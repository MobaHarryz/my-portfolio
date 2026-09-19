# 🐾 Clinic Mascotas

Full-stack veterinary clinic web app: clients book appointments online through a 4-step wizard, and clinic staff manage bookings, veterinarians and contact messages from an admin panel.

Designed in Adobe XD and built end-to-end by **Harrys Moreno Córdoba** — Software Developer + UX/UI.

| Stack | |
|---|---|
| **Frontend** | Angular 21 (standalone components, signals, `rxResource`, reactive forms, lazy routes), SCSS |
| **Backend** | Java 25, Spring Boot 4 (Web MVC, Security, Validation, Actuator) |
| **Database** | MongoDB (Spring Data MongoDB) |
| **Auth** | Stateless JWT (HS256) with BCrypt-hashed passwords and role-based access |
| **Design** | Adobe XD — web and responsive mockups in [`/design`](design) |

---

## ✨ Features

### Public site
- **Landing page** matching the original design, with live team section.
- **Booking wizard** — pet type → veterinarian → date & time → pet and owner details.
  - Only vets that treat the selected pet type are listed.
  - Real-time availability computed from each vet's weekly schedule minus taken slots.
  - Client- and server-side validation with friendly Spanish messages.
- **Confirmation page** with a shareable booking code (e.g. `/reserva/CM-9NTPBH`).
- **Contact form** stored in the database.
- Fully **responsive** (desktop ⇄ mobile layouts from the XD designs) and keyboard/screen-reader friendly.

### Admin panel (`/admin`)
- JWT login, route guard and automatic logout on expired sessions.
- **Dashboard**: today's agenda and key numbers.
- **Bookings**: search (code, pet, owner, email), filters (status, date, vet), pagination, status changes and internal notes.
- **Veterinarians**: create/edit, pet types treated, weekly schedule, activate/deactivate.
- **Messages**: read/unread inbox.

### Engineering highlights
- **No double bookings, even under concurrency**: an active appointment holds a `slotKey` (`vetId|startsAt`) protected by a *unique sparse index*; a second insert fails atomically and the API answers `409 Conflict`. Cancelling removes the key and frees the slot.
- Time-zone safe: appointments are stored as UTC instants and exposed in clinic time (`America/Bogota`).
- Errors follow **RFC 9457 Problem Details**, with per-field validation messages.
- Pure, unit-tested scheduling logic (`AvailabilityCalculator`).
- Public endpoints never expose client email or phone.

---

## 🗂️ Project structure

```
clinic_mascotas/
├── backend/            Spring Boot API
│   └── src/main/java/co/clinicmascotas/api/
│       ├── appointment/  bookings, availability, admin search
│       ├── vet/          veterinarians (public + admin)
│       ├── contact/      contact messages
│       ├── auth/         admin users, JWT login
│       ├── clinic/       clinic info, pet types & breeds
│       ├── config/       security, CORS, properties, demo data seeder
│       └── common/       error handling
├── frontend/           Angular app
│   └── src/app/
│       ├── pages/        home, booking wizard, confirmation, contact
│       ├── admin/        login, layout, dashboard, bookings, vets, messages
│       ├── core/         API client, models, auth (service, interceptor, guard)
│       └── shared/       logo, icons, header, footer, avatar, date helpers
├── design/             Adobe XD exports (web + responsive)
└── docker-compose.yml  Local MongoDB (optional)
```

---

## 🚀 Running locally

**Requirements:** Java 25, Node.js 22.12+ / 24+, and MongoDB (local install, Docker, or a free MongoDB Atlas cluster).

### 1. Database
```bash
docker compose up -d          # or start your local mongod on port 27017
```

### 2. API — http://localhost:8080
```bash
cd backend
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```
On first start it creates an admin account and six demo veterinarians.

### 3. Web app — http://localhost:4200
```bash
cd frontend
npm install
npm start
```

### Demo admin account (local only)
| Email | Password |
|---|---|
| `admin@clinicmascotas.co` | `Admin123*` |

> Change it with the `ADMIN_EMAIL` / `ADMIN_PASSWORD` environment variables before the first start in any shared environment.

### Tests
```bash
cd backend && ./mvnw test
cd frontend && npm run build
```

---

## ☁️ Deployment (free: Render + MongoDB Atlas)

The [`Dockerfile`](Dockerfile) builds the Angular app and bundles it inside the Spring Boot jar, so the whole app runs as **one web service on one URL** (no CORS, no second host).

1. **Database — MongoDB Atlas** (free M0 cluster)
   - Create a cluster, a database user, and under *Network Access* allow `0.0.0.0/0`.
   - Copy the connection string and add the database name before the `?`:
     `mongodb+srv://USER:PASSWORD@cluster0.xxxxx.mongodb.net/clinic_mascotas?retryWrites=true&w=majority`
2. **App — Render** (free web service)
   - *New → Blueprint* → select this repository. [`render.yaml`](render.yaml) configures everything.
   - Fill in `MONGODB_URI` (step 1), `ADMIN_EMAIL` and a strong `ADMIN_PASSWORD`. `JWT_SECRET` is generated automatically.
   - The first deploy takes a few minutes; the app is then live at `https://<service-name>.onrender.com`.

> Free Render services sleep after 15 minutes without traffic, so the first visit after a pause takes ~1 minute to wake up.

---

## ⚙️ Configuration (environment variables)

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | `mongodb://localhost:27017/clinic_mascotas` | Database connection string |
| `JWT_SECRET` | dev-only value | HS256 signing key, **min. 32 characters** — always set in production |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | see above | Initial admin, created only if none exists |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` | Comma-separated front-end origins |
| `SEED_DEMO_DATA` | `true` | Load demo veterinarians on an empty database |
| `PORT` | `8080` | API port |

Front-end API URLs live in `frontend/src/environments/`.

---

## 🔌 API overview

| Method | Endpoint | Access |
|---|---|---|
| GET | `/api/clinic` | Public — clinic info, price, pet types, breeds |
| GET | `/api/vets?petType=DOG` | Public |
| GET | `/api/vets/{id}/availability?days=21` | Public |
| POST | `/api/appointments` | Public — `201`, `400` validation, `409` slot taken |
| GET | `/api/appointments/{code}` | Public — confirmation data |
| POST | `/api/contact` | Public |
| POST | `/api/auth/login` | Public — returns JWT |
| GET | `/api/admin/stats` | Admin |
| GET / PATCH | `/api/admin/appointments[/{id}]` | Admin |
| GET / POST / PUT / DELETE | `/api/admin/vets[/{id}]` | Admin |
| GET / PATCH | `/api/admin/messages[/{id}]` | Admin |

---

## 🗺️ Roadmap
- Email confirmation and reminders.
- Client self-service cancellation with a signed link.
- Integration tests with Testcontainers and CI on GitHub Actions.

---

Made with ❤️ in Medellín · [LinkedIn](https://www.linkedin.com/in/harrys-moreno-c%C3%B3rdoba-a8107a212/)
