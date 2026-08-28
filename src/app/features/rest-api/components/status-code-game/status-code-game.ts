import { Component, computed, signal } from '@angular/core';

interface Question {
  scenario: string;
  options: number[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  { scenario: 'Created a new user.', options: [200, 201, 202, 204], correctIndex: 1, explanation: '201 Created — the request succeeded and a new resource now exists.' },
  { scenario: 'Successfully fetched a book.', options: [200, 201, 204, 304], correctIndex: 0, explanation: '200 OK — a successful read that returns a representation.' },
  { scenario: 'Successfully deleted a resource, nothing to return.', options: [200, 202, 204, 410], correctIndex: 2, explanation: '204 No Content — the operation succeeded and there is deliberately no response body.' },
  { scenario: 'The specific book requested does not exist.', options: [400, 404, 410, 204], correctIndex: 1, explanation: '404 Not Found — a specific, addressed resource has no match. (Not to be confused with an empty collection, which is still 200.)' },
  { scenario: 'The user is not authenticated at all.', options: [401, 403, 400, 419], correctIndex: 0, explanation: '401 Unauthorized — the client\'s identity could not be established in the first place.' },
  { scenario: 'The authenticated user lacks permission for this action.', options: [401, 403, 400, 405], correctIndex: 1, explanation: '403 Forbidden — the client is known, but not allowed to do this.' },
  { scenario: 'The request body fails validation.', options: [400, 401, 500, 409], correctIndex: 0, explanation: '400 Bad Request — malformed or invalid input. (422 Unprocessable Content is also a valid choice depending on the API\'s own convention for "well-formed but semantically invalid.")' },
  { scenario: 'The request conflicts with the resource\'s current state.', options: [400, 404, 409, 423], correctIndex: 2, explanation: '409 Conflict — e.g. a duplicate unique field, or an action that current state disallows.' },
  { scenario: 'The client has sent too many requests in a short time.', options: [403, 408, 429, 503], correctIndex: 2, explanation: '429 Too Many Requests — the standard status for rate limiting.' },
  { scenario: 'An unexpected failure occurred on the server.', options: [400, 404, 500, 501], correctIndex: 2, explanation: '500 Internal Server Error — reserved for genuinely unexpected failures, never predictable validation problems.' },
];

@Component({
  selector: 'app-status-code-game',
  standalone: true,
  template: `
    <section class="lab-section" id="status-code-game">
      <div class="container">
        <p class="lab-index">REST API / 38 — CHOOSE THE STATUS CODE</p>
        <h2 class="lab-title">Ten scenarios. Pick the status code that actually fits.</h2>

        @if (!finished()) {
          <div class="lab-panel">
            <p class="quiz-progress mono">Question {{ index() + 1 }} / {{ questions.length }}</p>
            <p class="quiz-question">{{ current().scenario }}</p>
            <div class="option-grid">
              @for (opt of current().options; track opt; let oi = $index) {
                <button
                  type="button"
                  class="option-btn mono"
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
    .quiz-progress { font-size: 0.75rem; color: var(--text-faint); margin-bottom: 12px; }
    .quiz-question { font-size: 1.0625rem; color: var(--text); font-weight: 600; }
    .option-grid { margin-top: 18px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    @media (min-width: 480px) { .option-grid { grid-template-columns: repeat(4, 1fr); } }
    .option-btn { text-align: center; padding: 14px 10px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); font-size: 1rem; font-weight: 700; }
    .option-btn:disabled { cursor: default; }
    .option-btn.is-correct { border-color: var(--accent-2); color: var(--accent-2); }
    .option-btn.is-wrong { border-color: var(--danger); color: var(--danger); }
    .explanation { margin-top: 16px; padding: 12px 14px; border-left: 3px solid var(--accent-2); background: var(--surface); font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; border-radius: var(--radius-sm); }
    .quiz-score { font-size: 1.25rem; color: var(--accent-strong); }
  `,
})
export class StatusCodeGame {
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
