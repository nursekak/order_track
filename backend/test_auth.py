"""Тесты аутентификации администратора."""


def test_login_success(client):
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert isinstance(body["access_token"], str) and body["access_token"]


def test_login_wrong_password(client):
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "wrong"})
    assert resp.status_code == 401
    assert "detail" in resp.json()


def test_login_wrong_username(client):
    resp = client.post("/api/auth/login", json={"username": "root", "password": "admin"})
    assert resp.status_code == 401
