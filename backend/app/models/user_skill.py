from app.extensions import db


class UserSkill(db.Model):
    __tablename__ = "user_skills"

    user_skill_id = db.Column(db.Integer, primary_key=True)

    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)

    skill_id = db.Column(db.Integer, db.ForeignKey("skills.skill_id"), nullable=False)

    experience_level = db.Column(db.String(20), nullable=False)

    years_of_experience = db.Column(db.Integer)

    description = db.Column(db.Text)

    user = db.relationship("User", back_populates="user_skills")

    skill = db.relationship("Skill", back_populates="user_skills")
