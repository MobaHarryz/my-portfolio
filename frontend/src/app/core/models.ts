export type PetTypeId = 'DOG' | 'CAT' | 'BIRD' | 'RODENT';
export type Sex = 'MALE' | 'FEMALE';
export type AppointmentStatus = 'CONFIRMED' | 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';
export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY';

export interface PetType {
  id: PetTypeId;
  label: string;
  breeds: string[];
}

export interface ClinicInfo {
  name: string;
  email: string;
  phone: string;
  address: string;
  mapsUrl: string;
  consultationPrice: number;
  currency: string;
  petTypes: PetType[];
  ageRanges: string[];
}

export interface VetSummary {
  id: string;
  fullName: string;
  title: string;
  university: string;
  photoUrl: string | null;
  petTypes: PetTypeId[];
  /** ISO date of the first free slot, or null when the vet has no availability */
  nextAvailable?: string | null;
}

export interface VetDetail extends VetSummary {
  weeklySchedule: Partial<Record<DayOfWeek, string[]>>;
  active: boolean;
}

export type VetRequest = Omit<VetDetail, 'id'>;

export interface DaySlots {
  /** ISO date, e.g. 2026-09-16 */
  date: string;
  /** "HH:mm" */
  times: string[];
}

export interface CreateAppointmentRequest {
  petType: PetTypeId;
  vetId: string;
  /** Local clinic date-time, e.g. 2026-09-16T13:00 */
  startsAt: string;
  pet: { name: string; breed: string; sex: Sex; ageRange: string; vaccinated: boolean };
  owner: { fullName: string; email: string; phone: string };
}

export interface AppointmentConfirmation {
  code: string;
  petName: string;
  petType: PetTypeId;
  vetName: string;
  startsAt: string;
  price: number;
  status: AppointmentStatus;
}

export interface AppointmentDetail {
  id: string;
  code: string;
  petType: PetTypeId;
  vetId: string;
  vetName: string;
  startsAt: string;
  pet: CreateAppointmentRequest['pet'];
  owner: CreateAppointmentRequest['owner'];
  price: number;
  status: AppointmentStatus;
  internalNotes: string | null;
  createdAt: string;
}

export interface Page<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}

export interface DashboardStats {
  today: number;
  upcoming: number;
  completed: number;
  cancelled: number;
  unreadMessages: number;
}

export interface ContactRequest {
  firstName: string;
  lastName: string;
  email: string;
  message: string;
}

export interface ContactMessage extends ContactRequest {
  id: string;
  read: boolean;
  createdAt: string;
}

export interface LoginResponse {
  token: string;
  expiresAt: string;
  name: string;
  email: string;
}

/** RFC 9457 problem details returned by the API */
export interface ApiProblem {
  status: number;
  title: string;
  detail?: string;
  errors?: Record<string, string>;
}

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  CONFIRMED: 'Confirmada',
  COMPLETED: 'Atendida',
  NO_SHOW: 'No asistió',
  CANCELLED: 'Cancelada',
};

export const DAYS: { id: DayOfWeek; label: string }[] = [
  { id: 'MONDAY', label: 'Lunes' },
  { id: 'TUESDAY', label: 'Martes' },
  { id: 'WEDNESDAY', label: 'Miércoles' },
  { id: 'THURSDAY', label: 'Jueves' },
  { id: 'FRIDAY', label: 'Viernes' },
  { id: 'SATURDAY', label: 'Sábado' },
  { id: 'SUNDAY', label: 'Domingo' },
];
