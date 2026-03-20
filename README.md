# HostelHub (Angular + Spring Boot)

A premium hostel management system with role-based dashboards for Students, Wardens, and Admins.

## Stack
- **Frontend**: Angular 19 (apps/web-angular)
- **Backend**: Spring Boot (apps/api-java)
- **Database**: PostgreSQL with Flyway

## Setup (Docker)
1. Copy `.env.example` to `.env`.
2. Start the stack:
   ```bash
   docker compose up --build -d
   ```
3. Access at:
   - Frontend: `http://localhost:4200`
   - API: `http://localhost:8080/actuator/health`

## Features
- **Booking**: Apply to hostels with 12h payment confirmation window.
- **Support**: Categorized resident complaints and maintenance tickets.
- **Admin**: Locations/Hostel management and application review.
