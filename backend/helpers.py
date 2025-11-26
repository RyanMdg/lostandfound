from sqlalchemy.orm import Session
from datetime import datetime
from models import Notification, ItemTimeline, AuditLog, User, Item
from typing import Optional


def create_notification(
    db: Session,
    user_id: int,
    notification_type: str,
    title: str,
    message: str,
    item_id: Optional[int] = None,
    link: Optional[str] = None
):
    """
    Create a notification for a user

    Types: found_approved, claim_submitted, claim_approved, claim_denied,
           ready_for_release, lost_matched, more_info_requested
    """
    notification = Notification(
        user_id=user_id,
        type=notification_type,
        title=title,
        message=message,
        item_id=item_id,
        link=link
    )
    db.add(notification)
    db.commit()
    db.refresh(notification)
    return notification


def create_timeline_event(
    db: Session,
    item_id: int,
    action: str,
    description: str,
    performed_by_id: Optional[int] = None
):
    """
    Create a timeline event for an item

    Actions: reported, verified, published, claimed, denied, on_hold, archived, disposed
    """
    event = ItemTimeline(
        item_id=item_id,
        action=action,
        description=description,
        performed_by_id=performed_by_id
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


def create_audit_log(
    db: Session,
    admin_id: int,
    action: str,
    entity_type: str,
    entity_id: int,
    details: Optional[str] = None
):
    """
    Create an audit log entry

    Actions: approve_item, reject_item, approve_claim, reject_claim, request_more_info,
            place_on_hold, archive_item, update_settings, etc.
    Entity types: item, claim, user, settings
    """
    log = AuditLog(
        admin_id=admin_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=details
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return log


def notify_item_approved(db: Session, item: Item, admin: User):
    """Notify reporter that their found item was approved"""
    create_notification(
        db=db,
        user_id=item.reporter_id,
        notification_type="found_approved",
        title="Found Item Approved",
        message=f"Your found item '{item.title}' has been approved and published.",
        item_id=item.id,
        link=f"/items/{item.id}"
    )


def notify_item_rejected(db: Session, item: Item, reason: str):
    """Notify reporter that their found item was rejected"""
    create_notification(
        db=db,
        user_id=item.reporter_id,
        notification_type="item_rejected",
        title="Found Item Rejected",
        message=f"Your found item '{item.title}' was rejected. Reason: {reason}",
        item_id=item.id
    )


def notify_more_info_requested(db: Session, item: Item, message: str):
    """Notify reporter that more information is requested"""
    create_notification(
        db=db,
        user_id=item.reporter_id,
        notification_type="more_info_requested",
        title="More Information Needed",
        message=f"For '{item.title}': {message}",
        item_id=item.id,
        link=f"/items/{item.id}"
    )


def notify_claim_submitted(db: Session, item: Item, claimant: User):
    """Notify item reporter that someone claimed their item"""
    create_notification(
        db=db,
        user_id=item.reporter_id,
        notification_type="claim_submitted",
        title="Claim Submitted",
        message=f"Someone has submitted a claim for '{item.title}'.",
        item_id=item.id
    )


def notify_claim_approved(db: Session, item: Item, claimant_id: int):
    """Notify claimant that their claim was approved"""
    create_notification(
        db=db,
        user_id=claimant_id,
        notification_type="claim_approved",
        title="Claim Approved",
        message=f"Your claim for '{item.title}' has been approved! Item is ready for release.",
        item_id=item.id,
        link=f"/items/{item.id}"
    )


def notify_claim_denied(db: Session, item: Item, claimant_id: int, reason: str):
    """Notify claimant that their claim was denied"""
    create_notification(
        db=db,
        user_id=claimant_id,
        notification_type="claim_denied",
        title="Claim Denied",
        message=f"Your claim for '{item.title}' was denied. Reason: {reason}",
        item_id=item.id
    )


def notify_lost_item_matched(db: Session, lost_item: Item, found_item: Item):
    """Notify lost item reporter that a potential match was found"""
    create_notification(
        db=db,
        user_id=lost_item.reporter_id,
        notification_type="lost_matched",
        title="Potential Match Found",
        message=f"A found item matching '{lost_item.title}' has been reported. Check it out!",
        item_id=found_item.id,
        link=f"/items/{found_item.id}"
    )


def get_unread_notifications(db: Session, user_id: int):
    """Get all unread notifications for a user"""
    return db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).order_by(Notification.created_at.desc()).all()


def mark_notification_as_read(db: Session, notification_id: int, user_id: int):
    """Mark a notification as read"""
    notification = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if notification:
        notification.is_read = True
        db.commit()
    return notification


def mark_all_notifications_as_read(db: Session, user_id: int):
    """Mark all notifications as read for a user"""
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
