import { Component, signal } from '@angular/core';

type Stage = 'idle' | 'client' | 'serialize' | 'json' | 'request' | 'network' | 'server' | 'deserialize' | 'server-object' | 'logic' | 'response';

const STAGES: Stage[] = ['client', 'serialize', 'json', 'request', 'network', 'server', 'deserialize', 'server-object', 'logic', 'response'];

interface InspectorPart {
  id: string;
  label: string;
  explanation: string;
}

const PARTS: InspectorPart[] = [
  { id: 'method', label: 'POST', explanation: 'The HTTP method — what kind of action this request represents.' },
  { id: 'route', label: '/users', explanation: 'The route/resource this request targets — resolved by the routing layer covered in the previous chapter.' },
  { id: 'content-type', label: 'Content-Type: application/json', explanation: 'Tells the receiver what representation the body uses, so it knows how to deserialize it.' },
  { id: 'body', label: '{ "name": "Alice", "age": 30 }', explanation: 'The serialized representation of the request data — the payload this whole chapter is about.' },
];

@Component({
  selector: 'app-http-request-inspector',
  standalone: true,
  template: `
    <section class="lab-section" id="http-flow">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 10 — A REAL HTTP FLOW</p>
        <h2 class="lab-title">Follow one object through an entire request.</h2>
        <p class="lab-lede">Client creates an object. Watch what it becomes by the time the server can use it.</p>

        <div class="pipeline mono">
          @for (s of allStages; track s) {
            <div class="pipeline-node" [class.is-active]="stage() === s" [class.is-past]="isPast(s)">
              {{ labelFor(s) }}
            </div>
          }
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="running()">
            {{ running() ? 'Running…' : 'Send Request' }}
          </button>
          <button type="button" class="lab-btn" (click)="reset()" [disabled]="running()">Reset</button>
        </div>
      </div>
    </section>

    <section class="lab-section" id="content-type">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 11 — REQUEST INSPECTOR &amp; CONTENT-TYPE</p>
        <h2 class="lab-title">How does the server know what it received?</h2>
        <p class="lab-lede">
          Click any line of this request. This is the same request/route pairing from the Routing chapter —
          routing decided <em>where</em> it goes, this chapter is about <em>what's inside it</em>.
        </p>

        <div class="request-block mono">
          <p class="req-line">
            <span class="req-token" [class.is-active]="selected() === 'method'" (click)="selected.set('method')">POST</span>
            <span class="req-plain"> /users HTTP/1.1</span>
          </p>
          <p class="req-line req-header">Host: api.example.com</p>
          <p class="req-line req-header">
            <span class="req-token" [class.is-active]="selected() === 'content-type'" (click)="selected.set('content-type')">Content-Type: application/json</span>
          </p>
          <p class="req-line req-body">
            <span class="req-token" [class.is-active]="selected() === 'body'" (click)="selected.set('body')">{{ '{' }} "name": "Alice", "age": 30 {{ '}' }}</span>
          </p>
        </div>

        <div class="request-detail lab-panel">
          <p class="detail-label mono">{{ activeLabel() }}</p>
          <p class="detail-text">{{ activeExplanation() }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .pipeline {
      margin-top: 32px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .pipeline-node {
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text-faint);
      font-size: 0.6875rem;
      transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
    }

    .pipeline-node.is-past {
      border-color: var(--accent-2-dim);
      color: var(--accent-2);
    }

    .pipeline-node.is-active {
      border-color: var(--accent);
      color: var(--text);
      background: color-mix(in srgb, var(--accent) 14%, var(--surface-raised));
      box-shadow: 0 0 16px var(--glow-accent);
    }

    .request-block {
      margin-top: 28px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 22px;
      font-size: 0.8125rem;
      line-height: 1.9;
    }

    .req-line {
      color: var(--text-faint);
    }

    .req-token {
      color: var(--text);
      cursor: pointer;
      border-radius: 4px;
      padding: 1px 4px;
    }

    .req-token:hover {
      background: var(--surface-elevated);
    }

    .req-token.is-active {
      background: var(--accent);
      color: #1a0d04;
      font-weight: 700;
    }

    .request-detail {
      margin-top: 18px;
      max-width: 560px;
    }

    .detail-label {
      font-size: 0.8125rem;
      color: var(--accent);
      margin-bottom: 8px;
    }

    .detail-text {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
    }
  `,
})
export class HttpRequestInspector {
  protected readonly allStages = STAGES;
  protected readonly stage = signal<Stage>('client');
  protected readonly running = signal(false);

  protected readonly selected = signal('body');
  private readonly parts = PARTS;

  protected activeLabel(): string {
    return this.parts.find((p) => p.id === this.selected())!.label;
  }

  protected activeExplanation(): string {
    return this.parts.find((p) => p.id === this.selected())!.explanation;
  }

  private readonly labels: Record<Stage, string> = {
    idle: '',
    client: 'CLIENT OBJECT',
    serialize: 'SERIALIZE',
    json: 'JSON',
    request: 'HTTP REQUEST',
    network: 'NETWORK',
    server: 'HTTP SERVER',
    deserialize: 'DESERIALIZE',
    'server-object': 'SERVER OBJECT',
    logic: 'BUSINESS LOGIC',
    response: 'RESPONSE',
  };

  labelFor(s: Stage): string {
    return this.labels[s];
  }

  isPast(s: Stage): boolean {
    return this.allStages.indexOf(s) < this.allStages.indexOf(this.stage());
  }

  async run(): Promise<void> {
    if (this.running()) return;
    this.running.set(true);
    for (const s of this.allStages) {
      this.stage.set(s);
      await wait(320);
    }
    this.running.set(false);
  }

  reset(): void {
    this.stage.set('client');
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
