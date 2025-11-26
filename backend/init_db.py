"""
Initialize the database with all tables and create an admin user
"""
from database import engine, SessionLocal, Base
from models import User, UserRole, AdminSettings
from auth import get_password_hash

# Import all models to ensure they're registered with Base
from models import (
    User, Item, Claim, Notification, ItemTimeline, AuditLog, AdminSettings
)

def init_database():
    """Create all tables"""
    print("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    print("✓ Database tables created successfully!")

def create_admin_user():
    """Create a default admin user"""
    db = SessionLocal()
    try:
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
        if existing_admin:
            print(f"✓ Admin user already exists: {existing_admin.email}")
            return

        # Create admin user
        admin = User(
            email="admin@school.edu",
            hashed_password=get_password_hash("admin123"),  # Change this password!
            first_name="Admin",
            last_name="User",
            student_number="ADMIN001",
            year_level=0,
            course="Administration",
            role=UserRole.ADMIN,
            is_active=True
        )

        db.add(admin)
        db.commit()

        print("✓ Admin user created successfully!")
        print("  Email: admin@school.edu")
        print("  Password: admin123")
        print("  ⚠️  IMPORTANT: Change this password after first login!")

    except Exception as e:
        print(f"✗ Error creating admin user: {e}")
        db.rollback()
    finally:
        db.close()

def create_default_settings():
    """Create default admin settings"""
    db = SessionLocal()
    try:
        # Check if settings exist
        existing = db.query(AdminSettings).first()
        if existing:
            print("✓ Admin settings already exist")
            return

        # Create default settings
        defaults = [
            AdminSettings(
                setting_key="hold_period_days",
                setting_value="7",
                description="Default hold period in days for items"
            ),
            AdminSettings(
                setting_key="blur_level",
                setting_value="medium",
                description="Blur level for published found items (low/medium/high)"
            ),
            AdminSettings(
                setting_key="admin_email",
                setting_value="admin@school.edu",
                description="Admin contact email for notifications"
            ),
        ]

        for setting in defaults:
            db.add(setting)

        db.commit()
        print("✓ Default admin settings created successfully!")

    except Exception as e:
        print(f"✗ Error creating settings: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("=" * 50)
    print("Lost and Found Database Initialization")
    print("=" * 50)

    init_database()
    create_admin_user()
    create_default_settings()

    print("\n" + "=" * 50)
    print("✓ Database initialization complete!")
    print("=" * 50)
