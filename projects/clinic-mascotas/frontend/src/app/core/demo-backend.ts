import { HttpErrorResponse, HttpInterceptorFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { Observable, defer, delay, of, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  AppointmentDetail,
  AppointmentStatus,
  ClinicInfo,
  ContactMessage,
  ContactRequest,
  CreateAppointmentRequest,
  DayOfWeek,
  DaySlots,
  PetTypeId,
  VetDetail,
  VetRequest,
} from './models';

/**
 * In-browser stand-in for the Spring Boot API, used by the static demo published in the portfolio.
 * It mirrors the real API: same endpoints, availability rules, validation messages and status codes,
 * with data persisted in localStorage instead of MongoDB.
 */

export const DEMO_ADMIN = { email: 'admin@clinicmascotas.co', password: 'demo1234' };

const STORAGE_KEY = 'cm-demo-db-v1';
const TOKEN = 'demo-token';
const LATENCY_MS = 350;
const BOOKING_DAYS_AHEAD = 21;
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const JS_DAYS: DayOfWeek[] = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

const CLINIC: ClinicInfo = {
  name: 'Clinic Mascotas',
  email: 'info@clinicmascotas.co',
  phone: '+57 319 225 6982',
  address: 'Cra. 43A #1-50, El Poblado, Medellín',
  mapsUrl: 'https://maps.google.com/?q=El+Poblado+Medellin',
  consultationPrice: 8000,
  currency: 'COP',
  petTypes: [
    { id: 'DOG', label: 'Perro', breeds: ['Mestizo', 'Labrador', 'Golden Retriever', 'Bulldog Francés', 'Pastor Alemán', 'Poodle', 'Chihuahua', 'Schnauzer', 'Doberman', 'Shih Tzu', 'Otra'] },
    { id: 'CAT', label: 'Gato', breeds: ['Mestizo', 'Persa', 'Siamés', 'Maine Coon', 'Bengalí', 'Angora', 'Otra'] },
    { id: 'BIRD', label: 'Ave', breeds: ['Periquito', 'Canario', 'Loro', 'Cacatúa', 'Agapornis', 'Otra'] },
    { id: 'RODENT', label: 'Roedor', breeds: ['Hámster', 'Cobayo', 'Chinchilla', 'Rata', 'Jerbo', 'Otra'] },
  ],
  ageRanges: ['Menos de 1 año', '1 a 3 años', '4 a 7 años', '8 a 11 años', '12 años o más'],
};

interface DemoDb {
  vets: VetDetail[];
  appointments: AppointmentDetail[];
  messages: ContactMessage[];
}

// ---------------------------------------------------------------- dates (clinic local time)

const pad = (n: number) => String(n).padStart(2, '0');
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const addDays = (d: Date, days: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + days);
const localDateTime = (date: string, time: string) => `${date}T${time}:00`;
const parseLocal = (value: string) => {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  const [hh, mm] = (value.slice(11, 16) || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
};

// ---------------------------------------------------------------- persistence & seed data

function load(): DemoDb {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as DemoDb;
    }
  } catch {
    // corrupted or blocked storage: start fresh
  }
  const db = seed();
  save(db);
  return db;
}

function save(db: DemoDb): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  } catch {
    // storage unavailable (private mode): the demo still works for this session
  }
}

