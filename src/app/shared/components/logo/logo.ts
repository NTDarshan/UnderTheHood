import { Component, input } from '@angular/core';

@Component({
  selector: 'app-logo',
  standalone: true,
  template: `
    <span class="logo" [class.logo-compact]="compact()">
      <svg viewBox="0 0 32 32" class="logo-mark" aria-hidden="true">
        <rect x="1" y="1" width="30" height="30" rx="7" class="logo-mark-bg" />
        <path
          d="M10 9v7.2c0 3.6 2.4 6.3 6 6.3s6-2.7 6-6.3V9"
          class="logo-mark-path"
          fill="none"
          stroke-width="2.4"
          stroke-linecap="round"
        />
        <circle cx="16" cy="24.4" r="1.4" class="logo-mark-dot" />
      </svg>
      <span class="logo-text">
        Under<span class="logo-accent">The</span>Hood
      </span>
    </span>
  `,
  styles: `
    .logo {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      font-family: var(--font-sans);
      font-weight: 700;
      font-size: 1.05rem;
      letter-spacing: -0.01em;
      color: var(--text);
    }

    .logo-mark {
      width: 28px;
      height: 28px;
      flex-shrink: 0;
    }

    .logo-mark-bg {
      fill: var(--surface-elevated);
      stroke: var(--border-strong);
    }

    .logo-mark-path {
      stroke: var(--accent);
    }

    .logo-mark-dot {
      fill: var(--accent-2);
    }

    .logo-accent {
      color: var(--accent);
    }

    .logo-compact .logo-text {
      display: none;
    }

    @media (max-width: 420px) {
      .logo-text {
        font-size: 0.95rem;
      }
    }
  `,
})
export class Logo {
  readonly compact = input(false);
}
