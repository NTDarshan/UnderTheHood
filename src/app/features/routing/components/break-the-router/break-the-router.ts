import { Component, signal } from '@angular/core';

interface Challenge {
  id: string;
  title: string;
  setup: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const CHALLENGES: Challenge[] = [
  {
    id: 'ordering',
    title: 'Scenario 1 — Ordering',
    setup: 'Route table: /users/{id} listed first, then /users/me.',
    question: 'What happens when a client requests GET /users/me?',
    options: [
      'It matches /users/me, because it is the more specific route',
      'It matches /users/{id} with id = "me", because that route is checked first',
      'It returns 404, because no route is specific enough',
    ],
    correctIndex: 1,
    explanation: '/users/{id} is checked first and its dynamic segment happily accepts the literal text "me" — the router never even reaches /users/me.',
  },
  {
    id: 'constraint',
    title: 'Scenario 2 — Constraints',
    setup: 'Route: /users/{id:int}. Request: GET /users/abc.',
    question: 'Will this route match?',
    options: ['Yes, {id} accepts any text', 'No, "abc" fails the :int constraint', 'Yes, but only with a warning'],
    correctIndex: 1,
    explanation: '"abc" is not an integer, so the :int constraint rejects it — the router moves on to the next candidate route, or 404s if none remain.',
  },
  {
    id: 'path-vs-query',
    title: 'Scenario 3 — Path vs Query',
    setup: 'Route: /users/{id}. Request: GET /users/123?sort=name.',
    question: 'What belongs to the path, and what belongs to the query?',
    options: [
      '"123" is a query value and "sort=name" is the path',
      '"123" is the path parameter (id) and "sort=name" is a query parameter',
      'Both are path parameters',
    ],
    correctIndex: 1,
    explanation: 'Everything before the "?" is the path — 123 fills {id}. Everything after is the query string — sort=name never affects which route matches.',
  },
  {
    id: 'catchall',
    title: 'Scenario 4 — Catch-all Placement',
    setup: 'Route table contains /{*path} as one of its entries.',
    question: 'Why should this route usually be treated as a fallback, placed last?',
    options: [
      'Because wildcard routes are slower to evaluate',
      'Because if placed earlier, it would match everything and shadow every more specific route below it',
      'Because catch-all routes only work with GET requests',
    ],
    correctIndex: 1,
    explanation: 'A catch-all matches almost any path. Ordering rules mean the first match wins — so placed early, it would win every time and starve every specific route beneath it.',
  },
];

@Component({
  selector: 'app-break-the-router',
  standalone: true,
  template: `
    <section class="lab-section" id="playground">
      <div class="container">
        <p class="lab-index">ROUTING / 15 — BREAK THE ROUTER</p>
        <h2 class="lab-title">Four ways routing goes wrong — before you hit them in production.</h2>
        <p class="lab-lede">
          Predict what the router does in each scenario, then check yourself against the actual behavior.
        </p>

        <div class="challenge-grid">
          @for (c of challenges; track c.id; let i = $index) {
            <div class="challenge-card">
              <p class="challenge-title mono">{{ c.title }}</p>
              <p class="challenge-setup">{{ c.setup }}</p>
              <p class="challenge-question">{{ c.question }}</p>

              <div class="option-list">
                @for (opt of c.options; track opt; let oi = $index) {
                  <button
                    type="button"
                    class="option-btn"
                    [class.is-selected]="picked()[i] === oi"
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
                <div class="verdict" [class.is-right]="picked()[i] === c.correctIndex">
                  <p class="verdict-heading">
                    {{ picked()[i] === c.correctIndex ? 'Correct!' : "Not quite — here's what the router did:" }}
                  </p>
                  <p class="verdict-body">{{ c.explanation }}</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .challenge-grid {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 900px) {
      .challenge-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .challenge-card {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 22px;
    }

    .challenge-title {
      color: var(--accent-2);
      font-size: 0.75rem;
      letter-spacing: 0.06em;
    }

    .challenge-setup {
      margin-top: 10px;
      font-size: 0.8125rem;
      color: var(--text-faint);
      font-family: var(--font-mono, monospace);
    }

    .challenge-question {
      margin-top: 10px;
      font-size: 0.9375rem;
      color: var(--text);
      font-weight: 600;
    }

    .option-list {
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .option-btn {
      text-align: left;
      padding: 10px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--text-muted);
      font-size: 0.8125rem;
      line-height: 1.5;
    }

    .option-btn:disabled {
      cursor: default;
    }

    .option-btn.is-correct {
      border-color: var(--accent-2);
      color: var(--accent-2);
    }

    .option-btn.is-wrong {
      border-color: var(--danger);
      color: var(--danger);
    }

    .verdict {
      margin-top: 14px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      background: var(--surface);
      border-left: 3px solid var(--danger);
    }

    .verdict.is-right {
      border-left-color: var(--accent-2);
    }

    .verdict-heading {
      font-weight: 700;
      font-size: 0.8125rem;
      color: var(--text);
    }

    .verdict-body {
      margin-top: 6px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.55;
    }
  `,
})
export class BreakTheRouter {
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
