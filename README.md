# HostelHub (Angular + Spring Boot)

A premium hostel management system with role-based dashboards for Students, Wardens, and Admins.

## Stack
- **Frontend**: Angular 20 (apps/web-angular)
- **Backend**: Spring Boot (apps/api-java)
- **Database**: PostgreSQL with Flyway

## Setup (Docker)
1. Copy `.env.example` to `.env`.
2. Set `JWT_SECRET` or `JWT_SECRET_FILE` to a non-placeholder secret with at least 32 characters.
3. Set `POSTGRES_PASSWORD` or `POSTGRES_PASSWORD_FILE`.
4. Start the stack:
   ```bash
   docker compose up --build -d
   ```
5. Access at:
   - Frontend: `http://localhost:4200`
   - API: `http://localhost:8080/actuator/health`

## Features
- **Booking**: Apply to hostels with 12h payment confirmation window.
- **Support**: Categorized resident complaints and maintenance tickets.
- **Admin**: Locations/Hostel management and application review.
- **Auth**: Password-based login, reset-token flow, and student self-registration.
