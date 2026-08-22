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
    Seed new clean dataset with custom requested users:
    - Common Password: Password123!
    - Domain: @gmail.com
    - Users: Akhil (Admin), Saanvi (Mentor), Karthick (Mentor), Harsh Kumar (Mentor),
             Harshad (Learner), Athul (Learner), Sooraj (Learner), Manas (Learner)
    """
    app = create_app()
    with app.app_context():
        # Drop and recreate all tables for a clean slate
        db.drop_all()
        db.create_all()

        print("Seeding new database with requested users...")
        common_password_hash = generate_password_hash("Password123!")

        # 1. Admin User: Akhil
        admin = User(
            society_id=1,
            full_name="Akhil",
            email="akhil@gmail.com",
            password_hash=common_password_hash,
            phone_number="9876543210",
            role="admin",
            bio="Lead Platform Administrator for Community Skill Exchange.",
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

        # 4. Mentors: Saanvi, Karthick, Harsh Kumar
        mentor_saanvi = User(
            society_id=society.society_id,
            full_name="Saanvi",
            email="saanvi@gmail.com",
            password_hash=common_password_hash,
            phone_number="9876543211",
            bio="Senior Full-stack Engineer with expertise in Python, Web Development, and Cloud architecture.",
            role="mentor",
            is_mentor=True,
            is_learner=False,
            is_verified=True,
            is_suspended=False,
        )
        mentor_karthick = User(
            society_id=society.society_id,
            full_name="Karthick",
            email="karthick@gmail.com",
            password_hash=common_password_hash,
            phone_number="9876543212",
            bio="Certified Yoga & Wellness Coach helping community members maintain strength and mindfulness.",
            role="mentor",
            is_mentor=True,
            is_learner=False,
            is_verified=True,
            is_suspended=False,
        )
        mentor_harsh = User(
            society_id=society.society_id,
            full_name="Harsh Kumar",
            email="harshkumar@gmail.com",
            password_hash=common_password_hash,
            phone_number="9876543213",
            bio="Musician and Guitar instructor teaching acoustic chords, fingerstyle, and music composition.",
            role="mentor",
            is_mentor=True,
            is_learner=False,
            is_verified=True,
            is_suspended=False,
        )
        db.session.add_all([mentor_saanvi, mentor_karthick, mentor_harsh])
        db.session.flush()

        # 5. Learners: Harshad, Athul, Sooraj, Manas
        learner_harshad = User(
            society_id=society.society_id,
            full_name="Harshad",
            email="harshad@gmail.com",
            password_hash=common_password_hash,
            phone_number="9876543214",
            bio="Enthusiastic learner focusing on backend engineering and algorithmic problem solving.",
            role="learner",
            is_mentor=False,
            is_learner=True,
            is_verified=True,
            is_suspended=False,
        )
        learner_athul = User(
            society_id=society.society_id,
            full_name="Athul",
            email="athul@gmail.com",
            password_hash=common_password_hash,
            phone_number="9876543215",
            bio="Curious learner eager to master guitar playing and creative storytelling.",
            role="learner",
            is_mentor=False,
            is_learner=True,
            is_verified=True,
            is_suspended=False,
        )
        learner_sooraj = User(
            society_id=society.society_id,
            full_name="Sooraj",
            email="sooraj@gmail.com",
            password_hash=common_password_hash,
            phone_number="9876543216",
            bio="Fitness enthusiast interested in yoga, wellness, and healthy lifestyle routines.",
            role="learner",
            is_mentor=False,
            is_learner=True,
            is_verified=True,
            is_suspended=False,
        )
        learner_manas = User(
            society_id=society.society_id,
            full_name="Manas",
            email="manas@gmail.com",
            password_hash=common_password_hash,
            phone_number="9876543217",
            bio="Tech hobbyist learning full-stack development and modern API systems.",
            role="learner",
            is_mentor=False,
            is_learner=True,
            is_verified=True,
            is_suspended=False,
        )
        db.session.add_all([learner_harshad, learner_athul, learner_sooraj, learner_manas])
        db.session.flush()

        # 6. Mentor Skills
        usk1 = UserSkill(
            user_id=mentor_saanvi.user_id,
            skill_id=created_skills["Python Programming"].skill_id,
            experience_level="Expert",
            years_of_experience=8,
            description="Python, Flask, API Architecture, and Data Pipelines.",
        )
        usk2 = UserSkill(
            user_id=mentor_saanvi.user_id,
            skill_id=created_skills["Web Development"].skill_id,
            experience_level="Advanced",
            years_of_experience=6,
            description="Full-stack Next.js, React, and TypeScript development.",
        )
        usk3 = UserSkill(
            user_id=mentor_karthick.user_id,
            skill_id=created_skills["Yoga & Fitness"].skill_id,
            experience_level="Expert",
            years_of_experience=7,
            description="Daily morning yoga routines, breathing exercises, and posture correction.",
        )
        usk4 = UserSkill(
            user_id=mentor_harsh.user_id,
            skill_id=created_skills["Guitar"].skill_id,
            experience_level="Expert",
            years_of_experience=9,
            description="Acoustic chords, scales, fingerpicking, and composition.",
        )
        db.session.add_all([usk1, usk2, usk3, usk4])

        # 7. Availabilities for Mentors
        days = ["Monday", "Wednesday", "Friday", "Saturday"]
        av_list = []
        for day in days:
            av1 = Availability(
                user_id=mentor_saanvi.user_id,
                day_of_week=day,
                start_time=time(10, 0),
                end_time=time(12, 0),
            )
            av2 = Availability(
                user_id=mentor_karthick.user_id,
                day_of_week=day,
                start_time=time(16, 0),
                end_time=time(18, 0),
            )
            av3 = Availability(
                user_id=mentor_harsh.user_id,
                day_of_week=day,
                start_time=time(14, 0),
                end_time=time(16, 0),
            )
            av_list.extend([av1, av2, av3])
        db.session.add_all(av_list)
        db.session.flush()

        # 8. Sessions
        target_date = date.today() + timedelta(days=2)
        sess1 = Session(
            learner_id=learner_harshad.user_id,
            mentor_id=mentor_saanvi.user_id,
            skill_id=created_skills["Python Programming"].skill_id,
            availability_id=av_list[0].availability_id,
            session_mode="online",
            session_date=date.today() - timedelta(days=2),
            meeting_link="https://meet.jit.si/nsep-python-session-101",
            status="Completed",
            learner_note="Looking forward to deep diving into Python decorators and system architecture.",
        )
        sess2 = Session(
            learner_id=learner_sooraj.user_id,
            mentor_id=mentor_karthick.user_id,
            skill_id=created_skills["Yoga & Fitness"].skill_id,
            availability_id=av_list[1].availability_id,
            session_mode="in-person",
            session_date=target_date,
            location="Society Clubhouse Room B",
            status="Accepted",
            learner_note="Need guidance on morning stretching and breathing routines.",
        )
        sess3 = Session(
            learner_id=learner_athul.user_id,
            mentor_id=mentor_harsh.user_id,
            skill_id=created_skills["Guitar"].skill_id,
            availability_id=av_list[2].availability_id,
            session_mode="in-person",
            session_date=target_date + timedelta(days=1),
            location="Community Garden Gazebo",
            status="Pending",
            learner_note="Beginner acoustic chords and rhythm exercises.",
        )
        db.session.add_all([sess1, sess2, sess3])
        db.session.flush()

        # 9. Review
        rev1 = Review(
            session_id=sess1.session_id,
            learner_id=learner_harshad.user_id,
            mentor_id=mentor_saanvi.user_id,
            rating=5,
            review_text="Saanvi is a brilliant mentor! She explained complex architectural concepts with great clarity.",
        )
        db.session.add(rev1)
        db.session.flush()

        # 10. Notifications
        notif1 = Notification(
            user_id=learner_sooraj.user_id,
            title="Session Confirmed",
            message=f"Your session with {mentor_karthick.full_name} on {target_date} has been confirmed.",
            notification_type="session",
            is_read=False,
        )
        notif2 = Notification(
            user_id=mentor_saanvi.user_id,
            title="New Review Received",
            message="Harshad left a 5-star review for your Python Programming session.",
            notification_type="review",
            is_read=False,
        )
        db.session.add_all([notif1, notif2])

        # 11. Messages
        msg1 = Message(
            sender_id=learner_harshad.user_id,
            receiver_id=mentor_saanvi.user_id,
            session_id=sess1.session_id,
            message="Hi Saanvi! Thank you for the insightful session today.",
            is_read=True,
        )
        msg2 = Message(
            sender_id=mentor_saanvi.user_id,
            receiver_id=learner_harshad.user_id,
            session_id=sess1.session_id,
            message="You're very welcome Harshad! Keep practicing those API concepts.",
            is_read=True,
        )
        db.session.add_all([msg1, msg2])

        # 12. Reports
        rep1 = Report(
            review_id=rev1.review_id,
            reported_by=learner_athul.user_id,
            reported_user=learner_manas.user_id,
            reason="Unverified Booking Activity",
            description="Suspicious duplicate booking request on community board.",
            status="Pending",
        )
        db.session.add(rep1)

        db.session.commit()
        print("Database successfully wiped and populated with new users!")


if __name__ == "__main__":
    seed_database()

