import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RoutingStore, QUICK_REQUESTS } from '../../engine/routing-store';
import { AttemptStatus, HttpMethod } from '../../engine/route-matcher';
import { RouteTable } from '../route-table/route-table';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];

const STAGES = [
  { label: 'Incoming Request', detail: 'The router receives a method and a URL — nothing has been decided yet.' },
  { label: 'Method Check', detail: 'Each candidate route is filtered by whether its HTTP method matches (or accepts any method).' },
  { label: 'Path Matching', detail: 'The URL path is compared segment-by-segment against each route pattern, in order.' },
  { label: 'Parameter Extraction', detail: 'Dynamic segments that matched are captured as named parameters.' },
  { label: 'Constraint Check', detail: 'Any typed constraints (like :int or :uuid) on dynamic segments are validated.' },
  { label: 'Route Precedence', detail: 'The FIRST route (in table order) that passes every check above wins — later matches are shadowed.' },
  { label: 'Selected Handler', detail: 'The winning route hands the request to its handler function.' },
];

function toHandlerName(description: string): string {
  const name = description
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
  return `${name}()`;
}

const STATUS_LABEL: Record<AttemptStatus, string> = {
  winner: 'WINNER',
  rejected: 'REJECTED',
  shadowed: 'SHADOWED',
  disabled: 'DISABLED',
};

