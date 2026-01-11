import pytest
from app.auth import (
    parse_users,
    authenticate_user,
    create_access_token,
    verify_token,
)
from fastapi import HTTPException


def test_parse_users():
    """Test parsing NIBBLE_USERS env var"""
    users = parse_users()
    assert isinstance(users, dict)
    assert "yak" in users
    assert users["yak"] == "changeme"


def test_authenticate_user_valid():
    """Test authentication with valid credentials"""
    user_id = authenticate_user("yak", "changeme")
    assert user_id == "yak"


def test_authenticate_user_invalid_username():
    """Test authentication with invalid username"""
    user_id = authenticate_user("invalid", "changeme")
    assert user_id is None


def test_authenticate_user_invalid_password():
    """Test authentication with invalid password"""
    user_id = authenticate_user("yak", "wrongpassword")
    assert user_id is None


def test_create_and_verify_token():
    """Test creating and verifying JWT token"""
    token = create_access_token(data={"sub": "testuser"})
    assert isinstance(token, str)
    assert len(token) > 0
    
    # Verify the token
    result = verify_token(token)
    assert result["user_id"] == "testuser"


def test_verify_token_invalid():
    """Test verifying invalid token"""
    with pytest.raises(HTTPException) as exc_info:
        verify_token("invalid.token.here")
    assert exc_info.value.status_code == 401


def test_verify_token_missing_sub():
    """Test verifying token without sub claim"""
    token = create_access_token(data={"other": "data"})
    with pytest.raises(HTTPException) as exc_info:
        verify_token(token)
    assert exc_info.value.status_code == 401


def test_login_endpoint(client):
    """Test login endpoint"""
    response = client.post(
        "/auth/login",
        json={"username": "yak", "password": "changeme"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "token" in data
    assert "user_id" in data
    assert data["user_id"] == "yak"


def test_login_endpoint_invalid(client):
    """Test login endpoint with invalid credentials"""
    response = client.post(
        "/auth/login",
        json={"username": "yak", "password": "wrong"}
    )
    assert response.status_code == 401


def test_health_endpoint(client):
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
