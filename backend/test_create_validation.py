"""Тесты создания заявки и валидации модели данных."""
from datetime import datetime

from conftest import make_ticket


def test_create_minimal(client):
    resp = client.post("/api/tickets", json={"title": "Минимальная заявка"})
    assert resp.status_code == 201
    body = resp.json()
    assert body["id"] >= 1
    assert body["title"] == "Минимальная заявка"
    assert body["description"] is None
    assert body["status"] == "new"        # дефолт
    assert body["priority"] == "normal"   # дефолт
    assert body["created_at"]
    assert body["updated_at"]


def test_create_full(client):
    body = make_ticket(client, title="Полная заявка", description="Текст",
                       status="in_progress", priority="high")
    assert body["title"] == "Полная заявка"
    assert body["description"] == "Текст"
    assert body["status"] == "in_progress"
    assert body["priority"] == "high"


def test_timestamps_are_utc_iso(client):
    body = make_ticket(client)
    # Значения должны парситься как ISO-даты.
    datetime.fromisoformat(body["created_at"])
    datetime.fromisoformat(body["updated_at"])


# ----- Валидация title -----

def test_title_too_short(client):
    resp = client.post("/api/tickets", json={"title": "ab"})
    assert resp.status_code == 422


def test_title_min_boundary_ok(client):
    resp = client.post("/api/tickets", json={"title": "abc"})
    assert resp.status_code == 201


def test_title_too_long(client):
    resp = client.post("/api/tickets", json={"title": "x" * 121})
    assert resp.status_code == 422


def test_title_max_boundary_ok(client):
    resp = client.post("/api/tickets", json={"title": "x" * 120})
    assert resp.status_code == 201


def test_title_missing(client):
    resp = client.post("/api/tickets", json={"description": "без заголовка"})
    assert resp.status_code == 422


# ----- Валидация description -----

def test_description_too_long(client):
    resp = client.post("/api/tickets", json={"title": "Заголовок", "description": "y" * 1001})
    assert resp.status_code == 422


def test_description_max_boundary_ok(client):
    resp = client.post("/api/tickets", json={"title": "Заголовок", "description": "y" * 1000})
    assert resp.status_code == 201


# ----- Валидация enum-полей -----

def test_invalid_status(client):
    resp = client.post("/api/tickets", json={"title": "Заголовок", "status": "unknown"})
    assert resp.status_code == 422


def test_invalid_priority(client):
    resp = client.post("/api/tickets", json={"title": "Заголовок", "priority": "urgent"})
    assert resp.status_code == 422
