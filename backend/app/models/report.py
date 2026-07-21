from datetime import datetime

from app.extensions import db


class Report(db.Model):
    __tablename__ = "reports"

    report_id = db.Column(db.Integer, primary_key=True)

    reported_by = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)

    reported_user = db.Column(
        db.Integer, db.ForeignKey("users.user_id"), nullable=False
    )

    reason = db.Column(db.String(255), nullable=False)

    description = db.Column(db.Text)

    status = db.Column(db.String(20), nullable=False, default="Pending")

    resolved_by = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=True)

    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    resolved_at = db.Column(db.DateTime, nullable=True)

    reporter = db.relationship(
        "User", foreign_keys=[reported_by], back_populates="reports_made"
    )

    reported_user_ref = db.relationship(
        "User", foreign_keys=[reported_user], back_populates="reports_received"
    )

    resolver = db.relationship(
        "User", foreign_keys=[resolved_by], back_populates="reports_resolved"
    )
