"""Скрипт для полного обнуления базы данных заявок."""
from database import Base, engine
import models  # noqa: F401  (нужен для регистрации таблиц в metadata)


def reset_database() -> None:
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    print("База данных обнулена: все заявки удалены, счётчик id сброшен.")


if __name__ == "__main__":
    reset_database()
