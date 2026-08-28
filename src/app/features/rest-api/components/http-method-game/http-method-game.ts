import { Component, computed, signal } from '@angular/core';

interface Question {
  scenario: string;
  options: string[];
  correctIndices: number[];
  explanation: string;
}

const QUESTIONS: Question[] = [
  { scenario: 'Get all books.', options: ['GET', 'POST', 'PUT', 'PATCH'], correctIndices: [0], explanation: 'GET — a safe, read-only retrieval of a collection.' },
  { scenario: 'Create a new book.', options: ['GET', 'POST', 'PUT', 'DELETE'], correctIndices: [1], explanation: 'POST — creates a new resource inside the books collection.' },
  { scenario: 'Replace a book\'s entire representation.', options: ['PATCH', 'PUT', 'POST', 'GET'], correctIndices: [1], explanation: 'PUT — supplies a full replacement representation for the target resource.' },
  { scenario: 'Update just a book\'s price.', options: ['PUT', 'POST', 'PATCH', 'DELETE'], correctIndices: [2], explanation: 'PATCH — a partial modification, leaving the rest of the resource untouched.' },
  { scenario: 'Delete a book.', options: ['PATCH', 'POST', 'GET', 'DELETE'], correctIndices: [3], explanation: 'DELETE — removes the target resource.' },
  {
    scenario: 'Archive a project.',
    options: ['PATCH /projects/9 { status: "archived" }', 'POST /projects/9/archive', 'GET /projects/9/archive', 'PUT /projects (full collection)'],
    correctIndices: [0, 1],
    explanation: 'Both are defensible. PATCH treats archiving as a state transition on the existing resource — simple and resource-oriented. POST to an action endpoint treats archiving as a distinct operation, useful when it triggers side effects (e.g. notifications, cascading changes) beyond a plain field update. Neither is a forced single right answer; which one fits depends on how much the operation is "just a field change" versus "a meaningful action."',
  },
];

@Component({
  selector: 'app-http-method-game',
  standalone: true,
  template: `
    <section class="lab-section" id="http-method-game">
      <div class="container">
        <p class="lab-index">REST API / 39 — CHOOSE THE HTTP METHOD</p>
        <h2 class="lab-title">Six scenarios. Pick the method that fits — one has more than one right answer.</h2>

        @if (!finished()) {
          <div class="lab-panel">
            <p class="quiz-progress mono">Question {{ index() + 1 }} / {{ questions.length }}</p>
            <p class="quiz-question">{{ current().scenario }}</p>
            <div class="option-list">
              @for (opt of current().options; track opt; let oi = $index) {
                <button
                  type="button"
                  class="option-btn mono"
                  [class.is-correct]="picked() !== null && isCorrect(oi)"
                  [class.is-wrong]="picked() === oi && !isCorrect(oi)"
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
    .quiz-progress { font-size: 0.75rem; color: var(--text-faint); margin-bottom: 12px; }
    .quiz-question { font-size: 1.0625rem; color: var(--text); font-weight: 600; }
    .option-list { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; }
    .option-btn { text-align: left; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); font-size: 0.875rem; }
    .option-btn:disabled { cursor: default; }
    .option-btn.is-correct { border-color: var(--accent-2); color: var(--accent-2); }
    .option-btn.is-wrong { border-color: var(--danger); color: var(--danger); }
    .explanation { margin-top: 16px; padding: 12px 14px; border-left: 3px solid var(--accent-2); background: var(--surface); font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; border-radius: var(--radius-sm); }
    .quiz-score { font-size: 1.25rem; color: var(--accent-strong); }
  `,
})
export class HttpMethodGame {
  protected readonly questions = QUESTIONS;
  protected readonly index = signal(0);
  protected readonly picked = signal<number | null>(null);
  protected readonly score = signal(0);
  protected readonly finished = signal(false);

  protected readonly current = computed(() => this.questions[this.index()]);

  isCorrect(oi: number): boolean {
    return this.current().correctIndices.includes(oi);
  }

  choose(oi: number): void {
    this.picked.set(oi);
    if (this.isCorrect(oi)) this.score.update((s) => s + 1);
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
