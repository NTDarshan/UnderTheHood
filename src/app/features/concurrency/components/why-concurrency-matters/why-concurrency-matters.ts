import { Component, computed, signal } from '@angular/core';

type Mode = 'sequential' | 'concurrent';

interface InFlightRequest {
  id: number;
  activity: string;
}

const ACTIVITIES = ['waiting for database', 'CPU work', 'waiting for network'];

@Component({
  selector: 'app-why-concurrency-matters',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="why-concurrency-matters">
      <div class="container">
        <p class="lab-index">01 — WHY CONCURRENCY MATTERS</p>
        <h2 class="lab-title">100 requests hit your server. What happens next?</h2>
        <p class="lab-lede">Toggle between two ways of handling the same load and watch what changes.</p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button
              type="button"
              class="lab-btn"
              [attr.aria-pressed]="mode() === 'sequential'"
              [class.is-active]="mode() === 'sequential'"
              (click)="setMode('sequential')"
            >
              Without concurrency
            </button>
            <button
              type="button"
              class="lab-btn"
              [attr.aria-pressed]="mode() === 'concurrent'"
              [class.is-active]="mode() === 'concurrent'"
              (click)="setMode('concurrent')"
            >
              With concurrency
            </button>
          </div>

          <div class="scene" aria-live="polite">
            @if (mode() === 'sequential') {
              <div class="seq-timeline mono">
                @for (r of sequentialSlots(); track r.id; let last = $last) {
                  <div class="seq-block" [class.is-active]="r.id === activeSeqId()" [class.is-done]="r.id < activeSeqId()">
                    Req {{ r.id }}
                  </div>
                  @if (!last) {
                    <span class="seq-gap">wait</span>
                  }
                }
              </div>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="runSequential()">
                  Step through requests
                </button>
              </div>
              <p class="queue-counter mono">Queue backlog: <strong>{{ backlog() }}</strong> requests waiting</p>
            } @else {
              <div class="concurrent-grid">
                @for (r of inFlight(); track r.id) {
                  <div class="cc-card">
                    <p class="cc-id mono">Req {{ r.id }}</p>
                    <p class="cc-activity mono">{{ r.activity }}</p>
                  </div>
                }
              </div>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="runConcurrent()">
                  Dispatch concurrently
                </button>
              </div>
            }
          </div>

          <div class="metrics-grid">
            <div class="metric">
              <p class="metric-label mono">RESOURCE UTILIZATION</p>
              <p class="metric-value mono">{{ utilization() }}%</p>
            </div>
            <div class="metric">
              <p class="metric-label mono">THROUGHPUT</p>
              <p class="metric-value mono">{{ throughput() }} req/s</p>
            </div>
            <div class="metric">
              <p class="metric-label mono">RESPONSIVENESS</p>
              <p class="metric-value mono">{{ responsiveness() }} ms</p>
            </div>
          </div>
        </div>

        <p class="lab-note">
          Concurrency is fundamentally about managing multiple pieces of work that are in progress.
        </p>
      </div>
    </section>
  `,
  styles: `
    .cx-scene {
      --running: #4ade80;
      --waiting: var(--accent);
      --blocked: var(--danger);
      --idle: #64748b;
      --c-cpu: #60a5fa;
      --c-thread: #a78bfa;
      --c-task: var(--accent-2);
      --c-lock: #f472b6;
      --c-queue: #fbbf24;
    }

    .scene { min-height: 160px; }

    .seq-timeline { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; }
    .seq-block {
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--text-faint);
      font-size: 0.8125rem;
      transition: all 0.2s ease;
    }
    .seq-block.is-active { border-color: var(--waiting); color: var(--waiting); box-shadow: 0 0 12px rgba(255, 138, 61, 0.25); }
    .seq-block.is-done { border-color: var(--running); color: var(--running); }
    .seq-gap { font-size: 0.6875rem; color: var(--text-faint); }

    .queue-counter { margin-top: 16px; font-size: 0.8125rem; color: var(--text-muted); }
    .queue-counter strong { color: var(--blocked); }

    .concurrent-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
    .cc-card { padding: 12px; border: 1px solid var(--c-task); border-radius: var(--radius-sm); background: var(--surface); }
    .cc-id { font-size: 0.75rem; color: var(--text); margin-bottom: 4px; }
    .cc-activity { font-size: 0.6875rem; color: var(--c-task); }

    .metrics-grid { margin-top: 24px; display: grid; grid-template-columns: repeat(1, 1fr); gap: 12px; padding-top: 20px; border-top: 1px solid var(--border); }
    @media (min-width: 640px) { .metrics-grid { grid-template-columns: repeat(3, 1fr); } }
    .metric { padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .metric-label { font-size: 0.625rem; letter-spacing: 0.06em; color: var(--text-faint); margin-bottom: 6px; }
    .metric-value { font-size: 1.0625rem; color: var(--text); }
  `,
})
export class WhyConcurrencyMatters {
  protected readonly mode = signal<Mode>('sequential');
  protected readonly isRunning = signal(false);

  protected readonly sequentialSlots = signal([{ id: 1 }, { id: 2 }, { id: 3 }]);
  protected readonly activeSeqId = signal(0);
  protected readonly backlog = signal(97);

  protected readonly inFlight = signal<InFlightRequest[]>([]);

  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly utilization = computed(() => (this.mode() === 'sequential' ? 12 : 78));
  protected readonly throughput = computed(() => (this.mode() === 'sequential' ? 3 : 42));
  protected readonly responsiveness = computed(() => (this.mode() === 'sequential' ? 2400 : 180));

  protected setMode(mode: Mode): void {
    if (this.isRunning()) return;
    this.mode.set(mode);
    this.activeSeqId.set(0);
    this.backlog.set(97);
    this.inFlight.set([]);
  }

  protected runSequential(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.activeSeqId.set(0);
    this.backlog.set(97);

    let step = 0;
    this.timer = setInterval(() => {
      step++;
      this.activeSeqId.set(step);
      this.backlog.set(Math.max(0, 97 - step * 3));
      if (step >= 3) {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this.isRunning.set(false);
      }
    }, 700);
  }

  protected runConcurrent(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.inFlight.set([]);

    let count = 0;
    this.timer = setInterval(() => {
      count++;
      const activity = ACTIVITIES[count % ACTIVITIES.length];
      this.inFlight.update((list) => [...list, { id: count, activity }].slice(-6));
      if (count >= 6) {
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this.isRunning.set(false);
      }
    }, 350);
  }
}
