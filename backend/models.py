from sqlalchemy import Boolean, Column, ForeignKey, Integer, String, Text, DateTime, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from database import Base


class UserRole(str, enum.Enum):
    STUDENT = "student"
    FACULTY = "faculty"
    ADMIN = "admin"


class ItemStatus(str, enum.Enum):
    LOST = "lost"
    FOUND = "found"
    PENDING_VERIFICATION = "pending_verification"
    CLAIMED = "claimed"
    READY_FOR_RELEASE = "ready_for_release"
    RETURNED = "returned"
    ON_HOLD = "on_hold"
    ARCHIVED = "archived"
    DISPOSED = "disposed"


class ClaimStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    MORE_INFO_NEEDED = "more_info_needed"


class VerificationStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    MORE_INFO_REQUESTED = "more_info_requested"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    student_number = Column(String, unique=True, index=True)
    year_level = Column(Integer)
    course = Column(String)
    phone = Column(String, nullable=True)
    role = Column(Enum(UserRole), default=UserRole.STUDENT)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    reported_items = relationship("Item", back_populates="reporter", foreign_keys="Item.reporter_id")
    claims = relationship("Claim", back_populates="claimant", foreign_keys="Claim.claimant_id")
    notifications = relationship("Notification", back_populates="user")


class Item(Base):
    __tablename__ = "items"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False, index=True)
    color = Column(String, nullable=True)
    condition = Column(String, nullable=True)
    location = Column(String, nullable=False)
    date = Column(DateTime, nullable=False)
    status = Column(Enum(ItemStatus), default=ItemStatus.PENDING_VERIFICATION, index=True)
    is_urgent = Column(Boolean, default=False)
    reward = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    contact_method = Column(String, default="email")
    submitted_to_security = Column(Boolean, default=False)
    reference_number = Column(String, unique=True, index=True)

    # Admin/Verification fields
    verification_status = Column(Enum(VerificationStatus), default=VerificationStatus.PENDING, index=True)
    admin_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    hold_until = Column(DateTime, nullable=True)
    hold_days = Column(Integer, default=0)
    is_published = Column(Boolean, default=False)

    # Foreign Keys
    reporter_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    claimed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    verified_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    verified_at = Column(DateTime, nullable=True)
    published_at = Column(DateTime, nullable=True)
    returned_at = Column(DateTime, nullable=True)
    archived_at = Column(DateTime, nullable=True)

    # Relationships
    reporter = relationship("User", back_populates="reported_items", foreign_keys=[reporter_id])
    claimed_by = relationship("User", foreign_keys=[claimed_by_id])
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    claims = relationship("Claim", back_populates="item")
    timeline_events = relationship("ItemTimeline", back_populates="item", cascade="all, delete-orphan")


class Claim(Base):
    __tablename__ = "claims"

    id = Column(Integer, primary_key=True, index=True)
    verification_details = Column(Text, nullable=False)
    status = Column(Enum(ClaimStatus), default=ClaimStatus.PENDING, index=True)
    admin_notes = Column(Text, nullable=True)
    rejection_reason = Column(Text, nullable=True)

    # Verification fields (what the claimant provided)
    claimed_color = Column(String, nullable=True)
    claimed_condition = Column(String, nullable=True)
    claimed_location = Column(String, nullable=True)
    claimed_date = Column(String, nullable=True)

    # Foreign Keys
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    claimant_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reviewed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    reviewed_at = Column(DateTime, nullable=True)

    # Relationships
    item = relationship("Item", back_populates="claims")
    claimant = relationship("User", back_populates="claims", foreign_keys=[claimant_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)  # found_approved, claim_submitted, claim_approved, claim_denied, ready_for_release, lost_matched
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=True)
    is_read = Column(Boolean, default=False)
    link = Column(String, nullable=True)

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    user = relationship("User", back_populates="notifications")


class ItemTimeline(Base):
    __tablename__ = "item_timeline"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)  # reported, verified, published, claimed, denied, on_hold, archived, disposed
    description = Column(Text, nullable=False)
    performed_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    item_id = Column(Integer, ForeignKey("items.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    item = relationship("Item", back_populates="timeline_events")
    performed_by = relationship("User")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False, index=True)  # approve_item, reject_item, approve_claim, reject_claim, etc.
    entity_type = Column(String, nullable=False)  # item, claim, user
    entity_id = Column(Integer, nullable=False)
    details = Column(Text, nullable=True)
    admin_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    # Relationships
    admin = relationship("User")


class AdminSettings(Base):
    __tablename__ = "admin_settings"

    id = Column(Integer, primary_key=True, index=True)
    setting_key = Column(String, unique=True, nullable=False, index=True)
    setting_value = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    updated_by_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    updated_by = relationship("User")