@Component({
  selector: 'app-route-matching-engine',
  standalone: true,
  imports: [FormsModule, RouteTable, ExplainSimply],
  template: `
    <section class="lab-section" id="route-matching">
      <div class="container">
        <p class="lab-index">ROUTING / 06 — THE ROUTE MATCHING ENGINE</p>
        <h2 class="lab-title">Watch a request find its handler.</h2>
        <p class="lab-lede">
          This is a live routing simulator. Build a request on the left, run it through the pipeline in
          the middle, and see exactly which route wins — and why the others didn't — on the right.
        </p>

        <app-explain-simply>
          Think of the routing engine like a bouncer with a clipboard of rules, checked top to bottom.
          The very first rule your request satisfies is the one that applies — the bouncer doesn't keep
          reading after that, even if a later rule would also have matched.
        </app-explain-simply>

        <div class="engine-grid">
          <div class="engine-col request-col">
            <p class="col-heading mono">REQUEST BUILDER</p>
            <div class="lab-field">
              <label for="method-select">Method</label>
              <select id="method-select" [ngModel]="store.method()" (ngModelChange)="onMethodChange($event)">
                @for (m of methods; track m) {
                  <option [value]="m">{{ m }}</option>
                }
              </select>
            </div>
            <div class="lab-field">
              <label for="url-input">URL</label>
              <input id="url-input" type="text" spellcheck="false" [ngModel]="store.url()" (ngModelChange)="onUrlChange($event)" />
            </div>

            <p class="col-subheading mono">TRY AN EXAMPLE</p>
            <div class="quick-list">
              @for (q of quickRequests; track q.url) {
                <button type="button" class="quick-btn mono" (click)="useQuick(q.method, q.url)">
                  <span class="quick-method">{{ q.method }}</span>{{ q.url }}
                </button>
              }
            </div>
          </div>

          <div class="engine-col pipeline-col">
            <p class="col-heading mono">ROUTING PIPELINE</p>
            <ol class="pipeline">
              @for (s of stages; track s.label; let i = $index) {
                <li [class.is-active]="stageIndex() === i" [class.is-past]="stageIndex() > i">
                  <span class="pipeline-dot" aria-hidden="true"></span>
                  <div>
                    <p class="pipeline-label">{{ s.label }}</p>
                    @if (stageIndex() >= i) {
                      <p class="pipeline-detail">{{ s.detail }}</p>
                    }
                  </div>
                </li>
              }
            </ol>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" (click)="runInstant()">Run Instantly</button>
              <button type="button" class="lab-btn" (click)="stepThrough()" [disabled]="stepping()">
                {{ stepping() ? 'Stepping…' : 'Step-by-Step' }}
              </button>
              <button type="button" class="lab-btn" (click)="reset()">Reset</button>
            </div>
          </div>

          <div class="engine-col result-col">
            <p class="col-heading mono">MATCH RESULT</p>
            @if (stageIndex() < stages.length - 1) {
              <p class="lab-note">Run the pipeline to see a result.</p>
            } @else if (store.result().matched) {
              <div class="result-ok">
                <p class="result-status mono">✓ ROUTE MATCHED</p>
                <p class="result-route mono">{{ store.result().route?.method }} {{ store.result().route?.pattern }}</p>

                <p class="result-heading mono">PARAMETERS</p>
                @if (store.result().params.length) {
                  <ul class="kv-list mono">
                    @for (p of store.result().params; track p.name) {
                      <li><span class="kv-key">{{ p.name }}</span> = {{ p.value }}</li>
                    }
                  </ul>
                } @else {
                  <p class="kv-empty mono">none</p>
                }

                <p class="result-heading mono">QUERY PARAMETERS</p>
                @if (store.result().query.length) {
                  <ul class="kv-list mono">
                    @for (q of store.result().query; track q.name) {
                      <li><span class="kv-key">{{ q.name }}</span> = {{ q.value }}</li>
                    }
                  </ul>
                } @else {
                  <p class="kv-empty mono">none</p>
                }

                <p class="result-heading mono">HANDLER</p>
                <p class="result-handler mono">{{ handlerName() }}</p>

                <p class="result-explain">{{ explanation() }}</p>
              </div>
            } @else {
              <div class="result-fail">
                <p class="result-status mono is-fail">✕ NO ROUTE MATCHED</p>
                <p class="result-code mono">404 Not Found</p>
                <p class="result-explain">{{ explanation() }}</p>
              </div>
            }

            @if (stageIndex() >= stages.length - 1) {
              <p class="result-heading mono">EVALUATION TRACE</p>
              <ul class="trace-list mono">
                @for (a of store.result().attempts; track a.route.id) {
                  <li [class]="'trace-' + a.status">
                    <span class="trace-badge">{{ statusLabel(a.status) }}</span>
                    <span class="trace-route">{{ a.route.method }} {{ a.route.pattern }}</span>
                    <span class="trace-reason">{{ a.reason }}</span>
                  </li>
                }
              </ul>
            }
          </div>
        </div>

        <p class="lab-note table-lede">
          Every route below feeds the engine above — edit a pattern, disable a route, or reorder the list
          and re-run the request to see the outcome change live.
        </p>
        <app-route-table />
      </div>
    </section>
  `,
  styles: `
    .engine-grid {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 1024px) {
      .engine-grid {
        grid-template-columns: 1fr 1.2fr 1.1fr;
      }
    }

    .engine-col {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px;
    }

    .col-heading {
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      color: var(--accent-2);
      margin-bottom: 16px;
    }

    .col-subheading {
      font-size: 0.625rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
      margin: 20px 0 10px;
    }

    .quick-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .quick-btn {
      text-align: left;
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .quick-btn:hover {
      border-color: var(--accent-dim);
    }

    .quick-method {
      display: inline-block;
      width: 48px;
      color: var(--accent);
      font-weight: 600;
    }

    .pipeline {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .pipeline li {
      display: flex;
      gap: 10px;
      padding: 8px 4px;
      opacity: 0.4;
      transition: opacity 0.25s ease;
    }

    .pipeline li.is-past {
      opacity: 0.7;
    }

    .pipeline li.is-active {
      opacity: 1;
    }

    .pipeline-dot {
      flex-shrink: 0;
      width: 9px;
      height: 9px;
      border-radius: 50%;
      margin-top: 4px;
      background: var(--border-strong);
    }

    .pipeline li.is-past .pipeline-dot {
      background: var(--accent-2);
    }

    .pipeline li.is-active .pipeline-dot {
      background: var(--accent);
      box-shadow: 0 0 8px var(--glow-accent);
    }

    .pipeline-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--text);
    }

    .pipeline-detail {
      margin-top: 2px;
      font-size: 0.75rem;
      color: var(--text-faint);
      line-height: 1.5;
      max-width: 40ch;
    }

    .result-status {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--accent-2);
    }

    .result-status.is-fail {
      color: var(--danger);
    }

    .result-route {
      margin-top: 4px;
      color: var(--accent);
      font-size: 0.8125rem;
    }

    .result-code {
      margin-top: 4px;
      color: var(--danger);
      font-size: 0.8125rem;
    }

    .result-heading {
      margin-top: 18px;
      font-size: 0.625rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
    }

    .kv-list {
      margin-top: 6px;
      display: flex;
      flex-direction: column;
      gap: 3px;
      font-size: 0.8125rem;
    }

    .kv-key {
      color: var(--accent-2);
    }

    .kv-empty {
      margin-top: 6px;
      color: var(--text-faint);
      font-size: 0.75rem;
    }

    .result-handler {
      margin-top: 6px;
      color: var(--accent);
      font-size: 0.875rem;
    }

    .result-explain {
      margin-top: 16px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .trace-list {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.6875rem;
    }

    .trace-list li {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: baseline;
      padding: 5px 8px;
      border-radius: var(--radius-sm);
      background: var(--surface);
    }

    .trace-badge {
      flex-shrink: 0;
      width: 68px;
      font-weight: 700;
    }

    .trace-winner .trace-badge { color: var(--accent-2); }
    .trace-rejected .trace-badge { color: var(--danger); }
    .trace-shadowed .trace-badge,
    .trace-disabled .trace-badge { color: var(--text-faint); }

    .trace-route {
      color: var(--text);
      flex-shrink: 0;
    }

    .trace-reason {
      color: var(--text-faint);
    }

    .trace-rejected,
    .trace-shadowed,
    .trace-disabled {
      opacity: 0.75;
    }

    .table-lede {
      margin-top: 32px;
    }
  `,
})
export class RouteMatchingEngine {
  protected readonly store = inject(RoutingStore);
  protected readonly methods = METHODS;
  protected readonly stages = STAGES;
  protected readonly quickRequests = QUICK_REQUESTS;

