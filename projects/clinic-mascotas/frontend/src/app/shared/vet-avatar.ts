import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Vet photo, or coloured initials when no photo is set. */
@Component({
  selector: 'app-vet-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (photoUrl()) {
      <img [src]="photoUrl()" [alt]="'Foto de ' + name()" [style.width.px]="size()" [style.height.px]="size()" />
    } @else {
      <span class="initials" [style.width.px]="size()" [style.height.px]="size()" [style.background]="color()">
        {{ initials() }}
      </span>
    }
  `,
  styles: `
    :host { display: inline-flex; }
    img, .initials { border-radius: 50%; border: 1px solid var(--line-strong); object-fit: cover; }
    .initials { display: grid; place-items: center; color: #fff; font-family: var(--font-heading); font-weight: 700; font-size: 1.1rem; }
  `,
})
export class VetAvatar {
  readonly name = input.required<string>();
  readonly photoUrl = input<string | null>(null);
  readonly size = input(60);

  protected readonly initials = computed(() =>
    this.name()
      .replace(/^(Dra?\.)\s*/i, '')
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase(),
  );

  protected readonly color = computed(() => {
    const palette = ['#7b00f0', '#5b21b6', '#a855f7', '#6d28d9', '#9333ea', '#4c1d95'];
    const hash = [...this.name()].reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return palette[hash % palette.length];
  });
}
