import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { environment } from '../environments/environment';
import { resetDemoData } from './core/demo-backend';

@Component({
  selector: 'app-root',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet],
  template: `
    @if (demo) {
      <div class="demo-bar" role="note">
        <a href="../index.html#portfolio" class="back">← Volver al portafolio</a>
        <span class="info"><strong>Demo</strong> · los datos se guardan solo en tu navegador</span>
        <button type="button" (click)="reset()">Reiniciar demo</button>
      </div>
    }
    <router-outlet />
  `,
  styles: `
    .demo-bar { position: relative; z-index: 50; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 6px 16px; padding: 7px 24px; background: #111; color: #eee; font-size: .82rem; }
    .demo-bar a { color: #fff; font-weight: 700; text-decoration: none; }
    .demo-bar a:hover { text-decoration: underline; }
    .info strong { color: #c9a5ff; }
    button { background: none; border: 1px solid #555; border-radius: 6px; color: #eee; font: inherit; padding: 3px 10px; cursor: pointer; }
    button:hover { border-color: #c9a5ff; color: #c9a5ff; }
    @media (max-width: 560px) { .info { display: none; } }
  `,
})
export class App {
  protected readonly demo = environment.demo;

  protected reset(): void {
    resetDemoData();
    sessionStorage.clear();
    location.hash = '#/';
    location.reload();
  }
}
