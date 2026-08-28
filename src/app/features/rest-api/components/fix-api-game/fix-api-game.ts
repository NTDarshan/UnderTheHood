import { Component, computed, signal } from '@angular/core';

interface Question {
  broken: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    broken: 'POST /api/createUser',
    options: ['POST /api/v1/users', 'POST /api/user/create', 'PUT /api/users/create', 'POST /api/createUsers'],
    correctIndex: 0,
    explanation: 'The path should name the resource collection, not the operation — POST already means "create." Versioning (v1) and pluralization (users) round out the fix.',
  },
  {
    broken: 'GET /api/books/findById/42',
    options: ['GET /api/v1/books/42', 'GET /api/books/find/42', 'POST /api/books/findById', 'GET /api/v1/books?id=42'],
    correctIndex: 0,
    explanation: 'The identifier already selects the resource — "findById" is a verb the URL does not need. GET /api/v1/books/42 is the resource-oriented, versioned form.',
  },
  {
    broken: 'GET /api/users/42/delete',
    options: ['DELETE /api/v1/users/42', 'POST /api/users/42/delete', 'GET /api/v1/users/delete/42', 'PATCH /api/users/42/delete'],
    correctIndex: 0,
    explanation: 'GET must stay safe (no side effects). Deleting a resource is exactly what the DELETE method exists for — the URL just names the resource.',
  },
  {
    broken: 'GET /api/books?sortBy=DROP_TABLE',
    options: [
      'Reject unknown sort fields — enforce a server-side allowlist',
      'Trust any client-supplied sortBy value as-is',
      'Silently ignore the sort parameter without validating it',
      'Move the sort value into the request body instead',
    ],
    correctIndex: 0,
    explanation: 'A client-supplied field name must never be passed straight into a query. Validating it against an explicit allowlist (e.g. title, createdAt, price) closes this off completely.',
  },
  {
    broken: 'GET /api/books?status=does-not-exist',
    options: [
      'Validate that the filter value is one of the supported statuses',
      'Return every book regardless of the filter value',
      'Return a 500 Internal Server Error',
      'Silently coerce the value to the default status',
    ],
    correctIndex: 0,
    explanation: 'An unsupported filter value is a predictable client input problem — it should be validated and rejected with a clear 400, not silently ignored or treated as a server failure.',
  },
];

@Component({
  selector: 'app-fix-api-game',
  standalone: true,
  template: `
    <section class="lab-section" id="fix-api-game">
      <div class="container">
        <p class="lab-index">REST API / 37 — FIX THIS API</p>
        <h2 class="lab-title">Five broken endpoints. Pick the fix, not just the flaw.</h2>

        @if (!finished()) {
          <div class="lab-panel">
            <p class="quiz-progress mono">Question {{ index() + 1 }} / {{ questions.length }}</p>
            <p class="lab-code broken-code"><span class="tok-status-err">✕</span> {{ current().broken }}</p>
            <div class="option-list">
              @for (opt of current().options; track opt; let oi = $index) {
                <button
                  type="button"
                  class="option-btn"
                  [class.is-correct]="picked() !== null && oi === current().correctIndex"
                  [class.is-wrong]="picked() === oi && oi !== current().correctIndex"
                  [disabled]="picked() !== null"
                  (click)="choose(oi)"
                >
                  {{ opt }}
                </button>
              }
            </div>
            @if (picked() !== null) {
              <p class="explanation">{{ current().explanation }}</p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-primary" (click)="next()">{{ index() < questions.length - 1 ? 'Next →' : 'See score' }}</button>
              </div>
            }
          </div>
        } @else {
          <div class="lab-panel">
            <p class="quiz-score mono">{{ score() }} / {{ questions.length }} correct</p>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn" (click)="restart()">↻ Play again</button>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .quiz-progress { font-size: 0.75rem; color: var(--text-faint); margin-bottom: 16px; }
    .broken-code { margin-bottom: 20px; }
    .option-list { display: flex; flex-direction: column; gap: 8px; }
    .option-btn { text-align: left; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); font-size: 0.875rem; }
    .option-btn:disabled { cursor: default; }
    .option-btn.is-correct { border-color: var(--accent-2); color: var(--accent-2); }
    .option-btn.is-wrong { border-color: var(--danger); color: var(--danger); }
    .explanation { margin-top: 16px; padding: 12px 14px; border-left: 3px solid var(--accent-2); background: var(--surface); font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; border-radius: var(--radius-sm); }
    .quiz-score { font-size: 1.25rem; color: var(--accent-strong); }
  `,
})
export class FixApiGame {
  protected readonly questions = QUESTIONS;
  protected readonly index = signal(0);
  protected readonly picked = signal<number | null>(null);
  protected readonly score = signal(0);
  protected readonly finished = signal(false);

  protected readonly current = computed(() => this.questions[this.index()]);

  choose(oi: number): void {
    this.picked.set(oi);
    if (oi === this.current().correctIndex) this.score.update((s) => s + 1);
  }

  next(): void {
    if (this.index() < this.questions.length - 1) {
      this.index.update((i) => i + 1);
      this.picked.set(null);
    } else {
      this.finished.set(true);
    }
  }

  restart(): void {
    this.index.set(0);
    this.picked.set(null);
    this.score.set(0);
    this.finished.set(false);
  }
}
