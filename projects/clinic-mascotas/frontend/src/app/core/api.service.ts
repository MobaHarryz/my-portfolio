import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';

import { environment } from '../../environments/environment';
import {
  AppointmentConfirmation,
  AppointmentDetail,
  AppointmentStatus,
  ClinicInfo,
  ContactMessage,
  ContactRequest,
  CreateAppointmentRequest,
  DashboardStats,
  DaySlots,
  LoginResponse,
  Page,
  PetTypeId,
  VetDetail,
  VetRequest,
  VetSummary,
} from './models';

export interface AppointmentQuery {
  status?: AppointmentStatus | '';
  date?: string;
  vetId?: string;
  q?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  private clinicInfo$?: Observable<ClinicInfo>;

  // ----- Public -----

  clinic(): Observable<ClinicInfo> {
    this.clinicInfo$ ??= this.http.get<ClinicInfo>(`${this.base}/clinic`).pipe(shareReplay(1));
    return this.clinicInfo$;
  }

  vets(petType?: PetTypeId): Observable<VetSummary[]> {
    const params = petType ? new HttpParams().set('petType', petType) : undefined;
    return this.http.get<VetSummary[]>(`${this.base}/vets`, { params });
  }

  availability(vetId: string, days = 21): Observable<DaySlots[]> {
    return this.http.get<DaySlots[]>(`${this.base}/vets/${vetId}/availability`, {
      params: new HttpParams().set('days', days),
    });
  }

  book(request: CreateAppointmentRequest): Observable<AppointmentConfirmation> {
    return this.http.post<AppointmentConfirmation>(`${this.base}/appointments`, request);
  }

  confirmation(code: string): Observable<AppointmentConfirmation> {
    return this.http.get<AppointmentConfirmation>(`${this.base}/appointments/${encodeURIComponent(code)}`);
  }

  sendContact(request: ContactRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/contact`, request);
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/auth/login`, { email, password });
  }

  // ----- Admin -----

  stats(): Observable<DashboardStats> {
    return this.http.get<DashboardStats>(`${this.base}/admin/stats`);
  }

  appointments(query: AppointmentQuery): Observable<Page<AppointmentDetail>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, value);
      }
    }
    return this.http.get<Page<AppointmentDetail>>(`${this.base}/admin/appointments`, { params });
  }

  updateAppointment(id: string, change: { status?: AppointmentStatus; internalNotes?: string }) {
    return this.http.patch<AppointmentDetail>(`${this.base}/admin/appointments/${id}`, change);
  }

  adminVets(): Observable<VetDetail[]> {
    return this.http.get<VetDetail[]>(`${this.base}/admin/vets`);
  }

  createVet(vet: VetRequest): Observable<VetDetail> {
    return this.http.post<VetDetail>(`${this.base}/admin/vets`, vet);
  }

  updateVet(id: string, vet: VetRequest): Observable<VetDetail> {
    return this.http.put<VetDetail>(`${this.base}/admin/vets/${id}`, vet);
  }

  messages(): Observable<ContactMessage[]> {
    return this.http.get<ContactMessage[]>(`${this.base}/admin/messages`);
  }

  markMessage(id: string, read: boolean): Observable<ContactMessage> {
    return this.http.patch<ContactMessage>(`${this.base}/admin/messages/${id}`, { read });
  }
}

/** Human-friendly message from any HTTP error. */
export function errorMessage(error: unknown, fallback = 'Algo salió mal. Intenta de nuevo.'): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) {
      return 'No pudimos conectar con el servidor. Revisa tu conexión.';
    }
    return error.error?.detail ?? fallback;
  }
  return fallback;
}
