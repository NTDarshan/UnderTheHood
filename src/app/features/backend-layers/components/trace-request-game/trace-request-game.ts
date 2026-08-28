import { Component, computed, signal } from '@angular/core';

interface Step {
  id: number;
  prompt: string;
  options: string[];
  answer: string;
  explanation: string;
}

const STEPS: Step[] = [
  { id: 1, prompt: 'GET /users/42 arrives. Where does it go next?', options: ['Repository', 'Middleware', 'Database'], answer: 'Middleware', explanation: 'Every request passes through the middleware/routing pipeline first.' },
  { id: 2, prompt: 'Middleware passed. Who matches this to a handler?', options: ['Router', 'Service', 'Controller'], answer: 'Router', explanation: 'Routing matches method + path to the responsible handler.' },
  { id: 3, prompt: 'Router matched an endpoint. Who handles the HTTP request itself?', options: ['Repository', 'Controller', 'Database'], answer: 'Controller', explanation: 'The controller is the HTTP boundary.' },
  { id: 4, prompt: 'Controller needs user data. Where should data access happen?', options: ['Controller directly', 'Repository', 'Middleware'], answer: 'Repository', explanation: 'Data access is a repository/data-access-abstraction responsibility, not the controller’s.' },
  { id: 5, prompt: 'Repository returns a row. Where does business meaning get applied, if any?', options: ['Service', 'Database', 'Router'], answer: 'Service', explanation: 'The service layer applies business rules to raw data before it becomes a result.' },
  { id: 6, prompt: 'Everything succeeded. Who shapes the final HTTP response?', options: ['Repository', 'Database', 'Controller'], answer: 'Controller', explanation: 'The controller converts the result into an HTTP response and sends it back.' },
];

@Component({
  selector: 'app-trace-request-game',
  standalone: true,
  template: `
    <section class="lab-section" id="trace-game">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 27 — "TRACE THIS REQUEST"</p>
        <h2 class="lab-title">GET /users/42 — you decide where it goes at every hop.</h2>

        <div class="lab-panel">
          <p class="progress mono">STEP {{ index() + 1 }} / {{ steps.length }}</p>
          <p class="prompt">{{ current().prompt }}</p>

          <div class="lab-btn-row">
            @for (opt of current().options; track opt) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="picked() === opt"
                [class.lab-btn-primary]="picked() === opt && picked() === current().answer"
                [class.lab-btn-danger]="picked() === opt && picked() !== current().answer"
                [disabled]="picked() !== null"
                (click)="pick(opt)"
              >
                {{ opt }}
              </button>
            }
          </div>

          @if (picked()) {
            <p class="lab-note" [class.lab-note-warn]="picked() !== current().answer">
              <strong>{{ picked() === current().answer ? 'Correct.' : 'Answer: ' + current().answer + '.' }}</strong> {{ current().explanation }}
            </p>
            <div class="lab-btn-row">
              @if (index() < steps.length - 1) {
                <button type="button" class="lab-btn" (click)="next()">Continue →</button>
              } @else {
                <button type="button" class="lab-btn" (click)="restart()">Trace Another Request</button>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .progress { font-size: 0.6875rem; color: var(--text-faint); }
    .prompt { margin-top: 10px; font-size: 1.0625rem; color: var(--text); font-weight: 600; }
  `,
})
export class TraceRequestGame {
  protected readonly steps = STEPS;
  protected readonly index = signal(0);
  protected readonly picked = signal<string | null>(null);
  protected readonly current = computed(() => this.steps[this.index()]);

  pick(opt: string): void {
    if (this.picked()) return;
    this.picked.set(opt);
  }

  next(): void {
    this.index.update((i) => Math.min(i + 1, this.steps.length - 1));
    this.picked.set(null);
  }

  restart(): void {
    this.index.set(0);
    this.picked.set(null);
  }
}