  protected readonly stageIndex = signal(-1);
  protected readonly stepping = signal(false);

  protected readonly handlerName = computed(() => {
    const route = this.store.result().route;
    return route ? toHandlerName(route.description) : '';
  });

  protected readonly explanation = computed(() => {
    const result = this.store.result();
    if (result.matched && result.route) {
      const paramText = result.params.length
        ? ` The dynamic segment(s) — ${result.params.map((p) => `"${p.value}"`).join(', ')} — satisfied every constraint on the way.`
        : '';
      return `The request matched ${result.route.method} ${result.route.pattern} because it was the first enabled route, in table order, whose method and path both agreed with the request.${paramText}`;
    }
    const rejected = result.attempts.filter((a) => a.status === 'rejected');
    return rejected.length
      ? `No route matched. ${rejected.length} candidate route(s) were checked and rejected — see the trace below for exactly why each one failed.`
      : 'No route matched, and no candidate route even attempted this path — check that a route table exists for this URL.';
  });

  onMethodChange(method: HttpMethod): void {
    this.store.method.set(method);
    this.reset();
  }

  onUrlChange(url: string): void {
    this.store.url.set(url);
    this.reset();
  }

  useQuick(method: HttpMethod, url: string): void {
    this.store.setRequest(method, url);
    this.reset();
  }

  statusLabel(status: AttemptStatus): string {
    return STATUS_LABEL[status];
  }

  runInstant(): void {
    this.stageIndex.set(this.stages.length - 1);
  }

  async stepThrough(): Promise<void> {
    if (this.stepping()) return;
    this.stepping.set(true);
    this.stageIndex.set(-1);
    for (let i = 0; i < this.stages.length; i++) {
      await new Promise((r) => setTimeout(r, 450));
      this.stageIndex.set(i);
    }
    this.stepping.set(false);
  }

  reset(): void {
    this.stageIndex.set(-1);
  }
}
