from datetime import date, time

from flask_jwt_extended import create_access_token

from app.models.availability import Availability
from app.models.review import Review
from app.models.session import Session
from app.models.skill import Skill
from app.models.user import User


def create_completed_session(database, auth_learner, sample_mentor):
    slot = Availability(
        user_id=sample_mentor.user_id,
        day_of_week="Friday",
        start_time=time(10, 0),
        end_time=time(11, 0),
    )

    skill = Skill(
        skill_name="Docker",
        category="DevOps",
    )

    database.session.add_all([slot, skill])
    database.session.commit()

    session = Session(
        learner_id=auth_learner["user"].user_id,
        mentor_id=sample_mentor.user_id,
        skill_id=skill.skill_id,
        availability_id=slot.availability_id,
        session_mode="Online",
        session_date=date.today(),
        status="Completed",
    )

    database.session.add(session)
    database.session.commit()

    return session


def test_rate_mentor_success(
    client,
    auth_learner,
    sample_mentor,
    database,
):
    session = create_completed_session(
        database,
        auth_learner,
        sample_mentor,
    )

    response = client.post(
        "/api/reviews/",
        json={
            "session_id": session.session_id,
            "rating": 5,
            "review_text": "Excellent mentoring session.",
        },
        headers=auth_learner["headers"],
    )

    assert response.status_code == 201

    data = response.get_json()

    assert data["status"] == "success"
    assert data["message"] == "Mentor rated successfully"

    assert data["data"]["session_id"] == session.session_id
    assert data["data"]["learner_id"] == auth_learner["user"].user_id
    assert data["data"]["mentor_id"] == sample_mentor.user_id
    assert data["data"]["rating"] == 5

    review = Review.query.one()

    assert review.session_id == session.session_id
    assert review.learner_id == auth_learner["user"].user_id
    assert review.mentor_id == sample_mentor.user_id
    assert review.rating == 5


def test_rate_mentor_invalid_rating(
    client,
    auth_learner,
    sample_mentor,
    database,
):
    session = create_completed_session(
        database,
        auth_learner,
        sample_mentor,
    )

    response = client.post(
        "/api/reviews/",
        json={
            "session_id": session.session_id,
            "rating": 6,
        },
        headers=auth_learner["headers"],
    )

    assert response.status_code == 400


def test_rate_mentor_unauthorized(
    client,
    auth_learner,
    sample_mentor,
    database,
):
    session = create_completed_session(
        database,
        auth_learner,
        sample_mentor,
    )

    response = client.post(
        "/api/reviews/",
        json={
            "session_id": session.session_id,
            "rating": 5,
        },
    )

    assert response.status_code == 401


def test_rate_mentor_invalid_session(
    client,
    auth_learner,
):
    response = client.post(
        "/api/reviews/",
        json={
            "session_id": 999999,
            "rating": 5,
        },
        headers=auth_learner["headers"],
    )

    assert response.status_code == 404


def test_rate_mentor_duplicate_rating(
    client,
    auth_learner,
    sample_mentor,
    database,
):
    session = create_completed_session(
        database,
        auth_learner,
        sample_mentor,
    )

    payload = {
        "session_id": session.session_id,
        "rating": 5,
    }

    first_response = client.post(
        "/api/reviews/",
        json=payload,
        headers=auth_learner["headers"],
    )

    second_response = client.post(
        "/api/reviews/",
        json=payload,
        headers=auth_learner["headers"],
    )

    assert first_response.status_code == 201
    assert second_response.status_code == 409


def test_learner_cannot_rate_session_they_did_not_attend(
    client,
    auth_learner,
    sample_mentor,
    database,
):
    session = create_completed_session(
        database,
        auth_learner,
        sample_mentor,
    )

    other_learner = User(
        society_id=auth_learner["user"].society_id,
        full_name="Other Learner",
        email="other.learner@example.com",
        password_hash="test-hash",
        phone_number="9999999991",
        is_learner=True,
        is_mentor=False,
    )

    database.session.add(other_learner)
    database.session.commit()

    token = create_access_token(
        identity=str(other_learner.user_id)
    )

    other_headers = {
        "Authorization": f"Bearer {token}"
    }

    response = client.post(
        "/api/reviews/",
        json={
            "session_id": session.session_id,
            "rating": 5,
        },
        headers=other_headers,
    )

    assert response.status_code == 403