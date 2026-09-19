import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { environment } from '../../environments/environment';
import { errorMessage } from '../core/api.service';
import { AuthService } from '../core/auth';
import { DEMO_ADMIN } from '../core/demo-backend';
import { Icon } from '../shared/icon';
import { Logo } from '../shared/logo';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Logo, Icon],
  template: `
    <main class="page">
      <form class="card" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <app-logo [height]="30" />
        <h1>Acceso del personal</h1>
        <p class="muted">Ingresa para gestionar reservas, veterinarios y mensajes.</p>

        @if (demo) {
          <div class="demo-hint">
            <strong>Cuenta de demostración</strong>
            <span>{{ demoAdmin.email }} · {{ demoAdmin.password }}</span>
            <button type="button" class="btn btn-outline btn-sm" (click)="useDemoAccount()">Usar cuenta demo</button>
          </div>
        }

        <label class="field">
          <span>Correo</span>
          <input type="email" formControlName="email" autocomplete="username" />
        </label>
        <label class="field">
          <span>Contraseña</span>
          <input type="password" formControlName="password" autocomplete="current-password" />
        </label>

        @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }

        <button type="submit" class="btn btn-primary" [disabled]="form.invalid || loading()">
          {{ loading() ? 'Ingresando…' : 'Ingresar' }}
        </button>

        <a routerLink="/" class="back"><app-icon name="arrow-left" [size]="16" /> Volver al sitio</a>
      </form>
    </main>
  `,
  styles: `
    .page { min-height: 100vh; display: grid; place-items: center; padding: 24px; background: var(--lavender); }
    .card { width: min(420px, 100%); background: #fff; border-radius: 20px; padding: 36px 32px; display: grid; box-shadow: 0 20px 50px rgb(80 0 160 / 10%); }
    h1 { font-size: 1.8rem; margin: 26px 0 4px; }
    p.muted { margin: 0 0 24px; }
    .btn { margin-top: 6px; }
    .demo-hint { display: grid; gap: 4px; justify-items: start; margin-bottom: 20px; padding: 12px 14px; border-radius: 10px; background: var(--lavender); font-size: .9rem; }
    .demo-hint .btn { margin-top: 6px; }
    .alert { margin: 0 0 12px; padding: 10px 14px; border-radius: 8px; background: #fdecec; color: #a4161a; }
    .back { justify-self: center; margin-top: 20px; display: inline-flex; align-items: center; gap: 6px; color: var(--muted); text-decoration: none; }
    .back:hover { color: var(--purple); }
  `,
})
export class Login {
  readonly returnUrl = input<string>();

  protected readonly demo = environment.demo;
  protected readonly demoAdmin = DEMO_ADMIN;

  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  constructor() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/admin']);
    }
  }

  protected useDemoAccount(): void {
    this.form.setValue({ ...DEMO_ADMIN });
    this.submit();
  }

  protected submit(): void {
    if (this.form.invalid) {
      return;
    }
    const { email, password } = this.form.getRawValue();
    this.loading.set(true);
    this.error.set(null);

    this.auth.login(email, password).subscribe({
      next: () => {
        const target = this.returnUrl()?.startsWith('/admin') ? this.returnUrl()! : '/admin';
        this.router.navigateByUrl(target);
      },
      error: (error: unknown) => {
        this.loading.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }
}
