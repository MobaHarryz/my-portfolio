import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { rxResource, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ApiService } from '../../core/api.service';
import { parseLocalDateTime } from '../../shared/dates';
import { Icon } from '../../shared/icon';
import { SiteHeader } from '../../shared/site-header';

@Component({
  selector: 'app-confirmation',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, CurrencyPipe, SiteHeader, Icon],
  template: `
    <app-site-header />

    <main class="container page">
      @if (booking.hasValue()) {
        @let b = booking.value();
        <h1>{{ b.status === 'CANCELLED' ? 'Reserva cancelada' : 'Reserva completada' }}</h1>

        <article class="card">
          <span class="check"><app-icon name="check" [size]="14" [strokeWidth]="4" /></span>

          <p class="code">Código de reserva: <strong>{{ b.code }}</strong></p>

          <p>
            La hora de atención para <strong>{{ b.petName }}</strong> ya está reservada para el próximo
            <strong><span class="capitalize">{{ when(b.startsAt) | date: 'EEEE d' }}</span> de <span class="capitalize">{{ when(b.startsAt) | date: 'MMMM' }}</span></strong> a las
            <strong>{{ when(b.startsAt) | date: 'HH:mm' }} Hrs.</strong> con {{ b.vetName.startsWith('Dra') ? 'la' : 'el' }}
            <strong>{{ b.vetName }}</strong>.
          </p>

          <p>Recuerda llegar con 15 minutos de anticipación para realizar el ingreso formal.</p>

          @if (clinic(); as info) {
            <p>
              El costo de la consulta es de <strong>{{ b.price | currency: info.currency : 'symbol-narrow' : '1.0-0' }}</strong>,
              pero el precio puede variar si es que se requiere proporcionar medicamentos o realizar procedimientos adicionales.
            </p>

            <p>
              ¿Necesitas indicaciones para llegar a la clínica? Mira nuestro
              <a [href]="info.mapsUrl" target="_blank" rel="noopener">mapa en Google Maps</a>
            </p>
          }
        </article>

        <a routerLink="/" class="home-link">Volver a la página de inicio</a>
      } @else if (booking.error()) {
        <h1>Reserva no encontrada</h1>
        <article class="card">
          <p>No encontramos una reserva con el código <strong>{{ code() }}</strong>. Revisa el enlace o crea una nueva reserva.</p>
          <a routerLink="/reservar" class="btn btn-primary">Reservar una hora</a>
        </article>
      } @else {
        <h1>Cargando tu reserva…</h1>
        <article class="card skeleton"></article>
      }
    </main>
  `,
  styles: `
    :host { display: block; min-height: 100vh; background: var(--lavender); }
    .page { max-width: 560px; padding-block: 40px 72px; text-align: center; }
    h1 { font-size: clamp(2rem, 4vw, 2.6rem); margin: 0 0 40px; }
    .card { position: relative; text-align: left; background: #fff; border: 1px solid var(--line-strong); border-radius: 28px; padding: 56px 68px 44px; line-height: 1.55; }
    .card p { margin: 0 0 20px; }
    .card p:last-child { margin-bottom: 0; }
    .check { position: absolute; top: -11px; left: 50%; transform: translateX(-50%); display: grid; place-items: center; width: 22px; height: 22px; border-radius: 50%; background: var(--purple); color: #fff; }
    .code { font-size: .9rem; color: var(--muted); }
    .code strong { color: var(--purple); letter-spacing: .06em; font-size: 1rem; }
    .capitalize { text-transform: capitalize; }
    a:not(.btn) { color: #2196f3; font-weight: 700; }
    .home-link { display: inline-block; margin-top: 36px; color: var(--muted) !important; text-decoration: none; }
    .home-link:hover { color: var(--purple) !important; }
    .skeleton { min-height: 320px; }
    @media (max-width: 560px) { .card { padding: 44px 24px 32px; } }
  `,
})
export class Confirmation {
  /** Bound from the route parameter :code */
  readonly code = input.required<string>();

  private readonly api = inject(ApiService);
  protected readonly clinic = toSignal(this.api.clinic());
  protected readonly booking = rxResource({
    params: () => this.code(),
    stream: ({ params }) => this.api.confirmation(params),
  });

  protected when(startsAt: string): Date {
    return parseLocalDateTime(startsAt);
  }
}
