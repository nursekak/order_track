"""Общие фикстуры для тестов: изолированная in-memory БД и тестовый клиент."""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

import models
from database import Base, get_db
from main import app


@pytest.fixture()
def client():
    # Отдельная in-memory SQLite БД на каждый тест — полная изоляция.
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    Base.metadata.create_all(bind=engine)

    def override_get_db():
        db = TestingSessionLocal()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)


@pytest.fixture()
def admin_token(client):
    resp = client.post("/api/auth/login", json={"username": "admin", "password": "admin"})
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.fixture()
def admin_headers(admin_token):
    return {"Authorization": f"Bearer {admin_token}"}


def make_ticket(client, **overrides):
    """Утилита создания заявки с дефолтными валидными полями."""
    payload = {
        "title": "Тестовая заявка",
        "description": "Описание",
        "status": "new",
        "priority": "normal",
    }
    payload.update(overrides)
    resp = client.post("/api/tickets", json=payload)
    assert resp.status_code == 201, resp.text
    return resp.json()
