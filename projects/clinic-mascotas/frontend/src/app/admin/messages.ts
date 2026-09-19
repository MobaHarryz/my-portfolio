import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { rxResource } from '@angular/core/rxjs-interop';

import { ApiService } from '../core/api.service';
import { ContactMessage } from '../core/models';

@Component({
  selector: 'app-messages',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe],
  template: `
    <div class="page-head">
      <div>
        <h1>Mensajes</h1>
        <p>Enviados desde el formulario de contacto.</p>
      </div>
    </div>

    @if (messages.error()) {
      <p class="alert">No se pudieron cargar los mensajes.</p>
    } @else if (messages.hasValue() && messages.value().length === 0) {
      <div class="panel empty">Aún no hay mensajes.</div>
    } @else {
      <ul class="list">
        @for (m of messages.value() ?? []; track m.id) {
          <li class="panel" [class.unread]="!m.read">
            <header>
              <div>
                <strong>{{ m.firstName }} {{ m.lastName }}</strong>
                <a [href]="'mailto:' + m.email + '?subject=Clinic%20Mascotas'">{{ m.email }}</a>
              </div>
              <time>{{ m.createdAt | date: 'medium' }}</time>
            </header>
            <p>{{ m.message }}</p>
            <button type="button" class="btn btn-outline btn-sm" (click)="toggle(m)">
              {{ m.read ? 'Marcar como no leído' : 'Marcar como leído' }}
            </button>
          </li>
        }
      </ul>
    }
  `,
  styleUrl: './admin-shared.scss',
  styles: `
    .list { list-style: none; margin: 0; padding: 0; display: grid; gap: 12px; }
    .unread { border-left: 4px solid var(--purple); }
    header { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; }
    header div { display: grid; }
    header a { color: var(--purple); font-size: .9rem; }
    time { color: var(--muted); font-size: .85rem; }
    p { white-space: pre-line; margin: 12px 0 14px; }
  `,
})
export class Messages {
  private readonly api = inject(ApiService);
  protected readonly messages = rxResource({ stream: () => this.api.messages() });

  protected toggle(message: ContactMessage): void {
    this.api.markMessage(message.id, !message.read).subscribe((updated) =>
      this.messages.update((list) => list?.map((m) => (m.id === updated.id ? updated : m))),
    );
  }
}
