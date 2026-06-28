import math
import datetime
from typing import Optional

import jwt
from fastapi import Depends, FastAPI, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import case, func, or_
from sqlalchemy.orm import Session

import models
import schemas
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Ticket Tracker API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

SECRET_KEY = "supersecret-key-change-in-production"
ALGORITHM = "HS256"
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin"


def create_token(username: str, role: str) -> str:
    payload = {
        "sub": username,
        "role": role,
        "exp": datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(hours=24),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def get_current_user(authorization: Optional[str] = Header(None)) -> Optional[dict]:
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization.split(" ", 1)[1]
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None


def require_admin(authorization: Optional[str] = Header(None)) -> dict:
    user = get_current_user(authorization)
    if not user or user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Требуются права администратора")
    return user


# ---------- Auth ----------

@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login(data: schemas.LoginRequest):
    if data.username == ADMIN_USERNAME and data.password == ADMIN_PASSWORD:
        token = create_token(data.username, "admin")
        return {"access_token": token, "token_type": "bearer"}
    raise HTTPException(status_code=401, detail="Неверные учётные данные")


@app.post("/api/auth/logout")
def logout():
    return {"detail": "Logged out"}


# ---------- Tickets ----------

_PRIORITY_ORDER = case(
    (models.Ticket.priority == "high", 3),
    (models.Ticket.priority == "normal", 2),
    else_=1,
)


@app.get("/api/tickets", response_model=schemas.PaginatedTickets)
def list_tickets(
    status: Optional[str] = Query(None),
    priority: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("created_at", pattern="^(created_at|priority)$"),
    sort_dir: str = Query("desc", pattern="^(asc|desc)$"),
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    query = db.query(models.Ticket)

    if status:
        query = query.filter(models.Ticket.status == status)
    if priority:
        query = query.filter(models.Ticket.priority == priority)
    if search and search.strip():
        like = f"%{search.strip().lower()}%"
        query = query.filter(
            or_(
                func.unicode_lower(models.Ticket.title).like(like),
                func.unicode_lower(models.Ticket.description).like(like),
            )
        )

    if sort_by == "priority":
        order_col = _PRIORITY_ORDER
    else:
        order_col = models.Ticket.created_at

    query = query.order_by(order_col.desc() if sort_dir == "desc" else order_col.asc())

    total = query.count()
    pages = max(1, math.ceil(total / page_size))
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return {"items": items, "total": total, "page": page, "page_size": page_size, "pages": pages}


@app.post("/api/tickets", response_model=schemas.TicketResponse, status_code=201)
def create_ticket(data: schemas.TicketCreate, db: Session = Depends(get_db)):
    ticket = models.Ticket(
        title=data.title,
        description=data.description,
        status=data.status.value,
        priority=data.priority.value,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)
    return ticket


@app.patch("/api/tickets/{ticket_id}", response_model=schemas.TicketResponse)
def update_ticket(
    ticket_id: int,
    data: schemas.TicketUpdate,
    db: Session = Depends(get_db),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if ticket.status == "done":
        raise HTTPException(
            status_code=422,
            detail="Нельзя редактировать заявку со статусом «Выполнено»",
        )

    if data.status is not None:
        if data.status.value != "done" and ticket.status == "done":
            raise HTTPException(
                status_code=422,
                detail="Нельзя вернуть заявку из статуса «Выполнено»",
            )
        ticket.status = data.status.value

    if data.priority is not None:
        ticket.priority = data.priority.value
    if data.title is not None:
        ticket.title = data.title
    if data.description is not None:
        ticket.description = data.description

    ticket.updated_at = datetime.datetime.now(datetime.timezone.utc)
    db.commit()
    db.refresh(ticket)
    return ticket


@app.delete("/api/tickets/{ticket_id}", status_code=204)
def delete_ticket(
    ticket_id: int,
    db: Session = Depends(get_db),
    _: dict = Depends(require_admin),
):
    ticket = db.query(models.Ticket).filter(models.Ticket.id == ticket_id).first()
    if not ticket:
        raise HTTPException(status_code=404, detail="Заявка не найдена")

    if ticket.status == "done":
        raise HTTPException(
            status_code=422,
            detail="Нельзя удалить заявку со статусом «Выполнено»",
        )

    db.delete(ticket)
    db.commit()
