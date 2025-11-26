from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timedelta
from pydantic import BaseModel, EmailStr
import uuid
import shutil
import os

from database import engine, get_db, Base
from models import User, Item, Claim, Notification, UserRole, ItemStatus, ClaimStatus, VerificationStatus
from auth import (
    get_password_hash,
    verify_password,
    create_access_token,
    get_current_active_user,
)
from helpers import create_timeline_event, get_unread_notifications, mark_notification_as_read, mark_all_notifications_as_read
import admin_routes

# Initialize FastAPI app
# Note: Tables will be created on first database access (lazy creation)
app = FastAPI(
    title="Lost and Found System API",
    description="API for school lost and found system",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "http://localhost:3000", "http://localhost:3001"],  # Vite ports + admin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(admin_routes.router)


# Pydantic schemas
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    firstName: str
    lastName: str
    studentNumber: str
    yearLevel: int
    course: str


class UserResponse(BaseModel):
    id: int
    email: str
    firstName: str
    lastName: str
    studentNumber: str
    yearLevel: int
    course: str
    role: str

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class ItemCreate(BaseModel):
    title: str
    description: str
    category: str
    color: Optional[str] = None
    condition: Optional[str] = None
    location: str
    date: datetime
    status: str
    isUrgent: bool = False
    reward: Optional[str] = None
    contactMethod: str = "email"
    submittedToSecurity: bool = False


class ItemResponse(BaseModel):
    id: int
    title: str
    description: str
    category: str
    color: Optional[str]
    condition: Optional[str]
    location: str
    date: datetime
    status: str
    isUrgent: bool
    reward: Optional[str]
    imageUrl: Optional[str]
    referenceNumber: str
    reporter: UserResponse
    createdAt: datetime

    class Config:
        from_attributes = True


class ClaimCreate(BaseModel):
    itemId: int
    verificationDetails: str
    color: Optional[str] = None
    condition: Optional[str] = None
    location: Optional[str] = None
    date: Optional[str] = None


# Routes

@app.get("/")
def read_root():
    return {"message": "Lost and Found System API", "status": "running"}


