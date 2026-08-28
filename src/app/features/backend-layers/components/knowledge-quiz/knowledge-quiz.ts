import { Component, computed, signal } from '@angular/core';

interface Question {
  q: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  { q: 'What is the primary responsibility of a controller?', options: ['Being the HTTP boundary: bind input, call the service, shape the response', 'Executing SQL queries'], correctIndex: 0, explanation: 'The controller translates between HTTP and application logic — nothing more.' },
  { q: 'Why should business logic not live inside controllers?', options: ['It couples business rules to a specific HTTP framework, making them hard to test and reuse', 'Controllers cannot contain any logic at all'], correctIndex: 0, explanation: 'A controller tied to business rules can only be exercised through HTTP.' },
  { q: 'What is the purpose of the service layer?', options: ['To coordinate application/business behavior without depending on HTTP', 'To store data permanently'], correctIndex: 0, explanation: 'The service is the business brain — it should be callable from anywhere.' },
  { q: 'What does a repository abstract?', options: ['Persistence/data-access concerns', 'HTTP routing'], correctIndex: 0, explanation: 'A repository hides how data is actually stored and retrieved.' },
  { q: 'What is middleware?', options: ['Cross-cutting logic that runs as part of the request pipeline', 'A synonym for the database'], correctIndex: 0, explanation: 'Middleware handles concerns that apply broadly across endpoints.' },
  { q: 'Why does middleware order matter?', options: ['Because ordering defines behavior — e.g. auth before protected routes, rate limiting before expensive work', 'It never matters, order is arbitrary'], correctIndex: 0, explanation: 'There is no single universal order, but the chosen order still has real consequences.' },
  { q: 'What happens when middleware does not call next()?', options: ['The request stops there — nothing downstream runs', 'The request continues automatically anyway'], correctIndex: 0, explanation: 'Middleware can short-circuit a request entirely, e.g. on failed authentication.' },
  { q: 'What is request context?', options: ['Request-scoped metadata (requestId, identity, trace info) available across a request’s lifecycle', 'A global variable shared by all requests'], correctIndex: 0, explanation: 'Context belongs to exactly one request execution.' },
  { q: 'Why is request context different from global state?', options: ['Context is isolated per request; global state is shared and risks races/leakage across requests', 'They are the same thing'], correctIndex: 0, explanation: 'Global mutable state can leak one request’s data into another’s response.' },
  { q: 'Why should authenticated identity not be taken blindly from the request body?', options: ['A client can put anything in the body — identity should come from a verified authentication mechanism', 'Request bodies are always encrypted so it is safe'], correctIndex: 0, explanation: 'A client-controlled userId field is not proof of identity.' },
  { q: 'What is a correlation ID?', options: ['An identifier that travels across services so one request can be traced end to end', 'A password reset code'], correctIndex: 0, explanation: 'It stitches together logs scattered across distributed services.' },
  { q: 'How can cancellation propagate through request context?', options: ['A cancellation signal travels with the context and downstream work checks/honors it', 'Every operation cancels itself automatically, always'], correctIndex: 0, explanation: 'Cancellation only works where the framework/library actually observes the signal.' },
  { q: 'Why should context not become a "bag of everything"?', options: ['It hides what a function actually depends on, making signatures uninformative', 'Because contexts can only hold one field'], correctIndex: 0, explanation: 'Business data is clearer as explicit parameters; context is for cross-cutting metadata.' },
  { q: 'What is the difference between middleware and service?', options: ['Middleware is cross-cutting pipeline behavior; service is a specific business use case', 'They are interchangeable terms'], correctIndex: 0, explanation: '"Applies to many endpoints" vs "belongs to one use case" is the key question.' },
  { q: 'What is the difference between controller and service?', options: ['Controller handles the HTTP boundary; service executes the business/application use case', 'Controllers and services both talk to the database directly'], correctIndex: 0, explanation: 'Only the controller should know HTTP exists.' },
  { q: 'What is a fat controller?', options: ['A controller that has absorbed business logic, SQL, and cross-cutting concerns it should not own', 'A controller with too many comments'], correctIndex: 0, explanation: 'Symptoms include SQL calls, discount math, and email sending inside the handler.' },
  { q: 'What is a god service?', options: ['A service with dozens of unrelated dependencies doing far more than one use case', 'Any class named "Service"'], correctIndex: 0, explanation: 'Not every class with logic is automatically a well-designed service.' },
  { q: 'Why does separation of concerns improve testability?', options: ['Business logic can be tested against a fake repository without HTTP or a real database', 'It has no effect on testing'], correctIndex: 0, explanation: 'Swapping a real repository for a fake one lets you unit test the service in isolation.' },
  { q: 'Why should repositories avoid business rules?', options: ['Because policy decisions belong to the service/domain layer, not the data-access layer', 'Repositories are incapable of running any logic'], correctIndex: 0, explanation: 'A repository deciding "is this user allowed" mixes concerns that belong elsewhere.' },
  { q: 'Can the exact controller/service/repository structure differ between architectures?', options: ['Yes — these are common boundaries, not a rigid law every backend must follow', 'No, every framework enforces identical layer names'], correctIndex: 0, explanation: 'The chapter teaches these as widely useful boundaries, not universal mandates.' },
  { q: 'Why should HTTP status codes not leak into business logic?', options: ['Business logic should be reusable outside an HTTP context and shouldn’t depend on transport details', 'HTTP status codes are required inputs to every business rule'], correctIndex: 0, explanation: 'A service deciding "insufficient balance" doesn’t need to know what a 422 is.' },
  { q: 'Where should cross-cutting concerns usually live?', options: ['Middleware', 'Repository'], correctIndex: 0, explanation: 'Logging, auth, and rate limiting apply broadly, which is exactly what middleware is for.' },
  { q: 'What happens when a repository fails?', options: ['The exception propagates upward through the service and controller to centralized error handling', 'The request silently returns an empty success response'], correctIndex: 0, explanation: 'Errors travel back up the same layers they were called through.' },
  { q: 'How does an error travel back toward centralized error handling?', options: ['It propagates from repository → service → controller → error-handling middleware', 'It is written directly to the database'], correctIndex: 0, explanation: 'This avoids every controller needing its own try/catch/response-formatting logic.' },
  { q: 'Why is dependency inversion useful for testing?', options: ['Depending on an interface lets a fake implementation stand in for the real one in tests', 'It makes code run faster in production'], correctIndex: 0, explanation: 'A service depending on IRepository can be tested against an in-memory fake.' },
];

@Component({
  selector: 'app-knowledge-quiz',
  standalone: true,
  template: `
    <section class="lab-section" id="quiz">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 28 — KNOWLEDGE CHECK</p>
        <h2 class="lab-title">Twenty-five questions. Every answer explains itself.</h2>

        @if (!finished()) {
          <div class="lab-panel quiz-panel">
            <p class="quiz-progress mono">Question {{ index() + 1 }} / {{ questions.length }}</p>
            <p class="quiz-question">{{ current().q }}</p>
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
          <div class="lab-panel quiz-panel">
            <p class="quiz-score mono">{{ score() }} / {{ questions.length }} correct</p>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn" (click)="restart()">↻ Retake the quiz</button>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .quiz-panel { margin-top: 24px; }
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
export class KnowledgeQuiz {
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
