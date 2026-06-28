from sqlalchemy import create_engine, event
from sqlalchemy.engine import Engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

SQLALCHEMY_DATABASE_URL = "sqlite:///./tickets.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)


@event.listens_for(Engine, "connect")
def _register_sqlite_functions(dbapi_connection, _connection_record):
    """Unicode-aware lower() для регистронезависимого поиска по кириллице."""
    try:
        dbapi_connection.create_function(
            "unicode_lower", 1, lambda value: value.lower() if value is not None else None
        )
    except Exception:
        # Не SQLite-подключение — пропускаем.
        pass
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
