import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ApiService } from '../core/api.service';
import { STATUS_LABELS } from '../core/models';
import { parseLocalDateTime, todayIso } from '../shared/dates';
import { Icon, IconName } from '../shared/icon';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, DatePipe, Icon],
  template: `
    <div class="page-head">
      <div>
        <h1>Panel</h1>
        <p>{{ today | date: 'fullDate' }}</p>
      </div>
      <a routerLink="/reservar" target="_blank" class="btn btn-primary btn-sm"><app-icon name="plus" [size]="16" /> Nueva reserva</a>
    </div>

    <ul class="stats">
      @for (card of cards; track card.key) {
        <li class="panel">
          <span class="stat-icon" [class]="card.key"><app-icon [name]="card.icon" [size]="20" /></span>
          <div>
            <strong>{{ stats.value()?.[card.key] ?? '–' }}</strong>
            <span>{{ card.label }}</span>
          </div>
        </li>
      }
    </ul>

    <section class="panel">
      <div class="section-head">
        <h2>Reservas de hoy</h2>
        <a routerLink="/admin/reservas">Ver todas →</a>
      </div>

      @if (todays.isLoading()) {
        <p class="empty">Cargando…</p>
      } @else if (todays.error()) {
        <p class="alert">No se pudieron cargar las reservas.</p>
      } @else if (!todays.value()?.content?.length) {
        <p class="empty">No hay reservas para hoy.</p>
      } @else {
        <ul class="agenda">
          @for (a of todays.value()!.content; track a.id) {
            <li>
              <time>{{ parse(a.startsAt) | date: 'HH:mm' }}</time>
              <div>
                <strong>{{ a.pet.name }}</strong> <small>· {{ a.pet.breed }}</small>
                <small>{{ a.vetName }} · {{ a.owner.fullName }} · {{ a.owner.phone }}</small>
              </div>
              <span class="status" [class]="a.status">{{ labels[a.status] }}</span>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styleUrl: './admin-shared.scss',
  styles: `
    .stats { list-style: none; margin: 0 0 24px; padding: 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(190px, 1fr)); gap: 16px; }
    .stats li { display: flex; align-items: center; gap: 14px; }
    .stats strong { display: block; font-family: var(--font-heading); font-size: 1.9rem; line-height: 1; }
    .stats span { color: var(--muted); font-size: .9rem; }
    .stat-icon { display: grid; place-items: center; width: 44px; height: 44px; border-radius: 12px; background: var(--lavender); color: var(--purple) !important; }
    .stat-icon.completed { background: #dcfce7; color: #166534 !important; }
    .stat-icon.cancelled { background: #f1f1f4; color: #6b6b75 !important; }
    .stat-icon.unreadMessages { background: #fef3c7; color: #92400e !important; }
    .section-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
    .section-head h2 { font-size: 1.3rem; margin: 0; }
    .section-head a { color: var(--purple); text-decoration: none; font-size: .9rem; }
    .agenda { list-style: none; margin: 0; padding: 0; }
    .agenda li { display: grid; grid-template-columns: 64px 1fr auto; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid var(--line); }
    .agenda li:last-child { border-bottom: 0; }
    .agenda time { font-family: var(--font-heading); font-weight: 700; font-size: 1.1rem; color: var(--purple); }
    .agenda small { color: var(--muted); }
    .agenda div small:last-child { display: block; }
  `,
})
export class Dashboard {
  private readonly api = inject(ApiService);

  protected readonly today = new Date();
  protected readonly labels = STATUS_LABELS;
  protected readonly stats = rxResource({ stream: () => this.api.stats() });
  protected readonly todays = rxResource({ stream: () => this.api.appointments({ date: todayIso(), size: 50 }) });

  protected readonly cards: { key: 'today' | 'upcoming' | 'completed' | 'cancelled' | 'unreadMessages'; label: string; icon: IconName }[] = [
    { key: 'today', label: 'Citas hoy', icon: 'calendar-check' },
    { key: 'upcoming', label: 'Próximas citas', icon: 'clock' },
    { key: 'completed', label: 'Atendidas', icon: 'circle-check' },
    { key: 'cancelled', label: 'Canceladas', icon: 'x' },
    { key: 'unreadMessages', label: 'Mensajes sin leer', icon: 'mail' },
  ];

  protected parse(value: string): Date {
    return parseLocalDateTime(value);
  }
}
