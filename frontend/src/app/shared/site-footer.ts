import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Logo } from './logo';

@Component({
  selector: 'app-site-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, Logo],
  template: `
    <footer class="footer">
      <div class="container inner">
        <app-logo [height]="26" />
        <nav aria-label="Enlaces del pie de página">
          <a routerLink="/reservar">Reservar hora</a>
          <a routerLink="/contacto">Contáctanos</a>
          <a routerLink="/admin">Acceso personal</a>
        </nav>
        <p>&copy; {{ year }} Clinic Mascotas · Proyecto de portafolio por Harrys Moreno</p>
      </div>
    </footer>
  `,
  styles: `
    .footer { border-top: 1px solid var(--line); padding-block: 28px; background: #fff; }
    .inner { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px 32px; }
    nav { display: flex; flex-wrap: wrap; gap: 20px; }
    a { color: var(--ink); text-decoration: none; font-size: .95rem; }
    a:hover { color: var(--purple); }
    p { margin: 0; width: 100%; color: var(--muted); font-size: .85rem; }
  `,
})
export class SiteFooter {
  protected readonly year = new Date().getFullYear();
}
