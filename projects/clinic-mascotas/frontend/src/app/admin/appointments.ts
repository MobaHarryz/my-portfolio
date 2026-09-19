import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, WritableSignal, computed, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { ApiService, errorMessage } from '../core/api.service';
import { AppointmentDetail, AppointmentStatus, STATUS_LABELS } from '../core/models';
import { parseLocalDateTime } from '../shared/dates';
import { Icon } from '../shared/icon';

const PET_LABELS = { DOG: 'Perro', CAT: 'Gato', BIRD: 'Ave', RODENT: 'Roedor' } as const;

@Component({
  selector: 'app-appointments',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DatePipe, Icon],
  template: `
    <div class="page-head">
      <div>
        <h1>Reservas</h1>
        @let total = result.value()?.totalElements ?? 0;
        <p>{{ total }} {{ total === 1 ? 'resultado' : 'resultados' }}</p>
      </div>
    </div>

    <div class="panel">
      <form class="filters" (submit)="$event.preventDefault()">
        <label class="field search">
          <span>Buscar</span>
          <div class="input-icon">
            <app-icon name="search" [size]="16" />
            <input type="search" placeholder="Código, mascota, dueño o email" [ngModel]="q()" (ngModelChange)="setFilter(q, $event)" name="q" />
          </div>
        </label>
        <label class="field">
          <span>Estado</span>
          <select [ngModel]="status()" (ngModelChange)="setFilter(status, $event)" name="status">
            <option value="">Todos</option>
            @for (s of statuses; track s) { <option [value]="s">{{ labels[s] }}</option> }
          </select>
        </label>
        <label class="field">
          <span>Fecha</span>
          <input type="date" [ngModel]="date()" (ngModelChange)="setFilter(date, $event)" name="date" />
        </label>
        <label class="field">
          <span>Veterinario</span>
          <select [ngModel]="vetId()" (ngModelChange)="setFilter(vetId, $event)" name="vetId">
            <option value="">Todos</option>
            @for (v of vets.value() ?? []; track v.id) { <option [value]="v.id">{{ v.fullName }}</option> }
          </select>
        </label>
      </form>

      @if (actionError()) { <p class="alert" role="alert">{{ actionError() }}</p> }

      @if (result.error()) {
        <p class="alert">No se pudieron cargar las reservas.</p>
      } @else if (result.hasValue() && result.value().content.length === 0) {
        <p class="empty">No hay reservas con esos filtros.</p>
      } @else {
        <div class="table-wrap" [class.loading]="result.isLoading()">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Mascota</th>
                <th>Dueño</th>
                <th>Veterinario</th>
                <th>Estado</th>
                <th><span class="sr-only">Detalle</span></th>
              </tr>
            </thead>
            <tbody>
              @for (a of result.value()?.content ?? []; track a.id) {
                <tr [class.open]="expanded() === a.id">
                  <td>
                    <strong>{{ parse(a.startsAt) | date: 'EEE d MMM' }}</strong>
                    <small>{{ parse(a.startsAt) | date: 'HH:mm' }} · {{ a.code }}</small>
                  </td>
                  <td>
                    {{ a.pet.name }}
                    <small>{{ petLabels[a.petType] }} · {{ a.pet.breed }}</small>
                  </td>
                  <td>
                    {{ a.owner.fullName }}
                    <small>{{ a.owner.phone }}</small>
                  </td>
                  <td>{{ a.vetName }}</td>
                  <td>
                    <select class="status-select status" [class]="a.status" [ngModel]="a.status"
                            (ngModelChange)="changeStatus(a, $event)" [attr.aria-label]="'Estado de la reserva ' + a.code">
                      @for (s of statuses; track s) { <option [value]="s">{{ labels[s] }}</option> }
                    </select>
                  </td>
                  <td>
                    <button type="button" class="btn btn-outline btn-sm" (click)="toggle(a.id)">
                      {{ expanded() === a.id ? 'Cerrar' : 'Detalle' }}
                    </button>
                  </td>
                </tr>
                @if (expanded() === a.id) {
                  <tr class="detail">
                    <td colspan="6">
                      <dl>
                        <div><dt>Email</dt><dd><a [href]="'mailto:' + a.owner.email">{{ a.owner.email }}</a></dd></div>
                        <div><dt>Sexo</dt><dd>{{ a.pet.sex === 'MALE' ? 'Macho' : 'Hembra' }}</dd></div>
                        <div><dt>Edad</dt><dd>{{ a.pet.ageRange }}</dd></div>
                        <div><dt>Vacunas al día</dt><dd>{{ a.pet.vaccinated ? 'Sí' : 'No' }}</dd></div>
                        <div><dt>Reservada</dt><dd>{{ a.createdAt | date: 'short' }}</dd></div>
                      </dl>
                      <label class="field notes">
                        <span>Notas internas</span>
                        <textarea rows="3" [(ngModel)]="notesDraft" name="notes" placeholder="Solo visibles para el personal"></textarea>
                      </label>
                      <button type="button" class="btn btn-primary btn-sm" [disabled]="saving()" (click)="saveNotes(a)">Guardar notas</button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        @if ((result.value()?.totalPages ?? 0) > 1) {
          <nav class="pager" aria-label="Paginación">
            <button type="button" class="btn btn-outline btn-sm" [disabled]="page() === 0" (click)="page.set(page() - 1)">
              <app-icon name="chevron-left" [size]="16" /> Anterior
            </button>
            <span>Página {{ page() + 1 }} de {{ result.value()?.totalPages }}</span>
            <button type="button" class="btn btn-outline btn-sm" [disabled]="page() + 1 >= (result.value()?.totalPages ?? 0)" (click)="page.set(page() + 1)">
              Siguiente <app-icon name="chevron-right" [size]="16" />
            </button>
          </nav>
        }
      }
    </div>
  `,
  styleUrl: './admin-shared.scss',
  styles: `
    .filters { display: grid; grid-template-columns: 2fr 1fr 1fr 1.3fr; gap: 0 14px; margin-bottom: 8px; }
    .input-icon { position: relative; }
    .input-icon app-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: var(--muted); }
    .input-icon input { padding-left: 32px; }
    .loading { opacity: .55; transition: opacity .2s; }
    .status-select { border: 0; padding: 4px 8px; cursor: pointer; font: inherit; font-size: .8rem; font-weight: 700; appearance: auto; }
    tr.open td { border-bottom-color: transparent; }
    .detail td { background: #faf8fe; }
    dl { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 10px; margin: 0 0 14px; }
    dt { font-size: .75rem; color: var(--muted); text-transform: uppercase; }
    dd { margin: 0; }
    dd a { color: var(--purple); }
    .notes { max-width: 560px; margin-bottom: 10px; }
    .pager { display: flex; justify-content: space-between; align-items: center; padding-top: 16px; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); }
    @media (max-width: 900px) { .filters { grid-template-columns: 1fr 1fr; } .search { grid-column: 1 / -1; } }
  `,
})
export class Appointments {
  private readonly api = inject(ApiService);

