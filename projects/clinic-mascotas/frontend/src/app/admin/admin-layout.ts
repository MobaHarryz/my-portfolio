import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthService } from '../core/auth';
import { Icon, IconName } from '../shared/icon';
import { Logo } from '../shared/logo';

@Component({
  selector: 'app-admin-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo, Icon],
  template: `
    <div class="shell" [class.menu-open]="menuOpen()">
      <aside class="sidebar">
        <div class="brand">
          <a routerLink="/admin" aria-label="Panel"><app-logo [height]="22" /></a>
          <button type="button" class="menu-close" aria-label="Cerrar menú" (click)="menuOpen.set(false)">
            <app-icon name="x" />
          </button>
        </div>
        <nav aria-label="Administración">
          @for (link of links; track link.path) {
            <a [routerLink]="link.path" routerLinkActive="active" (click)="menuOpen.set(false)">
              <app-icon [name]="link.icon" [size]="19" /> {{ link.label }}
            </a>
          }
        </nav>
        <div class="user">
          <span class="avatar">{{ (auth.user()?.name ?? 'A')[0] }}</span>
          <div>
            <strong>{{ auth.user()?.name }}</strong>
            <small>{{ auth.user()?.email }}</small>
          </div>
          <button type="button" class="logout" aria-label="Cerrar sesión" title="Cerrar sesión" (click)="auth.logout()">
            <app-icon name="logout" [size]="18" />
          </button>
        </div>
      </aside>

      <div class="main">
        <header class="topbar">
          <button type="button" class="menu-open-btn" aria-label="Abrir menú" (click)="menuOpen.set(true)">
            <app-icon name="menu" />
          </button>
          <a routerLink="/" target="_blank" class="site-link">Ver sitio público ↗</a>
        </header>
        <main class="content">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: `
    .shell { display: grid; grid-template-columns: 250px 1fr; min-height: 100vh; background: #f7f5fb; }
    .sidebar { position: sticky; top: 0; height: 100vh; display: flex; flex-direction: column; background: #fff; border-right: 1px solid var(--line); padding: 22px 14px; }
    .brand { display: flex; justify-content: space-between; align-items: center; padding: 0 8px 26px; }
    .brand a { color: var(--ink); }
    nav { display: grid; gap: 4px; }
    nav a { display: flex; align-items: center; gap: 12px; padding: 11px 12px; border-radius: 10px; color: var(--muted); text-decoration: none; }
    nav a:hover { background: var(--lavender); color: var(--ink); }
    nav a.active { background: var(--purple); color: #fff; }
    .user { margin-top: auto; display: flex; align-items: center; gap: 10px; padding: 12px 8px 0; border-top: 1px solid var(--line); }
    .user div { display: grid; min-width: 0; flex: 1; }
    .user strong { font-size: .9rem; }
    .user small { color: var(--muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .avatar { display: grid; place-items: center; width: 36px; height: 36px; flex-shrink: 0; border-radius: 50%; background: var(--lavender); color: var(--purple); font-weight: 700; }
    .logout, .menu-close, .menu-open-btn { display: grid; place-items: center; width: 36px; height: 36px; border: 0; border-radius: 8px; background: none; color: var(--muted); cursor: pointer; }
    .logout:hover, .menu-close:hover, .menu-open-btn:hover { background: var(--lavender); color: var(--purple); }
    .main { min-width: 0; }
    .topbar { display: flex; justify-content: flex-end; align-items: center; padding: 16px 32px 0; }
    .site-link { color: var(--purple); text-decoration: none; font-size: .9rem; }
    .content { padding: 12px 32px 48px; }
    .menu-close, .menu-open-btn { display: none; }
    @media (max-width: 900px) {
      .shell { grid-template-columns: 1fr; }
      .sidebar { position: fixed; inset: 0 auto 0 0; width: 260px; z-index: 20; transform: translateX(-100%); transition: transform .2s; box-shadow: 0 0 40px rgb(0 0 0 / 15%); }
      .menu-open .sidebar { transform: none; }
      .menu-close, .menu-open-btn { display: grid; }
      .topbar { justify-content: space-between; padding: 12px 16px 0; }
      .content { padding: 12px 16px 40px; }
    }
  `,
})
export class AdminLayout {
  protected readonly auth = inject(AuthService);
  protected readonly menuOpen = signal(false);

  protected readonly links: { path: string; label: string; icon: IconName }[] = [
    { path: 'panel', label: 'Panel', icon: 'dashboard' },
    { path: 'reservas', label: 'Reservas', icon: 'calendar' },
    { path: 'veterinarios', label: 'Veterinarios', icon: 'stethoscope' },
    { path: 'mensajes', label: 'Mensajes', icon: 'inbox' },
  ];
}
