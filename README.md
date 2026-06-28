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

### Скрипты запуска (Windows)
В корне есть готовые PowerShell-скрипты:
```powershell
.\start-backend.ps1    # запуск API на порту 8000
.\start-frontend.ps1   # запуск фронтенда на порту 5173
```

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

- Регистронезависимый поиск работает в том числе для кириллицы

## Бизнес-правила

- Заявку в статусе **«Выполнено»** нельзя редактировать или удалять
- Нельзя вернуть заявку из статуса «Выполнено» в другой
- При нарушении правила API возвращает `422` с понятным сообщением в поле `detail`

## API

| Метод | Путь | Описание | Доступ |
|-------|------|----------|--------|
| `POST` | `/api/auth/login` | Вход, выдаёт JWT-токен | все |
| `GET` | `/api/tickets` | Список с фильтрами, поиском, сортировкой, пагинацией | все |
| `POST` | `/api/tickets` | Создание заявки | все |
| `PATCH` | `/api/tickets/{id}` | Изменение статуса/полей | все |
| `DELETE` | `/api/tickets/{id}` | Удаление заявки | только админ |

**Параметры `GET /api/tickets`:** `search`, `status`, `priority`, `sort_by` (`created_at` \| `priority`), `sort_dir` (`asc` \| `desc`), `page`, `page_size` (1–100). Поиск, фильтрация, сортировка и пагинация выполняются на backend.

## Тесты

Backend покрыт **44 тестами** (pytest) с изолированной in-memory БД — проверяются валидация модели, все функциональные требования и бизнес-правила.

```bash
cd backend
python -m pytest -v
```

## Сброс базы данных

Полное обнуление (удаление всех заявок и сброс счётчика `id`):
```bash
cd backend
python reset_db.py
```

## Структура проекта

```
zakaz/
├── backend/
│   ├── main.py             # FastAPI приложение, маршруты
│   ├── models.py           # SQLAlchemy ORM модели
│   ├── schemas.py          # Pydantic схемы валидации
│   ├── database.py         # Подключение к SQLite, unicode_lower
│   ├── reset_db.py         # Скрипт обнуления базы
│   ├── conftest.py         # Фикстуры тестов (изолированная БД)
│   ├── test_auth.py                    # Тесты аутентификации
│   ├── test_create_validation.py       # Тесты создания и валидации
│   ├── test_list_filter_search_sort.py # Тесты списка/фильтров/поиска
│   ├── test_update_delete_rules.py     # Тесты статусов и бизнес-правил
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── App.tsx             # Главный компонент
│   │   ├── api.ts              # HTTP-клиент
│   │   ├── types.ts            # TypeScript типы
│   │   └── components/
│   │       ├── TicketRow.tsx          # Строка таблицы
│   │       ├── StatusBadge.tsx        # Бейджи статуса/приоритета
│   │       ├── CreateTicketModal.tsx  # Модал создания
│   │       ├── LoginModal.tsx         # Модал входа
│   │       └── Pagination.tsx         # Пагинация
│   └── package.json
├── start-backend.ps1
├── start-frontend.ps1
└── .gitignore
```
