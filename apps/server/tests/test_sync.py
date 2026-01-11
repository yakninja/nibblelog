import pytest
from uuid import uuid4


@pytest.mark.skip(reason="Integration test - requires database")
def test_push_deltas_unauthorized(client):
    """Test push endpoint without auth"""
    response = client.post(
        "/sync/push",
        json={
            "device_id": "test-device",
            "deltas": []
        }
    )
    assert response.status_code == 403


@pytest.mark.skip(reason="Integration test - requires database")
def test_pull_deltas_unauthorized(client):
    """Test pull endpoint without auth"""
    response = client.get("/sync/pull?cursor=0&device_id=test-device")
    assert response.status_code == 403


@pytest.mark.skip(reason="Integration test - requires database")
def test_push_and_pull_deltas(client, auth_headers):
    """Test pushing and pulling deltas"""
    delta = {
        "id": str(uuid4()),
        "user_id": "yak",
        "device_id": "test-device",
        "entity": "category",
        "entity_id": str(uuid4()),
        "op": "upsert",
        "payload": {"name": "Test Category", "color": "#FF0000"},
        "ts": 1704945600000
    }
    
    # Push delta
    response = client.post(
        "/sync/push",
        json={"device_id": "test-device", "deltas": [delta]},
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert delta["id"] in data["acked"]
    assert data["last_server_seq"] > 0
    
    # Pull deltas
    response = client.get(
        "/sync/pull?cursor=0&device_id=test-device",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert "deltas" in data
    assert "cursor" in data
    assert len(data["deltas"]) > 0
    assert data["deltas"][0]["id"] == delta["id"]


@pytest.mark.skip(reason="Integration test - requires database")
def test_push_deltas_idempotent(client, auth_headers):
    """Test that pushing the same delta twice is idempotent"""
    delta = {
        "id": str(uuid4()),
        "user_id": "yak",
        "device_id": "test-device",
        "entity": "activity",
        "entity_id": str(uuid4()),
        "op": "upsert",
        "payload": {"description": "Test Activity"},
        "ts": 1704945600000
    }
    
    # Push first time
    response1 = client.post(
        "/sync/push",
        json={"device_id": "test-device", "deltas": [delta]},
        headers=auth_headers
    )
    assert response1.status_code == 200
    cursor1 = response1.json()["last_server_seq"]
    
    # Push second time (same delta)
    response2 = client.post(
        "/sync/push",
        json={"device_id": "test-device", "deltas": [delta]},
        headers=auth_headers
    )
    assert response2.status_code == 200
    # Should still be acknowledged
    assert delta["id"] in response2.json()["acked"]


@pytest.mark.skip(reason="Integration test - requires database")
def test_push_wrong_user(client, auth_headers):
    """Test that users can't push deltas for other users"""
    delta = {
        "id": str(uuid4()),
        "user_id": "other_user",  # Different user!
        "device_id": "test-device",
        "entity": "category",
        "entity_id": str(uuid4()),
        "op": "upsert",
        "payload": {"name": "Malicious Category"},
        "ts": 1704945600000
    }
    
    response = client.post(
        "/sync/push",
        json={"device_id": "test-device", "deltas": [delta]},
        headers=auth_headers
    )
    assert response.status_code == 403
