from app.extensions import db


class Skill(db.Model):
    __tablename__ = "skills"

    skill_id = db.Column(db.Integer, primary_key=True)

    skill_name = db.Column(db.String(100), unique=True, nullable=False)

    category = db.Column(db.String(100), nullable=False)

    user_skills = db.relationship(
        "UserSkill", back_populates="skill", cascade="all, delete-orphan", lazy=True
    )

    sessions = db.relationship("Session", back_populates="skill", lazy=True)
