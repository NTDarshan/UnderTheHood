import { Component, signal } from '@angular/core';

interface Challenge {
  id: string;
  title: string;
  json: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const CHALLENGES: Challenge[] = [
  {
    id: 'syntax',
    title: 'Challenge 1 — Syntax',
    json: '{\n  name: "Alice"\n}',
    question: 'Is this valid JSON?',
    options: ['Yes', 'No — keys must be double-quoted strings'],
    correctIndex: 1,
    explanation: 'Unquoted keys are one of the most common ways hand-written JSON breaks. "name" is required, not name.',
  },
  {
    id: 'type',
    title: 'Challenge 2 — Wrong Value Type',
    json: '{\n  "age": "thirty"\n}',
    question: 'The server expects age to be a number. Does this request succeed?',
    options: ['Yes, JSON is valid so it always works', 'The JSON parses fine, but the value fails application validation'],
    correctIndex: 1,
    explanation: 'Syntactically valid JSON does not automatically satisfy the receiving schema — "thirty" cannot become a number.',
  },
  {
    id: 'missing',
    title: 'Challenge 3 — Missing Field',
    json: '{\n  "name": "Alice"\n}',
    question: 'The application expects both name and age. What happens?',
    options: ['JSON is invalid because age is missing', 'JSON is valid, but application-level validation can still fail'],
    correctIndex: 1,
    explanation: 'JSON has no concept of "required fields" — that constraint lives entirely in the receiving application, not the format.',
  },
  {
    id: 'unknown',
    title: 'Challenge 4 — Unknown Field',
    json: '{\n  "name": "Alice",\n  "nickname": "Al"\n}',
    question: 'The schema only defines name. What happens to nickname?',
    options: ['The whole request always fails', 'Depends on the receiving system — it may be ignored, stripped, or rejected'],
    correctIndex: 1,
    explanation: 'Unknown-field handling is a design decision made by the receiving system, not something JSON itself dictates.',
  },
];

@Component({
  selector: 'app-break-serializer',
  standalone: true,
  template: `
    <section class="lab-section" id="break-serializer">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 20 — BREAK THE SERIALIZER</p>
        <h2 class="lab-title">Four ways a payload can betray you.</h2>
        <p class="lab-lede">Predict the outcome, then check yourself.</p>

        <div class="challenge-grid">
          @for (c of challenges; track c.id; let i = $index) {
            <div class="challenge-card">
              <p class="challenge-title mono">{{ c.title }}</p>
              <pre class="challenge-json mono">{{ c.json }}</pre>
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
                <div class="verdict" [class.is-right]="picked()[i] === c.correctIndex">
                  <p class="verdict-body">{{ c.explanation }}</p>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </section>

    <section class="lab-section" id="misconceptions">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 21 — COMMON MISCONCEPTIONS</p>
        <h2 class="lab-title">Myth vs. reality.</h2>

        <div class="myth-grid">
          @for (m of myths; track m.myth) {
            <div class="myth-card">
              <p class="myth-label mono">MYTH</p>
              <p class="myth-text">"{{ m.myth }}"</p>
              <p class="reality-label mono">REALITY</p>
              <p class="reality-text">{{ m.reality }}</p>
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

    .challenge-json {
      margin-top: 12px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 10px 12px;
      white-space: pre-wrap;
    }

    .challenge-question {
      margin-top: 12px;
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
      border-left: 3px solid var(--accent-2);
    }

    .verdict-body {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.55;
    }

    .myth-grid {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    @media (min-width: 800px) {
      .myth-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .myth-card {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px;
    }

    .myth-label {
      font-size: 0.6875rem;
      color: var(--danger);
      letter-spacing: 0.06em;
    }

    .myth-text {
      margin-top: 6px;
      font-size: 0.9375rem;
      color: var(--text);
      font-style: italic;
    }

    .reality-label {
      margin-top: 14px;
      font-size: 0.6875rem;
      color: var(--accent-2);
      letter-spacing: 0.06em;
    }

    .reality-text {
      margin-top: 6px;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.55;
    }
  `,
})
export class BreakSerializer {
  protected readonly challenges = CHALLENGES;
  protected readonly picked = signal<(number | undefined)[]>(CHALLENGES.map(() => undefined));

  choose(challengeIndex: number, optionIndex: number): void {
    this.picked.update((p) => {
      const next = [...p];
      next[challengeIndex] = optionIndex;
      return next;
    });
  }

  protected readonly myths = [
    { myth: 'JSON is an object.', reality: 'JSON is a text-based representation of structured data — not the object itself.' },
    { myth: 'Serialization means sending the object itself.', reality: 'The object is converted into a transferable representation; the original object never leaves its process.' },
    { myth: 'Valid JSON means valid application data.', reality: 'Syntax validity and application-level validation are separate concerns.' },
    { myth: 'JSON is the only serialization format.', reality: 'JSON is one of many — XML, YAML, Protocol Buffers, and Avro are common alternatives.' },
    { myth: 'Binary is always faster.', reality: 'Performance depends on the specific format, implementation, and workload.' },
    { myth: 'Deserialization validates everything.', reality: 'Deserialization reconstructs data; validation is a distinct step that checks whether it satisfies application requirements.' },
  ];
}
