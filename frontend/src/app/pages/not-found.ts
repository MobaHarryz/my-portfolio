import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SiteHeader } from '../shared/site-header';

@Component({
  selector: 'app-not-found',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SiteHeader],
  template: `
    <app-site-header />
    <main class="container page">
      <p class="code">404</p>
      <h1>Esta página se escapó 🐾</h1>
      <p>No encontramos lo que buscabas.</p>
      <a routerLink="/" class="btn btn-primary">Volver al inicio</a>
    </main>
  `,
  styles: `
    .page { text-align: center; padding-block: 80px; }
    .code { font-family: var(--font-heading); font-weight: 800; font-size: 6rem; color: var(--lavender-strong); margin: 0; line-height: 1; }
    h1 { margin: 12px 0; }
    p { margin: 0 0 28px; }
  `,
})
export class NotFound {}
