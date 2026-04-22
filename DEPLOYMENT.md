# Deployment

Everything is Docker-first. Just use the root `docker-compose.yml`.

1. `cp .env.example .env`
2. Set `JWT_SECRET` or `JWT_SECRET_FILE` to a real secret value before first boot.
3. Set `POSTGRES_PASSWORD` or `POSTGRES_PASSWORD_FILE`.
4. `docker compose up --build -d`

The Angular app proxies `/api/*` to the Spring Boot service automatically.
Flyway migrations run on startup.
The API container fails fast if required secrets are missing or placeholder-like.
