import { Component, signal } from '@angular/core';

interface Span {
  id: string;
  spanId: string;
  parentId: string | null;
  parentName: string | null;
  name: string;
  service: string;
  start: number;
  duration: number;
  depth: number;
  color: string;
}

const TRACE_ID = 'tr-8f3a1c9e2b47d0f6';

const SPANS: Span[] = [
  {
    id: 'client',
    spanId: 'sp-0a1b2c3d',
    parentId: null,
    parentName: null,
    name: 'CLIENT',
    service: 'Browser request',
    start: 0,
    duration: 210,
    depth: 0,
    color: 'var(--c-client)',
  },
  {
    id: 'api',
    spanId: 'sp-4e5f6071',
    parentId: 'client',
    parentName: 'CLIENT',
    name: 'API',
    service: 'Gateway — GET /products/42',
    start: 0,
    duration: 210,
    depth: 1,
    color: 'var(--c-compute)',
  },
  {
    id: 'auth',
    spanId: 'sp-829a3bc4',
    parentId: 'api',
    parentName: 'API',
    name: 'AUTH SERVICE',
    service: 'Token validation',
    start: 5,
    duration: 12,
    depth: 2,
    color: 'var(--accent-2)',
  },
  {
    id: 'product',
    spanId: 'sp-d5e6f708',
    parentId: 'api',
    parentName: 'API',
    name: 'PRODUCT SERVICE',
    service: 'Fetch product + enrich',
    start: 20,
    duration: 180,
    depth: 2,
    color: 'var(--c-compute)',
  },
  {
    id: 'db',
    spanId: 'sp-19203a4b',
    parentId: 'product',
    parentName: 'PRODUCT SERVICE',
    name: 'DATABASE',
    service: 'SELECT product by id',
    start: 30,
    duration: 110,
    depth: 3,
    color: 'var(--c-db)',
  },
  {
    id: 'external',
    spanId: 'sp-5c6d7e8f',
    parentId: 'product',
    parentName: 'PRODUCT SERVICE',
    name: 'EXTERNAL API',
    service: 'Pricing partner lookup',
    start: 145,
    duration: 50,
    depth: 3,
    color: 'var(--c-queue)',
  },
];

const TIMELINE_MS = 210;

