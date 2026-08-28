import { Component, signal } from '@angular/core';

interface Challenge {
  id: string;
  request: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const CHALLENGES: Challenge[] = [
  {
    id: 'c1',
    request: '{ "email": "john", "age": 25 }',
    question: 'What fails?',
    options: ['Syntactic validation', 'Semantic validation', 'Cross-field validation'],
    correctIndex: 0,
    explanation: '"john" doesn\'t follow the email format at all — a syntax-level failure, before meaning even enters the picture.',
  },
  {
    id: 'c2',
    request: '{ "email": "john@example.com", "age": 400 }',
    question: 'What fails?',
    options: ['Syntactic validation', 'Semantic validation', 'Allowlist validation'],
    correctIndex: 1,
    explanation: '400 is a syntactically valid number — it just isn\'t a plausible age. That\'s a semantic failure.',
  },
  {
    id: 'c3',
    request: '{ "married": true, "partnerName": "" }',
    question: 'What fails?',
    options: ['Type validation', 'Cross-field validation', 'Domain/business rule'],
    correctIndex: 1,
    explanation: 'The rule depends on the relationship between married and partnerName — a cross-field check.',
  },
  {
    id: 'c4',
    request: '{ "page": "hello" }',
    question: 'What fails?',
    options: ['Transformation / type validation', 'Semantic validation', 'Cross-resource validation'],
    correctIndex: 0,
    explanation: '"hello" simply cannot become a valid integer — it fails during transformation/type checking.',
  },
  {
    id: 'c5',
    request: '{ "sortBy": "unknownField" }',
    question: 'What fails?',
    options: ['Length validation', 'Allowlist validation', 'Semantic validation'],
    correctIndex: 1,
    explanation: '"unknownField" isn\'t in the set of accepted sort columns — an allowlist rejection.',
  },
  {
    id: 'c6',
    request: '{ "amount": 1000 } — account balance: 500',
    question: 'What fails?',
    options: ['Type validation', 'Syntactic validation', 'Domain / business rule failure'],
    correctIndex: 2,
    explanation: '1000 is a perfectly valid number — the failure is that current account state can\'t support it. That\'s domain logic, not input validation.',
  },
];

@Component({
  selector: 'app-break-the-api-game',
  standalone: true,
  template: `
    <section class="lab-section" id="break-the-api">
      <div class="container">
        <p class="lab-index">VALIDATION / 40 — "BREAK THE API"</p>
        <h2 class="lab-title">Identify the layer responsible for each failure.</h2>

        <div class="challenge-grid">
          @for (c of challenges; track c.id; let i = $index) {
            <div class="challenge-card">
              <pre class="challenge-request mono">{{ c.request }}</pre>
              <p class="challenge-question">{{ c.question }}</p>
              <div class="option-list">
                @for (opt of c.options; track opt; let oi = $index) {
                  <button
                    type="button"
                    class="option-btn"
                    [class.is-correct]="picked()[i] !== undefined && oi === c.correctIndex"
                    [class.is-wrong]="picked()[i] === oi && oi !== c.correctIndex"
                    [disabled]="picked()[i] !== undefined"
                    (click)="choose(i, oi)"
                  >
                    {{ opt }}
                  </button>
                }
              </div>
              @if (picked()[i] !== undefined) {
                <p class="explanation">{{ c.explanation }}</p>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .challenge-grid { margin-top: 32px; display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 900px) { .challenge-grid { grid-template-columns: 1fr 1fr; } }
    .challenge-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
    .challenge-request { font-size: 0.8125rem; color: var(--text-muted); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); padding: 10px 12px; white-space: pre-wrap; }
    .challenge-question { margin-top: 12px; font-size: 0.9375rem; color: var(--text); font-weight: 600; }
    .option-list { margin-top: 14px; display: flex; flex-direction: column; gap: 8px; }
    .option-btn { text-align: left; padding: 10px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); font-size: 0.8125rem; }
    .option-btn:disabled { cursor: default; }
    .option-btn.is-correct { border-color: var(--accent-2); color: var(--accent-2); }
    .option-btn.is-wrong { border-color: var(--danger); color: var(--danger); }
    .explanation { margin-top: 14px; padding: 12px 14px; border-left: 3px solid var(--accent-2); background: var(--surface); font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; border-radius: var(--radius-sm); }
  `,
})
export class BreakTheApiGame {
  protected readonly challenges = CHALLENGES;
  protected readonly picked = signal<(number | undefined)[]>(CHALLENGES.map(() => undefined));

  choose(challengeIndex: number, optionIndex: number): void {
    this.picked.update((p) => {
      const next = [...p];
      next[challengeIndex] = optionIndex;
      return next;
    });
  }
}
