# Harrys Moreno — Portfolio

Personal portfolio of **Harrys Moreno Córdoba**, Software Developer (Consultant · Backend · Frontend) based in Medellín, Colombia.

## What's inside

| Path | What it is |
|---|---|
| [`index.html`](index.html), `styles.css`, `funcionalidad.js` | The portfolio site (HTML, CSS and vanilla JavaScript) |
| [`clinic-mascotas/`](clinic-mascotas) | **Clinic Mascotas** demo — the real Angular app, built to run entirely in the browser |
| [`projects/clinic-mascotas/`](projects/clinic-mascotas) | Full source of Clinic Mascotas: Angular 21 + Spring Boot 4 + MongoDB ([README](projects/clinic-mascotas/README.md)) |

## Featured project: Clinic Mascotas

Online booking for a veterinary clinic: a 4-step booking wizard with real-time availability, confirmation codes, a contact form and a JWT-secured admin panel (bookings, veterinarians and schedules, messages). Designed in Adobe XD and built end to end.

The demo in `clinic-mascotas/` is built in **demo mode**: an in-browser backend mirrors the Spring Boot API (same endpoints, availability rules, validation and double-booking protection) and keeps data in `localStorage`, so it runs on any static host with no server.

- Admin demo account: `admin@clinicmascotas.co` / `demo1234`
- Rebuild the demo after changing the app:
  ```bash
  cd projects/clinic-mascotas/frontend
  npm install
  npm run build:demo   # writes the app into ../../../clinic-mascotas
  ```

## Publishing

The site is fully static. With GitHub Pages: *Settings → Pages → Deploy from a branch → `main` / root*.

## Contact

[LinkedIn](https://www.linkedin.com/in/harrys-moreno-c%C3%B3rdoba-a8107a212/) · mobaharrys@gmail.com
