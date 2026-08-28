import { Component, computed, signal } from '@angular/core';

interface QuizQuestion {
  abbrev: string;
  options: string[];
  correct: string;
}

const QUESTIONS: QuizQuestion[] = [
  { abbrev: 'fn', options: ['firstName', 'fullName', 'fieldName'], correct: 'firstName' },
  { abbrev: 'ln', options: ['lastName', 'linkName', 'listName'], correct: 'lastName' },
  { abbrev: 'desc', options: ['descending', 'description', 'descriptor'], correct: 'description' },
  { abbrev: 'crtDt', options: ['currentDate', 'createdAt', 'certifiedDate'], correct: 'createdAt' },
];

@Component({
  selector: 'app-consistency-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="consistency">
      <div class="container">
        <p class="lab-index">REST API / 23 — CONSISTENCY</p>
        <h2 class="lab-title">The same concept should never wear two different names.</h2>
        <p class="lab-lede">Naming rules matter less than picking one set of rules and applying it everywhere in your API.</p>

        <div class="lab-panel two-col">
          <div class="card card-bad">
            <p class="lab-node">BAD — INCONSISTENT NAMING</p>
            <p class="lab-code mono"><span class="tok-method">GET</span> <span class="tok-key">/users</span></p>
            <p class="lab-code">{{ '{' }}
  <span class="tok-key">"user_id"</span>: 1,
  <span class="tok-key">"usrName"</span>: <span class="tok-status-ok">"john"</span>,
  <span class="tok-key">"desc"</span>: <span class="tok-status-ok">"…"</span>
{{ '}' }}</p>
            <p class="lab-code mono" style="margin-top: 14px;"><span class="tok-method">GET</span> <span class="tok-key">/orders/10</span></p>
            <p class="lab-code">{{ '{' }}
  <span class="tok-key">"id"</span>: 10,
  <span class="tok-key">"userId"</span>: 1,
  <span class="tok-key">"description"</span>: <span class="tok-status-ok">"…"</span>
{{ '}' }}</p>
            <p class="lab-note lab-note-warn">Same three concepts — identifier, name, description — three different naming schemes across two endpoints.</p>
          </div>

          <div class="card card-good">
            <p class="lab-node">GOOD — CONSISTENT NAMING</p>
            <p class="lab-code mono"><span class="tok-method">GET</span> <span class="tok-key">/users</span></p>
            <p class="lab-code">{{ '{' }}
  <span class="tok-key">"userId"</span>: 1,
  <span class="tok-key">"userName"</span>: <span class="tok-status-ok">"john"</span>,
  <span class="tok-key">"description"</span>: <span class="tok-status-ok">"…"</span>
{{ '}' }}</p>
            <p class="lab-code mono" style="margin-top: 14px;"><span class="tok-method">GET</span> <span class="tok-key">/orders/10</span></p>
            <p class="lab-code">{{ '{' }}
  <span class="tok-key">"id"</span>: 10,
  <span class="tok-key">"userId"</span>: 1,
  <span class="tok-key">"description"</span>: <span class="tok-status-ok">"…"</span>
{{ '}' }}</p>
            <p class="lab-note">Same field names, same casing, same shape for the same concept — every endpoint reads like it was designed by the same team.</p>
          </div>
        </div>

        <div class="lab-panel">
          <p class="lab-node">TRY IT — PICK THE CLEARER FULL NAME</p>

          @if (!finished()) {
            <p class="quiz-progress mono">Question {{ index() + 1 }} / {{ questions.length }}</p>
            <p class="quiz-question mono">Abbreviation: <span class="tok-key">{{ current().abbrev }}</span></p>
            <div class="lab-btn-row">
              @for (opt of current().options; track opt) {
                <button
                  type="button"
                  class="lab-btn"
                  [class.is-active]="picked() === opt"
                  [class.lab-btn-primary]="picked() !== null && opt === current().correct"
                  [class.lab-btn-danger]="picked() === opt && opt !== current().correct"
                  [disabled]="picked() !== null"
                  (click)="choose(opt)"
                >
                  {{ opt }}
                </button>
              }
            </div>
            @if (picked() !== null) {
              <p class="lab-note">{{ picked() === current().correct ? '✓ Correct.' : '✕ Not quite — ' + current().correct + ' is the clearer full name.' }}</p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-primary" (click)="next()">{{ index() < questions.length - 1 ? 'Next →' : 'See score' }}</button>
              </div>
            }
          } @else {
            <p class="quiz-score mono">{{ score() }} / {{ questions.length }} correct</p>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn" (click)="restart()">↻ Retry</button>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .two-col { display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 768px) { .two-col { grid-template-columns: 1fr 1fr; } }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
    .card-bad { border-color: color-mix(in srgb, var(--danger) 30%, var(--border)); }
    .card-good { border-color: color-mix(in srgb, var(--accent-2) 30%, var(--border)); }
    .quiz-progress { font-size: 0.75rem; color: var(--text-faint); margin-bottom: 10px; }
    .quiz-question { font-size: 0.9375rem; color: var(--text); font-weight: 600; }
    .quiz-score { font-size: 1.125rem; color: var(--accent-strong); }
  `,
})
export class ConsistencyLab {
  protected readonly questions = QUESTIONS;
  protected readonly index = signal(0);
  protected readonly picked = signal<string | null>(null);
  protected readonly score = signal(0);
  protected readonly finished = signal(false);

  protected readonly current = computed(() => this.questions[this.index()]);

  choose(opt: string): void {
    this.picked.set(opt);
    if (opt === this.current().correct) this.score.update((s) => s + 1);
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
