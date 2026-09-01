import { Component, OnDestroy, signal } from '@angular/core';

interface Segment {
  key: string;
  label: string;
  ms: number;
  color: string;
  description: string;
}

const SEGMENTS: Segment[] = [
  {
    key: 'network-out',
    label: 'Network',
    ms: 8,
    color: 'var(--c-client)',
    description:
      'Time for the request bytes to travel from the client to the server — governed by physical distance, connection setup, and current network conditions.',
  },
  {
    key: 'queueing',
    label: 'Queueing',
    ms: 4,
    color: 'var(--c-queue)',
    description:
      'The request sits in a queue waiting for a free worker/thread. This is the segment that grows first once a server is under heavy load.',
  },
  {
    key: 'application',
    label: 'Application processing',
    ms: 12,
    color: 'var(--c-compute)',
    description: "The server's own code runs: parsing the request, executing business logic, and serializing a response.",
  },
  {
    key: 'database',
    label: 'Database',
    ms: 65,
    color: 'var(--c-db)',
    description:
      'The application queries a database. I/O time, lock contention, and slow or missing indexes usually dominate this segment.',
  },
  {
    key: 'external',
    label: 'External service',
    ms: 15,
    color: 'var(--c-cache)',
    description:
      "A call out to another service — a payment processor, a third-party API. You're now waiting on someone else's latency too.",
  },
  {
    key: 'response',
    label: 'Response transmission',
    ms: 6,
    color: 'var(--c-client)',
    description: 'Sending the response bytes back across the network to the client.',
  },
];

const TOTAL_MS = SEGMENTS.reduce((sum, s) => sum + s.ms, 0);
const ANIMATION_MS = 900;

@Component({
  selector: 'app-latency-breakdown',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section bs-scene" id="what-is-latency">
      <div class="container">
        <p class="lab-index">01 — LATENCY</p>
        <h2 class="lab-title">Latency is the time between request and response.</h2>
        <p class="lab-lede">
          Not how much work the server does — just how long the person on the other end has to wait for an
          answer.
        </p>

        <div class="lab-panel">
          <div class="stopwatch-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="sendRequest()" [disabled]="running()">
              {{ running() ? 'Waiting for response…' : 'Send request' }}
            </button>
            <p class="elapsed mono">{{ elapsedMs().toFixed(0) }} ms</p>
          </div>
          @if (!running() && elapsedMs() > 0) {
            <p class="lab-note">Response received after {{ elapsedMs().toFixed(0) }} ms — broken down below.</p>
          }

          <p class="lab-node timeline-heading">CLIENT → SERVER → CLIENT, broken into phases</p>
          <div class="timeline" role="group" aria-label="Latency broken into phases, click a phase for detail">
            @for (seg of segments; track seg.key) {
              <button
                type="button"
                class="timeline-seg"
                [style.width.%]="(seg.ms / totalMs) * 100"
                [style.background]="seg.color"
                [class.is-selected]="selected()?.key === seg.key"
                (click)="select(seg)"
                [attr.aria-pressed]="selected()?.key === seg.key"
                [attr.aria-label]="seg.label + ', ' + seg.ms + ' milliseconds'"
              ></button>
            }
          </div>
          <div class="timeline-legend">
            @for (seg of segments; track seg.key) {
              <button type="button" class="legend-item" (click)="select(seg)" [class.is-selected]="selected()?.key === seg.key">
                <span class="legend-swatch" [style.background]="seg.color"></span>
                <span class="mono legend-label">{{ seg.label }} — {{ seg.ms }}ms</span>
              </button>
            }
          </div>

          @if (selected(); as sel) {
            <div class="detail-panel">
              <p class="detail-title mono">{{ sel.label }} · {{ sel.ms }}ms</p>
              <p class="detail-text">{{ sel.description }}</p>
            </div>
          } @else {
            <p class="detail-hint">Click any phase above (or in the legend) to see what happens during it.</p>
          }

          <p class="lab-node total-heading">TOTAL: {{ totalMs }}ms</p>
        </div>

        <p class="lab-note-warn lab-note">
          This {{ totalMs }}ms is one request's latency, not <em>the</em> latency of the system. The next section
          shows why a single "average" number can hide what most users actually experience — not every request
          takes the average time.
        </p>
      </div>
    </section>
  `,
  styles: `
    .bs-scene {
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
    }

    .stopwatch-row { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
    .elapsed { font-size: 1.5rem; color: var(--text); min-width: 90px; }

    .timeline-heading { margin-top: 32px; margin-bottom: 12px; }
    .timeline { display: flex; width: 100%; height: 40px; border-radius: var(--radius-sm); overflow: hidden; border: 1px solid var(--border-strong); }
    .timeline-seg { height: 100%; border: none; opacity: 0.75; transition: opacity 0.15s ease, transform 0.15s ease; cursor: pointer; }
    .timeline-seg:hover { opacity: 1; }
    .timeline-seg.is-selected { opacity: 1; box-shadow: inset 0 0 0 2px var(--text); }

    .timeline-legend { display: flex; flex-wrap: wrap; gap: 10px 18px; margin-top: 14px; }
    .legend-item { display: inline-flex; align-items: center; gap: 8px; background: none; border: none; padding: 4px 0; color: var(--text-muted); }
    .legend-item.is-selected .legend-label { color: var(--text); }
    .legend-swatch { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
    .legend-label { font-size: 0.75rem; }

    .detail-panel { margin-top: 20px; padding: 16px 18px; background: var(--surface); border-left: 2px solid var(--accent-2-dim); border-radius: var(--radius-sm); }
    .detail-title { color: var(--accent-2); font-size: 0.8125rem; margin-bottom: 8px; }
    .detail-text { color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; }
    .detail-hint { margin-top: 16px; font-size: 0.8125rem; color: var(--text-faint); }

    .total-heading { margin-top: 24px; color: var(--text-muted); }
  `,
})
export class LatencyBreakdown implements OnDestroy {
  protected readonly segments = SEGMENTS;
  protected readonly totalMs = TOTAL_MS;

  protected readonly running = signal(false);
  protected readonly elapsedMs = signal(0);
  protected readonly selected = signal<Segment | null>(null);

  private rafId: number | null = null;

  sendRequest(): void {
    if (this.running()) return;
    this.running.set(true);
    this.elapsedMs.set(0);
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / ANIMATION_MS);
      this.elapsedMs.set(progress * TOTAL_MS);
      if (progress < 1) {
        this.rafId = requestAnimationFrame(tick);
      } else {
        this.running.set(false);
        this.rafId = null;
      }
    };
    this.rafId = requestAnimationFrame(tick);
  }

  select(seg: Segment): void {
    this.selected.set(this.selected()?.key === seg.key ? null : seg);
  }

  ngOnDestroy(): void {
    if (this.rafId !== null) cancelAnimationFrame(this.rafId);
  }
}
