from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func, or_
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel

from database import get_db
from models import (
    User, Item, Claim, Notification, ItemTimeline, AuditLog, AdminSettings,
    ItemStatus, ClaimStatus, VerificationStatus, UserRole
)
from auth import get_current_admin_user
from helpers import (
    create_notification, create_timeline_event, create_audit_log,
    notify_item_approved, notify_item_rejected, notify_more_info_requested,
    notify_claim_approved, notify_claim_denied
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


# Pydantic schemas for admin operations
class ItemVerificationAction(BaseModel):
    action: str  # approve, reject, request_more_info
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    more_info_message: Optional[str] = None


class ClaimVerificationAction(BaseModel):
    action: str  # approve, deny, request_more_info, hold
    notes: Optional[str] = None
    rejection_reason: Optional[str] = None
    hold_days: Optional[int] = None


class AdminSettingUpdate(BaseModel):
    setting_key: str
    setting_value: str


# =================
# ADMIN DASHBOARD
# =================

@router.get("/dashboard/stats")
def get_admin_dashboard_stats(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get statistics for admin dashboard"""

    # Items statistics
    pending_items = db.query(Item).filter(
        Item.verification_status == VerificationStatus.PENDING
    ).count()

    approved_items = db.query(Item).filter(
        Item.verification_status == VerificationStatus.APPROVED
    ).count()

    # Claims statistics
    pending_claims = db.query(Claim).filter(
        Claim.status == ClaimStatus.PENDING
    ).count()

    approved_claims = db.query(Claim).filter(
        Claim.status == ClaimStatus.APPROVED
    ).count()

    # Items on hold
    items_on_hold = db.query(Item).filter(
        Item.status == ItemStatus.ON_HOLD
    ).count()

    # Ready for release
    ready_for_release = db.query(Item).filter(
        Item.status == ItemStatus.READY_FOR_RELEASE
    ).count()

    # Recent activity (last 7 days)
    seven_days_ago = datetime.utcnow() - timedelta(days=7)
    recent_items = db.query(Item).filter(
        Item.created_at >= seven_days_ago
    ).count()

    recent_claims = db.query(Claim).filter(
        Claim.created_at >= seven_days_ago
    ).count()

    # Total users
    total_users = db.query(User).filter(User.role == UserRole.STUDENT).count()

    return {
        "pendingItems": pending_items,
        "approvedItems": approved_items,
        "pendingClaims": pending_claims,
        "approvedClaims": approved_claims,
        "itemsOnHold": items_on_hold,
        "readyForRelease": ready_for_release,
        "recentItems": recent_items,
        "recentClaims": recent_claims,
        "totalUsers": total_users
    }


# =================
# PENDING ITEMS QUEUE
# =================

@router.get("/items/pending")
def get_pending_items(
    skip: int = 0,
    limit: int = 50,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all pending items for verification"""
    items = db.query(Item).filter(
        Item.verification_status == VerificationStatus.PENDING
    ).order_by(Item.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for item in items:
        result.append({
            "id": item.id,
            "title": item.title,
            "description": item.description,
            "category": item.category,
            "color": item.color,
            "condition": item.condition,
            "location": item.location,
            "date": item.date,
            "status": item.status.value,
            "imageUrl": item.image_url,
            "referenceNumber": item.reference_number,
            "isUrgent": item.is_urgent,
            "reward": item.reward,
            "submittedToSecurity": item.submitted_to_security,
            "reporter": {
                "id": item.reporter.id,
                "name": f"{item.reporter.first_name} {item.reporter.last_name}",
                "email": item.reporter.email,
                "studentNumber": item.reporter.student_number,
                "yearLevel": item.reporter.year_level,
                "course": item.reporter.course
            },
            "createdAt": item.created_at,
            "verificationStatus": item.verification_status.value
        })

    return result


@router.get("/items/{item_id}/full")
def get_full_item_details(
    item_id: int,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get full unblurred item details (admin only)"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    # Get timeline
    timeline = db.query(ItemTimeline).filter(
        ItemTimeline.item_id == item_id
    ).order_by(ItemTimeline.created_at.desc()).all()

    timeline_events = []
    for event in timeline:
        timeline_events.append({
            "id": event.id,
            "action": event.action,
            "description": event.description,
            "performedBy": event.performed_by.first_name + " " + event.performed_by.last_name if event.performed_by else "System",
            "createdAt": event.created_at
        })

    return {
        "id": item.id,
        "title": item.title,
        "description": item.description,
        "category": item.category,
        "color": item.color,
        "condition": item.condition,
        "location": item.location,
        "date": item.date,
        "status": item.status.value,
        "imageUrl": item.image_url,
        "referenceNumber": item.reference_number,
        "isUrgent": item.is_urgent,
        "reward": item.reward,
        "submittedToSecurity": item.submitted_to_security,
        "verificationStatus": item.verification_status.value,
        "adminNotes": item.admin_notes,
        "rejectionReason": item.rejection_reason,
        "holdUntil": item.hold_until,
        "holdDays": item.hold_days,
        "isPublished": item.is_published,
        "reporter": {
            "id": item.reporter.id,
            "name": f"{item.reporter.first_name} {item.reporter.last_name}",
            "email": item.reporter.email,
            "studentNumber": item.reporter.student_number,
            "yearLevel": item.reporter.year_level,
            "course": item.reporter.course,
            "phone": item.reporter.phone
        },
        "createdAt": item.created_at,
        "verifiedAt": item.verified_at,
        "publishedAt": item.published_at,
        "timeline": timeline_events
    }


@router.post("/items/{item_id}/verify")
def verify_item(
    item_id: int,
    action_data: ItemVerificationAction,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Verify an item (approve, reject, or request more info)"""
    item = db.query(Item).filter(Item.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    if action_data.action == "approve":
        item.verification_status = VerificationStatus.APPROVED
        item.status = ItemStatus.FOUND
        item.is_published = True
        item.verified_at = datetime.utcnow()
        item.published_at = datetime.utcnow()
        item.verified_by_id = current_admin.id
        item.admin_notes = action_data.notes

        # Create timeline event
        create_timeline_event(
            db, item.id, "verified",
            f"Item verified and approved by {current_admin.first_name} {current_admin.last_name}",
            current_admin.id
        )

        create_timeline_event(
            db, item.id, "published",
            "Item published to dashboard",
            current_admin.id
        )

        # Create audit log
        create_audit_log(
            db, current_admin.id, "approve_item", "item", item.id,
            f"Approved item: {item.title}"
        )

        # Notify reporter
        notify_item_approved(db, item, current_admin)

        message = "Item approved and published"

    elif action_data.action == "reject":
        item.verification_status = VerificationStatus.REJECTED
        item.verified_at = datetime.utcnow()
        item.verified_by_id = current_admin.id
        item.rejection_reason = action_data.rejection_reason
        item.admin_notes = action_data.notes

        create_timeline_event(
            db, item.id, "rejected",
            f"Item rejected by {current_admin.first_name} {current_admin.last_name}",
            current_admin.id
        )

        create_audit_log(
            db, current_admin.id, "reject_item", "item", item.id,
            f"Rejected item: {item.title}. Reason: {action_data.rejection_reason}"
        )

        notify_item_rejected(db, item, action_data.rejection_reason or "Not specified")

        message = "Item rejected"

    elif action_data.action == "request_more_info":
        item.verification_status = VerificationStatus.MORE_INFO_REQUESTED
        item.admin_notes = action_data.notes

        create_timeline_event(
            db, item.id, "more_info_requested",
            f"More information requested by {current_admin.first_name} {current_admin.last_name}",
            current_admin.id
        )

        create_audit_log(
            db, current_admin.id, "request_more_info", "item", item.id,
            f"Requested more info for: {item.title}"
        )

        notify_more_info_requested(db, item, action_data.more_info_message or "Please provide additional details")

        message = "More information requested"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    db.commit()

    return {"message": message, "item": get_full_item_details(item_id, current_admin, db)}


# =================
# PENDING CLAIMS QUEUE
# =================

@router.get("/claims/pending")
def get_pending_claims(
    skip: int = 0,
    limit: int = 50,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all pending claims for verification"""
    claims = db.query(Claim).filter(
        Claim.status == ClaimStatus.PENDING
    ).order_by(Claim.created_at.desc()).offset(skip).limit(limit).all()

    result = []
    for claim in claims:
        result.append({
            "id": claim.id,
            "verificationDetails": claim.verification_details,
            "claimedColor": claim.claimed_color,
            "claimedCondition": claim.claimed_condition,
            "claimedLocation": claim.claimed_location,
            "claimedDate": claim.claimed_date,
            "status": claim.status.value,
            "item": {
                "id": claim.item.id,
                "title": claim.item.title,
                "description": claim.item.description,
                "color": claim.item.color,
                "condition": claim.item.condition,
                "location": claim.item.location,
                "date": claim.item.date,
                "imageUrl": claim.item.image_url,
                "referenceNumber": claim.item.reference_number
            },
            "claimant": {
                "id": claim.claimant.id,
                "name": f"{claim.claimant.first_name} {claim.claimant.last_name}",
                "email": claim.claimant.email,
                "studentNumber": claim.claimant.student_number,
                "yearLevel": claim.claimant.year_level,
                "course": claim.claimant.course,
                "phone": claim.claimant.phone
            },
            "createdAt": claim.created_at
        })

    return result


@router.post("/claims/{claim_id}/verify")
def verify_claim(
    claim_id: int,
    action_data: ClaimVerificationAction,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Verify a claim (approve, deny, request more info, or hold)"""
    claim = db.query(Claim).filter(Claim.id == claim_id).first()
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    item = claim.item

    if action_data.action == "approve":
        claim.status = ClaimStatus.APPROVED
        claim.reviewed_at = datetime.utcnow()
        claim.reviewed_by_id = current_admin.id
        claim.admin_notes = action_data.notes

        item.status = ItemStatus.READY_FOR_RELEASE
        item.claimed_by_id = claim.claimant_id

        create_timeline_event(
            db, item.id, "claimed",
            f"Claim approved by {current_admin.first_name} {current_admin.last_name}",
            current_admin.id
        )

        create_audit_log(
            db, current_admin.id, "approve_claim", "claim", claim.id,
            f"Approved claim for item: {item.title}"
        )

        notify_claim_approved(db, item, claim.claimant_id)

        message = "Claim approved - item ready for release"

    elif action_data.action == "deny":
        claim.status = ClaimStatus.REJECTED
        claim.reviewed_at = datetime.utcnow()
        claim.reviewed_by_id = current_admin.id
        claim.rejection_reason = action_data.rejection_reason
        claim.admin_notes = action_data.notes

        create_timeline_event(
            db, item.id, "claim_denied",
            f"Claim denied by {current_admin.first_name} {current_admin.last_name}",
            current_admin.id
        )

        create_audit_log(
            db, current_admin.id, "deny_claim", "claim", claim.id,
            f"Denied claim for item: {item.title}"
        )

        notify_claim_denied(db, item, claim.claimant_id, action_data.rejection_reason or "Not specified")

        message = "Claim denied"

    elif action_data.action == "request_more_info":
        claim.status = ClaimStatus.MORE_INFO_NEEDED
        claim.admin_notes = action_data.notes

        create_notification(
            db, claim.claimant_id, "more_info_requested",
            "More Information Needed",
            f"We need more information about your claim for '{item.title}'. {action_data.notes}",
            item.id
        )

        create_audit_log(
            db, current_admin.id, "request_claim_info", "claim", claim.id,
            f"Requested more info for claim on: {item.title}"
        )

        message = "More information requested from claimant"

    elif action_data.action == "hold":
        hold_days = action_data.hold_days or 7
        item.status = ItemStatus.ON_HOLD
        item.hold_until = datetime.utcnow() + timedelta(days=hold_days)
        item.hold_days = hold_days

        create_timeline_event(
            db, item.id, "on_hold",
            f"Item placed on hold for {hold_days} days by {current_admin.first_name} {current_admin.last_name}",
            current_admin.id
        )

        create_audit_log(
            db, current_admin.id, "place_on_hold", "item", item.id,
            f"Placed item on hold for {hold_days} days: {item.title}"
        )

        message = f"Item placed on hold for {hold_days} days"
    else:
        raise HTTPException(status_code=400, detail="Invalid action")

    db.commit()

    return {"message": message}


# =================
# NOTIFICATIONS
# =================

@router.get("/notifications")
def get_all_notifications(
    user_id: Optional[int] = None,
    skip: int = 0,
    limit: int = 100,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get notifications (optionally filter by user_id)"""
    query = db.query(Notification)

    if user_id:
        query = query.filter(Notification.user_id == user_id)

    notifications = query.order_by(
        Notification.created_at.desc()
    ).offset(skip).limit(limit).all()

    return [{
        "id": n.id,
        "type": n.type,
        "title": n.title,
        "message": n.message,
        "isRead": n.is_read,
        "link": n.link,
        "createdAt": n.created_at,
        "user": {
            "id": n.user.id,
            "name": f"{n.user.first_name} {n.user.last_name}"
        }
    } for n in notifications]


# =================
# AUDIT LOGS
# =================

@router.get("/audit-logs")
def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    action: Optional[str] = None,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get audit logs"""
    query = db.query(AuditLog)

    if action:
        query = query.filter(AuditLog.action == action)

    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    return [{
        "id": log.id,
        "action": log.action,
        "entityType": log.entity_type,
        "entityId": log.entity_id,
        "details": log.details,
        "admin": {
            "id": log.admin.id,
            "name": f"{log.admin.first_name} {log.admin.last_name}"
        },
        "createdAt": log.created_at
    } for log in logs]


# =================
# ADMIN SETTINGS
# =================

@router.get("/settings")
def get_admin_settings(
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all admin settings"""
    settings = db.query(AdminSettings).all()

    # Create default settings if none exist
    if not settings:
        defaults = [
            {"setting_key": "hold_period_days", "setting_value": "7", "description": "Default hold period in days"},
            {"setting_key": "blur_level", "setting_value": "medium", "description": "Blur level for published items"},
            {"setting_key": "admin_email", "setting_value": "admin@school.edu", "description": "Admin contact email"},
        ]

        for default in defaults:
            setting = AdminSettings(**default, updated_by_id=current_admin.id)
            db.add(setting)

        db.commit()
        settings = db.query(AdminSettings).all()

    return [{
        "id": s.id,
        "settingKey": s.setting_key,
        "settingValue": s.setting_value,
        "description": s.description,
        "updatedAt": s.updated_at
    } for s in settings]


@router.put("/settings")
def update_admin_setting(
    setting_data: AdminSettingUpdate,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Update an admin setting"""
    setting = db.query(AdminSettings).filter(
        AdminSettings.setting_key == setting_data.setting_key
    ).first()

    if not setting:
        setting = AdminSettings(
            setting_key=setting_data.setting_key,
            setting_value=setting_data.setting_value,
            updated_by_id=current_admin.id
        )
        db.add(setting)
    else:
        setting.setting_value = setting_data.setting_value
        setting.updated_by_id = current_admin.id

    create_audit_log(
        db, current_admin.id, "update_settings", "settings", setting.id,
        f"Updated setting: {setting_data.setting_key} = {setting_data.setting_value}"
    )

    db.commit()

    return {"message": "Setting updated successfully"}


# =================
# USER MANAGEMENT
# =================

@router.get("/users")
def get_all_users(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all users"""
    query = db.query(User)

    if search:
        query = query.filter(
            or_(
                User.email.ilike(f"%{search}%"),
                User.first_name.ilike(f"%{search}%"),
                User.last_name.ilike(f"%{search}%"),
                User.student_number.ilike(f"%{search}%")
            )
        )

    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()

    return [{
        "id": u.id,
        "email": u.email,
        "firstName": u.first_name,
        "lastName": u.last_name,
        "studentNumber": u.student_number,
        "yearLevel": u.year_level,
        "course": u.course,
        "phone": u.phone,
        "role": u.role.value,
        "isActive": u.is_active,
        "createdAt": u.created_at
    } for u in users]


@router.get("/users/{user_id}/activity")
def get_user_activity(
    user_id: int,
    current_admin: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get user activity (items reported, claims made, etc.)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    items_reported = db.query(Item).filter(Item.reporter_id == user_id).count()
    claims_made = db.query(Claim).filter(Claim.claimant_id == user_id).count()
    items_claimed = db.query(Item).filter(Item.claimed_by_id == user_id).count()

    return {
        "userId": user_id,
        "itemsReported": items_reported,
        "claimsMade": claims_made,
        "itemsClaimed": items_claimed
    }
