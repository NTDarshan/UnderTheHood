import { Component, input } from '@angular/core';

@Component({
  selector: 'app-tech-badge',
  standalone: true,
  template: `<span class="tech-badge mono">{{ label() }}</span>`,
  styles: `
    .tech-badge {
      display: inline-flex;
      align-items: center;
      font-size: 0.8125rem;
      font-weight: 500;
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
      border: 1px solid var(--border);
      color: var(--text-muted);
      transition: border-color 0.2s ease, color 0.2s ease;
    }

    .tech-badge:hover {
      border-color: var(--accent-dim);
      color: var(--text);
    }
  `,
})
export class TechBadge {
  readonly label = input.required<string>();
}
