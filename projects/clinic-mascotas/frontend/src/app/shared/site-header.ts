import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ApiService } from '../core/api.service';
import { Icon } from './icon';
import { Logo } from './logo';

@Component({
  selector: 'app-site-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Logo, Icon],
  template: `
    <header class="container header">
      <a routerLink="/" class="brand" aria-label="Clinic Mascotas, ir al inicio">
        <app-logo />
      </a>
      <ul class="contact">
        <li>
          <a [href]="'mailto:' + email()">
            <span class="badge"><app-icon name="mail" [size]="14" /></span>{{ email() }}
          </a>
        </li>
        <li>
          <a [href]="'tel:' + phone().replaceAll(' ', '')">
            <span class="badge"><app-icon name="phone" [size]="14" /></span>{{ phone() }}
          </a>
        </li>
      </ul>
    </header>
  `,
  styles: `
    .header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding-block: 26px; }
    .brand { color: var(--ink); display: inline-flex; }
    .contact { list-style: none; margin: 0; padding: 0; display: flex; gap: 20px; }
    .contact a { display: inline-flex; align-items: center; gap: 8px; color: var(--ink); text-decoration: none; font-size: .95rem; }
    .contact a:hover { color: var(--purple); }
    .badge { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 5px; background: var(--purple); color: #fff; }
    @media (max-width: 860px) {
      .header { align-items: flex-start; }
      .contact { flex-direction: column; gap: 8px; }
      .contact a { font-size: .8rem; }
    }
    @media (max-width: 420px) {
      .contact a { font-size: 0; gap: 0; }
      .badge { width: 34px; height: 34px; border-radius: 8px; }
      .contact { flex-direction: row; }
    }
  `,
})
export class SiteHeader {
  private readonly clinic = toSignal(inject(ApiService).clinic());

  protected readonly email = () => this.clinic()?.email ?? 'info@clinicmascotas.co';
  protected readonly phone = () => this.clinic()?.phone ?? '+57 319 225 6982';
}
