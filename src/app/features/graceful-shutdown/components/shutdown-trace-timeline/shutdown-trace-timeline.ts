import { Component, OnDestroy, computed, signal } from '@angular/core';

interface TraceEvent {
  id: string;
  lane: string;
  tSeconds: number;
  label: string;
}

const TOTAL_SECONDS = 6;

const LANES: string[] = ['Load Balancer', 'Application', 'Request', 'Database', 'Worker', 'Queue', 'External API'];

const EVENTS: TraceEvent[] = [
  { id: 'sigterm', lane: 'Application', tSeconds: 0, label: 'SIGTERM' },
  { id: 'readiness', lane: 'Application', tSeconds: 0.2, label: 'Readiness false' },
  { id: 'traffic', lane: 'Load Balancer', tSeconds: 0.5, label: 'New traffic stops' },
  { id: 'req-complete', lane: 'Request', tSeconds: 1, label: 'Request completes' },
  { id: 'worker-stop', lane: 'Worker', tSeconds: 2, label: 'Worker stops consuming' },
  { id: 'db-complete', lane: 'Database', tSeconds: 4, label: 'Database operation completes' },
  { id: 'resources-close', lane: 'Queue', tSeconds: 5, label: 'Resources close' },
  { id: 'exit', lane: 'Application', tSeconds: 5.2, label: 'Process exits' },
];

const PLAYBACK_MS = 6500;

