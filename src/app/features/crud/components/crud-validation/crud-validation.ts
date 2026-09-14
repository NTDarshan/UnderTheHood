import { Component, OnDestroy, signal } from '@angular/core';

type ScenarioId = 'empty-title' | 'negative-price' | 'missing-author';
type PipelineStage = 'idle' | 'request' | 'validation' | 'rejected' | 'business-rules' | 'persistence';

interface Scenario {
  id: ScenarioId;
  label: string;
  book: { title: string; author: string; price: string };
  invalidFields: ('title' | 'author' | 'price')[];
  status: string;
  errorField: string;
  errorMessage: string;
  failsAt: 'validation';
}

const SCENARIOS: Scenario[] = [
  {
    id: 'empty-title',
    label: 'Try: empty title',
    book: { title: '', author: 'Frank Herbert', price: '12.99' },
    invalidFields: ['title'],
    status: '400 Bad Request',
    errorField: 'title',
    errorMessage: '"title" is required',
    failsAt: 'validation',
  },
  {
    id: 'negative-price',
    label: 'Try: price = -500',
    book: { title: 'Dune', author: 'Frank Herbert', price: '-500' },
    invalidFields: ['price'],
    status: '400 Bad Request',
    errorField: 'price',
    errorMessage: '"price" must be greater than 0',
    failsAt: 'validation',
  },
  {
    id: 'missing-author',
    label: 'Try: missing author',
    book: { title: 'Dune', author: '', price: '12.99' },
    invalidFields: ['author'],
    status: '400 Bad Request',
    errorField: 'author',
    errorMessage: '"author" is required',
    failsAt: 'validation',
  },
];

const PIPELINE_STEPS: { id: PipelineStage; label: string }[] = [
  { id: 'request', label: 'Request' },
  { id: 'validation', label: 'Validation' },
  { id: 'business-rules', label: 'Business Rules' },
  { id: 'persistence', label: 'Persistence' },
];

