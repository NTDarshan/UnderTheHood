import { Component, computed, signal } from '@angular/core';

interface Question {
  id: string;
  q: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  {
    id: 'q1',
    q: 'What is serialization?',
    options: [
      'Converting an in-memory object into a representation suitable for transmission or storage',
      'Sending a raw memory pointer over the network',
      'A synonym for JSON.parse',
    ],
    correctIndex: 0,
    explanation: 'Serialization is the conversion step — object to transferable representation.',
  },
  {
    id: 'q2',
    q: 'What is deserialization?',
    options: ['Deleting invalid data', 'Reconstructing usable application data from a serialized representation', 'Compressing a file'],
    correctIndex: 1,
    explanation: 'Deserialization reverses serialization — representation back into usable data.',
  },
  {
    id: 'q3',
    q: "Why can't two applications simply exchange in-memory objects?",
    options: ['Networks are too slow', 'Memory representation is local and implementation-specific to each program', 'It is against HTTP standards'],
    correctIndex: 1,
    explanation: "Memory layout depends on the language/runtime — it isn't something another process can read directly.",
  },
  {
    id: 'q4',
    q: 'Is { name: "Alice" } valid JSON?',
    options: ['Yes', 'No — the key must be a double-quoted string'],
    correctIndex: 1,
    explanation: 'JSON requires "name", not name.',
  },
  {
    id: 'q5',
    q: 'Is valid JSON necessarily valid application data?',
    options: ['Yes, always', 'No — parsing success and application validation are separate concerns'],
    correctIndex: 1,
    explanation: 'A payload can parse fine and still fail a schema or business rule.',
  },
  {
    id: 'q6',
    q: 'What does Content-Type tell the receiver?',
    options: ['The size of the request', 'What representation the body uses, so it knows how to interpret it', 'The route to send the response to'],
    correctIndex: 1,
    explanation: 'Content-Type is the hint that lets the server pick the right deserializer.',
  },
  {
    id: 'q7',
    q: 'Which of these is human-readable without special tooling?',
    options: ['JSON', 'Protocol Buffers'],
    correctIndex: 0,
    explanation: 'JSON is text-based; Protobuf is a compact binary format.',
  },
  {
    id: 'q8',
    q: 'Where does serialization happen in a typical HTTP request flow?',
    options: ['Only inside the database', 'When the client converts its object to JSON before sending, and again when the server responds', 'It only happens once, on the server'],
    correctIndex: 1,
    explanation: "Both directions serialize — request going out, response coming back.",
  },
  {
    id: 'q9',
    q: 'What is the difference between serialization and validation?',
    options: ['They are the same thing', 'Serialization asks "how do I represent this?"; validation asks "is this acceptable?"', 'Validation only applies to binary formats'],
    correctIndex: 1,
    explanation: 'Different questions, different steps in the pipeline.',
  },
  {
    id: 'q10',
    q: 'Why might schema evolution matter?',
    options: ['It never matters once an API ships', 'Old and new clients/servers need to keep working together as fields are added or removed', 'It only affects binary formats'],
    correctIndex: 1,
    explanation: 'APIs change over time — schema evolution is how compatibility survives that change.',
  },
];

@Component({
  selector: 'app-knowledge-quiz',
  standalone: true,
  template: `
    <section class="lab-section" id="quiz">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 22 — KNOWLEDGE CHECK</p>
        <h2 class="lab-title">Ten questions. See what stuck.</h2>

        <p class="quiz-score mono">Score: {{ score() }} / {{ questions.length }}</p>

        <div class="quiz-grid">
          @for (item of questions; track item.id; let i = $index) {
            <div class="quiz-card">
              <p class="quiz-question">{{ i + 1 }}. {{ item.q }}</p>
              <div class="option-list">
                @for (opt of item.options; track opt; let oi = $index) {
                  <button
                    type="button"
                    class="option-btn"
                    [class.is-correct]="picked()[i] !== undefined && oi === item.correctIndex"
                    [class.is-wrong]="picked()[i] === oi && oi !== item.correctIndex"
                    [disabled]="picked()[i] !== undefined"
                    (click)="choose(i, oi)"
                  >
                    {{ opt }}
                  </button>
                }
              </div>
              @if (picked()[i] !== undefined) {
                <p class="quiz-feedback" [class.is-right]="picked()[i] === item.correctIndex">
                  {{ picked()[i] === item.correctIndex ? 'Correct ✓' : 'Not quite' }} — {{ item.explanation }}
                </p>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .quiz-score {
      margin-top: 20px;
      font-size: 0.9375rem;
      color: var(--accent);
    }

    .quiz-grid {
      margin-top: 24px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    @media (min-width: 900px) {
      .quiz-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .quiz-card {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px;
    }

    .quiz-question {
      font-size: 0.9375rem;
      color: var(--text);
      font-weight: 600;
    }

    .option-list {
      margin-top: 12px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .option-btn {
      text-align: left;
      padding: 9px 12px;
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

    .quiz-feedback {
      margin-top: 12px;
      font-size: 0.8125rem;
      color: var(--danger);
      line-height: 1.55;
    }

    .quiz-feedback.is-right {
      color: var(--accent-2);
    }
  `,
})
export class KnowledgeQuiz {
  protected readonly questions = QUESTIONS;
  protected readonly picked = signal<(number | undefined)[]>(QUESTIONS.map(() => undefined));

  protected readonly score = computed(
    () => this.picked().filter((p, i) => p === QUESTIONS[i].correctIndex).length,
  );

  choose(questionIndex: number, optionIndex: number): void {
    this.picked.update((p) => {
      const next = [...p];
      next[questionIndex] = optionIndex;
      return next;
    });
  }
}
