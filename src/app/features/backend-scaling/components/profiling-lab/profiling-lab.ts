import { Component, signal } from '@angular/core';

interface FlowNode {
  label: string;
}

const FLOW: FlowNode[] = [
  { label: 'Request' },
  { label: 'Controller' },
  { label: 'Service' },
  { label: 'Repository' },
  { label: 'Database' },
];

interface Segment {
  key: string;
  label: string;
  ms: number;
  color: string;
}

const SEGMENTS: Segment[] = [
  { key: 'controller', label: 'Controller', ms: 5, color: 'var(--c-compute)' },
  { key: 'logic', label: 'Business logic', ms: 12, color: 'var(--accent-2)' },
  { key: 'serialization', label: 'Serialization', ms: 4, color: 'var(--c-queue)' },
  { key: 'database', label: 'Database', ms: 180, color: 'var(--c-db)' },
];

const TOTAL_MS = SEGMENTS.reduce((sum, s) => sum + s.ms, 0);

interface ProfileType {
  name: string;
  detail: string;
}

const PROFILE_TYPES: ProfileType[] = [
  { name: 'CPU profiling', detail: 'Shows where CPU cycles go — which functions actually run the processor.' },
  { name: 'Memory profiling', detail: "Shows where allocations happen, and what's still retained instead of freed." },
  { name: 'Database query profiling', detail: 'Shows which queries are slow, and why — missing indexes, bad plans, N+1 calls.' },
];

