"""
Reset & Seed Script for Neighborhood Skill Exchange (Team-082)
Usage:
    cd backend
    python seed_data.py
"""

from datetime import datetime, date, timedelta
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
from app.models.message import Message
from app.models.notification import Notification
from app.models.favorite import Favorite


def seed_database():
    app = create_app()
    with app.app_context():
        print("[1/9] Resetting database tables...")
        db.drop_all()
        db.create_all()

        pwd_hash = generate_password_hash("Password123!")

        # 1. Societies (Neighborhoods)
        print("[2/9] Creating Societies / Neighborhoods...")
        s1 = Society(society_name="Green Valley Heights", address="100 Main Road", city="Chennai", state="TN", pincode="600036")
        s2 = Society(society_name="Palm Meadows", address="200 Lake View", city="Chennai", state="TN", pincode="600042")
        db.session.add_all([s1, s2])
        db.session.commit()

        # 2. Users (Admin, Mentors, Learners)
        print("[3/9] Creating Users...")
        admin = User(
            full_name="Akhil",
            email="akhil@gmail.com",
            password_hash=pwd_hash,
            phone_number="9876543210",
            society_id=s1.society_id,
            role="Admin",
            is_mentor=False,
            is_verified=True,
            bio="Platform Administrator for Green Valley Heights.",
        )
        db.session.add(admin)
        db.session.commit()

        s1.admin_id = admin.user_id
        db.session.commit()

        # Mentors & Learners
        mentor1 = User(
            full_name="Saanvi",
            email="saanvi@gmail.com",
            password_hash=pwd_hash,
            phone_number="9876543211",
            society_id=s1.society_id,
            role="Mentor",
            is_mentor=True,
            is_verified=True,
            bio="Senior Software Engineer passionate about teaching Python, Full-Stack development, and UI design.",
        )

        mentor2 = User(
            full_name="Karthick",
            email="karthick@gmail.com",
            password_hash=pwd_hash,
            phone_number="9876543212",
            society_id=s1.society_id,
            role="Mentor",
            is_mentor=True,
            is_verified=True,
            bio="Classical guitarist and music educator for over 6 years. Conducting acoustic and theory sessions.",
        )

        mentor3 = User(
            full_name="Harsh Kumar",
            email="harshkumar@gmail.com",
            password_hash=pwd_hash,
            phone_number="9876543213",
            society_id=s1.society_id,
            role="Mentor",
            is_mentor=True,
            is_verified=True,
            bio="Fitness trainer and yoga practitioner helping residents maintain a healthy lifestyle.",
        )

        learner1 = User(
            full_name="Harshad",
            email="harshad@gmail.com",
            password_hash=pwd_hash,
            phone_number="9876543214",
            society_id=s1.society_id,
            role="Learner",
            is_mentor=False,
            is_verified=True,
            bio="College student eager to learn Python programming and web development.",
        )

        learner2 = User(
            full_name="Athul",
            email="athul@gmail.com",
            password_hash=pwd_hash,
            phone_number="9876543215",
            society_id=s1.society_id,
            role="Learner",
            is_mentor=False,
            is_verified=True,
            bio="High schooler looking to learn acoustic guitar chords and music theory.",
        )

        learner3 = User(
            full_name="Sooraj",
            email="sooraj@gmail.com",
            password_hash=pwd_hash,
            phone_number="9876543216",
            society_id=s1.society_id,
            role="Learner",
            is_mentor=False,
            is_verified=True,
            bio="Tech enthusiast wanting to learn Yoga and morning mindfulness routines.",
        )

        learner4 = User(
            full_name="Manas",
            email="manas@gmail.com",
            password_hash=pwd_hash,
            phone_number="9876543217",
            society_id=s1.society_id,
            role="Learner",
            is_mentor=False,
            is_verified=True,
            bio="Resident looking to improve conversational Spanish and creative photography.",
        )

        db.session.add_all([admin, mentor1, mentor2, mentor3, learner1, learner2, learner3, learner4])
        db.session.commit()

        # 3. Skills
        print("[4/9] Creating Skills...")
        sk_python = Skill(skill_name="Python Programming", category="Technology")
        sk_guitar = Skill(skill_name="Acoustic Guitar", category="Music")
        sk_yoga = Skill(skill_name="Yoga & Mindfulness", category="Fitness")
        sk_web = Skill(skill_name="Web Development", category="Technology")
        sk_cook = Skill(skill_name="Healthy Meal Prep", category="Cooking")
        
        db.session.add_all([sk_python, sk_guitar, sk_yoga, sk_web, sk_cook])
        db.session.commit()

        # 4. User Skills (Mentor expertise with individual years of experience)
        print("[5/9] Assigning Skills to Mentors...")
        db.session.add_all([
            # Saanvi (Python + Web Dev)
            UserSkill(user_id=mentor1.user_id, skill_id=sk_python.skill_id, experience_level="Advanced", years_of_experience=5),
            UserSkill(user_id=mentor1.user_id, skill_id=sk_web.skill_id, experience_level="Intermediate", years_of_experience=4),
            
            # Karthick (Acoustic Guitar)
            UserSkill(user_id=mentor2.user_id, skill_id=sk_guitar.skill_id, experience_level="Advanced", years_of_experience=6),
            
            # Harsh Kumar (Yoga & Mindfulness + Healthy Meal Prep)
            UserSkill(user_id=mentor3.user_id, skill_id=sk_yoga.skill_id, experience_level="Advanced", years_of_experience=7),
            UserSkill(user_id=mentor3.user_id, skill_id=sk_cook.skill_id, experience_level="Intermediate", years_of_experience=3),
        ])
        db.session.commit()

        # 5. Availability Windows
        print("[6/9] Adding Mentor Availability Windows...")
        from datetime import time as dt_time

        # Saanvi Availability
        av_s1 = Availability(user_id=mentor1.user_id, day_of_week="Monday", start_time=dt_time(18, 0), end_time=dt_time(20, 30))
        av_s2 = Availability(user_id=mentor1.user_id, day_of_week="Wednesday", start_time=dt_time(18, 0), end_time=dt_time(20, 30))
        av_s3 = Availability(user_id=mentor1.user_id, day_of_week="Saturday", start_time=dt_time(9, 0), end_time=dt_time(12, 0))

        # Karthick Availability
        av_k1 = Availability(user_id=mentor2.user_id, day_of_week="Tuesday", start_time=dt_time(18, 0), end_time=dt_time(20, 0))
        av_k2 = Availability(user_id=mentor2.user_id, day_of_week="Thursday", start_time=dt_time(18, 0), end_time=dt_time(20, 0))
        av_k3 = Availability(user_id=mentor2.user_id, day_of_week="Sunday", start_time=dt_time(10, 0), end_time=dt_time(13, 0))

        # Harsh Kumar Availability
        av_h1 = Availability(user_id=mentor3.user_id, day_of_week="Monday", start_time=dt_time(7, 0), end_time=dt_time(8, 30))
        av_h2 = Availability(user_id=mentor3.user_id, day_of_week="Saturday", start_time=dt_time(7, 0), end_time=dt_time(9, 0))

        db.session.add_all([av_s1, av_s2, av_s3, av_k1, av_k2, av_k3, av_h1, av_h2])
        db.session.commit()

        # 6. Sessions (Diverse states: Pending, Accepted, Completed, Cancelled/Rejected)
        print("[7/9] Seeding Sessions across all statuses...")
        today = date.today()
        tomorrow = today + timedelta(days=1)
        next_week = today + timedelta(days=7)
        
        # 1. PENDING REQUESTS (For Saanvi to Accept / Decline)
        sess_pend1 = Session(
            learner_id=learner1.user_id,
            mentor_id=mentor1.user_id,
            skill_id=sk_python.skill_id,
            availability_id=av_s1.availability_id,
            session_mode="online",
            session_date=tomorrow,
            status="Pending",
            learner_note="Hi Saanvi! I need help understanding Python list comprehensions and dictionaries.",
            created_at=datetime.utcnow() - timedelta(hours=3),
            updated_at=datetime.utcnow() - timedelta(hours=3),
        )

        sess_pend2 = Session(
            learner_id=learner4.user_id,
            mentor_id=mentor1.user_id,
            skill_id=sk_web.skill_id,
            availability_id=av_s2.availability_id,
            session_mode="in_person",
            location="Tower B Clubhouse, Green Valley",
            session_date=today + timedelta(days=3),
            status="Pending",
            learner_note="Would love a 1-hour session on React hooks and state management.",
            created_at=datetime.utcnow() - timedelta(hours=1),
            updated_at=datetime.utcnow() - timedelta(hours=1),
        )

        # 2. ACCEPTED / CONFIRMED SESSIONS (Active classes ready to Start Call)
        sess_acc1 = Session(
            learner_id=learner2.user_id,
            mentor_id=mentor1.user_id,
            skill_id=sk_python.skill_id,
            availability_id=av_s3.availability_id,
            session_mode="online",
            session_date=today + timedelta(days=2),
            meeting_link="https://meet.jit.si/NSEP-Session-Saanvi-Athul",
            status="Accepted",
            learner_note="Looking forward to practicing algorithm basics!",
            created_at=datetime.utcnow() - timedelta(days=1),
            updated_at=datetime.utcnow() - timedelta(hours=5),
        )

        sess_acc2 = Session(
            learner_id=learner2.user_id,
            mentor_id=mentor2.user_id,
            skill_id=sk_guitar.skill_id,
            availability_id=av_k1.availability_id,
            session_mode="in_person",
            location="Clubhouse Music Room, Green Valley",
            session_date=tomorrow,
            status="Accepted",
            learner_note="Acoustic chords lesson (G, C, D progressions).",
            created_at=datetime.utcnow() - timedelta(days=2),
            updated_at=datetime.utcnow() - timedelta(days=1),
        )

        # 3. COMPLETED SESSIONS (Historical teaching records)
        sess_comp1 = Session(
            learner_id=learner1.user_id,
            mentor_id=mentor1.user_id,
            skill_id=sk_python.skill_id,
            availability_id=av_s1.availability_id,
            session_mode="online",
            session_date=today - timedelta(days=5),
            meeting_link="https://meet.jit.si/NSEP-Session-Past-Python",
            status="Completed",
            learner_note="Intro to Python variables and loops.",
            created_at=datetime.utcnow() - timedelta(days=6),
            updated_at=datetime.utcnow() - timedelta(days=5),
        )

        sess_comp2 = Session(
            learner_id=learner3.user_id,
            mentor_id=mentor1.user_id,
            skill_id=sk_web.skill_id,
            availability_id=av_s2.availability_id,
            session_mode="online",
            session_date=today - timedelta(days=8),
            meeting_link="https://meet.jit.si/NSEP-Session-Past-Web",
            status="Completed",
            learner_note="Building our first responsive CSS layout.",
            created_at=datetime.utcnow() - timedelta(days=9),
            updated_at=datetime.utcnow() - timedelta(days=8),
        )

        sess_comp3 = Session(
            learner_id=learner3.user_id,
            mentor_id=mentor3.user_id,
            skill_id=sk_yoga.skill_id,
            availability_id=av_h1.availability_id,
            session_mode="in_person",
            location="Society Lawn & Gazebo",
            session_date=today - timedelta(days=3),
            status="Completed",
            learner_note="Morning breathing exercise and spine alignment.",
            created_at=datetime.utcnow() - timedelta(days=4),
            updated_at=datetime.utcnow() - timedelta(days=3),
        )

        # 4. REJECTED / CANCELLED SESSIONS
        sess_rej1 = Session(
            learner_id=learner4.user_id,
            mentor_id=mentor1.user_id,
            skill_id=sk_python.skill_id,
            availability_id=av_s1.availability_id,
            session_mode="online",
            session_date=today - timedelta(days=2),
            status="Rejected",
            learner_note="Can we meet at 11 PM?",
            created_at=datetime.utcnow() - timedelta(days=3),
            updated_at=datetime.utcnow() - timedelta(days=2),
        )

        db.session.add_all([sess_pend1, sess_pend2, sess_acc1, sess_acc2, sess_comp1, sess_comp2, sess_comp3, sess_rej1])
        db.session.commit()

        # 7. Reviews & Ratings
        print("[8/9] Seeding Reviews & Community Feedback...")
        rev1 = Review(
            session_id=sess_comp1.session_id,
            learner_id=learner1.user_id,
            mentor_id=mentor1.user_id,
            rating=5,
            review_text="Saanvi explained Python concepts so clearly! Very patient and practical examples.",
            created_at=datetime.utcnow() - timedelta(days=5),
        )

        rev2 = Review(
            session_id=sess_comp2.session_id,
            learner_id=learner3.user_id,
            mentor_id=mentor1.user_id,
            rating=5,
            review_text="Great introductory web dev class. Helped me debug my CSS flexbox confusion in 20 minutes!",
            created_at=datetime.utcnow() - timedelta(days=8),
        )

        rev3 = Review(
            session_id=sess_comp3.session_id,
            learner_id=learner3.user_id,
            mentor_id=mentor3.user_id,
            rating=5,
            review_text="Harsh is an incredible yoga instructor. The morning session felt energizing and refreshing.",
            created_at=datetime.utcnow() - timedelta(days=3),
        )

        db.session.add_all([rev1, rev2, rev3])
        db.session.commit()

        # 8. Direct Messages (Pre-booking and active coordination)
        print("[9/9] Seeding Chat Conversations...")
        msg1 = Message(
            sender_id=learner1.user_id,
            receiver_id=mentor1.user_id,
            message="Hi Saanvi, I sent a request for Python mentorship on lists. Looking forward to your guidance!",
            is_read=True,
            sent_at=datetime.utcnow() - timedelta(hours=3),
        )
        msg2 = Message(
            sender_id=mentor1.user_id,
            receiver_id=learner1.user_id,
            message="Hi Harshad! Sure, make sure to have your VS Code and Python setup ready. We'll start with list comprehensions.",
            is_read=True,
            sent_at=datetime.utcnow() - timedelta(hours=2),
        )

        msg3 = Message(
            sender_id=learner4.user_id,
            receiver_id=mentor1.user_id,
            message="Hey Saanvi! Would you be available for in-person React guidance at the Clubhouse this weekend?",
            is_read=False,
            sent_at=datetime.utcnow() - timedelta(hours=1),
        )

        msg4 = Message(
            sender_id=learner2.user_id,
            receiver_id=mentor2.user_id,
            message="Hi Karthick, I brought an acoustic guitar. Do I need to buy any specific picks for our session?",
            is_read=True,
            sent_at=datetime.utcnow() - timedelta(days=1),
        )
        msg5 = Message(
            sender_id=mentor2.user_id,
            receiver_id=learner2.user_id,
            message="Hey Athul! Medium (0.73mm) picks are great for beginners. I will bring a spare one as well!",
            is_read=True,
            sent_at=datetime.utcnow() - timedelta(hours=18),
        )

        db.session.add_all([msg1, msg2, msg3, msg4, msg5])
        db.session.commit()

        # 9. Notifications
        db.session.add_all([
            Notification(
                user_id=mentor1.user_id,
                title="New booking request",
                message="Harshad requested a session on Python Programming for tomorrow.",
                notification_type="booking_request",
                is_read=False,
                created_at=datetime.utcnow() - timedelta(hours=3),
            ),
            Notification(
                user_id=mentor1.user_id,
                title="New booking request",
                message="Manas requested an in-person session on Web Development.",
                notification_type="booking_request",
                is_read=False,
                created_at=datetime.utcnow() - timedelta(hours=1),
            ),
            Notification(
                user_id=learner1.user_id,
                title="New review submitted",
                message="Your review for Saanvi has been recorded.",
                notification_type="review",
                is_read=True,
                created_at=datetime.utcnow() - timedelta(days=5),
            ),
        ])
        db.session.commit()

        print("\nSUCCESS: All platform features populated with realistic test data!")


if __name__ == "__main__":
    seed_database()