@Component({
  selector: 'app-distributed-tracing',
  standalone: true,
  template: `
    <section class="lab-section trace-section" id="distributed-tracing" style="--ok:#4ade80;--warn:var(--accent);--crit:var(--danger);--c-client:var(--accent-2);--c-compute:#60a5fa;--c-db:#a78bfa;--c-cache:#2dd4bf;--c-queue:#fbbf24;">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container">
        <p class="lab-index">10 — DISTRIBUTED TRACING</p>
        <h2 class="lab-title">Distributed tracing lets you follow one request as it moves across services.</h2>
        <p class="lab-lede">
          A single request from a client can fan out across a gateway, an auth check, a product service, a
          database, and even a third-party API. A trace stitches every hop back together as one timeline.
        </p>

        <div class="lab-panel">
          <div class="id-row mono">
            <span class="id-chip"><span class="id-key">TRACE ID</span> {{ traceId }}</span>
            <span class="id-note">— one ID, shared by every span below</span>
          </div>

          <div class="waterfall" role="list" aria-label="Trace waterfall">
            @for (s of spans; track s.id) {
              <div class="wf-row" role="listitem">
                <div class="wf-label mono" [style.paddingLeft.px]="s.depth * 16">
                  <span class="wf-swatch" [style.background]="s.color"></span>
                  {{ s.name }}
                </div>
                <div class="wf-track">
                  <button
                    type="button"
                    class="wf-span"
                    [class.is-selected]="selected()?.id === s.id"
                    [style.left.%]="leftPct(s)"
                    [style.width.%]="widthPct(s)"
                    [style.background]="s.color"
                    (click)="select(s)"
                    [attr.aria-pressed]="selected()?.id === s.id"
                    [attr.aria-label]="s.name + ', ' + s.duration + 'ms, starts at ' + s.start + 'ms'"
                  >
                    <span class="wf-span-ms mono">{{ s.duration }}ms</span>
                  </button>
                </div>
              </div>
            }

            <div class="wf-ruler mono" aria-hidden="true">
              <span>0ms</span>
              <span>{{ timelineMs / 2 }}ms</span>
              <span>{{ timelineMs }}ms</span>
            </div>
          </div>

          <p class="lab-note">Click any span to inspect its trace ID, span ID, duration and parent.</p>

          @if (selected(); as s) {
            <div class="detail-panel">
              <p class="detail-name">{{ s.name }}</p>
              <p class="detail-service">{{ s.service }}</p>
              <dl class="detail-grid mono">
                <dt>Trace ID</dt>
                <dd>{{ traceId }}</dd>
                <dt>Span ID</dt>
                <dd>{{ s.spanId }}</dd>
                <dt>Duration</dt>
                <dd>{{ s.duration }}ms (starts at {{ s.start }}ms)</dd>
                <dt>Parent span</dt>
                <dd>{{ s.parentName ?? '— (root span)' }}</dd>
              </dl>
            </div>
          } @else {
            <div class="detail-panel detail-empty">
              <p>Select a span above to see its details.</p>
            </div>
          }
        </div>

        <div class="concept-row">
          <div class="concept-card">
            <p class="concept-title mono">TRACE ID</p>
            <p class="concept-body">One identifier shared by every span in the request — it's how a tracing system knows all these spans belong to the same journey.</p>
          </div>
          <div class="concept-card">
            <p class="concept-title mono">SPAN ID</p>
            <p class="concept-body">A unique identifier per operation. Each hop — auth check, DB query, external call — gets its own span, linked to a parent.</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .trace-section {
      position: relative;
    }

    .id-row {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 8px;
      font-size: 0.8125rem;
    }

    .id-chip {
      color: var(--accent-2);
    }

    .id-key {
      color: var(--text-faint);
      letter-spacing: 0.08em;
      margin-right: 6px;
    }

    .id-note {
      color: var(--text-faint);
      font-size: 0.75rem;
    }

    .waterfall {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .wf-row {
      display: grid;
      grid-template-columns: 180px 1fr;
      align-items: center;
      gap: 12px;
    }

    .wf-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .wf-swatch {
      width: 8px;
      height: 8px;
      border-radius: 2px;
      flex-shrink: 0;
    }

    .wf-track {
      position: relative;
      height: 30px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }

    .wf-span {
      position: absolute;
      top: 3px;
      bottom: 3px;
      border: 1px solid rgba(0, 0, 0, 0.3);
      border-radius: 3px;
      cursor: pointer;
      display: flex;
      align-items: center;
      padding-left: 6px;
      min-width: 6px;
      transition: filter 0.15s ease, outline 0.15s ease;
    }

    .wf-span:hover {
      filter: brightness(1.2);
    }

    .wf-span.is-selected {
      outline: 2px solid var(--text);
      outline-offset: 1px;
      filter: brightness(1.25);
    }

    .wf-span-ms {
      font-size: 0.625rem;
      font-weight: 700;
      color: #0a0c0f;
      white-space: nowrap;
    }

    .wf-ruler {
      display: grid;
      grid-template-columns: 180px 1fr;
      gap: 12px;
      margin-top: 4px;
    }

    .wf-ruler span:first-child {
      grid-column: 1;
    }

    .wf-ruler {
      font-size: 0.6875rem;
      color: var(--text-faint);
    }

    .wf-ruler > span {
      display: none;
    }

    .detail-panel {
      margin-top: 24px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      padding: 18px 20px;
    }

    .detail-empty {
      color: var(--text-faint);
      font-size: 0.875rem;
    }

    .detail-name {
      font-size: 1.0625rem;
      font-weight: 700;
      color: var(--text);
    }

    .detail-service {
      margin-top: 4px;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .detail-grid {
      margin-top: 14px;
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: 6px 16px;
      font-size: 0.8125rem;
    }

    .detail-grid dt {
      color: var(--text-faint);
      letter-spacing: 0.04em;
    }

    .detail-grid dd {
      margin: 0;
      color: var(--text);
    }

    .concept-row {
      margin-top: 40px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 14px;
    }

    .concept-card {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px;
    }

    .concept-title {
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      color: var(--accent);
    }

    .concept-body {
      margin-top: 10px;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.55;
    }

    @media (max-width: 640px) {
      .wf-row,
      .wf-ruler {
        grid-template-columns: 110px 1fr;
      }

      .wf-label {
        font-size: 0.6875rem;
      }
    }
  `,
})
export class DistributedTracing {
  protected readonly spans = SPANS;
  protected readonly traceId = TRACE_ID;
  protected readonly timelineMs = TIMELINE_MS;
  protected readonly selected = signal<Span | null>(null);

  leftPct(s: Span): number {
    return (s.start / TIMELINE_MS) * 100;
  }

  widthPct(s: Span): number {
    return (s.duration / TIMELINE_MS) * 100;
  }

  select(s: Span): void {
    this.selected.set(this.selected()?.id === s.id ? null : s);
  }
}
