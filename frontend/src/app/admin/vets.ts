import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

import { ApiService, errorMessage } from '../core/api.service';
import { DAYS, DayOfWeek, PetTypeId, VetDetail, VetRequest } from '../core/models';
import { Icon } from '../shared/icon';
import { VetAvatar } from '../shared/vet-avatar';

const PET_TYPES: { id: PetTypeId; label: string }[] = [
  { id: 'DOG', label: 'Perro' },
  { id: 'CAT', label: 'Gato' },
  { id: 'BIRD', label: 'Ave' },
  { id: 'RODENT', label: 'Roedor' },
];

interface VetDraft {
  id: string | null;
  fullName: string;
  title: string;
  university: string;
  photoUrl: string;
  petTypes: PetTypeId[];
  /** Comma separated "HH:mm" times per day, easy to edit */
  schedule: Record<DayOfWeek, string>;
  active: boolean;
}

@Component({
  selector: 'app-vets',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, Icon, VetAvatar],
  template: `
    <div class="page-head">
      <div>
        <h1>Veterinarios</h1>
        <p>Profesionales, tipos de mascota que atienden y su agenda semanal.</p>
      </div>
      <button type="button" class="btn btn-primary btn-sm" (click)="edit(null)"><app-icon name="plus" [size]="16" /> Nuevo</button>
    </div>

    @if (draft(); as d) {
      <form class="panel editor" (ngSubmit)="save()" #editor="ngForm">
        <h2>{{ d.id ? 'Editar profesional' : 'Nuevo profesional' }}</h2>

        <div class="grid">
          <label class="field"><span>Nombre completo</span><input name="fullName" [(ngModel)]="d.fullName" required maxlength="80" placeholder="Dra. Ana Pérez" /></label>
          <label class="field"><span>Cargo</span><input name="title" [(ngModel)]="d.title" required maxlength="60" placeholder="Médica veterinaria" /></label>
          <label class="field"><span>Universidad</span><input name="university" [(ngModel)]="d.university" required maxlength="80" /></label>
          <label class="field"><span>URL de la foto (opcional)</span><input name="photoUrl" type="url" [(ngModel)]="d.photoUrl" placeholder="https://…" /></label>
        </div>

        <fieldset>
          <legend>Atiende a</legend>
          <div class="chips">
            @for (type of petTypes; track type.id) {
              <label class="chip" [class.on]="d.petTypes.includes(type.id)">
                <input type="checkbox" [checked]="d.petTypes.includes(type.id)" (change)="togglePet(d, type.id)" /> {{ type.label }}
              </label>
            }
          </div>
        </fieldset>

        <fieldset>
          <legend>Agenda semanal <small>(horas separadas por coma, ej: 09:00, 10:30, 14:00)</small></legend>
          <div class="schedule">
            @for (day of days; track day.id) {
              <label class="field inline"><span>{{ day.label }}</span><input [name]="'day-' + day.id" [(ngModel)]="d.schedule[day.id]" placeholder="Sin atención" /></label>
            }
          </div>
        </fieldset>

        <label class="switch"><input type="checkbox" name="active" [(ngModel)]="d.active" /> Disponible para reservas</label>

        @if (formError()) { <p class="alert" role="alert">{{ formError() }}</p> }

        <div class="editor-actions">
          <button type="button" class="btn btn-outline btn-sm" (click)="draft.set(null)">Cancelar</button>
          <button type="submit" class="btn btn-primary btn-sm" [disabled]="editor.invalid || d.petTypes.length === 0 || saving()">
            {{ saving() ? 'Guardando…' : 'Guardar' }}
          </button>
        </div>
      </form>
    }

    <div class="panel">
      @if (vets.error()) {
        <p class="alert">No se pudieron cargar los veterinarios.</p>
      } @else if (vets.isLoading() && !vets.hasValue()) {
        <p class="empty">Cargando…</p>
      } @else {
        <div class="table-wrap">
          <table>
            <thead><tr><th>Profesional</th><th>Atiende</th><th>Agenda</th><th>Estado</th><th></th></tr></thead>
            <tbody>
              @for (v of vets.value() ?? []; track v.id) {
                <tr [class.inactive]="!v.active">
                  <td>
                    <div class="who">
                      <app-vet-avatar [name]="v.fullName" [photoUrl]="v.photoUrl" [size]="40" />
                      <div>{{ v.fullName }}<small>{{ v.title }} · {{ v.university }}</small></div>
                    </div>
                  </td>
                  <td>{{ petLabels(v.petTypes) }}</td>
                  <td><small class="agenda">{{ scheduleSummary(v) }}</small></td>
                  <td><span class="status" [class.COMPLETED]="v.active" [class.CANCELLED]="!v.active">{{ v.active ? 'Activo' : 'Inactivo' }}</span></td>
                  <td><button type="button" class="btn btn-outline btn-sm" (click)="edit(v)">Editar</button></td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styleUrl: './admin-shared.scss',
  styles: `
    .editor { margin-bottom: 20px; }
    .editor h2 { margin: 0 0 18px; font-size: 1.3rem; }
    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 16px; }
    fieldset { border: 0; padding: 0; margin: 0 0 18px; }
    legend { font-weight: 700; margin-bottom: 10px; }
    legend small { font-weight: 400; color: var(--muted); }
    .chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { display: inline-flex; align-items: center; gap: 6px; padding: 6px 14px; border: 1px solid var(--line-strong); border-radius: 999px; cursor: pointer; }
    .chip.on { border-color: var(--purple); background: var(--lavender); color: var(--purple); }
    .chip input { accent-color: var(--purple); }
    .schedule { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0 16px; }
    .inline { flex-direction: row; align-items: center; margin-bottom: 8px; }
    .inline span { width: 90px; flex-shrink: 0; }
    .switch { display: inline-flex; gap: 8px; align-items: center; margin-bottom: 16px; }
    .switch input { accent-color: var(--purple); width: 16px; height: 16px; }
    .editor-actions { display: flex; justify-content: flex-end; gap: 10px; }
    .who { display: flex; gap: 10px; align-items: center; }
    .agenda { max-width: 320px; }
    tr.inactive td { opacity: .6; }
    @media (max-width: 700px) { .grid, .schedule { grid-template-columns: 1fr; } }
  `,
})
export class Vets {
  private readonly api = inject(ApiService);

  protected readonly days = DAYS;
  protected readonly petTypes = PET_TYPES;
  protected readonly vets = rxResource({ stream: () => this.api.adminVets() });
  protected readonly draft = signal<VetDraft | null>(null);
  protected readonly saving = signal(false);
  protected readonly formError = signal<string | null>(null);

  protected edit(vet: VetDetail | null): void {
    this.formError.set(null);
    const schedule = Object.fromEntries(DAYS.map((day) => [day.id, (vet?.weeklySchedule[day.id] ?? []).join(', ')])) as Record<DayOfWeek, string>;
    this.draft.set({
      id: vet?.id ?? null,
      fullName: vet?.fullName ?? '',
      title: vet?.title ?? '',
      university: vet?.university ?? '',
      photoUrl: vet?.photoUrl ?? '',
      petTypes: [...(vet?.petTypes ?? [])],
      schedule,
      active: vet?.active ?? true,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  protected togglePet(draft: VetDraft, type: PetTypeId): void {
    draft.petTypes = draft.petTypes.includes(type)
      ? draft.petTypes.filter((t) => t !== type)
      : [...draft.petTypes, type];
    this.draft.set({ ...draft });
  }

  protected save(): void {
    const draft = this.draft();
    if (!draft) {
      return;
    }

    const weeklySchedule: Partial<Record<DayOfWeek, string[]>> = {};
    for (const day of DAYS) {
      const times = draft.schedule[day.id].split(',').map((t) => t.trim()).filter(Boolean)
        .map((t) => (/^\d:\d{2}$/.test(t) ? `0${t}` : t));
      const wrong = times.find((t) => !/^([01]\d|2[0-3]):[0-5]\d$/.test(t));
      if (wrong) {
        this.formError.set(`"${wrong}" no es una hora válida para ${day.label}. Usa el formato HH:mm.`);
        return;
      }
      if (times.length) {
        weeklySchedule[day.id] = times;
      }
    }

    const request: VetRequest = {
      fullName: draft.fullName,
      title: draft.title,
      university: draft.university,
      photoUrl: draft.photoUrl || null,
      petTypes: draft.petTypes,
      weeklySchedule,
      active: draft.active,
    };

    this.saving.set(true);
    this.formError.set(null);
    const call = draft.id ? this.api.updateVet(draft.id, request) : this.api.createVet(request);
    call.subscribe({
      next: () => {
        this.saving.set(false);
        this.draft.set(null);
        this.vets.reload();
      },
      error: (error: unknown) => {
        this.saving.set(false);
        this.formError.set(errorMessage(error));
      },
    });
  }

  protected petLabels(types: PetTypeId[]): string {
    return PET_TYPES.filter((t) => types.includes(t.id)).map((t) => t.label).join(', ');
  }

  protected scheduleSummary(vet: VetDetail): string {
    const parts = DAYS.filter((d) => vet.weeklySchedule[d.id]?.length)
      .map((d) => `${d.label.slice(0, 3)}: ${vet.weeklySchedule[d.id]!.join(' ')}`);
    return parts.length ? parts.join(' · ') : 'Sin agenda';
  }
}
