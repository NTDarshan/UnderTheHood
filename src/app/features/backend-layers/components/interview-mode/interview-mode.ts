import { Component, OnDestroy, computed, signal } from '@angular/core';

interface InterviewQ {
  question: string;
  answerPoints: string[];
}

const QUESTIONS: InterviewQ[] = [
  {
    question: 'Explain the request lifecycle in a backend application.',
    answerPoints: [
      'Request arrives',
      'Middleware pipeline (logging, CORS, auth, rate limiting)',
      'Routing selects the handler',
      'Controller/handler binds the request',
      'Service/application logic executes the use case',
      'Repository/data access reads or writes',
      'Database executes the operation',
      'Response travels back up',
      'Middleware/error handling may participate on the way out',
      'Request context carries request-scoped metadata the whole way',
    ],
  },
  {
    question: "Why shouldn't a controller contain business logic?",
    answerPoints: [
      'It couples business rules to one specific transport (HTTP)',
      'It becomes untestable without spinning up a server',
      'It cannot be reused from a queue worker, CLI, or another controller',
    ],
  },
  {
    question: 'What is request context?',
    answerPoints: [
      'Request-scoped metadata: requestId, traceId, authenticated identity, cancellation',
      'Available to code participating in one request without threading it through every signature',
      'Never shared or leaked between requests',
    ],
  },
  {
    question: 'Middleware vs service — what is the difference?',
    answerPoints: [
      'Middleware: cross-cutting, applies broadly across many endpoints',
      'Service: a specific business/application use case',
      'Ask: "does this apply everywhere, or is it one use case?"',
    ],
  },
  {
    question: 'Repository vs service — what is the difference?',
    answerPoints: [
      'Repository: persistence/data-access mechanics only',
      'Service: business rules and orchestration',
      'A repository should never decide policy; a service should never write SQL',
    ],
  },
];

@Component({
  selector: 'app-interview-mode',
  standalone: true,
  template: `
    <section class="lab-section" id="interview-mode">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 29 — INTERVIEW MODE</p>
        <h2 class="lab-title">Could you explain this out loud, under pressure?</h2>

        <div class="lab-panel">
          <p class="interviewer mono">INTERVIEWER</p>
          <p class="q-text">{{ current().question }}</p>

          @if (!revealed()) {
            <div class="timer-row">
              <p class="timer mono">{{ seconds() }}s</p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-primary" (click)="reveal()">Reveal Ideal Answer</button>
              </div>
            </div>
          } @else {
            <div class="answer-box">
              <p class="answer-title mono">IDEAL ANSWER STRUCTURE</p>
              <ol class="answer-list">
                @for (p of current().answerPoints; track p) {
                  <li>{{ p }}</li>
                }
              </ol>
            </div>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [disabled]="index() === 0" (click)="prev()">← Previous</button>
            <button type="button" class="lab-btn" [disabled]="index() === questions.length - 1" (click)="next()">Next Question →</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .interviewer { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .q-text { margin-top: 8px; font-size: 1.125rem; color: var(--text); font-weight: 600; }

    .timer-row { margin-top: 20px; display: flex; align-items: center; gap: 20px; }
    .timer { font-size: 1.5rem; color: var(--accent-strong); }

    .answer-box { margin-top: 20px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .answer-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 10px; }
    .answer-list { display: flex; flex-direction: column; gap: 6px; counter-reset: pt; list-style: decimal; padding-left: 20px; }
    .answer-list li { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class InterviewMode implements OnDestroy {
  protected readonly questions = QUESTIONS;
  protected readonly index = signal(0);
  protected readonly revealed = signal(false);
  protected readonly seconds = signal(60);
  protected readonly current = computed(() => this.questions[this.index()]);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.startTimer();
  }

  private startTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.seconds.set(60);
    this.timer = setInterval(() => {
      this.seconds.update((s) => {
        if (s <= 1) {
          this.reveal();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  reveal(): void {
    this.revealed.set(true);
    if (this.timer) clearInterval(this.timer);
  }

  next(): void {
    this.index.update((i) => Math.min(i + 1, this.questions.length - 1));
    this.revealed.set(false);
    this.startTimer();
  }

  prev(): void {
    this.index.update((i) => Math.max(i - 1, 0));
    this.revealed.set(false);
    this.startTimer();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }
}