@Component({
  selector: 'app-crud-validation',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="crud-validation">
      <div class="container">
        <p class="lab-index mono">11 — VALIDATION</p>
        <h2 class="lab-title">Create does not mean "write whatever arrives"</h2>
        <p class="lab-lede">
          POST /api/books looks like a straight line to the database. It isn't. Every write passes through
          validation and business rules first — pick a scenario below and watch a bad request get stopped
          before it ever reaches persistence.
        </p>

        <div class="lab-panel">
          <div class="pipeline mono" aria-hidden="true">
            @for (step of pipelineSteps; track step.id; let last = $last) {
              <span class="pipeline-step" [class.is-active]="stage() === step.id" [class.is-passed]="passedStage(step.id)" [class.is-blocked]="stage() === 'rejected' && step.id === 'validation'">
                {{ step.label }}
              </span>
              @if (!last) {
                <span class="pipeline-arrow" [class.is-cut]="stage() === 'rejected' && step.id === 'validation'">&darr;</span>
              }
            }
          </div>

          <div class="try-form" [class.is-shaking]="shake()">
            <div class="lab-field" [class.has-error]="erroredField() === 'title'">
              <label for="cv-title">title</label>
              <input id="cv-title" type="text" readonly [value]="activeBook().title" placeholder="(empty)" />
              @if (erroredField() === 'title') {
                <p class="field-error mono">{{ activeScenario()?.errorMessage }}</p>
              }
            </div>
            <div class="lab-field" [class.has-error]="erroredField() === 'author'">
              <label for="cv-author">author</label>
              <input id="cv-author" type="text" readonly [value]="activeBook().author" placeholder="(empty)" />
              @if (erroredField() === 'author') {
                <p class="field-error mono">{{ activeScenario()?.errorMessage }}</p>
              }
            </div>
            <div class="lab-field" [class.has-error]="erroredField() === 'price'">
              <label for="cv-price">price</label>
              <input id="cv-price" type="text" readonly [value]="activeBook().price" />
              @if (erroredField() === 'price') {
                <p class="field-error mono">{{ activeScenario()?.errorMessage }}</p>
              }
            </div>
          </div>

          <div class="lab-btn-row">
            @for (s of scenarios; track s.id) {
              <button type="button" class="lab-btn" [class.is-active]="activeId() === s.id" [disabled]="stage() !== 'idle' && stage() !== 'rejected'" (click)="run(s.id)">{{ s.label }}</button>
            }
          </div>

          @if (activeScenario(); as sc) {
            <div class="result-card">
              @switch (stage()) {
                @case ('request') {
                  <p class="lab-code"><span class="tok-method">POST</span> <span class="tok-key">/api/books</span></p>
                }
                @case ('validation') {
                  <p class="result-status mono">checking request shape&hellip;</p>
                }
                @case ('rejected') {
                  <p class="lab-code">
                    <span class="tok-method">POST</span> <span class="tok-key">/api/books</span>
                    <br /><span class="tok-dim">&darr;</span>
                    <br /><span class="tok-status-err">{{ sc.status }}</span>
                    <br /><span class="tok-dim">{{ '{ "field": "' + sc.errorField + '", "message": "' + sc.errorMessage + '" }' }}</span>
                  </p>
                  <p class="result-note">Rejected at the validation stage. It never reached business rules or persistence — the database was never touched.</p>
                }
                @default {}
              }
            </div>
          }

          <p class="lab-note">
            CRUD names the operation. It says nothing about what makes a Book <em>valid</em> — that's a separate
            job, sitting between the request and the write, and it runs on every Create and Update, not just this demo.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .cr-scene {
      --cr-accent: var(--accent);
      --cr-cyan: var(--accent-2);
      --cr-violet: #a78bfa;
      --cr-success: #4ade80;
      --cr-warning: #fbbf24;
      --cr-danger: var(--danger);
    }

    .pipeline { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 0.75rem; }
    .pipeline-step { padding: 6px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); color: var(--text-faint); transition: color 0.2s ease, border-color 0.2s ease, background 0.2s ease; }
    .pipeline-step.is-passed { color: var(--cr-cyan); border-color: var(--cr-cyan); }
    .pipeline-step.is-active { color: var(--cr-accent); border-color: var(--cr-accent); background: color-mix(in srgb, var(--cr-accent) 12%, var(--surface)); }
    .pipeline-step.is-blocked { color: var(--cr-danger); border-color: var(--cr-danger); background: color-mix(in srgb, var(--cr-danger) 12%, var(--surface)); }
    .pipeline-arrow { color: var(--text-faint); }
    .pipeline-arrow.is-cut { color: var(--cr-danger); }

    .try-form { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 14px; max-width: 420px; }
    @media (min-width: 560px) { .try-form { grid-template-columns: repeat(3, 1fr); } }

    .try-form .lab-field input { cursor: default; }
    .try-form .lab-field.has-error input { border-color: var(--cr-danger); }
    .field-error { margin-top: 2px; font-size: 0.6875rem; color: var(--cr-danger); }

    .try-form.is-shaking { animation: cv-shake 0.4s ease; }
    @keyframes cv-shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-3px); }
      80% { transform: translateX(2px); }
    }
    @media (prefers-reduced-motion: reduce) {
      .try-form.is-shaking { animation: none; }
    }

    .result-card { margin-top: 20px; }
    .result-status { font-size: 0.8125rem; color: var(--text-faint); }
    .result-note { margin-top: 10px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }
  `,
})
export class CrudValidation implements OnDestroy {
  protected readonly scenarios = SCENARIOS;
  protected readonly pipelineSteps = PIPELINE_STEPS;

  protected readonly activeId = signal<ScenarioId | null>(null);
  protected readonly stage = signal<PipelineStage>('idle');
  protected readonly shake = signal(false);

  private timers: ReturnType<typeof setTimeout>[] = [];

  private readonly defaultBook = { title: 'Dune', author: 'Frank Herbert', price: '12.99' };

  protected activeScenario(): Scenario | undefined {
    const id = this.activeId();
    return id ? this.scenarios.find((s) => s.id === id) : undefined;
  }

  protected activeBook(): { title: string; author: string; price: string } {
    return this.activeScenario()?.book ?? this.defaultBook;
  }

  protected erroredField(): 'title' | 'author' | 'price' | null {
    if (this.stage() !== 'rejected') return null;
    const sc = this.activeScenario();
    return sc ? sc.invalidFields[0] : null;
  }

  protected passedStage(id: PipelineStage): boolean {
    const order: PipelineStage[] = ['request', 'validation', 'business-rules', 'persistence'];
    const current = this.stage();
    if (current !== 'request' && current !== 'validation' && current !== 'business-rules' && current !== 'persistence') return false;
    return order.indexOf(id) < order.indexOf(current);
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected run(id: ScenarioId): void {
    if (this.stage() !== 'idle' && this.stage() !== 'rejected') return;
    this.timers.forEach(clearTimeout);
    this.timers = [];

    this.activeId.set(id);
    this.shake.set(false);
    this.stage.set('request');

    this.timers.push(setTimeout(() => this.stage.set('validation'), 400));
    this.timers.push(
      setTimeout(() => {
        this.stage.set('rejected');
        this.shake.set(true);
        this.timers.push(setTimeout(() => this.shake.set(false), 400));
      }, 900),
    );
  }
}
