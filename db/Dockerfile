FROM postgres:16-alpine

WORKDIR /migrations

COPY migrations ./migrations

CMD ["sh", "-c", "psql \"$DATABASE_URL\" -f ./migrations/001_create_tasks.sql"]
