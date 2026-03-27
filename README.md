# Kittygram

`Kittygram` — учебный веб-проект для публикации карточек котов с
фотографиями, цветом, годом рождения и достижениями.

## Назначение проекта
Проект реализует:
- регистрацию пользователей;
- авторизацию по токену;
- просмотр списка котов с пагинацией;
- создание, редактирование и удаление карточек котов;
- загрузку изображений;
- работу с достижениями котов;
- автоматическую документацию API через Swagger и ReDoc.

## Используемые технологии
- Python 3.9
- Django 3.2
- Django REST Framework
- Djoser
- PostgreSQL
- Nginx
- Docker Compose

## Структура проекта
- `backend/` — серверная часть на Django REST Framework;
- `frontend/` — клиентская часть приложения;
- `nginx/` — конфигурация веб-сервера;
- `docker-compose.yml` — конфигурация локального запуска контейнеров;
- `.env.example` — пример переменных окружения.

## Требования к окружению
Для запуска проекта необходимо установить:
- Git;
- Docker Desktop.

При работе в Windows перед запуском проекта необходимо убедиться, что
`Docker Desktop` запущен.

## Порядок локального запуска
1. Клонировать репозиторий и перейти в его каталог:
```bash
git clone https://github.com/ReLax164/kittygram.git
cd kittygram
```

2. Создать файл `.env` в корневой директории проекта по примеру
`.env.example`.

Пример содержимого файла `.env`:
```env
POSTGRES_DB=kittygram
POSTGRES_USER=kittygram_user
POSTGRES_PASSWORD=kittygram_password
DB_NAME=kittygram
DB_HOST=db
DB_PORT=5432
```

3. Выполнить сборку и запуск контейнеров:
```bash
docker compose up --build -d
```

4. Применить миграции базы данных:
```bash
docker compose exec backend python manage.py migrate
```

5. Собрать статические файлы и подготовить их для раздачи через `nginx`:
```bash
docker compose exec backend python manage.py collectstatic --no-input
docker compose exec backend cp -r /app/collected_static/. /backend_static/static/
```

6. Создать суперпользователя:
```bash
docker compose exec backend python manage.py createsuperuser
```

7. Проверить состояние контейнеров:
```bash
docker compose ps
```

## Адреса после запуска
- главная страница: `http://127.0.0.1:9000/`
- административная панель: `http://127.0.0.1:9000/admin/`
- Swagger UI: `http://127.0.0.1:9000/swagger/`
- ReDoc: `http://127.0.0.1:9000/redoc/`

## Авторизация в API
В проекте используется токен-аутентификация.

Для получения токена необходимо выполнить запрос:
```http
POST /api/token/login/
```

Пример тела запроса:
```json
{
  "username": "your_username",
  "password": "your_password"
}
```

После получения токена его необходимо передавать в заголовке запроса:
```text
Authorization: Token <ваш_токен>
```

## Основные API-эндпоинты
- `POST /api/token/login/`
- `POST /api/token/logout/`
- `GET /api/cats/`
- `POST /api/cats/`
- `GET /api/cats/{id}/`
- `PATCH /api/cats/{id}/`
- `DELETE /api/cats/{id}/`
- `GET /api/users/me/`
- `GET /api/achievements/`

## Остановка проекта
Для остановки контейнеров выполнить команду:
```bash
docker compose down
```
