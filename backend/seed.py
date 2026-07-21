from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models.society import Society
from app.models.user import User


def seed_database():
    """
    Seed initial development data into the database if no societies exist.
    Inserts a default Society (ID 1) and its associated Admin User.
    """
    app = create_app()
    with app.app_context():
        # Check if database already contains societies
        if db.session.query(Society).first():
            print("Database already contains societies. Skipping seed.")
            return

        print("Seeding initial development database...")

        # 1. Create initial Admin User with temporary society_id=1
        admin = User(
            society_id=1,
            full_name="Default Society Admin",
            email="admin@nsepsociety.org",
            password_hash=generate_password_hash("AdminSecret123!"),
            phone_number="9000000000",
            role="admin",
            is_learner=False,
            is_mentor=False,
            is_verified=True,
        )
        db.session.add(admin)
        db.session.flush()

        # 2. Create Default Society (ID 1)
        society = Society(
            society_name="Green Valley Heights",
            address="100 Community Center Road",
            city="Metropolis",
            state="Maharashtra",
            pincode="400001",
            admin_id=admin.user_id,
        )
        db.session.add(society)
        db.session.commit()

        # 3. Update admin user's society_id
        admin.society_id = society.society_id
        db.session.commit()

        print(
            f"Successfully seeded Society '{society.society_name}' (ID: {society.society_id}) and Admin '{admin.email}'."
        )


if __name__ == "__main__":
    seed_database()
