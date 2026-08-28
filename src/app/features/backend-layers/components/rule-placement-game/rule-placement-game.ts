import { Component, computed, signal } from '@angular/core';

type Layer = 'Middleware' | 'Controller' | 'Service' | 'Repository';

interface Question {
  id: number;
  behavior: string;
  answer: Layer;
  explanation: string;
}

const QUESTIONS: Question[] = [
  { id: 1, behavior: 'Add a correlation ID to every request.', answer: 'Middleware', explanation: 'Cross-cutting, applies to every endpoint regardless of use case.' },
  { id: 2, behavior: 'Parse a route parameter.', answer: 'Controller', explanation: 'Part of binding the HTTP request — the controller/framework layer.' },
  { id: 3, behavior: 'Calculate an order discount.', answer: 'Service', explanation: 'A business/domain calculation.' },
  { id: 4, behavior: 'Execute a database query.', answer: 'Repository', explanation: 'Data access is the repository\'s entire job.' },
  { id: 5, behavior: 'Convert a service result into HTTP 201.', answer: 'Controller', explanation: 'Shaping the HTTP response is a controller responsibility.' },
  { id: 6, behavior: 'Authenticate the request.', answer: 'Middleware', explanation: 'Applies broadly across protected endpoints, before routing decides anything.' },
  { id: 7, behavior: 'Determine whether a user can cancel an order.', answer: 'Service', explanation: 'An authorization/business-policy decision that belongs at the application/domain boundary.' },
  { id: 8, behavior: 'Log every incoming request.', answer: 'Middleware', explanation: 'Cross-cutting, not specific to one use case.' },
  { id: 9, behavior: 'Fetch a user by primary key.', answer: 'Repository', explanation: 'A focused data-access operation.' },
  { id: 10, behavior: 'Send an order confirmation after a successful order creation.', answer: 'Service', explanation: 'Application orchestration — though in event-driven architectures this might instead be a listener reacting to a domain event.' },
];

@Component({
  selector: 'app-rule-placement-game',
  standalone: true,
  template: `
    <section class="lab-section" id="rule-placement">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 12 — "WHERE SHOULD THIS CODE GO?"</p>
        <h2 class="lab-title">Ten behaviors. Four possible homes.</h2>
        <p class="lab-lede">There isn't always exactly one correct answer — but there is usually a best-fit layer, and a reason for it.</p>

        <div class="lab-panel">
          <p class="q-index mono">QUESTION {{ index() + 1 }} / {{ questions.length }}</p>
          <p class="q-behavior">{{ current().behavior }}</p>

          <div class="lab-btn-row">
            @for (l of layerOptions; track l) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="picked() === l"
                [class.lab-btn-primary]="picked() === l && picked() === current().answer"
                [class.lab-btn-danger]="picked() === l && picked() !== current().answer"
                [disabled]="picked() !== null"
                (click)="pick(l)"
              >
                {{ l }}
              </button>
            }
          </div>

          @if (picked()) {
            <p class="lab-note" [class.lab-note-warn]="picked() !== current().answer">
              <strong>{{ picked() === current().answer ? 'Correct.' : 'Best fit: ' + current().answer + '.' }}</strong>
              {{ current().explanation }}
            </p>
            <div class="lab-btn-row">
              @if (index() < questions.length - 1) {
                <button type="button" class="lab-btn" (click)="next()">Next Question →</button>
              } @else {
                <button type="button" class="lab-btn" (click)="restart()">Restart</button>
              }
            </div>
          }

          <p class="score mono">Score: {{ score() }} / {{ answered() }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .q-index { font-size: 0.6875rem; color: var(--text-faint); }
    .q-behavior { margin-top: 10px; font-size: 1.125rem; color: var(--text); font-weight: 600; }
    .score { margin-top: 24px; font-size: 0.75rem; color: var(--text-faint); }
  `,
})
export class RulePlacementGame {
  protected readonly questions = QUESTIONS;
  protected readonly layerOptions: Layer[] = ['Middleware', 'Controller', 'Service', 'Repository'];
  protected readonly index = signal(0);
  protected readonly picked = signal<Layer | null>(null);
  protected readonly score = signal(0);
  protected readonly answered = signal(0);

  protected readonly current = computed(() => this.questions[this.index()]);

  pick(l: Layer): void {
    if (this.picked()) return;
    this.picked.set(l);
    this.answered.update((a) => a + 1);
    if (l === this.current().answer) this.score.update((s) => s + 1);
  }

  next(): void {
    this.index.update((i) => Math.min(i + 1, this.questions.length - 1));
    this.picked.set(null);
  }

  restart(): void {
    this.index.set(0);
    this.picked.set(null);
    this.score.set(0);
    this.answered.set(0);
  }
}