  protected readonly labels = STATUS_LABELS;
  protected readonly petLabels = PET_LABELS;
  protected readonly statuses = Object.keys(STATUS_LABELS) as AppointmentStatus[];

  protected readonly q = signal('');
  protected readonly status = signal<AppointmentStatus | ''>('');
  protected readonly date = signal('');
  protected readonly vetId = signal('');
  protected readonly page = signal(0);
  private readonly reload = signal(0);

  protected readonly expanded = signal<string | null>(null);
  protected notesDraft = '';
  protected readonly saving = signal(false);
  protected readonly actionError = signal<string | null>(null);

  private readonly query = computed(() => ({
    q: this.q(),
    status: this.status(),
    date: this.date(),
    vetId: this.vetId(),
    page: this.page(),
    size: 15,
    _reload: this.reload(),
  }));

  protected readonly result = rxResource({
    params: () => this.query(),
    stream: ({ params: { _reload, ...query } }) => this.api.appointments(query),
  });

  protected readonly vets = rxResource({ stream: () => this.api.adminVets() });

  protected setFilter<T>(filter: WritableSignal<T>, value: T): void {
    filter.set(value);
    this.page.set(0);
  }

  protected parse(value: string): Date {
    return parseLocalDateTime(value);
  }

  protected toggle(id: string): void {
    const opening = this.expanded() !== id;
    this.expanded.set(opening ? id : null);
    if (opening) {
      this.notesDraft = this.result.value()?.content.find((a) => a.id === id)?.internalNotes ?? '';
    }
  }

  protected changeStatus(appointment: AppointmentDetail, status: AppointmentStatus): void {
    this.actionError.set(null);
    this.api.updateAppointment(appointment.id, { status }).subscribe({
      next: (updated) => this.replace(updated),
      error: (error: unknown) => {
        this.actionError.set(errorMessage(error));
        this.reload.update((n) => n + 1); // restore the real status in the table
      },
    });
  }

  protected saveNotes(appointment: AppointmentDetail): void {
    this.saving.set(true);
    this.api.updateAppointment(appointment.id, { internalNotes: this.notesDraft }).subscribe({
      next: (updated) => {
        this.saving.set(false);
        this.replace(updated);
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.actionError.set(errorMessage(error));
      },
    });
  }

  private replace(updated: AppointmentDetail): void {
    this.result.update((page) =>
      page ? { ...page, content: page.content.map((a) => (a.id === updated.id ? updated : a)) } : page,
    );
  }
}
