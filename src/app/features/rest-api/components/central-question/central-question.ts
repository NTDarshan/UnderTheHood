import { Component, computed, signal } from '@angular/core';

interface Pillar {
  id: string;
  label: string;
  explanation: string;
}

const PILLARS: Pillar[] = [
  { id: 'resources', label: 'RESOURCES', explanation: 'The API is organized around the things clients care about (books, orders, users) rather than around actions or scripts.' },
  { id: 'http-semantics', label: 'HTTP SEMANTICS', explanation: 'Methods and status codes carry their standard meaning, so GET, POST, 404 and 409 mean the same thing here as everywhere else.' },
  { id: 'consistency', label: 'CONSISTENCY', explanation: 'Similar things look similar across the whole API — naming, casing, pagination, and error shapes don\'t reinvent themselves per endpoint.' },
  { id: 'predictability', label: 'PREDICTABILITY', explanation: 'A client can guess how an unfamiliar endpoint behaves because it follows the same rules as the ones they already know.' },
  { id: 'evolution', label: 'EVOLUTION', explanation: 'The API can grow — new fields, new endpoints, new versions — without breaking the clients already depending on it.' },
];

@Component({
  selector: 'app-central-question',
  standalone: true,
  template: `
    <section class="lab-section" id="central-question">
      <div class="container">
        <p class="lab-index">REST API / 02 — THE CENTRAL QUESTION</p>
        <h2 class="lab-title">What makes an API well designed?</h2>

        <div class="lab-panel">
          <div class="pillar-row">
            @for (p of pillars; track p.id; let i = $index) {
              <button
                type="button"
                class="pillar-btn"
                [class.is-active]="expanded() === p.id"
                (click)="toggle(p.id)"
              >
                <span class="pillar-num mono">{{ '0' + (i + 1) }}</span>
                <span class="pillar-label">{{ p.label }}</span>
              </button>
            }
          </div>

          @if (current(); as p) {
            <p class="pillar-explanation">{{ p.explanation }}</p>
          }
        </div>

        <p class="lab-note">
          A good API is not simply an endpoint that works. It's an interface that clients can understand
          without constantly guessing.
        </p>
      </div>
    </section>
  `,
  styles: `
    .pillar-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .pillar-btn { display: flex; align-items: center; gap: 10px; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-elevated); color: var(--text-muted); transition: border-color 0.15s ease, color 0.15s ease; }
    .pillar-btn:hover { border-color: var(--accent); color: var(--accent-strong); }
    .pillar-btn.is-active { border-color: var(--accent-2); color: var(--accent-2); background: color-mix(in srgb, var(--accent-2) 10%, var(--surface-elevated)); }
    .pillar-num { font-size: 0.6875rem; color: var(--text-faint); }
    .pillar-btn.is-active .pillar-num { color: var(--accent-2); }
    .pillar-label { font-size: 0.8125rem; font-weight: 600; letter-spacing: 0.04em; }

    .pillar-explanation { margin-top: 22px; padding: 14px 16px; border-left: 3px solid var(--accent-2); background: var(--surface); border-radius: var(--radius-sm); font-size: 0.9375rem; color: var(--text); line-height: 1.6; }
  `,
})
export class CentralQuestion {
  protected readonly pillars = PILLARS;
  protected readonly expanded = signal<string | null>('resources');

  protected readonly current = computed(() => this.pillars.find((p) => p.id === this.expanded()) ?? null);

  toggle(id: string): void {
    this.expanded.set(this.expanded() === id ? null : id);
  }
}