export function resetDemoData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function seed(): DemoDb {
  const morning = ['09:00', '10:00', '11:00'];
  const afternoon = ['13:00', '14:00', '15:00', '16:00'];
  const fullDay = ['10:00', '11:00', '13:00', '15:00', '16:00'];
  const days = (times: string[], ...weekdays: DayOfWeek[]) =>
    Object.fromEntries(weekdays.map((d) => [d, times])) as Partial<Record<DayOfWeek, string[]>>;

  const vets: VetDetail[] = [
    { id: 'vet-1', fullName: 'Dr. Mario Bongá', title: 'Médico veterinario', university: 'U. de Antioquia', photoUrl: null, petTypes: ['DOG', 'CAT'], weeklySchedule: days(fullDay, 'MONDAY', 'TUESDAY', 'THURSDAY'), active: true },
    { id: 'vet-2', fullName: 'Dr. Lorenzo Torres', title: 'Médico veterinario', university: 'Tecnológico de Antioquia', photoUrl: null, petTypes: ['DOG', 'CAT', 'RODENT'], weeklySchedule: days(afternoon, 'MONDAY', 'WEDNESDAY', 'FRIDAY'), active: true },
    { id: 'vet-3', fullName: 'Dra. Lía Touré', title: 'Médica veterinaria', university: 'I.U. Pascual Bravo', photoUrl: null, petTypes: ['CAT', 'BIRD'], weeklySchedule: days(morning, 'TUESDAY', 'WEDNESDAY', 'SATURDAY'), active: true },
    { id: 'vet-4', fullName: 'Dr. Andrux Potz', title: 'Médico veterinario', university: 'I.T.M', photoUrl: null, petTypes: ['DOG', 'BIRD', 'RODENT'], weeklySchedule: days(fullDay, 'WEDNESDAY', 'THURSDAY', 'FRIDAY'), active: true },
    { id: 'vet-5', fullName: 'Dra. Sara Montoya', title: 'Médica veterinaria · Exóticos', university: 'U. CES', photoUrl: null, petTypes: ['BIRD', 'RODENT'], weeklySchedule: days(afternoon, 'MONDAY', 'THURSDAY', 'SATURDAY'), active: true },
    { id: 'vet-6', fullName: 'Dr. Tomás Quintero', title: 'Médico veterinario · Urgencias', university: 'U. de Antioquia', photoUrl: null, petTypes: ['DOG', 'CAT', 'BIRD', 'RODENT'], weeklySchedule: days(morning, 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'), active: true },
  ];

  // A few sample bookings on real schedule slots so the admin panel has something to show
  const samples: { vet: VetDetail; pet: AppointmentDetail['pet']; petType: PetTypeId; owner: AppointmentDetail['owner']; status: AppointmentStatus; offset: number }[] = [
    { vet: vets[0], petType: 'DOG', pet: { name: 'Bombón', breed: 'Doberman', sex: 'FEMALE', ageRange: '1 a 3 años', vaccinated: true }, owner: { fullName: 'Laura Gómez', email: 'laura.gomez@example.com', phone: '+57 300 111 2233' }, status: 'COMPLETED', offset: -6 },
    { vet: vets[1], petType: 'CAT', pet: { name: 'Michi', breed: 'Siamés', sex: 'MALE', ageRange: '4 a 7 años', vaccinated: true }, owner: { fullName: 'Andrés Pérez', email: 'andres.perez@example.com', phone: '+57 301 222 3344' }, status: 'CANCELLED', offset: 1 },
    { vet: vets[5], petType: 'DOG', pet: { name: 'Rocky', breed: 'Labrador', sex: 'MALE', ageRange: '8 a 11 años', vaccinated: false }, owner: { fullName: 'Camila Ríos', email: 'camila.rios@example.com', phone: '+57 302 333 4455' }, status: 'CONFIRMED', offset: 1 },
    { vet: vets[2], petType: 'BIRD', pet: { name: 'Kiwi', breed: 'Periquito', sex: 'FEMALE', ageRange: 'Menos de 1 año', vaccinated: true }, owner: { fullName: 'Julián Mejía', email: 'julian.mejia@example.com', phone: '+57 303 444 5566' }, status: 'CONFIRMED', offset: 2 },
    { vet: vets[4], petType: 'RODENT', pet: { name: 'Nube', breed: 'Chinchilla', sex: 'FEMALE', ageRange: '1 a 3 años', vaccinated: true }, owner: { fullName: 'Sofía Restrepo', email: 'sofia.restrepo@example.com', phone: '+57 304 555 6677' }, status: 'CONFIRMED', offset: 3 },
  ];

  const today = new Date();
  const appointments: AppointmentDetail[] = [];
  for (const sample of samples) {
    const slot = firstScheduledSlot(sample.vet, addDays(today, sample.offset), sample.offset < 0 ? -1 : 1);
    if (!slot) {
      continue;
    }
    appointments.push({
      id: `apt-${appointments.length + 1}`,
      code: newCode(appointments),
      petType: sample.petType,
      vetId: sample.vet.id,
      vetName: sample.vet.fullName,
      startsAt: slot,
      pet: sample.pet,
      owner: sample.owner,
      price: CLINIC.consultationPrice,
      status: sample.status,
      internalNotes: sample.status === 'COMPLETED' ? 'Control de vacunas en 6 meses.' : null,
      createdAt: new Date(today.getTime() - 3 * 86_400_000).toISOString(),
    });
  }

  const messages: ContactMessage[] = [
    { id: 'msg-1', firstName: 'Valentina', lastName: 'Castro', email: 'valentina.castro@example.com', message: '¿Atienden tortugas? Tengo una tortuga de orejas rojas y quisiera una revisión general.', read: false, createdAt: new Date(today.getTime() - 5 * 3_600_000).toISOString() },
    { id: 'msg-2', firstName: 'Mateo', lastName: 'Arango', email: 'mateo.arango@example.com', message: 'Hola, ¿el precio de la consulta incluye la vacuna antirrábica?', read: true, createdAt: new Date(today.getTime() - 2 * 86_400_000).toISOString() },
  ];

  return { vets, appointments, messages };
}

/** First scheduled time of a vet starting at `from`, walking forwards (1) or backwards (-1) day by day. */
function firstScheduledSlot(vet: VetDetail, from: Date, direction: 1 | -1): string | null {
  for (let i = 0; i < 14; i++) {
    const date = addDays(from, i * direction);
    const times = vet.weeklySchedule[JS_DAYS[date.getDay()]] ?? [];
    if (times.length) {
      return localDateTime(isoDate(date), [...times].sort()[0]);
    }
  }
  return null;
}

// ---------------------------------------------------------------- business rules (mirror of the Java services)

const holdsSlot = (a: AppointmentDetail) => a.status !== 'CANCELLED';

function freeSlots(db: DemoDb, vet: VetDetail, days: number): DaySlots[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const span = Math.min(Math.max(days, 1), BOOKING_DAYS_AHEAD + 1);
  const taken = new Set(db.appointments.filter((a) => a.vetId === vet.id && holdsSlot(a)).map((a) => a.startsAt.slice(0, 16)));

  const result: DaySlots[] = [];
  for (let i = 0; i < span; i++) {
    const date = addDays(today, i);
    const day = isoDate(date);
    const times = [...new Set(vet.weeklySchedule[JS_DAYS[date.getDay()]] ?? [])]
      .sort()
      .filter((time) => parseLocal(`${day}T${time}`) > now && !taken.has(`${day}T${time}`));
    if (times.length) {
      result.push({ date: day, times });
    }
  }
  return result;
}

function newCode(existing: AppointmentDetail[]): string {
  let code: string;
  do {
    code = 'CM-' + Array.from({ length: 6 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('');
  } while (existing.some((a) => a.code === code));
  return code;
}

function normalizeSchedule(schedule: Partial<Record<DayOfWeek, string[]>>): Partial<Record<DayOfWeek, string[]>> {
  const result: Partial<Record<DayOfWeek, string[]>> = {};
  for (const [day, times] of Object.entries(schedule) as [DayOfWeek, string[]][]) {
    const clean = [...new Set(times)].sort();
    if (clean.length) {
      result[day] = clean;
    }
  }
  return result;
}

// ---------------------------------------------------------------- HTTP plumbing

class ApiError {
  constructor(readonly status: number, readonly detail: string) {}
}

const TITLES: Record<number, string> = { 400: 'Bad Request', 401: 'Unauthorized', 404: 'Not Found', 409: 'Conflict' };
const fail = (status: number, detail: string): never => {
  throw new ApiError(status, detail);
};

type Handler = (req: HttpRequest<unknown>, params: string[], db: DemoDb) => unknown;
interface Route {
  method: string;
  pattern: RegExp;
  admin?: boolean;
  status?: number;
  handle: Handler;
}

const routes: Route[] = [
  // ----- Public
  { method: 'GET', pattern: /^\/clinic$/, handle: () => CLINIC },
  {
    method: 'GET',
    pattern: /^\/vets$/,
    handle: (req, _p, db) => {
      const petType = req.params.get('petType') as PetTypeId | null;
      return db.vets
        .filter((v) => v.active && (!petType || v.petTypes.includes(petType)))
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
        .map(({ weeklySchedule: _schedule, active: _active, ...vet }) => ({
          ...vet,
          nextAvailable: freeSlots(db, db.vets.find((v) => v.id === vet.id)!, BOOKING_DAYS_AHEAD + 1)[0]?.date ?? null,
        }));
    },
  },
  {
    method: 'GET',
    pattern: /^\/vets\/([^/]+)\/availability$/,
    handle: (req, [id], db) => {
      const vet = db.vets.find((v) => v.id === id && v.active) ?? fail(404, 'El profesional no está disponible.');
      return freeSlots(db, vet, Number(req.params.get('days') ?? 14));
    },
  },
  {
    method: 'POST',
    pattern: /^\/appointments$/,
    status: 201,
    handle: (req, _p, db) => {
      const body = req.body as CreateAppointmentRequest;
      const vet = db.vets.find((v) => v.id === body.vetId && v.active) ?? fail(404, 'El profesional no está disponible.');
      const startsAt = body.startsAt.slice(0, 16);
      const breeds = CLINIC.petTypes.find((t) => t.id === body.petType)?.breeds ?? [];
      const start = parseLocal(startsAt);

      if (!vet.petTypes.includes(body.petType)) fail(400, 'Este profesional no atiende ese tipo de mascota.');
      if (!breeds.includes(body.pet.breed)) fail(400, 'Selecciona una raza de la lista.');
      if (start <= new Date() || start > addDays(new Date(), BOOKING_DAYS_AHEAD + 1)) fail(400, 'La fecha seleccionada ya no está disponible.');
      if (!(vet.weeklySchedule[JS_DAYS[start.getDay()]] ?? []).includes(startsAt.slice(11, 16))) fail(400, 'El profesional no atiende en ese horario.');
      if (db.appointments.some((a) => a.vetId === vet.id && holdsSlot(a) && a.startsAt.slice(0, 16) === startsAt)) {
        fail(409, 'Ese horario acaba de ser reservado. Por favor elige otro.');
      }

      const appointment: AppointmentDetail = {
        id: `apt-${Date.now()}`,
        code: newCode(db.appointments),
        petType: body.petType,
        vetId: vet.id,
        vetName: vet.fullName,
        startsAt: `${startsAt}:00`,
        pet: { ...body.pet, name: body.pet.name.trim() },
        owner: { fullName: body.owner.fullName.trim(), email: body.owner.email.trim().toLowerCase(), phone: body.owner.phone.trim() },
        price: CLINIC.consultationPrice,
        status: 'CONFIRMED',
        internalNotes: null,
        createdAt: new Date().toISOString(),
      };
      db.appointments.push(appointment);
      return toConfirmation(appointment);
    },
  },
  {
    method: 'GET',
    pattern: /^\/appointments\/([^/]+)$/,
    handle: (_req, [code], db) =>
      toConfirmation(db.appointments.find((a) => a.code === decodeURIComponent(code).toUpperCase()) ?? fail(404, 'No encontramos esa reserva.')),
  },
  {
    method: 'POST',
    pattern: /^\/contact$/,
    status: 201,
    handle: (req, _p, db) => {
      const body = req.body as ContactRequest;
      db.messages.unshift({ ...body, email: body.email.trim().toLowerCase(), id: `msg-${Date.now()}`, read: false, createdAt: new Date().toISOString() });
      return null;
    },
  },
  {
    method: 'POST',
    pattern: /^\/auth\/login$/,
    handle: (req) => {
      const { email, password } = req.body as { email: string; password: string };
      if (email.trim().toLowerCase() !== DEMO_ADMIN.email || password !== DEMO_ADMIN.password) {
        fail(401, 'Correo o contraseña incorrectos.');
      }
      return { token: TOKEN, expiresAt: new Date(Date.now() + 8 * 3_600_000).toISOString(), name: 'Administrador (demo)', email: DEMO_ADMIN.email };
    },
  },

  // ----- Admin
  {
    method: 'GET',
    pattern: /^\/admin\/stats$/,
    admin: true,
    handle: (_req, _p, db) => {
      const now = new Date();
      const today = isoDate(now);
      const confirmed = db.appointments.filter((a) => a.status === 'CONFIRMED');
      return {
        today: confirmed.filter((a) => a.startsAt.startsWith(today)).length,
        upcoming: confirmed.filter((a) => parseLocal(a.startsAt) > now).length,
        completed: db.appointments.filter((a) => a.status === 'COMPLETED').length,
        cancelled: db.appointments.filter((a) => a.status === 'CANCELLED').length,
        unreadMessages: db.messages.filter((m) => !m.read).length,
      };
    },
  },
  {
    method: 'GET',
    pattern: /^\/admin\/appointments$/,
    admin: true,
    handle: (req, _p, db) => {
      const status = req.params.get('status');
      const date = req.params.get('date');
      const vetId = req.params.get('vetId');
      const q = req.params.get('q')?.trim().toLowerCase();
      const page = Math.max(Number(req.params.get('page') ?? 0), 0);
      const size = Math.min(Math.max(Number(req.params.get('size') ?? 10), 1), 100);

      const matches = db.appointments
        .filter((a) => !status || a.status === status)
        .filter((a) => !date || a.startsAt.startsWith(date))
        .filter((a) => !vetId || a.vetId === vetId)
        .filter((a) => !q || [a.code, a.pet.name, a.owner.fullName, a.owner.email].some((v) => v.toLowerCase().includes(q)))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

      return {
        content: matches.slice(page * size, page * size + size),
        page,
        size,
        totalElements: matches.length,
        totalPages: Math.ceil(matches.length / size),
      };
    },
  },
  {
    method: 'PATCH',
    pattern: /^\/admin\/appointments\/([^/]+)$/,
    admin: true,
    handle: (req, [id], db) => {
      const appointment = db.appointments.find((a) => a.id === id) ?? fail(404, 'La reserva no existe.');
      const change = req.body as { status?: AppointmentStatus; internalNotes?: string };

      if (change.status && change.status !== appointment.status) {
        const reclaimsSlot = appointment.status === 'CANCELLED' && change.status !== 'CANCELLED';
        const slotTaken = db.appointments.some(
          (a) => a.id !== appointment.id && a.vetId === appointment.vetId && holdsSlot(a) && a.startsAt === appointment.startsAt,
        );
        if (reclaimsSlot && slotTaken) {
          fail(409, 'Ese horario acaba de ser reservado. Por favor elige otro.');
        }
        appointment.status = change.status;
      }
      if (change.internalNotes !== undefined) {
        appointment.internalNotes = change.internalNotes.trim();
      }
      return appointment;
    },
  },
  {
    method: 'GET',
    pattern: /^\/admin\/vets$/,
    admin: true,
    handle: (_req, _p, db) => [...db.vets].sort((a, b) => a.fullName.localeCompare(b.fullName)),
  },
  {
    method: 'POST',
    pattern: /^\/admin\/vets$/,
    admin: true,
    status: 201,
    handle: (req, _p, db) => {
      const body = req.body as VetRequest;
      const vet: VetDetail = { ...body, id: `vet-${Date.now()}`, weeklySchedule: normalizeSchedule(body.weeklySchedule) };
      db.vets.push(vet);
      return vet;
    },
  },
  {
    method: 'PUT',
    pattern: /^\/admin\/vets\/([^/]+)$/,
    admin: true,
    handle: (req, [id], db) => {
      const index = db.vets.findIndex((v) => v.id === id);
      if (index < 0) fail(404, 'El profesional no existe.');
      const body = req.body as VetRequest;
      db.vets[index] = { ...body, id, weeklySchedule: normalizeSchedule(body.weeklySchedule) };
      return db.vets[index];
    },
  },
  {
    method: 'GET',
    pattern: /^\/admin\/messages$/,
    admin: true,
    handle: (_req, _p, db) => [...db.messages].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  },
  {
    method: 'PATCH',
    pattern: /^\/admin\/messages\/([^/]+)$/,
    admin: true,
    handle: (req, [id], db) => {
      const message = db.messages.find((m) => m.id === id) ?? fail(404, 'El mensaje no existe.');
      message.read = (req.body as { read: boolean }).read;
      return message;
    },
  },
];

function toConfirmation(a: AppointmentDetail) {
  return { code: a.code, petName: a.pet.name, petType: a.petType, vetName: a.vetName, startsAt: a.startsAt, price: a.price, status: a.status };
}

/** Answers calls to `environment.apiUrl` in the browser. Registered only in the demo build. */
export const demoBackendInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.demo || !req.url.startsWith(environment.apiUrl)) {
    return next(req);
  }

  const path = req.url.slice(environment.apiUrl.length).split('?')[0];
  const route = routes.find((r) => r.method === req.method && r.pattern.test(path));

  const response$: Observable<HttpResponse<unknown>> = defer(() => {
    try {
      if (!route) fail(404, 'Recurso no encontrado.');
      if (route!.admin && req.headers.get('Authorization') !== `Bearer ${TOKEN}`) fail(401, 'Tu sesión expiró.');

      const db = load();
      const body = route!.handle(req, path.match(route!.pattern)!.slice(1), db);
      save(db);
      return of(new HttpResponse({ status: route!.status ?? 200, body: structuredClone(body), url: req.url }));
    } catch (error) {
      if (error instanceof ApiError) {
        return throwError(() => new HttpErrorResponse({
          status: error.status,
          statusText: TITLES[error.status],
          url: req.url,
          error: { status: error.status, title: TITLES[error.status], detail: error.detail },
        }));
      }
      throw error;
    }
  });

  return response$.pipe(delay(LATENCY_MS));
};
