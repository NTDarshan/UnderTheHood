import { Component, computed, signal } from '@angular/core';

interface RuleRound {
  id: string;
  rule: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const ROUNDS: RuleRound[] = [
  {
    id: 'r1',
    rule: 'Email must contain a valid format.',
    options: ['Controller boundary', 'Service', 'Repository', 'Database'],
    correctIndex: 0,
    explanation: 'A pure format check on a single field is exactly what boundary/input validation exists for.',
  },
  {
    id: 'r2',
    rule: 'A user cannot delete another user\'s document.',
    options: ['Controller boundary', 'Authorization / domain policy', 'Repository', 'Database'],
    correctIndex: 1,
    explanation: 'This depends on identity and resource ownership — an authorization/application policy concern, not a format check.',
  },
  {
    id: 'r3',
    rule: 'Account balance cannot become negative.',
    options: ['Controller boundary', 'Domain rule + database integrity', 'Repository only', 'None needed'],
    correctIndex: 1,
    explanation: 'This is a domain/business rule enforced in the service layer, ideally backed by a database constraint as a second line of defense.',
  },
  {
    id: 'r4',
    rule: 'Email must be unique.',
    options: ['Controller boundary only', 'Business/application check + database UNIQUE constraint', 'Repository only', 'Database only'],
    correctIndex: 1,
    explanation: 'Uniqueness typically needs an application-level check for a good error message, and a UNIQUE constraint as the real guarantee under concurrency.',
  },
];

@Component({
  selector: 'app-where-rule-live-game',
  standalone: true,
  template: `
    <section class="lab-section" id="where-rule-lives">
      <div class="container">
        <p class="lab-index">VALIDATION / 41 — "WHERE SHOULD THIS RULE LIVE?"</p>
        <h2 class="lab-title">Not every rule belongs in the controller.</h2>

        @if (!finished()) {
          <div class="lab-panel round-panel">
            <p class="round-progress mono">Round {{ index() + 1 }} / {{ rounds.length }}</p>
            <p class="round-rule">"{{ current().rule }}"</p>
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
                <button type="button" class="lab-btn lab-btn-primary" (click)="next()">{{ index() < rounds.length - 1 ? 'Next →' : 'Finish' }}</button>
              </div>
            }
          </div>
        } @else {
          <div class="lab-panel round-panel">
            <p class="round-score mono">{{ score() }} / {{ rounds.length }} correct</p>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn" (click)="restart()">↻ Play again</button>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .round-panel { margin-top: 24px; }
    .round-progress { font-size: 0.75rem; color: var(--text-faint); margin-bottom: 12px; }
    .round-rule { font-size: 1.0625rem; color: var(--text); font-weight: 600; font-style: italic; }
    .option-list { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; }
    .option-btn { text-align: left; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); font-size: 0.875rem; }
    .option-btn:disabled { cursor: default; }
    .option-btn.is-correct { border-color: var(--accent-2); color: var(--accent-2); }
    .option-btn.is-wrong { border-color: var(--danger); color: var(--danger); }
    .explanation { margin-top: 16px; padding: 12px 14px; border-left: 3px solid var(--accent-2); background: var(--surface); font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; border-radius: var(--radius-sm); }
    .round-score { font-size: 1.25rem; color: var(--accent-strong); }
  `,
})
export class WhereRuleLiveGame {
  protected readonly rounds = ROUNDS;
  protected readonly index = signal(0);
  protected readonly picked = signal<number | null>(null);
  protected readonly score = signal(0);
  protected readonly finished = signal(false);

  protected readonly current = computed(() => this.rounds[this.index()]);

  choose(oi: number): void {
    this.picked.set(oi);
    if (oi === this.current().correctIndex) this.score.update((s) => s + 1);
  }

  next(): void {
    if (this.index() < this.rounds.length - 1) {
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
