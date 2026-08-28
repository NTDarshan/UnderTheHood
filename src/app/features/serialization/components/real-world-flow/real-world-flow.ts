import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type Stage =
  | 'object'
  | 'serialize'
  | 'json'
  | 'post'
  | 'http'
  | 'server'
  | 'deserialize'
  | 'validate'
  | 'logic'
  | 'database'
  | 'response'
  | 'serialize2'
  | 'json2'
  | 'client'
  | 'deserialize2';

const STAGES: { id: Stage; label: string }[] = [
  { id: 'object', label: 'Order Object' },
  { id: 'serialize', label: 'Serialize' },
  { id: 'json', label: 'JSON' },
  { id: 'post', label: 'POST /orders' },
  { id: 'http', label: 'HTTP' },
  { id: 'server', label: 'Server' },
  { id: 'deserialize', label: 'Deserialize' },
  { id: 'validate', label: 'Validate' },
  { id: 'logic', label: 'Business Logic' },
  { id: 'database', label: 'Database' },
  { id: 'response', label: 'Server Response' },
  { id: 'serialize2', label: 'Serialize' },
  { id: 'json2', label: 'JSON' },
  { id: 'client', label: 'Client' },
  { id: 'deserialize2', label: 'Deserialize' },
];

@Component({
  selector: 'app-real-world-flow',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="lab-section" id="real-world">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 19 — A REAL-WORLD API EXAMPLE</p>
        <h2 class="lab-title">"Create Order," end to end.</h2>
        <p class="lab-lede">
          This connects everything so far: the previous <a class="inline-link" routerLink="/explore/routing">Routing</a>
          chapter answered "which handler receives this?" — this chapter answers "what shape is the data
          inside it?"
        </p>

        <div class="scenario-block lab-panel">
          <p class="scenario-title mono">User clicks "Create Order"</p>
          <pre class="scenario-code mono">Order {{ '{' }}
  productId: 123,
  quantity: 2,
  address: {{ '{' }} city: "Bangalore" {{ '}' }}
{{ '}' }}</pre>
        </div>

        <div class="rw-pipeline mono">
          @for (s of stages; track s.id) {
            <div class="rw-node" [class.is-active]="stage() === s.id" [class.is-past]="isPast(s.id)">
              {{ s.label }}
            </div>
          }
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="running()">
            {{ running() ? 'Running…' : 'Run the full round-trip' }}
          </button>
        </div>

        <div class="bridge-note mono">
          HTTP Request
          <span class="bridge-sub">├── Method</span>
          <span class="bridge-sub">├── Route <span class="bridge-tag">(Routing chapter)</span></span>
          <span class="bridge-sub">├── Headers</span>
          <span class="bridge-sub">└── Body <span class="bridge-tag">(Serialization — this chapter)</span></span>
        </div>
      </div>
    </section>
  `,
  styles: `
    .inline-link {
      color: var(--accent-2);
      text-decoration: underline dotted;
      text-underline-offset: 3px;
    }

    .scenario-block {
      margin-top: 28px;
      max-width: 340px;
    }

    .scenario-title {
      font-size: 0.75rem;
      color: var(--accent-2);
      margin-bottom: 10px;
    }

    .scenario-code {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.7;
      white-space: pre-wrap;
    }

    .rw-pipeline {
      margin-top: 28px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .rw-node {
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text-faint);
      font-size: 0.6875rem;
      transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
    }

    .rw-node.is-past {
      border-color: var(--accent-2-dim);
      color: var(--accent-2);
    }

    .rw-node.is-active {
      border-color: var(--accent);
      color: var(--text);
      background: color-mix(in srgb, var(--accent) 14%, var(--surface-raised));
      box-shadow: 0 0 16px var(--glow-accent);
    }

    .bridge-note {
      margin-top: 32px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.8125rem;
      color: var(--text);
    }

    .bridge-sub {
      color: var(--text-muted);
      padding-left: 8px;
    }

    .bridge-tag {
      color: var(--text-faint);
    }
  `,
})
export class RealWorldFlow {
  protected readonly stages = STAGES;
  protected readonly stage = signal<Stage>('object');
  protected readonly running = signal(false);

  isPast(id: Stage): boolean {
    return this.stages.findIndex((s) => s.id === id) < this.stages.findIndex((s) => s.id === this.stage());
  }

  async run(): Promise<void> {
    if (this.running()) return;
    this.running.set(true);
    for (const s of this.stages) {
      this.stage.set(s.id);
      await wait(260);
    }
    this.running.set(false);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
