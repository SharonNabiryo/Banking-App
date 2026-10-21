import pytest

from app import create_app
from app.config import TestConfig
from app.extensions import db


@pytest.fixture
def app():
    app = create_app(TestConfig)
    yield app
    with app.app_context():
        db.drop_all()


@pytest.fixture
def client(app):
    return app.test_client()


def register(client, email="jane@test.dev", ssn="999123456", first="jane", last="doe"):
    res = client.post("/api/auth/register", json={
        "email": email, "password": "password123", "firstName": first, "lastName": last, "ssn": ssn,
    })
    assert res.status_code == 201, res.json
    return {"Authorization": f"Bearer {res.json['token']}"}


def open_account(client, headers, deposit=None, kind="checking"):
    res = client.post("/api/accounts", json={"kind": kind, "openingDeposit": deposit}, headers=headers)
    assert res.status_code == 201, res.json
    return res.json["account"]["number"], res.json["pin"]


@pytest.fixture
def user(client):
    return register(client)
