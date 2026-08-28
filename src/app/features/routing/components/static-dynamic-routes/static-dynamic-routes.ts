import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

interface SegmentView {
  text: string;
  kind: 'literal' | 'dynamic';
  paramName?: string;
}

const EXAMPLES = [
  { pattern: '/users/{id}', request: '/users/42' },
  { pattern: '/products/{productId}', request: '/products/8821' },
  { pattern: '/orders/{orderId}', request: '/orders/A-991' },
];

function buildSegments(pattern: string, request: string): SegmentView[] {
  const patternParts = pattern.split('/').filter(Boolean);
  const requestParts = request.split('/').filter(Boolean);
  return patternParts.map((part, i) => {
    const dynamic = part.match(/^\{(\w+)\}$/);
    if (dynamic) {
      return { text: requestParts[i] ?? '', kind: 'dynamic', paramName: dynamic[1] };
    }
    return { text: part, kind: 'literal' };
  });
}

@Component({
  selector: 'app-static-dynamic-routes',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="static-dynamic">
      <div class="container">
        <p class="lab-index">ROUTING / 03 — STATIC VS DYNAMIC ROUTES</p>
        <h2 class="lab-title">Some segments never change. Others are filled in per request.</h2>
        <p class="lab-lede">
          A static route matches one exact path. A dynamic route has one or more placeholder segments that
          are extracted as parameters whenever the request matches its shape.
        </p>

        <app-explain-simply>
          A static route is like a labeled mailbox: "Mailbox 12" only ever means one thing. A dynamic route
          is like a form field labeled "Order Number ___" — the label stays the same, but whatever you write
          in the blank becomes the value.
        </app-explain-simply>

        <div class="compare-grid">
          <div class="compare-col">
            <p class="compare-heading mono">STATIC</p>
            <ul class="example-list mono">
              <li>/users</li>
              <li>/products</li>
              <li>/orders</li>
            </ul>
          </div>
          <div class="compare-col">
            <p class="compare-heading mono">DYNAMIC</p>
            <ul class="example-list mono">
              <li>/users/{{ '{id}' }}</li>
              <li>/products/{{ '{productId}' }}</li>
              <li>/orders/{{ '{orderId}' }}</li>
            </ul>
          </div>
        </div>

        <p class="col-subheading mono">PICK A DYNAMIC ROUTE TO EXTRACT</p>
        <div class="lab-btn-row">
          @for (ex of examples; track ex.pattern; let i = $index) {
            <button type="button" class="lab-btn" [class.is-active]="selected() === i" (click)="selected.set(i)">
              {{ ex.pattern }}
            </button>
          }
        </div>

        <div class="extraction-panel">
          <p class="extraction-label mono">Route: <span class="accent-2">{{ examples[selected()].pattern }}</span></p>
          <p class="extraction-label mono">Request: <span class="accent">{{ examples[selected()].request }}</span></p>

          <div class="segment-row mono">
            @for (seg of segments(); track $index) {
              <span class="segment" [class.is-dynamic]="seg.kind === 'dynamic'">{{ seg.text }}</span>
              @if (!$last) {
                <span class="segment-slash">/</span>
              }
            }
          </div>

          <p class="extraction-result-label mono">EXTRACTED PARAMETERS</p>
          <ul class="kv-list mono">
            @for (seg of segments(); track $index) {
              @if (seg.kind === 'dynamic') {
                <li><span class="kv-key">{{ seg.paramName }}</span> = {{ seg.text }}</li>
              }
            }
          </ul>
        </div>
      </div>
    </section>
  `,
  styles: `
    .compare-grid {
      margin-top: 28px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    @media (min-width: 640px) {
      .compare-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .compare-col {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 18px;
    }

    .compare-heading {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--accent-2);
      margin-bottom: 12px;
    }

    .example-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.875rem;
      color: var(--text);
    }

    .col-subheading {
      margin-top: 32px;
      font-size: 0.625rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
      margin-bottom: 10px;
    }

    .extraction-panel {
      margin-top: 20px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .extraction-label {
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-bottom: 4px;
    }

    .accent { color: var(--accent); }
    .accent-2 { color: var(--accent-2); }

    .segment-row {
      margin-top: 20px;
      display: flex;
      align-items: center;
      gap: 2px;
      font-size: 1rem;
    }

    .segment {
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      background: var(--surface-elevated);
      color: var(--text-muted);
      border: 1px solid var(--border-strong);
    }

    .segment.is-dynamic {
      color: var(--accent);
      border-color: var(--accent-dim);
      background: color-mix(in srgb, var(--accent) 10%, var(--surface-elevated));
    }

    .segment-slash {
      color: var(--text-faint);
    }

    .extraction-result-label {
      margin-top: 20px;
      font-size: 0.625rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
    }

    .kv-list {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.875rem;
    }

    .kv-key {
      color: var(--accent-2);
    }
  `,
})
export class StaticDynamicRoutes {
  protected readonly examples = EXAMPLES;
  protected readonly selected = signal(0);

  protected readonly segments = computed<SegmentView[]>(() => {
    const ex = this.examples[this.selected()];
    return buildSegments(ex.pattern, ex.request);
  });
}
