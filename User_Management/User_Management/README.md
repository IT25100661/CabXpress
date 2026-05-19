# CabXpress

CabXpress is a full-stack taxi and cab booking platform with a Java Spring Boot backend, MySQL persistence, React + TypeScript frontend, JWT authentication, route/fare calculation, Stripe sandbox payments, email OTP support, customer booking flows, and an admin management panel.

## Features

- Premium public website for airport transfers, city rides, outstation trips, business travel, family rides, and luxury travel
- JWT auth with persistent frontend session state, role-aware navigation, protected user routes, and admin-only routes
- Email OTP verification, forgot password, profile, booking history, booking details, and pickup OTP confirmation
- Backend-calculated fares using pricing rules, distance, duration, category, and vehicle selection
- Stripe sandbox PaymentIntent flow with backend-owned amount calculation
- OpenRouteService geocoding/route support, OSRM route fallback, and local distance fallback for offline development
- Admin panel with dashboards, charts, search, filters, modal forms, users, vehicles, categories, bookings, pricing, CMS, theme settings, and reports
- CAB_DRIVER role with a dedicated `/driver` dashboard for assigned trips, large Start Trip and Finish Trip actions, and driver-only API authorization
- In-app notifications for users, admins, and cab drivers across booking, payment, cancellation, trip started, and trip completed events
- Admin vehicle image management with main image URL, local image upload, gallery URLs, previews, and category fallbacks
- Vehicle availability lifecycle that hides unavailable, in-trip, maintenance, and inactive vehicles from public booking surfaces
- Production build-ready React + Tailwind CSS + Framer Motion interface

## Tech Stack

Backend: Java 17, Spring Boot 3, Maven, Spring Security, JPA, MySQL, JavaMailSender, Stripe Java SDK, Springdoc OpenAPI.

Frontend: React, TypeScript, Vite, Tailwind CSS, Framer Motion, Axios, React Router, Recharts, Stripe React/JS packages.

## Environment

Copy `.env.example` to `.env` at the project root, or create `backend/.env` and `frontend/.env` with the relevant values.

Backend values:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cabxpress_db
DB_USERNAME=root
DB_PASSWORD=
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRATION_MS=86400000
MAIL_HOST=smtp.example.com
MAIL_PORT=587
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_FROM=no-reply@cabxpress.test
OPENROUTE_API_KEY=
ORS_BASE_URL=https://api.openrouteservice.org
OSRM_BASE_URL=https://router.project-osrm.org
STRIPE_SECRET_KEY=
APP_FRONTEND_URL=http://localhost:5173
MOCK_EMAIL=true
MOCK_PAYMENT=true
MOCK_MAPS=true
```

Frontend values:

```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_STRIPE_PUBLIC_KEY=
VITE_APP_NAME=CabXpress
```

## MySQL Setup

Create the database before starting the backend:

```sql
CREATE DATABASE IF NOT EXISTS cabxpress_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Spring uses `spring.jpa.hibernate.ddl-auto=update`, so tables and seed data are created/updated on startup.

## Run Backend

```bash
cd backend
./mvnw spring-boot:run
```

On Windows PowerShell:

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

API docs are available at `http://localhost:8080/swagger-ui.html`.

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Stripe Sandbox

For live sandbox card confirmation:

- Backend: set `STRIPE_SECRET_KEY=sk_test_...`
- Frontend: set `VITE_STRIPE_PUBLIC_KEY=pk_test_...`
- Set `MOCK_PAYMENT=false`

Stripe test card:

`4242 4242 4242 4242`, any future expiry date, any CVC.

If Stripe keys are not configured, keep `MOCK_PAYMENT=true` for local development. The customer UI still completes a polished secure confirmation flow, while the backend records the payment as locally confirmed.

## Maps

Preferred setup:

- Set `MOCK_MAPS=false`
- Set `OPENROUTE_API_KEY` to your OpenRouteService API key
- Keep `ORS_BASE_URL=https://api.openrouteservice.org`
- Keep `OSRM_BASE_URL=https://router.project-osrm.org`
- Search uses OpenRouteService geocoding and returns `provider: OPENROUTE` when the API call succeeds
- Route distance uses OpenRouteService when available

Fallback behavior:

- If OpenRouteService is unavailable, the backend tries OSRM at `OSRM_BASE_URL`
- If OSRM is unavailable, the backend uses a local Haversine estimate with a clear warning field in the API response
- Use `MOCK_MAPS=true` when developing without external map services

Spring Boot imports backend environment values from `.env` files through `backend/src/main/resources/application.properties`.
When running from `backend`, create `backend/.env`. When running from the repository root, create `cabxpress/.env` or `cabxpress/backend/.env`.

The exact backend property bindings are:

```properties
app.mock-maps=${MOCK_MAPS:false}
openroute.api.key=${OPENROUTE_API_KEY:}
openroute.base-url=${ORS_BASE_URL:https://api.openrouteservice.org}
osrm.base-url=${OSRM_BASE_URL:https://router.project-osrm.org}
```

Local verification endpoints are available outside the `prod` Spring profile:

```powershell
Invoke-RestMethod http://localhost:8080/api/dev/maps/status
Invoke-RestMethod http://localhost:8080/api/maps/search?query=Colombo%20Fort
Invoke-RestMethod -Method Post http://localhost:8080/api/dev/maps/test-route
```

`/api/dev/maps/status` reports whether `MOCK_MAPS` is enabled, whether an OpenRoute key is present, the configured ORS/OSRM base URLs, and provider priority. It never returns the API key.

## Test Accounts

Default seed accounts:

- Admin: `admin@cabxpress.test` / `Admin@12345`
- User: `user@cabxpress.test` / `User@12345`
- Driver: `driver@cabxpress.test` / `Driver@12345`

These are for local testing only and are not exposed as buttons in the application UI.

## Build And Test

Backend:

```powershell
cd backend
.\mvnw.cmd clean compile
.\mvnw.cmd test
```

Frontend:

```bash
cd frontend
npm install
npm run build
```

## Troubleshooting

- If login fails, confirm MySQL is running and the backend has started without datasource errors.
- If the navbar does not update after login, clear browser storage for the local site and log in again.
- If OTP email is not received, keep `MOCK_EMAIL=true` and read the OTP in backend logs.
- If Stripe card entry is unavailable, check `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY`, and `MOCK_PAYMENT=false`.
- If route search fails, check `OPENROUTE_API_KEY`; route distance can still fall back to OSRM or a local estimate.
- If frontend API calls fail, verify `VITE_API_BASE_URL=http://localhost:8080/api` and CORS `APP_FRONTEND_URL=http://localhost:5173`.
- If uploaded vehicle images do not render, confirm backend static files are reachable at `http://localhost:8080/uploads/vehicles/{filename}`.

## Driver Workflow

Admins can assign a CAB_DRIVER user to a vehicle from the vehicle edit form. When a customer completes payment, the booking becomes `CONFIRMED`, the selected vehicle becomes `UNAVAILABLE`, and the assigned driver receives an in-app/email notification. The driver uses `/driver` to start and finish the trip. Starting changes the booking to `IN_PROGRESS` and the vehicle to `IN_TRIP`; finishing changes the booking to `COMPLETED` and returns the vehicle to `AVAILABLE`.

## University Checklist

- Web-based service management application: yes
- OOP with entities, services, repositories, controllers, and DTOs: yes
- 3+ CRUD operations: yes, more than 5 management modules
- User-friendly interface: yes
- Java/Spring Boot and HTML/CSS/JavaScript frontend: yes
- MySQL database: yes
- IntelliJ IDEA ready: yes
- Git-ready structure and `.gitignore`: yes
