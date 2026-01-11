import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Test client fixture"""
    return TestClient(app)


@pytest.fixture
def auth_headers(client):
    """Fixture to get auth headers with valid token"""
    response = client.post(
        "/auth/login",
        json={"username": "yak", "password": "changeme"}
    )
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}