@app.post("/api/auth/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    # Check if user already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.student_number == user_data.studentNumber)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email or student number already registered"
        )

    # Create new user
    hashed_password = get_password_hash(user_data.password)
    new_user = User(
        email=user_data.email,
        hashed_password=hashed_password,
        first_name=user_data.firstName,
        last_name=user_data.lastName,
        student_number=user_data.studentNumber,
        year_level=user_data.yearLevel,
        course=user_data.course,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create access token
    access_token = create_access_token(data={"sub": new_user.email})

    user_response = UserResponse(
        id=new_user.id,
        email=new_user.email,
        firstName=new_user.first_name,
        lastName=new_user.last_name,
        studentNumber=new_user.student_number,
        yearLevel=new_user.year_level,
        course=new_user.course,
        role=new_user.role.value,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )


@app.post("/api/auth/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Find user by email
    user = db.query(User).filter(User.email == form_data.username).first()

    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Create access token
    access_token = create_access_token(data={"sub": user.email})

    user_response = UserResponse(
        id=user.id,
        email=user.email,
        firstName=user.first_name,
        lastName=user.last_name,
        studentNumber=user.student_number,
        yearLevel=user.year_level,
        course=user.course,
        role=user.role.value,
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        user=user_response
    )


@app.get("/api/users/me", response_model=UserResponse)
def get_current_user_info(current_user: User = Depends(get_current_active_user)):
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        firstName=current_user.first_name,
        lastName=current_user.last_name,
        studentNumber=current_user.student_number,
        yearLevel=current_user.year_level,
        course=current_user.course,
        role=current_user.role.value,
    )


@app.post("/api/items", response_model=ItemResponse)
def create_item(
    item_data: ItemCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Generate reference number
    reference_number = f"LF-{datetime.now().year}-{uuid.uuid4().hex[:8].upper()}"

    # Determine initial status - items go to pending verification for admin approval
    if item_data.status == "found":
        initial_status = ItemStatus.PENDING_VERIFICATION
        verification_status = VerificationStatus.PENDING
    else:
        # Lost items can be approved automatically or also need verification (configurable)
        initial_status = ItemStatus.PENDING_VERIFICATION
        verification_status = VerificationStatus.PENDING

    # Create new item
    new_item = Item(
        title=item_data.title,
        description=item_data.description,
        category=item_data.category,
        color=item_data.color,
        condition=item_data.condition,
        location=item_data.location,
        date=item_data.date,
        status=initial_status,
        verification_status=verification_status,
        is_urgent=item_data.isUrgent,
        reward=item_data.reward,
        contact_method=item_data.contactMethod,
        submitted_to_security=item_data.submittedToSecurity,
        reference_number=reference_number,
        reporter_id=current_user.id,
    )

    db.add(new_item)
    db.commit()
    db.refresh(new_item)

    # Create timeline event
    create_timeline_event(
        db, new_item.id, "reported",
        f"Item reported by {current_user.first_name} {current_user.last_name}",
        current_user.id
    )

    return ItemResponse(
        id=new_item.id,
        title=new_item.title,
        description=new_item.description,
        category=new_item.category,
        color=new_item.color,
        condition=new_item.condition,
        location=new_item.location,
        date=new_item.date,
        status=new_item.status.value,
        isUrgent=new_item.is_urgent,
        reward=new_item.reward,
        imageUrl=new_item.image_url,
        referenceNumber=new_item.reference_number,
        reporter=UserResponse(
            id=current_user.id,
            email=current_user.email,
            firstName=current_user.first_name,
            lastName=current_user.last_name,
            studentNumber=current_user.student_number,
            yearLevel=current_user.year_level,
            course=current_user.course,
            role=current_user.role.value,
        ),
        createdAt=new_item.created_at,
    )


@app.get("/api/items", response_model=List[ItemResponse])
def get_items(
    status: Optional[str] = None,
    category: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    # Only show published/approved items to public
    query = db.query(Item).filter(Item.is_published == True)

    if status:
        query = query.filter(Item.status == status)
    if category:
        query = query.filter(Item.category == category)

    items = query.order_by(Item.created_at.desc()).offset(skip).limit(limit).all()

    return [
        ItemResponse(
            id=item.id,
            title=item.title,
            description=item.description,
            category=item.category,
            color=item.color,
            condition=item.condition,
            location=item.location,
            date=item.date,
            status=item.status.value,
            isUrgent=item.is_urgent,
            reward=item.reward,
            imageUrl=item.image_url,
            referenceNumber=item.reference_number,
            reporter=UserResponse(
                id=item.reporter.id,
                email=item.reporter.email,
                firstName=item.reporter.first_name,
                lastName=item.reporter.last_name,
                studentNumber=item.reporter.student_number,
                yearLevel=item.reporter.year_level,
                course=item.reporter.course,
                role=item.reporter.role.value,
            ),
            createdAt=item.created_at,
        )
        for item in items
    ]


@app.get("/api/items/{item_id}", response_model=ItemResponse)
def get_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(Item).filter(Item.id == item_id).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    return ItemResponse(
        id=item.id,
        title=item.title,
        description=item.description,
        category=item.category,
        color=item.color,
        condition=item.condition,
        location=item.location,
        date=item.date,
        status=item.status.value,
        isUrgent=item.is_urgent,
        reward=item.reward,
        imageUrl=item.image_url,
        referenceNumber=item.reference_number,
        reporter=UserResponse(
            id=item.reporter.id,
            email=item.reporter.email,
            firstName=item.reporter.first_name,
            lastName=item.reporter.last_name,
            studentNumber=item.reporter.student_number,
            yearLevel=item.reporter.year_level,
            course=item.reporter.course,
            role=item.reporter.role.value,
        ),
        createdAt=item.created_at,
    )


@app.post("/api/items/{item_id}/mark-found")
def mark_item_found(
    item_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == item_id).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    if item.status != ItemStatus.LOST:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item is not lost"
        )

    # Update item status to FOUND
    item.status = ItemStatus.FOUND

    db.commit()

    return {"message": "Item marked as found successfully"}


@app.post("/api/items/{item_id}/claim")
def claim_item(
    item_id: int,
    claim_data: ClaimCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    item = db.query(Item).filter(Item.id == item_id).first()

    if not item:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Item not found"
        )

    if item.status != ItemStatus.FOUND:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Item is not available for claiming"
        )

    # Create claim with pending status - no automatic verification
    new_claim = Claim(
        item_id=item_id,
        claimant_id=current_user.id,
        verification_details=claim_data.verificationDetails,
        claimed_color=claim_data.color,
        claimed_condition=claim_data.condition,
        claimed_location=claim_data.location,
        claimed_date=claim_data.date,
        status=ClaimStatus.PENDING
    )

    db.add(new_claim)

    # Create timeline event
    create_timeline_event(
        db, item.id, "claim_submitted",
        f"Claim submitted by {current_user.first_name} {current_user.last_name}",
        current_user.id
    )

    # Notify the item reporter that someone submitted a claim
    from helpers import notify_claim_submitted
    notify_claim_submitted(db, item, current_user)

    # Notify all admins about the new claim
    admins = db.query(User).filter(User.role == UserRole.ADMIN).all()
    for admin in admins:
        from helpers import create_notification
        create_notification(
            db, admin.id, "new_claim",
            "New Claim Submitted",
            f"A claim has been submitted for '{item.title}' (Ref: {item.reference_number})",
            item.id,
            f"/admin/claims/{new_claim.id}"
        )

    db.commit()
    db.refresh(new_claim)

    return {"message": "Claim submitted successfully and is pending admin approval", "claimId": new_claim.id}


@app.get("/api/my-claims")
def get_my_claims(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all claims made by the current user"""
    claims = db.query(Claim).filter(
        Claim.claimant_id == current_user.id
    ).order_by(Claim.created_at.desc()).all()

    result = []
    for claim in claims:
        result.append({
            "id": claim.id,
            "status": claim.status.value,
            "verificationDetails": claim.verification_details,
            "rejectionReason": claim.rejection_reason,
            "createdAt": claim.created_at,
            "reviewedAt": claim.reviewed_at,
            "item": {
                "id": claim.item.id,
                "title": claim.item.title,
                "description": claim.item.description,
                "category": claim.item.category,
                "imageUrl": claim.item.image_url,
                "referenceNumber": claim.item.reference_number,
                "status": claim.item.status.value
            }
        })

    return result


@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    total_lost = db.query(Item).filter(Item.status == ItemStatus.LOST).count()
    total_found = db.query(Item).filter(Item.status == ItemStatus.FOUND).count()
    total_returned = db.query(Item).filter(Item.status == ItemStatus.RETURNED).count()

    return {
        "totalLost": total_lost,
        "totalFound": total_found,
        "totalReturned": total_returned,
    }


# =================
# NOTIFICATION ENDPOINTS
# =================

@app.get("/api/notifications")
def get_user_notifications(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all notifications for the current user"""
    notifications = get_unread_notifications(db, current_user.id)

    # Also get read notifications (last 50)
    read_notifications = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == True
    ).order_by(Notification.created_at.desc()).limit(50).all()

    all_notifications = notifications + read_notifications

    return [{
        "id": n.id,
        "type": n.type,
        "title": n.title,
        "message": n.message,
        "isRead": n.is_read,
        "link": n.link,
        "itemId": n.item_id,
        "createdAt": n.created_at
    } for n in sorted(all_notifications, key=lambda x: x.created_at, reverse=True)]


@app.get("/api/notifications/unread/count")
def get_unread_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get count of unread notifications"""
    count = db.query(Notification).filter(
        Notification.user_id == current_user.id,
        Notification.is_read == False
    ).count()

    return {"count": count}


@app.post("/api/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark a notification as read"""
    notification = mark_notification_as_read(db, notification_id, current_user.id)

    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")

    return {"message": "Notification marked as read"}


@app.post("/api/notifications/mark-all-read")
def mark_all_read(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Mark all notifications as read"""
    mark_all_notifications_as_read(db, current_user.id)

    return {"message": "All notifications marked as read"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
