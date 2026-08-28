import { Component, computed, signal } from '@angular/core';

interface Question {
  scenario: string;
  correctIndex: number;
  explanation: string;
}

const OPTIONS = ['Idempotent', 'Not idempotent'];

const QUESTIONS: Question[] = [
  {
    scenario: 'PUT /users/42 { name: "John" }',
    correctIndex: 0,
    explanation: 'Idempotent — PUT replaces the resource with the same representation every time. Repeating the call leaves the resource in the exact same state.',
  },
  {
    scenario: 'POST /orders',
    correctIndex: 1,
    explanation: 'Not idempotent, generally — POST typically creates a new resource on every call, so repeating it creates multiple orders.',
  },
  {
    scenario: 'DELETE /users/42',
    correctIndex: 0,
    explanation: 'Idempotent — even though the second call returns 404 instead of 204, the intended end state ("this user is gone") is unchanged after the first call. Idempotency is about the resulting state, not the response code.',
  },
  {
    scenario: 'PATCH /users/42 { name: "John" }',
    correctIndex: 0,
    explanation: 'Idempotent — this specific PATCH sets an absolute value. Applying it repeatedly leaves name at "John" every time. PATCH is not inherently one or the other; it depends on the operation it expresses.',
  },
  {
    scenario: 'PATCH /counter/1 { increment: 1 }',
    correctIndex: 1,
    explanation: 'Not idempotent — this PATCH expresses a relative change. Each repeated call increments the counter further, so the end state keeps changing.',
  },
];

@Component({
  selector: 'app-idempotency-game',
  standalone: true,
  template: `
    <section class="lab-section" id="idempotency-game">
      <div class="container">
        <p class="lab-index">REST API / 40 — IS THIS IDEMPOTENT?</p>
        <h2 class="lab-title">Five requests. Same call, repeated — does the end state stay the same?</h2>

        @if (!finished()) {
          <div class="lab-panel">
            <p class="quiz-progress mono">Question {{ index() + 1 }} / {{ questions.length }}</p>
            <p class="lab-code scenario-code">{{ current().scenario }}</p>
            <div class="option-list">
              @for (opt of options; track opt; let oi = $index) {
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
    .scenario-code { margin-bottom: 20px; }
    .option-list { display: flex; flex-direction: column; gap: 8px; max-width: 320px; }
    .option-btn { text-align: left; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); font-size: 0.875rem; font-weight: 600; }
    .option-btn:disabled { cursor: default; }
    .option-btn.is-correct { border-color: var(--accent-2); color: var(--accent-2); }
    .option-btn.is-wrong { border-color: var(--danger); color: var(--danger); }
    .explanation { margin-top: 16px; padding: 12px 14px; border-left: 3px solid var(--accent-2); background: var(--surface); font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; border-radius: var(--radius-sm); }
    .quiz-score { font-size: 1.25rem; color: var(--accent-strong); }
  `,
})
export class IdempotencyGame {
  protected readonly questions = QUESTIONS;
  protected readonly options = OPTIONS;
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
