# Deployment

Everything is Docker-first. Just use the root `docker-compose.yml`.

1. `cp .env.example .env`
2. `docker compose up --build -d`

The Angular app proxies `/api/*` to the Spring Boot service automatically.
Flyway migrations run on startup.
