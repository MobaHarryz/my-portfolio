import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** "CLINIC ~heartbeat~ 🐾 MASCOTAS" wordmark recreated from the design as SVG. */
@Component({
  selector: 'app-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.height]="height()" viewBox="0 0 312 44" role="img" aria-label="Clinic Mascotas">
      <text x="0" y="31" class="word">CLINIC</text>
      <polyline class="beat" points="80,24 96,24 100,14 104,36 109,6 113,40 117,24 130,24 133,19 136,28 139,24 146,24" />
      <g class="paw" transform="translate(150 9)">
        <ellipse cx="13" cy="19" rx="8" ry="6.5" />
        <ellipse cx="4" cy="9" rx="3" ry="4" />
        <ellipse cx="10" cy="4" rx="3" ry="4" />
        <ellipse cx="17" cy="4" rx="3" ry="4" />
        <ellipse cx="23" cy="9" rx="3" ry="4" />
      </g>
      <text x="180" y="31" class="word">MASCOTAS</text>
    </svg>
  `,
  styles: `
    :host { display: inline-flex; }
    svg { display: block; width: auto; overflow: visible; }
    .word { font-family: var(--font-heading); font-weight: 800; font-size: 25px; fill: currentColor; letter-spacing: -0.5px; }
    .beat { fill: none; stroke: var(--purple); stroke-width: 1.6; stroke-linejoin: round; }
    .paw { fill: var(--purple); }
  `,
})
export class Logo {
  readonly height = input(34);
}
