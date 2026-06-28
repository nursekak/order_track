"""Тесты списка: фильтрация, поиск, сортировка, пагинация (всё на backend)."""
from conftest import make_ticket


def test_list_empty(client):
    resp = client.get("/api/tickets")
    assert resp.status_code == 200
    body = resp.json()
    assert body["items"] == []
    assert body["total"] == 0
    assert body["page"] == 1
    assert body["pages"] == 1


def test_list_returns_all(client):
    for i in range(3):
        make_ticket(client, title=f"Заявка {i}")
    body = client.get("/api/tickets").json()
    assert body["total"] == 3
    assert len(body["items"]) == 3


# ----- Фильтрация -----

def test_filter_by_status(client):
    make_ticket(client, status="new")
    make_ticket(client, status="in_progress")
    make_ticket(client, status="in_progress")
    body = client.get("/api/tickets", params={"status": "in_progress"}).json()
    assert body["total"] == 2
    assert all(t["status"] == "in_progress" for t in body["items"])


def test_filter_by_priority(client):
    make_ticket(client, priority="low")
    make_ticket(client, priority="high")
    body = client.get("/api/tickets", params={"priority": "high"}).json()
    assert body["total"] == 1
    assert body["items"][0]["priority"] == "high"


def test_filter_combined(client):
    make_ticket(client, status="new", priority="high")
    make_ticket(client, status="new", priority="low")
    make_ticket(client, status="done", priority="high")
    body = client.get("/api/tickets", params={"status": "new", "priority": "high"}).json()
    assert body["total"] == 1


# ----- Поиск -----

def test_search_by_title(client):
    make_ticket(client, title="Починить принтер")
    make_ticket(client, title="Заказать бумагу")
    body = client.get("/api/tickets", params={"search": "принтер"}).json()
    assert body["total"] == 1
    assert "принтер" in body["items"][0]["title"].lower()


def test_search_by_description(client):
    make_ticket(client, title="Заявка A", description="срочно нужен ноутбук")
    make_ticket(client, title="Заявка B", description="обычное описание")
    body = client.get("/api/tickets", params={"search": "ноутбук"}).json()
    assert body["total"] == 1


def test_search_case_insensitive(client):
    make_ticket(client, title="Большая Буква")
    body = client.get("/api/tickets", params={"search": "большая"}).json()
    assert body["total"] == 1


# ----- Сортировка -----

def test_sort_by_created_at_desc(client):
    a = make_ticket(client, title="Первая")
    b = make_ticket(client, title="Вторая")
    body = client.get("/api/tickets", params={"sort_by": "created_at", "sort_dir": "desc"}).json()
    ids = [t["id"] for t in body["items"]]
    assert ids.index(b["id"]) < ids.index(a["id"])


def test_sort_by_created_at_asc(client):
    a = make_ticket(client, title="Первая")
    b = make_ticket(client, title="Вторая")
    body = client.get("/api/tickets", params={"sort_by": "created_at", "sort_dir": "asc"}).json()
    ids = [t["id"] for t in body["items"]]
    assert ids.index(a["id"]) < ids.index(b["id"])


def test_sort_by_priority_desc(client):
    make_ticket(client, title="low", priority="low")
    make_ticket(client, title="high", priority="high")
    make_ticket(client, title="normal", priority="normal")
    body = client.get("/api/tickets", params={"sort_by": "priority", "sort_dir": "desc"}).json()
    priorities = [t["priority"] for t in body["items"]]
    assert priorities == ["high", "normal", "low"]


def test_sort_by_priority_asc(client):
    make_ticket(client, title="low", priority="low")
    make_ticket(client, title="high", priority="high")
    make_ticket(client, title="normal", priority="normal")
    body = client.get("/api/tickets", params={"sort_by": "priority", "sort_dir": "asc"}).json()
    priorities = [t["priority"] for t in body["items"]]
    assert priorities == ["low", "normal", "high"]


def test_invalid_sort_param_rejected(client):
    resp = client.get("/api/tickets", params={"sort_by": "title"})
    assert resp.status_code == 422


# ----- Пагинация -----

def test_pagination_pages_and_slicing(client):
    for i in range(25):
        make_ticket(client, title=f"Заявка {i:02d}")
    page1 = client.get("/api/tickets", params={"page": 1, "page_size": 10}).json()
    assert page1["total"] == 25
    assert page1["pages"] == 3
    assert len(page1["items"]) == 10
    assert page1["page"] == 1

    page3 = client.get("/api/tickets", params={"page": 3, "page_size": 10}).json()
    assert len(page3["items"]) == 5


def test_pagination_no_overlap(client):
    for i in range(10):
        make_ticket(client, title=f"Заявка {i}")
    p1 = client.get("/api/tickets", params={"page": 1, "page_size": 5}).json()
    p2 = client.get("/api/tickets", params={"page": 2, "page_size": 5}).json()
    ids1 = {t["id"] for t in p1["items"]}
    ids2 = {t["id"] for t in p2["items"]}
    assert ids1.isdisjoint(ids2)


def test_pagination_invalid_params(client):
    assert client.get("/api/tickets", params={"page": 0}).status_code == 422
    assert client.get("/api/tickets", params={"page_size": 0}).status_code == 422
    assert client.get("/api/tickets", params={"page_size": 101}).status_code == 422
