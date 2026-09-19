import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiService, errorMessage } from '../../core/api.service';
import { Icon } from '../../shared/icon';
import { Logo } from '../../shared/logo';

@Component({
  selector: 'app-contact',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, Logo, Icon],
  template: `
    <main class="page">
      <section class="brand-side">
        <a routerLink="/" class="back"><app-icon name="arrow-left" [size]="18" /> Inicio</a>
        <div class="brand-center">
          <app-logo [height]="64" />
          <p class="tagline">Porque nos interesa<br />la salud de tu mascota.</p>
        </div>
        <p class="social">
          Encuéntranos en:
          <a href="https://www.tumblr.com" target="_blank" rel="noopener" aria-label="Tumblr" class="social-t">t</a>
          <a href="https://www.instagram.com" target="_blank" rel="noopener" aria-label="Instagram" class="social-o"></a>
        </p>
      </section>

      <section class="form-side">
        <h1>Contáctanos</h1>

        @if (sent()) {
          <div class="sent" role="status">
            <app-icon name="circle-check" [size]="40" />
            <h2>¡Mensaje enviado!</h2>
            <p>Gracias por escribirnos. Te responderemos lo antes posible.</p>
            <button type="button" class="btn btn-outline" (click)="sent.set(false)">Enviar otro mensaje</button>
          </div>
        } @else {
          <form [formGroup]="form" (ngSubmit)="send()" novalidate>
            <div class="row">
              <label class="field">
                <span>Nombres</span>
                <input formControlName="firstName" autocomplete="given-name" [class.invalid]="invalid('firstName')" />
                @if (invalid('firstName')) { <small class="error">Ingresa tus nombres</small> }
              </label>
              <label class="field">
                <span>Apellidos:</span>
                <input formControlName="lastName" autocomplete="family-name" [class.invalid]="invalid('lastName')" />
                @if (invalid('lastName')) { <small class="error">Ingresa tus apellidos</small> }
              </label>
            </div>
            <label class="field">
              <span>Correo electrónico</span>
              <input type="email" formControlName="email" autocomplete="email" [class.invalid]="invalid('email')" />
              @if (invalid('email')) { <small class="error">Ingresa un correo válido</small> }
            </label>
            <label class="field">
              <span>Observaciones</span>
              <textarea formControlName="message" rows="5" [class.invalid]="invalid('message')"></textarea>
              @if (invalid('message')) { <small class="error">Escribe tu mensaje</small> }
            </label>

            @if (error()) { <p class="alert" role="alert">{{ error() }}</p> }

            <button type="submit" class="btn btn-primary btn-lg" [disabled]="sending()">
              {{ sending() ? 'Enviando…' : 'Enviar' }}
            </button>
          </form>
        }
      </section>
    </main>
  `,
  styles: `
    :host { display: block; background: var(--lavender); min-height: 100vh; }
    .page { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; max-width: 1366px; margin: 0 auto; }
    .brand-side { position: relative; display: flex; flex-direction: column; padding: 40px; border-right: 1px solid var(--purple); margin-block: 90px; }
    .back { position: absolute; top: -60px; left: 40px; display: inline-flex; align-items: center; gap: 6px; color: var(--ink); text-decoration: none; }
    .back:hover { color: var(--purple); }
    .brand-center { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 36px; padding-top: 20px; }
    .tagline { font-size: clamp(1.4rem, 2.4vw, 2rem); text-align: center; line-height: 1.25; margin: 0; }
    .social { display: flex; align-items: center; gap: 14px; margin: 0; font-size: 1.3rem; position: absolute; bottom: -70px; left: 40px; }
    .social-t { font-family: var(--font-heading); font-weight: 800; font-size: 2.4rem; line-height: 1; color: #000; text-decoration: none; }
    .social-o { width: 40px; height: 40px; border-radius: 50%; background: #000; position: relative; }
    .social-o::after { content: ""; position: absolute; inset: 11px; border-radius: 50%; border: 4px solid #fff; }
    .form-side { padding: 70px 100px 60px 64px; }
    h1 { font-size: clamp(2.8rem, 6vw, 5.4rem); line-height: 1; margin: 0 0 24px; }
    form { display: grid; gap: 4px; }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: 0 46px; }
    .field input, .field textarea { border-color: var(--purple); }
    .btn { justify-self: end; margin-top: 8px; min-width: 156px; }
    .alert { margin: 0; padding: 10px 14px; border-radius: 8px; background: #fdecec; color: #a4161a; }
    .sent { display: grid; justify-items: start; gap: 8px; padding: 32px; background: #fff; border-radius: var(--radius); color: var(--purple); }
    .sent h2 { color: var(--ink); margin: 8px 0 0; }
    .sent p { color: var(--ink); margin: 0 0 12px; }
    @media (max-width: 900px) {
      .page { grid-template-columns: 1fr; }
      .brand-side { border-right: 0; border-bottom: 1px solid var(--purple); margin: 0 24px; padding: 70px 0 32px; }
      .back { top: 24px; left: 0; }
      .brand-center app-logo { max-width: 100%; }
      .social { position: static; margin-top: 28px; justify-content: center; }
      .form-side { padding: 32px 24px 56px; }
      .row { grid-template-columns: 1fr; }
      .btn { justify-self: stretch; }
    }
  `,
})
export class Contact {
  private readonly api = inject(ApiService);
  private readonly fb = inject(FormBuilder);

  protected readonly sending = signal(false);
  protected readonly sent = signal(false);
  protected readonly error = signal<string | null>(null);
  private readonly submitted = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    firstName: ['', [Validators.required, Validators.maxLength(60)]],
    lastName: ['', [Validators.required, Validators.maxLength(60)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.maxLength(2000)]],
  });

  protected invalid(name: keyof typeof this.form.controls): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || this.submitted());
  }

  protected send(): void {
    this.submitted.set(true);
    this.error.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.sending.set(true);
    this.api.sendContact(this.form.getRawValue()).subscribe({
      next: () => {
        this.sending.set(false);
        this.submitted.set(false);
        this.form.reset();
        this.sent.set(true);
      },
      error: (error: unknown) => {
        this.sending.set(false);
        this.error.set(errorMessage(error));
      },
    });
  }
}
