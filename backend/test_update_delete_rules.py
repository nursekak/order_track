"""Тесты изменения статуса, удаления и бизнес-правил."""
from conftest import make_ticket


# ----- Изменение статуса -----

def test_update_status(client):
    t = make_ticket(client, status="new")
    resp = client.patch(f"/api/tickets/{t['id']}", json={"status": "in_progress"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "in_progress"


def test_update_priority(client):
    t = make_ticket(client, priority="low")
    resp = client.patch(f"/api/tickets/{t['id']}", json={"priority": "high"})
    assert resp.status_code == 200
    assert resp.json()["priority"] == "high"


def test_update_changes_updated_at(client):
    t = make_ticket(client, status="new")
    resp = client.patch(f"/api/tickets/{t['id']}", json={"status": "in_progress"})
    assert resp.json()["updated_at"] >= t["updated_at"]


def test_update_nonexistent(client):
    resp = client.patch("/api/tickets/9999", json={"status": "done"})
    assert resp.status_code == 404


# ----- Бизнес-правило: done нельзя редактировать -----

def test_done_cannot_be_edited(client):
    t = make_ticket(client, status="done")
    resp = client.patch(f"/api/tickets/{t['id']}", json={"priority": "high"})
    assert resp.status_code == 422
    assert "detail" in resp.json()


def test_done_cannot_change_title(client):
    t = make_ticket(client, status="done")
    resp = client.patch(f"/api/tickets/{t['id']}", json={"title": "Новый заголовок"})
    assert resp.status_code == 422


# ----- Бизнес-правило: нельзя вернуть из done -----

def test_cannot_revert_from_done(client):
    # Создаём new, переводим в done, пытаемся вернуть.
    t = make_ticket(client, status="new")
    client.patch(f"/api/tickets/{t['id']}", json={"status": "done"})
    resp = client.patch(f"/api/tickets/{t['id']}", json={"status": "new"})
    assert resp.status_code == 422
    assert "detail" in resp.json()


def test_can_move_new_to_done(client):
    t = make_ticket(client, status="new")
    resp = client.patch(f"/api/tickets/{t['id']}", json={"status": "done"})
    assert resp.status_code == 200
    assert resp.json()["status"] == "done"


# ----- Удаление: только админ -----

def test_delete_requires_auth(client):
    t = make_ticket(client, status="new")
    resp = client.delete(f"/api/tickets/{t['id']}")
    assert resp.status_code == 403


def test_delete_as_admin(client, admin_headers):
    t = make_ticket(client, status="new")
    resp = client.delete(f"/api/tickets/{t['id']}", headers=admin_headers)
    assert resp.status_code == 204
    # Заявка действительно удалена.
    assert client.get("/api/tickets").json()["total"] == 0


def test_delete_with_invalid_token(client):
    t = make_ticket(client, status="new")
    resp = client.delete(f"/api/tickets/{t['id']}", headers={"Authorization": "Bearer fake"})
    assert resp.status_code == 403


def test_delete_nonexistent(client, admin_headers):
    resp = client.delete("/api/tickets/9999", headers=admin_headers)
    assert resp.status_code == 404


# ----- Бизнес-правило: done нельзя удалять -----

def test_done_cannot_be_deleted_by_admin(client, admin_headers):
    t = make_ticket(client, status="done")
    resp = client.delete(f"/api/tickets/{t['id']}", headers=admin_headers)
    assert resp.status_code == 422
    assert "detail" in resp.json()
    # Заявка осталась в базе.
    assert client.get("/api/tickets").json()["total"] == 1
