import { Component, computed, signal } from '@angular/core';
import { httpMethods } from '../../../../data/http/http-methods.data';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

interface RetryScenario {
  method: string;
  verdict: string;
  note: string;
}

const RETRY_SCENARIOS: RetryScenario[] = [
  { method: 'GET', verdict: 'Generally safe to retry.', note: 'It is safe and idempotent — retrying costs nothing extra in intended effect.' },
  { method: 'PUT', verdict: 'Retry can be appropriate.', note: 'PUT is idempotent — sending it again converges to the same end state.' },
  { method: 'DELETE', verdict: 'Retry can be appropriate.', note: 'DELETE is idempotent — the resource stays deleted either way.' },
  { method: 'POST', verdict: 'Requires an idempotency strategy.', note: 'POST is not idempotent by method semantics — blind retries risk duplicate creation. Applications often add an idempotency key.' },
  { method: 'PATCH', verdict: 'Depends on what the patch describes.', note: 'A "set to X" patch is safe to retry; an "increment by 1" patch is not.' },
];

@Component({
  selector: 'app-idempotency-matrix',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="safe-idempotent-cacheable">
      <div class="container">
        <p class="lab-index">HTTP / 07 — SAFE · IDEMPOTENT · CACHEABLE</p>
        <h2 class="lab-title">Three separate properties — not one sliding scale.</h2>
        <p class="lab-lede">
          It's tempting to simplify this to "GET is idempotent, POST is not." The real picture has three
          independent axes, and a method can satisfy some without satisfying others.
        </p>

        <app-explain-simply>
          Idempotent is like a light switch — you can flip it to "ON" as many times as you want, it's still
          just ON. That's different from pressing a button that drops a coin in a jar each time: press it
          three times, and three coins land in the jar. GET (checking something) is like the switch. POST
          (creating something new) is like the coin button.
        </app-explain-simply>

        <div class="axis-defs">
          <div class="axis-def">
            <p class="axis-name mono">SAFE</p>
            <p>The intended semantics are read-only.</p>
          </div>
          <div class="axis-def">
            <p class="axis-name mono">IDEMPOTENT</p>
            <p>Repeating the same request has the same intended effect as making it once.</p>
          </div>
          <div class="axis-def">
            <p class="axis-name mono">CACHEABLE</p>
            <p>A response may be stored and reused according to HTTP caching rules.</p>
          </div>
        </div>

        <div class="lab-panel matrix-wrap">
          <div class="matrix" role="table" aria-label="Safe, idempotent and cacheable matrix by method">
            <div class="matrix-row matrix-head" role="row">
              <span role="columnheader" class="mono">METHOD</span>
              <span role="columnheader" class="mono">SAFE</span>
              <span role="columnheader" class="mono">IDEMPOTENT</span>
              <span role="columnheader" class="mono">CACHEABLE</span>
            </div>
            @for (m of methods; track m.method) {
              <div class="matrix-row" role="row">
                <span role="cell" class="matrix-method mono">{{ m.method }}</span>
                <span role="cell" class="matrix-cell" [class.is-on]="m.safe === 'yes'">{{ m.safe === 'yes' ? '●' : m.safe === 'conditional' ? '◐' : '—' }}</span>
                <span role="cell" class="matrix-cell" [class.is-on]="m.idempotent === 'yes'">{{ m.idempotent === 'yes' ? '●' : m.idempotent === 'conditional' ? '◐' : '—' }}</span>
                <span role="cell" class="matrix-cell" [class.is-on]="m.cacheable === 'yes'">{{ m.cacheable === 'yes' ? '●' : m.cacheable === 'conditional' ? '◐' : '—' }}</span>
              </div>
            }
          </div>
          <p class="matrix-legend mono">● yes &nbsp; ◐ depends / conditional &nbsp; — no</p>
          <p class="matrix-callout">SAFE ≠ IDEMPOTENT, and IDEMPOTENT ≠ CACHEABLE — notice PUT and DELETE are idempotent but not cacheable, while GET is all three.</p>
        </div>

        <h3 class="retry-heading">Retry simulation</h3>
        <p class="lab-note">A request's connection fails before its response arrives. Should the client retry?</p>

        <div class="retry-tabs mono">
          @for (s of scenarios; track s.method) {
            <button type="button" class="lab-btn" [class.is-active]="selectedScenario().method === s.method" (click)="selectedMethod.set(s.method)">{{ s.method }}</button>
          }
        </div>

        <div class="lab-panel retry-panel">
          <div class="retry-flow mono">
            <span>Request</span>
            <span class="lab-flow-arrow">↓</span>
            <span>Connection fails before response arrives</span>
            <span class="lab-flow-arrow">↓</span>
            <span>Should we retry?</span>
          </div>
          <p class="retry-verdict">{{ selectedScenario().verdict }}</p>
          <p class="retry-note">{{ selectedScenario().note }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .axis-defs {
      margin-top: 28px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }

    @media (min-width: 720px) {
      .axis-defs {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .axis-def {
      padding: 16px 18px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .axis-name {
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      color: var(--accent);
      margin-bottom: 8px;
    }

    .axis-def p:last-child {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.55;
    }

    .matrix-wrap {
      overflow-x: auto;
    }

    .matrix {
      display: flex;
      flex-direction: column;
      min-width: 420px;
    }

    .matrix-row {
      display: grid;
      grid-template-columns: 100px repeat(3, 1fr);
      align-items: center;
      padding: 10px 0;
      border-bottom: 1px solid var(--border);
    }

    .matrix-row:last-of-type {
      border-bottom: none;
    }

    .matrix-head {
      color: var(--text-faint);
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
    }

    .matrix-method {
      font-weight: 600;
      color: var(--text);
      font-size: 0.8125rem;
    }

    .matrix-cell {
      color: var(--text-faint);
      font-size: 1rem;
      text-align: center;
    }

    .matrix-cell.is-on {
      color: var(--accent-2);
      text-shadow: 0 0 8px var(--glow-accent-2);
    }

    .matrix-legend {
      margin-top: 16px;
      font-size: 0.6875rem;
      color: var(--text-faint);
    }

    .matrix-callout {
      margin-top: 14px;
      padding-top: 14px;
      border-top: 1px solid var(--border);
      font-size: 0.875rem;
      color: var(--text);
      max-width: 640px;
    }

    .retry-heading {
      margin-top: 48px;
      font-size: 1.25rem;
      color: var(--text);
    }

    .retry-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 20px;
    }

    .retry-flow {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .retry-verdict {
      margin-top: 16px;
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--accent-strong);
    }

    .retry-note {
      margin-top: 8px;
      color: var(--text-muted);
      font-size: 0.875rem;
      line-height: 1.6;
      max-width: 560px;
    }
  `,
})
export class IdempotencyMatrix {
  protected readonly methods = httpMethods;
  protected readonly scenarios = RETRY_SCENARIOS;
  protected readonly selectedMethod = signal('GET');
  protected readonly selectedScenario = computed(
    () => this.scenarios.find((s) => s.method === this.selectedMethod()) ?? this.scenarios[0],
  );
}