@Component({
  selector: 'app-shutdown-trace-timeline',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene trace-scene" id="gs-trace-timeline">
      <div class="container">
        <p class="lab-index">30 — THE SHUTDOWN TRACE</p>
        <h2 class="lab-title">One shutdown, traced across every layer.</h2>
        <p class="lab-lede">
          Distributed tracing tools show requests as spans across services. Shutdown is a trace too — a single
          SIGTERM ripples through the load balancer, the application, and every resource it holds, in a specific
          order. Press play and watch the playhead sweep across it.
        </p>

        <div class="lab-panel trace-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="play()" [disabled]="isPlaying()">
              {{ hasPlayed() && !isPlaying() ? '▶ Replay' : '▶ Play trace' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="!hasPlayed() && !isPlaying()">Reset</button>
            <span class="mono trace-clock" aria-live="polite">T+{{ playheadSeconds().toFixed(1) }}s</span>
          </div>

          <div class="trace-timeline">
            <div class="trace-axis" aria-hidden="true">
              @for (mark of axisMarks; track mark) {
                <span class="trace-axis-tick" [style.left.%]="(mark / TOTAL_SECONDS) * 100">T+{{ mark }}s</span>
              }
            </div>

            <div class="trace-playhead" [style.left.%]="playheadPct()" [class.is-active]="isPlaying()" aria-hidden="true"></div>

            <div class="trace-lanes">
              @for (lane of lanes; track lane) {
                <div class="trace-lane">
                  <div class="trace-lane-label mono">{{ lane }}</div>
                  <div class="trace-lane-track">
                    @for (evt of eventsByLane(lane); track evt.id) {
                      <button
                        type="button"
                        class="trace-marker"
                        [style.left.%]="(evt.tSeconds / TOTAL_SECONDS) * 100"
                        [class.is-revealed]="revealedIds().has(evt.id)"
                        [attr.aria-pressed]="revealedIds().has(evt.id)"
                        (click)="toggleManualReveal(evt.id)"
                        [attr.title]="evt.label + ' at T+' + evt.tSeconds + 's'"
                      >
                        <span class="trace-marker-dot" aria-hidden="true"></span>
                        <span class="trace-marker-label mono">{{ evt.label }}</span>
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <ol class="trace-log" aria-label="Revealed events in order">
            @for (evt of revealedEventsInOrder(); track evt.id) {
              <li class="mono">T+{{ evt.tSeconds }}s &mdash; <strong>{{ evt.lane }}</strong>: {{ evt.label }}</li>
            } @empty {
              <li class="mono trace-log-empty">Press play, or click any marker, to reveal shutdown events in order.</li>
            }
          </ol>
        </div>
      </div>
    </section>
  `,
  styles: `
    .trace-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .trace-clock { margin-left: auto; color: var(--text-muted); font-size: 0.8125rem; align-self: center; }
    .lab-btn-row { align-items: center; }

    .trace-timeline { position: relative; margin-top: 28px; padding-top: 20px; }

    .trace-axis { position: relative; height: 18px; margin-bottom: 6px; }
    .trace-axis-tick {
      position: absolute;
      transform: translateX(-50%);
      font-size: 0.625rem;
      color: var(--text-faint);
      font-family: var(--font-mono);
      white-space: nowrap;
    }

    .trace-playhead {
      position: absolute;
      top: 20px;
      bottom: 0;
      width: 2px;
      background: var(--signal);
      box-shadow: 0 0 10px color-mix(in srgb, var(--signal) 60%, transparent);
      transition: left 0.05s linear;
      z-index: 3;
      pointer-events: none;
    }
    .trace-playhead.is-active { background: var(--draining); box-shadow: 0 0 12px color-mix(in srgb, var(--draining) 70%, transparent); }

    .trace-lanes { display: flex; flex-direction: column; gap: 10px; }
    .trace-lane { display: grid; grid-template-columns: 110px 1fr; align-items: center; gap: 10px; }
    @media (min-width: 640px) { .trace-lane { grid-template-columns: 140px 1fr; } }

    .trace-lane-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.04em; }

    .trace-lane-track {
      position: relative;
      height: 34px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      overflow: visible;
    }

    .trace-marker {
      position: absolute;
      top: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 3px 3px;
      background: none;
      border: none;
      cursor: pointer;
      max-width: 40px;
      overflow: visible;
    }
    .trace-marker-dot {
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: var(--idle);
      border: 2px solid var(--surface);
      flex-shrink: 0;
      transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.2s ease;
    }
    .trace-marker-label {
      font-size: 0.625rem;
      color: var(--text-faint);
      white-space: nowrap;
      opacity: 0;
      transform: translateX(-4px);
      transition: opacity 0.2s ease, transform 0.2s ease, color 0.2s ease;
      pointer-events: none;
    }

    .trace-marker.is-revealed .trace-marker-dot {
      background: var(--draining);
      box-shadow: 0 0 10px color-mix(in srgb, var(--draining) 55%, transparent);
      transform: scale(1.2);
    }
    .trace-marker.is-revealed .trace-marker-label {
      opacity: 1;
      transform: translateX(0);
      color: var(--text);
      font-weight: 600;
    }
    .trace-marker:hover .trace-marker-dot { box-shadow: 0 0 8px color-mix(in srgb, var(--accent-2) 50%, transparent); }
    .trace-marker:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; border-radius: 4px; }

    .trace-log {
      margin: 20px 0 0;
      padding: 14px 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--text-muted);
      min-height: 40px;
    }
    .trace-log li strong { color: var(--text); }
    .trace-log-empty { color: var(--text-faint); }

    @media (prefers-reduced-motion: reduce) {
      .trace-playhead { transition: none; }
      .trace-marker-dot, .trace-marker-label { transition: none; }
    }
  `,
})
export class ShutdownTraceTimeline implements OnDestroy {
  protected readonly TOTAL_SECONDS = TOTAL_SECONDS;
  protected readonly lanes = LANES;
  protected readonly axisMarks = [0, 1, 2, 3, 4, 5, 6];

  protected readonly isPlaying = signal(false);
  protected readonly hasPlayed = signal(false);
  protected readonly playheadSeconds = signal(0);
  protected readonly revealedIds = signal<Set<string>>(new Set());

  private rafId: number | null = null;
  private startTime = 0;

  protected readonly playheadPct = computed(() => Math.min(100, (this.playheadSeconds() / TOTAL_SECONDS) * 100));

  protected readonly revealedEventsInOrder = computed(() => {
    const ids = this.revealedIds();
    return EVENTS.filter((e) => ids.has(e.id)).sort((a, b) => a.tSeconds - b.tSeconds);
  });

  ngOnDestroy(): void {
    this.stopAnimation();
  }

  protected eventsByLane(lane: string): TraceEvent[] {
    return EVENTS.filter((e) => e.lane === lane);
  }

  protected toggleManualReveal(id: string): void {
    if (this.isPlaying()) return;
    this.revealedIds.update((set) => {
      const next = new Set(set);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected play(): void {
    if (this.isPlaying()) return;
    this.isPlaying.set(true);
    this.hasPlayed.set(true);
    this.revealedIds.set(new Set());
    this.playheadSeconds.set(0);
    this.startTime = performance.now();
    this.tickAnimation();
  }

  private tickAnimation = (): void => {
    const elapsedMs = performance.now() - this.startTime;
    const seconds = Math.min(TOTAL_SECONDS, (elapsedMs / PLAYBACK_MS) * TOTAL_SECONDS);
    this.playheadSeconds.set(seconds);

    const toReveal = EVENTS.filter((e) => e.tSeconds <= seconds);
    if (toReveal.length > this.revealedIds().size) {
      this.revealedIds.set(new Set(toReveal.map((e) => e.id)));
    }

    if (seconds >= TOTAL_SECONDS) {
      this.isPlaying.set(false);
      this.rafId = null;
      return;
    }

    this.rafId = requestAnimationFrame(this.tickAnimation);
  };

  private stopAnimation(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  protected reset(): void {
    this.stopAnimation();
    this.isPlaying.set(false);
    this.hasPlayed.set(false);
    this.playheadSeconds.set(0);
    this.revealedIds.set(new Set());
  }
}
