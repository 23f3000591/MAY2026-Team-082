from datetime import datetime, timedelta, date, time
from werkzeug.security import generate_password_hash

from app import create_app
from app.extensions import db
from app.models.society import Society
from app.models.user import User
from app.models.skill import Skill
from app.models.user_skill import UserSkill
from app.models.availability import Availability
from app.models.session import Session
from app.models.review import Review
from app.models.notification import Notification
from app.models.message import Message
from app.models.report import Report


def seed_database():
    """
    Seed initial development and manual-testing data into the database.
    """
    app = create_app()
    with app.app_context():
        # Clean and recreate tables
        db.create_all()

        if db.session.query(Society).first():
            print("Database already contains societies. Skipping seed.")
            return

        print("Seeding initial development database...")

        # 1. Admin User
        admin = User(
            society_id=1,
            full_name="Default Society Admin",
            email="admin@nsepsociety.org",
            password_hash=generate_password_hash("AdminSecret123!"),
            phone_number="9000000000",
            role="admin",
            bio="Administrator for Green Valley Heights Community Skill Exchange.",
            is_learner=False,
            is_mentor=False,
            is_verified=True,
            is_suspended=False,
        )
        db.session.add(admin)
        db.session.flush()

        # 2. Society
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

        admin.society_id = society.society_id
        db.session.commit()

        # 3. Skills
        skill_items = [
            ("Python Programming", "Technology"),
            ("Web Development", "Technology"),
            ("Data Science", "Technology"),
            ("Mathematics", "Academics"),
            ("English Communication", "Languages"),
            ("Guitar", "Music & Arts"),
            ("Yoga & Fitness", "Health & Wellness"),
            ("Digital Marketing", "Business"),
        ]
        created_skills = {}
        for name, cat in skill_items:
            sk = Skill(skill_name=name, category=cat)
            db.session.add(sk)
            db.session.flush()
            created_skills[name] = sk

        # 4. Mentors
        mentor1 = User(
            society_id=society.society_id,
            full_name="Dr. Alan Turing",
            email="alan.turing@nsepsociety.org",
            password_hash=generate_password_hash("Password123!"),
            phone_number="9111111111",
            bio="Senior Software Architect with 10+ years of experience in Python, Cloud systems, and algorithms.",
            role="mentor",
            is_mentor=True,
            is_learner=False,
            is_verified=True,
            is_suspended=False,
        )
        mentor2 = User(
            society_id=society.society_id,
            full_name="Sarah Connor",
            email="sarah.connor@nsepsociety.org",
            password_hash=generate_password_hash("Password123!"),
            phone_number="9222222222",
            bio="Certified Yoga instructor and wellness coach helping neighbors achieve balance.",
            role="mentor",
            is_mentor=True,
            is_learner=False,
            is_verified=True,
            is_suspended=False,
        )
        mentor3 = User(
            society_id=society.society_id,
            full_name="Elena Rostova",
            email="elena.mentor@nsepsociety.org",
            password_hash=generate_password_hash("Password123!"),
            phone_number="9333333333",
            bio="Professional guitarist and composer with 8 years performing and teaching experience.",
            role="mentor",
            is_mentor=True,
            is_learner=False,
            is_verified=True,
            is_suspended=False,
        )
        db.session.add_all([mentor1, mentor2, mentor3])
        db.session.flush()

        # 5. Learners
        learner1 = User(
            society_id=society.society_id,
            full_name="Alex Turner",
            email="alex.learner@nsepsociety.org",
            password_hash=generate_password_hash("Password123!"),
            phone_number="9444444444",
            bio="Aspiring programmer and guitar enthusiast looking to learn from neighbors.",
            role="learner",
            is_mentor=False,
            is_learner=True,
            is_verified=True,
            is_suspended=False,
        )
        learner2 = User(
            society_id=society.society_id,
            full_name="Emma Watson",
            email="emma.learner@nsepsociety.org",
            password_hash=generate_password_hash("Password123!"),
            phone_number="9555555555",
            bio="Passionate learner curious about fitness and data science.",
            role="learner",
            is_mentor=False,
            is_learner=True,
            is_verified=True,
            is_suspended=False,
        )
        db.session.add_all([learner1, learner2])
        db.session.flush()

        # 6. User Skills
        usk1 = UserSkill(
            user_id=mentor1.user_id,
            skill_id=created_skills["Python Programming"].skill_id,
            experience_level="Expert",
            years_of_experience=10,
            description="Core Python, FastAPI, Flask, and Distributed Systems.",
        )
        usk2 = UserSkill(
            user_id=mentor1.user_id,
            skill_id=created_skills["Web Development"].skill_id,
            experience_level="Advanced",
            years_of_experience=7,
            description="Full-stack TypeScript and Next.js applications.",
        )
        usk3 = UserSkill(
            user_id=mentor2.user_id,
            skill_id=created_skills["Yoga & Fitness"].skill_id,
            experience_level="Expert",
            years_of_experience=6,
            description="Hatha Yoga, breathing exercises, and guided meditation.",
        )
        usk4 = UserSkill(
            user_id=mentor3.user_id,
            skill_id=created_skills["Guitar"].skill_id,
            experience_level="Expert",
            years_of_experience=8,
            description="Acoustic chords, fingerstyle, and music theory.",
        )
        db.session.add_all([usk1, usk2, usk3, usk4])

        # 7. Availabilities for Mentors
        days = ["Monday", "Wednesday", "Friday", "Saturday"]
        av_list = []
        for day in days:
            av1 = Availability(
                user_id=mentor1.user_id,
                day_of_week=day,
                start_time=time(10, 0),
                end_time=time(12, 0),
            )
            av2 = Availability(
                user_id=mentor2.user_id,
                day_of_week=day,
                start_time=time(16, 0),
                end_time=time(18, 0),
            )
            av3 = Availability(
                user_id=mentor3.user_id,
                day_of_week=day,
                start_time=time(14, 0),
                end_time=time(16, 0),
            )
            av_list.extend([av1, av2, av3])
        db.session.add_all(av_list)
        db.session.flush()

        # 8. Completed Session & Active Session
        target_date = date.today() + timedelta(days=2)
        sess1 = Session(
            learner_id=learner1.user_id,
            mentor_id=mentor1.user_id,
            skill_id=created_skills["Python Programming"].skill_id,
            availability_id=av_list[0].availability_id,
            session_mode="online",
            session_date=date.today() - timedelta(days=3),
            meeting_link="https://meet.jit.si/nsep-python-session-101",
            status="Completed",
            learner_note="Looking forward to deep diving into Python decorators and generators.",
        )
        sess2 = Session(
            learner_id=learner1.user_id,
            mentor_id=mentor2.user_id,
            skill_id=created_skills["Yoga & Fitness"].skill_id,
            availability_id=av_list[1].availability_id,
            session_mode="in-person",
            session_date=target_date,
            location="Society Clubhouse Room B",
            status="Accepted",
            learner_note="Need guidance on beginner yoga posture and back pain relief.",
        )
        db.session.add_all([sess1, sess2])
        db.session.flush()

        # 9. Review for completed session
        rev1 = Review(
            session_id=sess1.session_id,
            learner_id=learner1.user_id,
            mentor_id=mentor1.user_id,
            rating=5,
            review_text="Dr. Turing is an exceptional mentor! He explained tricky concepts with clear real-world examples.",
        )
        db.session.add(rev1)
        db.session.flush()

        # 10. Notifications
        notif1 = Notification(
            user_id=learner1.user_id,
            title="Session Confirmed",
            message=f"Your session with {mentor2.full_name} on {target_date} has been accepted.",
            notification_type="session",
            is_read=False,
        )
        notif2 = Notification(
            user_id=mentor1.user_id,
            title="New Review Received",
            message="Alex Turner left a 5-star review for your Python Programming session.",
            notification_type="review",
            is_read=False,
        )
        db.session.add_all([notif1, notif2])

        # 11. Chat Messages
        msg1 = Message(
            sender_id=learner1.user_id,
            receiver_id=mentor1.user_id,
            session_id=sess1.session_id,
            message="Hi Dr. Turing! Thank you so much for the wonderful session today.",
            is_read=True,
        )
        msg2 = Message(
            sender_id=mentor1.user_id,
            receiver_id=learner1.user_id,
            session_id=sess1.session_id,
            message="You're very welcome Alex! Keep practicing those generator functions.",
            is_read=True,
        )
        db.session.add_all([msg1, msg2])

        # 12. Report
        rep1 = Report(
            review_id=rev1.review_id,
            reported_by=mentor2.user_id,
            reported_user=learner1.user_id,
            reason="Spam or Inappropriate Content",
            description="Test report for moderation queue review.",
            status="Pending",
        )
        db.session.add(rep1)

        db.session.commit()
        print("Database successfully seeded with complete test datasets!")


if __name__ == "__main__":
    seed_database()