@Component({
  selector: 'app-profiling-lab',
  standalone: true,
  template: `
    <section class="lab-section prof-section" id="profiling-lab" style="--ok:#4ade80;--warn:var(--accent);--crit:var(--danger);--c-client:var(--accent-2);--c-compute:#60a5fa;--c-db:#a78bfa;--c-cache:#2dd4bf;--c-queue:#fbbf24;">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container">
        <p class="lab-index">09 — PROFILING</p>
        <h2 class="lab-title">One request. Where did the 201ms actually go?</h2>
        <p class="lab-lede">
          Profiling means finding where execution time is actually being spent inside one process — not guessing
          from a hunch. Follow the call flow, then look at the timing.
        </p>

        <div class="lab-panel">
          <div class="call-flow" aria-label="Call flow: Request through Controller, Service, Repository, to Database">
            @for (n of flow; track n.label; let i = $index) {
              <div class="flow-node lab-node">{{ n.label }}</div>
              @if (i < flow.length - 1) {
                <div class="lab-flow-arrow" aria-hidden="true">↓</div>
              }
            }
          </div>
        </div>

        <div class="lab-panel">
          <p class="bar-heading mono">REQUEST TIMING — {{ totalMs }}ms TOTAL</p>
          <div class="timing-bar" role="img" [attr.aria-label]="barAriaLabel">
            @for (seg of segments; track seg.key) {
              <button
                type="button"
                class="bar-segment"
                [style.width.%]="pct(seg.ms)"
                [style.background]="seg.color"
                [class.is-active]="activeSeg() === seg.key"
                (click)="toggleSeg(seg.key)"
                (mouseenter)="hoverSeg(seg.key)"
                (mouseleave)="hoverSeg(null)"
                (focus)="hoverSeg(seg.key)"
                (blur)="hoverSeg(null)"
              >
                @if (seg.ms >= 12) {
                  <span class="seg-label mono">{{ seg.label }}</span>
                }
              </button>
            }
          </div>

          @if (tooltipSeg(); as seg) {
            <div class="tooltip mono">
              <strong>{{ seg.label }}</strong> — {{ seg.ms }}ms ({{ pct(seg.ms).toFixed(1) }}% of total)
            </div>
          } @else {
            <div class="tooltip mono tooltip-hint">Hover or click a segment for exact timing.</div>
          }

          <div class="legend-row">
            @for (seg of segments; track seg.key) {
              <span class="legend-chip mono">
                <span class="legend-swatch" [style.background]="seg.color"></span>
                {{ seg.label }} · {{ seg.ms }}ms
              </span>
            }
          </div>
        </div>

        <div class="lab-panel question-panel">
          <p class="question-text">Where is most of the time spent?</p>
          <button type="button" class="lab-btn lab-btn-primary" (click)="reveal()" [disabled]="revealed()">
            {{ revealed() ? 'Revealed' : 'Reveal answer' }}
          </button>

          @if (revealed()) {
            <p class="answer-text">
              <strong style="color: var(--c-db)">Database — 180ms, 89.6% of the total.</strong>
              Controller, business logic and serialization together cost 21ms. Profiling isn't about intuition —
              it's the measurement that tells you, unambiguously, that optimizing the controller here would be a
              waste of effort, and the database call is the only thing worth touching.
            </p>
          }
        </div>

        <div class="types-block">
          <h3 class="types-heading">Three kinds of profiling</h3>
          <div class="types-grid">
            @for (pt of profileTypes; track pt.name) {
              <div class="type-card">
                <span class="pill pill-yes">{{ pt.name }}</span>
                <p class="type-detail">{{ pt.detail }}</p>
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .prof-section {
      position: relative;
    }

    .call-flow {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    .flow-node {
      padding: 10px 20px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      min-width: 180px;
      text-align: center;
    }

    .bar-heading {
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      color: var(--accent-2);
    }

    .timing-bar {
      margin-top: 16px;
      display: flex;
      width: 100%;
      height: 52px;
      border-radius: var(--radius-sm);
      overflow: hidden;
      border: 1px solid var(--border);
    }

    .bar-segment {
      position: relative;
      height: 100%;
      border: none;
      border-right: 1px solid rgba(0, 0, 0, 0.35);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      transition: filter 0.15s ease, outline-color 0.15s ease;
      min-width: 8px;
    }

    .bar-segment:last-child {
      border-right: none;
    }

    .bar-segment:hover,
    .bar-segment.is-active {
      filter: brightness(1.25);
    }

    .seg-label {
      font-size: 0.6875rem;
      font-weight: 700;
      color: #0a0c0f;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .tooltip {
      margin-top: 14px;
      font-size: 0.8125rem;
      color: var(--text);
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      display: inline-block;
    }

    .tooltip-hint {
      color: var(--text-faint);
    }

    .legend-row {
      margin-top: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .legend-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .legend-swatch {
      width: 10px;
      height: 10px;
      border-radius: 2px;
      display: inline-block;
    }

    .question-panel {
      margin-top: 24px;
    }

    .question-text {
      font-size: 1.0625rem;
      color: var(--text);
      margin-bottom: 16px;
    }

    .answer-text {
      margin-top: 18px;
      font-size: 0.9375rem;
      color: var(--text-muted);
      line-height: 1.65;
      max-width: 640px;
    }

    .types-block {
      margin-top: 48px;
    }

    .types-heading {
      font-size: 1.25rem;
      color: var(--text);
    }

    .types-grid {
      margin-top: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }

    .type-card {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px;
    }

    .type-detail {
      margin-top: 12px;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.55;
    }
  `,
})
export class ProfilingLab {
  protected readonly flow = FLOW;
  protected readonly segments = SEGMENTS;
  protected readonly totalMs = TOTAL_MS;
  protected readonly barAriaLabel = SEGMENTS.map((s) => `${s.label} ${s.ms}ms`).join(', ') + `, total ${TOTAL_MS}ms`;
  protected readonly profileTypes = PROFILE_TYPES;

  private readonly hovered = signal<string | null>(null);
  protected readonly activeSeg = signal<string | null>(null);
  protected readonly revealed = signal(false);

  pct(ms: number): number {
    return (ms / TOTAL_MS) * 100;
  }

  hoverSeg(key: string | null): void {
    this.hovered.set(key);
  }

  toggleSeg(key: string): void {
    this.activeSeg.set(this.activeSeg() === key ? null : key);
  }

  tooltipSeg(): Segment | null {
    const key = this.hovered() ?? this.activeSeg();
    return this.segments.find((s) => s.key === key) ?? null;
  }

  reveal(): void {
    this.revealed.set(true);
  }
}
