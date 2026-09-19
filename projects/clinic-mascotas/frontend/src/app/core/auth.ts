import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Observable, catchError, tap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';
import { ApiService } from './api.service';
import { LoginResponse } from './models';

const STORAGE_KEY = 'cm_admin_session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  private readonly session = signal<LoginResponse | null>(this.restore());

  readonly user = computed(() => this.session());
  readonly isLoggedIn = computed(() => {
    const session = this.session();
    return !!session && new Date(session.expiresAt).getTime() > Date.now();
  });

  get token(): string | null {
    return this.isLoggedIn() ? this.session()!.token : null;
  }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.api.login(email, password).pipe(
      tap((session) => {
        this.session.set(session);
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      }),
    );
  }

  logout(redirect = true): void {
    this.session.set(null);
    sessionStorage.removeItem(STORAGE_KEY);
    if (redirect) {
      this.router.navigate(['/admin/login']);
    }
  }

  private restore(): LoginResponse | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as LoginResponse) : null;
    } catch {
      return null;
    }
  }
}

/** Adds the bearer token to admin API calls and logs out when it is rejected. */
export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const auth = inject(AuthService);
  const isAdminCall = request.url.startsWith(`${environment.apiUrl}/admin`);
  const token = auth.token;

  const authorized = isAdminCall && token
    ? request.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : request;

  return next(authorized).pipe(
    catchError((error: unknown) => {
      if (isAdminCall && error instanceof HttpErrorResponse && error.status === 401) {
        auth.logout();
      }
      return throwError(() => error);
    }),
  );
};

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthService);
  return auth.isLoggedIn()
    ? true
    : inject(Router).createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
};
