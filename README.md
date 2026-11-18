# Cinema API: домашнє завдання 2

Серверна частина кінотеатру на NestJS + PostgreSQL 

## Запуск

```bash
npm install

cp .env.example .env

docker compose up -d

npm run migration:run

npm run seed

npm run start:dev
```

Після запуску:

- API: http://localhost:3000
- Swagger: http://localhost:3000/docs

### Приклад `.env`

```env
# Порт HTTP-сервера
PORT=3000

# Підключення до PostgreSQL
DB_HOST=localhost
DB_PORT=5433
DB_USER=cinema
DB_PASSWORD=cinema
DB_NAME=cinema
```

## Міграції

```bash
npm run migration:run
npm run migration:revert
npm run migration:generate -- src/database/migrations/<Name>
```

## Перевірка

Файл [`requests.http`](requests.http)

Автотести:

```bash
docker exec cinema-postgres psql -U cinema -d cinema -c "create database cinema_test"
DB_NAME=cinema_test npm run migration:run
npm run test:e2e
```
