import { Component, computed, signal } from '@angular/core';

interface SecurityStep {
  id: string;
  label: string;
  question: string;
  explanation: string;
  chapterLink: string;
}

const STEPS: SecurityStep[] = [
  {
    id: 'authn',
    label: 'Authentication',
    question: 'Who are you?',
    explanation: 'The request must first prove an identity — a token, session, or key — before anything else runs. This is the Authentication & Authorization chapter\'s job, not the REST layer\'s.',
    chapterLink: 'Authentication & Authorization',
  },
  {
    id: 'authz',
    label: 'Authorization',
    question: 'Can you delete book 42?',
    explanation: 'Knowing who the caller is does not mean they may perform this action on this resource. Authorization checks the permission, not just the identity.',
    chapterLink: 'Authentication & Authorization',
  },
  {
    id: 'validation',
    label: 'Validation',
    question: 'Is book ID valid?',
    explanation: 'The path parameter is untrusted input. Before it touches any lookup, it is checked for shape — e.g. is "42" actually a valid identifier format. This is the Validation & Transformation chapter\'s job.',
    chapterLink: 'Validation & Transformation',
  },
  {
    id: 'state',
    label: 'Resource state check',
    question: 'Does book 42 exist?',
    explanation: 'Even a well-formed, authorized request can target a resource that is not there. This check is what decides between a real delete and a 404.',
    chapterLink: 'REST API Design',
  },
  {
    id: 'repository',
    label: 'Repository',
    question: 'Remove the row for book 42.',
    explanation: 'Only after every prior gate passes does the repository translate "delete this resource" into an actual persistence operation.',
    chapterLink: 'Backend Layers',
  },
  {
    id: 'database',
    label: 'Database',
    question: 'DELETE FROM books WHERE id = 42.',
    explanation: 'The database executes the final write. Everything before this point exists to make sure this statement only runs when it should.',
    chapterLink: 'Backend Layers',
  },
];

@Component({
  selector: 'app-api-security-connection',
  standalone: true,
  template: `
    <section class="lab-section" id="api-security">
      <div class="container">
        <p class="lab-index">REST API / 33 — API DESIGN MEETS SECURITY</p>
        <h2 class="lab-title">One DELETE request. Six gates before the database sees it.</h2>
        <p class="lab-lede">
          <code class="mono">DELETE /books/42</code> looks like a single line in an API spec. In a real backend it
          is a chain — click each stage to see what it actually checks.
        </p>

        <div class="lab-panel">
          <div class="chain">
            @for (s of steps; track s.id; let i = $index) {
              <button
                type="button"
                class="chain-node"
                [class.is-active]="selected() === s.id"
                (click)="select(s.id)"
              >
                <span class="chain-num mono">{{ i + 1 }}</span>
                <span class="lab-node">{{ s.label }}</span>
              </button>
              @if (i < steps.length - 1) {
                <span class="lab-flow-arrow chain-arrow">→</span>
              }
            }
          </div>

          @if (current(); as step) {
            <div class="reveal-box">
              <p class="reveal-question mono">"{{ step.question }}"</p>
              <p class="reveal-explanation">{{ step.explanation }}</p>
              <p class="reveal-chapter">Covered in depth in <strong>{{ step.chapterLink }}</strong>.</p>
            </div>
          } @else {
            <p class="lab-note">Click any stage above to see what it checks before the request moves on.</p>
          }
        </div>

        <p class="lab-note lab-note-warn">
          REST endpoint design does not exist in isolation. The URL and method you choose are only the entry point —
          what actually happens depends on authentication, authorization, validation, and the layers underneath, as
          covered in the Authentication &amp; Authorization and Validation &amp; Transformation chapters.
        </p>
      </div>
    </section>
  `,
  styles: `
    .chain { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .chain-node { display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-elevated); transition: border-color 0.15s ease, background 0.15s ease; }
    .chain-node:hover { border-color: var(--accent); }
    .chain-node.is-active { border-color: var(--accent-2); background: color-mix(in srgb, var(--accent-2) 12%, var(--surface-elevated)); }
    .chain-node.is-active .lab-node { color: var(--accent-2); }
    .chain-num { font-size: 0.6875rem; color: var(--text-faint); }
    .chain-arrow { flex-shrink: 0; }

    .reveal-box { margin-top: 24px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .reveal-question { font-size: 0.875rem; color: var(--text); }
    .reveal-explanation { margin-top: 10px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }
    .reveal-chapter { margin-top: 10px; font-size: 0.8125rem; color: var(--accent-2); }
    .reveal-chapter strong { color: var(--accent-2); }
  `,
})
export class ApiSecurityConnection {
  protected readonly steps = STEPS;
  protected readonly selected = signal<string | null>(null);
  protected readonly current = computed(() => this.steps.find((s) => s.id === this.selected()) ?? null);

  select(id: string): void {
    this.selected.set(id);
  }
}
