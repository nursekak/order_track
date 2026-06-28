# Трекер заявок

Fullstack-приложение для учёта внутренних заявок.

**Стек:** Python 3.11 + FastAPI + SQLite | React 19 + TypeScript + Tailwind CSS 4

## Быстрый старт

### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
API доступен на `http://localhost:8000`  
Swagger UI: `http://localhost:8000/docs`

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Приложение: `http://localhost:5173`

## Учётные данные

| Роль          | Логин | Пароль |
|---------------|-------|--------|
| Администратор | admin | admin  |

Вход через кнопку **«Войти как админ»** в шапке.

## Функциональность

- Создание заявок с заголовком, описанием, статусом и приоритетом
- Список заявок в таблице с пагинацией
- Поиск по заголовку и описанию (debounce 400 мс)
- Фильтрация по статусу и приоритету
- Сортировка по дате создания и приоритету
- Изменение статуса прямо в строке таблицы
- Удаление заявок (только администратор)
- Все операции выполняются на backend

## Бизнес-правила

- Заявку в статусе **«Выполнено»** нельзя редактировать или удалять
- Нельзя вернуть заявку из статуса «Выполнено» в другой

## Структура проекта

```
zakaz/
├── backend/
│   ├── main.py         # FastAPI приложение, маршруты
│   ├── models.py       # SQLAlchemy ORM модели
│   ├── schemas.py      # Pydantic схемы валидации
│   ├── database.py     # Подключение к SQLite
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── App.tsx             # Главный компонент
    │   ├── api.ts              # HTTP-клиент
    │   ├── types.ts            # TypeScript типы
    │   └── components/
    │       ├── TicketRow.tsx          # Строка таблицы
    │       ├── StatusBadge.tsx        # Бейджи статуса/приоритета
    │       ├── CreateTicketModal.tsx  # Модал создания
    │       ├── LoginModal.tsx         # Модал входа
    │       └── Pagination.tsx         # Пагинация
    └── package.json
```
