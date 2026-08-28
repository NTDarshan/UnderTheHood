import { Component, computed, signal } from '@angular/core';

interface Question {
  q: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

const QUESTIONS: Question[] = [
  { q: 'Why can frontend validation never replace backend validation?', options: ['A client can always bypass the frontend and call the API directly', 'Frontend validation is always buggy'], correctIndex: 0, explanation: 'Anything running purely in the browser can be skipped or edited by whoever controls the request.' },
  { q: 'What is the difference between validation and transformation?', options: ['They are the same thing', 'Transformation changes representation; validation judges acceptability'], correctIndex: 1, explanation: 'Transformation asks "can I convert this?" — validation asks "is this acceptable?"' },
  { q: 'What is syntactic validation?', options: ['Does the value follow the expected format?', 'Does the value make business sense?'], correctIndex: 0, explanation: 'Syntactic validation checks format/shape, not meaning.' },
  { q: 'What is semantic validation?', options: ['Checking string length', 'Checking whether a syntactically valid value makes sense in context'], correctIndex: 1, explanation: 'A future birth date can be a perfectly formatted date and still be semantically wrong.' },
  { q: 'What is type validation?', options: ['Checking whether the value has the expected type or shape', 'Checking HTTP headers'], correctIndex: 0, explanation: 'Type validation confirms the data matches what the application expects to work with.' },
  { q: 'What is cross-field validation?', options: ['A rule that depends on more than one field at once', 'A rule that only checks one field'], correctIndex: 0, explanation: '"partnerName required if married" can only be evaluated by looking at both fields together.' },
  { q: 'Why should unexpected input generally be rejected instead of silently defaulted?', options: ['Silent defaulting can change meaning without telling anyone', 'Rejection is always faster'], correctIndex: 0, explanation: '"abc" silently becoming 0 can produce a very different, incorrect outcome than the client intended.' },
  { q: 'What is model/input binding?', options: ['Mapping incoming request data into the application\'s expected structure', 'The same thing as validation'], correctIndex: 0, explanation: 'Binding answers "how do I map this data?" — validation separately asks if the mapped data is acceptable.' },
  { q: 'What is the difference between optional and nullable?', options: ['They always mean exactly the same thing', 'Optional often means "may be absent"; nullable often means "may be explicitly null"'], correctIndex: 1, explanation: 'The application must define what each representation means — they are not automatically equivalent.' },
  { q: 'Why are allowlists useful for dynamic fields like sortBy?', options: ['They accept only known-safe values instead of trying to enumerate every bad one', 'They make the API faster'], correctIndex: 0, explanation: 'Trying to deny-list every dangerous value is an endless, losing game — allowlisting flips that around.' },
  { q: 'What is overposting?', options: ['A client submitting properties beyond what the operation is meant to accept', 'A rate-limiting technique'], correctIndex: 0, explanation: 'Overposting/mass assignment happens when unexpected fields (like "role") get silently accepted.' },
  { q: 'Why should API request DTOs often be separate from persistence models?', options: ['To avoid exposing or allowing writes to internal-only fields', 'DTOs are required by HTTP'], correctIndex: 0, explanation: 'A dedicated DTO defines exactly what the client can send — nothing more.' },
  { q: 'What is the difference between validation and authorization?', options: ['They are the same check', 'Validation asks if input is acceptable; authorization asks if this identity may perform the action'], correctIndex: 1, explanation: 'A request can be authorized and still contain invalid data, or valid and still not be authorized.' },
  { q: 'What is the difference between input validation and business rules?', options: ['Input validation checks structural acceptability; business rules check domain-level correctness', 'Business rules always run first'], correctIndex: 0, explanation: '"amount is numeric" is input validation; "balance can\'t go negative" is a business rule.' },
  { q: 'Why should database constraints still exist even when API validation exists?', options: ['They protect data integrity as a deeper safety net, including from paths that bypass the API', 'They replace the need for API validation'], correctIndex: 0, explanation: 'Constraints and API validation are complementary layers, not substitutes for each other.' },
  { q: 'Why can a syntactically valid request still fail later?', options: ["Syntax says nothing about semantics, business rules, or current domain state", 'It can\'t — valid syntax means the request will succeed'], correctIndex: 0, explanation: 'age: 400 or a withdrawal exceeding balance are both syntactically fine and still fail.' },
  { q: 'What is the difference between 400 and 422?', options: ['400 commonly signals a malformed/invalid request; some APIs use 422 specifically for semantic failures', 'They are identical in every API'], correctIndex: 0, explanation: 'Neither is mandatory — the important thing is choosing one convention deliberately and staying consistent.' },
  { q: 'Why should validation failures be structured?', options: ['So the client knows exactly which field failed and why', 'Structure has no real benefit'], correctIndex: 0, explanation: 'A field-by-field error body lets the client (or its UI) act precisely instead of guessing.' },
  { q: 'Why should validation happen before expensive database operations where possible?', options: ['Cheap deterministic checks can reject bad input before costly work runs', 'Database calls are always instantaneous'], correctIndex: 0, explanation: 'Rejecting early avoids unnecessary DB round-trips or external calls for input that was never going to succeed.' },
  { q: 'Can a request be authenticated, authorized, and still invalid?', options: ['No — passing those two guarantees valid data', 'Yes — identity and permission say nothing about the data itself'], correctIndex: 1, explanation: 'This is one of the chapter\'s central lessons: three separate gates, each answering a different question.' },
];

@Component({
  selector: 'app-knowledge-quiz',
  standalone: true,
  template: `
    <section class="lab-section" id="quiz">
      <div class="container">
        <p class="lab-index">VALIDATION / 47 — KNOWLEDGE CHECK</p>
        <h2 class="lab-title">Twenty questions. Every answer explains itself.</h2>

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
