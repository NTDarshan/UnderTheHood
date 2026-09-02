import { Component, OnDestroy, computed, signal } from '@angular/core';

type Stage = 'http' | 'handler' | 'async' | 'db' | 'response' | 'done';
type ReqState = 'RUNNING' | 'WAITING' | 'BLOCKED' | 'DONE';

interface Segment {
  kind: 'cpu' | 'io' | 'queue' | 'db';
  ms: number;
}

interface RequestDef {
  id: string;
  threadId: string;
  startDelay: number;
  segments: Segment[];
  blockedOn: string | null;
}

const REQUEST_DEFS: RequestDef[] = [
  {
    id: 'R1',
    threadId: 'worker-1',
    startDelay: 0,
    segments: [
      { kind: 'cpu', ms: 400 },
      { kind: 'io', ms: 600 },
      { kind: 'db', ms: 500 },
      { kind: 'cpu', ms: 200 },
    ],
    blockedOn: null,
  },
  {
    id: 'R2',
    threadId: 'worker-2',
    startDelay: 150,
    segments: [
      { kind: 'cpu', ms: 300 },
      { kind: 'queue', ms: 700 },
      { kind: 'db', ms: 400 },
      { kind: 'cpu', ms: 150 },
    ],
    blockedOn: 'connection pool (db-pool-1)',
  },
  {
    id: 'R3',
    threadId: 'worker-3',
    startDelay: 300,
    segments: [
      { kind: 'cpu', ms: 250 },
      { kind: 'io', ms: 350 },
      { kind: 'db', ms: 300 },
      { kind: 'cpu', ms: 180 },
    ],
    blockedOn: null,
  },
  {
    id: 'R4',
    threadId: 'worker-1',
    startDelay: 450,
    segments: [
      { kind: 'cpu', ms: 350 },
      { kind: 'io', ms: 900 },
      { kind: 'db', ms: 250 },
      { kind: 'cpu', ms: 120 },
    ],
    blockedOn: 'mutex on cache entry "user:44"',
  },
  {
    id: 'R5',
    threadId: 'worker-2',
    startDelay: 600,
    segments: [
      { kind: 'cpu', ms: 200 },
      { kind: 'queue', ms: 300 },
      { kind: 'db', ms: 600 },
      { kind: 'cpu', ms: 160 },
    ],
    blockedOn: null,
  },
];

const KIND_LABEL: Record<Segment['kind'], string> = {
  cpu: 'CPU time',
  io: 'I/O wait',
  queue: 'Queue wait',
  db: 'DB wait',
};

const STAGE_LABEL: Record<Stage, string> = {
  http: 'HTTP layer',
  handler: 'Request handler',
  async: 'Async operation',
  db: 'Database',
  response: 'Response',
  done: 'Complete',
};

const STAGE_ORDER: Stage[] = ['http', 'handler', 'async', 'db', 'response', 'done'];

interface LiveRequest {
  def: RequestDef;
  elapsed: number;
  stageIndex: number;
  finished: boolean;
}

@Component({
  selector: 'app-server-concurrency-trace',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="server-concurrency-trace">
      <div class="container">
        <p class="lab-index mono">39,44,45 — TRACING A REQUEST THROUGH A CONCURRENT SERVER</p>
        <h2 class="lab-title">Tracing a request through a concurrent server</h2>
        <p class="lab-lede">
          Five requests (R1–R5) enter the server within a fraction of a second and are handled concurrently.
          Each one moves through the same pipeline — HTTP layer → request handler → async operation → database →
          response — but spends a different amount of time in CPU work, I/O wait, queueing, and DB wait. Run the
          trace, then click any request to inspect it like a profiler would.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="run()">
              {{ isRunning() ? 'Tracing…' : 'Run' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="pipeline-strip mono">
            @for (s of stageStrip; track s; let last = $last) {
              <span class="pipeline-stage">{{ s }}</span>
              @if (!last) {
                <span class="lab-flow-arrow">&rarr;</span>
              }
            }
          </div>

          <div class="trace-table" aria-live="polite">
            @for (r of liveRequests(); track r.def.id) {
              <button
                type="button"
                class="trace-row"
                [class.is-selected]="selectedId() === r.def.id"
                [attr.aria-pressed]="selectedId() === r.def.id"
                (click)="select(r.def.id)"
              >
                <span class="row-id mono">{{ r.def.id }}</span>
                <span class="row-stage mono">{{ stageLabel(r) }}</span>
                <span class="timeline" [attr.aria-label]="'Execution trace for ' + r.def.id">
                  @for (seg of visibleSegments(r); track $index) {
                    <span
                      class="seg"
                      [class]="'seg-' + seg.kind"
                      [style.width.%]="segWidthPct(r.def, seg)"
                      [title]="kindLabel(seg.kind) + ': ' + seg.ms + 'ms'"
                    ></span>
                  }
                </span>
                <span class="row-state pill" [class]="pillClassFor(r)">{{ stateOf(r) }}</span>
              </button>
            }
          </div>

          <p class="legend mono">
            <span class="legend-item"><span class="dot seg-cpu"></span>CPU time</span>
            <span class="legend-item"><span class="dot seg-io"></span>I/O wait</span>
            <span class="legend-item"><span class="dot seg-queue"></span>Queue wait</span>
            <span class="legend-item"><span class="dot seg-db"></span>DB wait</span>
          </p>

          @if (selectedInfo(); as info) {
            <div class="inspector">
              <p class="inspector-title mono">INSPECTOR — {{ info.def.id }}</p>
              <dl class="inspector-grid">
                <dt>Thread / task id</dt>
                <dd class="mono">{{ info.def.threadId }}</dd>

                <dt>State</dt>
                <dd>
                  <span class="pill" [class]="pillClassFor(info)">{{ stateOf(info) }}</span>
                </dd>

                <dt>Blocked on</dt>
                <dd>{{ info.def.blockedOn ?? '— nothing, not currently blocked' }}</dd>

                <dt>CPU time so far</dt>
                <dd class="mono">{{ cpuTimeSoFar(info) }}ms</dd>

                <dt>Wait time so far</dt>
                <dd class="mono">{{ waitTimeSoFar(info) }}ms</dd>

                <dt>Total latency (target)</dt>
                <dd class="mono">{{ totalMs(info.def) }}ms</dd>

                <dt>Latency breakdown</dt>
                <dd>
                  <span class="breakdown mono">
                    @for (seg of info.def.segments; track $index; let last = $last) {
                      {{ kindLabel(seg.kind) }}: {{ seg.ms }}ms@if (!last) {, }
                    }
                  </span>
                </dd>
              </dl>
            </div>
          } @else {
            <p class="lab-note">Click any request row above to open its inspector.</p>
          }
        </div>

        <p class="lab-note lab-note-warn">
          Notice R2 and R4 spend most of their time not running at all — R2 waits in queue for the connection
          pool, R4 blocks on a mutex held by another request. More requests does not mean more parallel CPU work;
          it usually means more waiting.
        </p>
      </div>
    </section>
  `,
  styles: `
    .pipeline-strip { margin-top: 20px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; font-size: 0.6875rem; color: var(--text-faint); }
    .pipeline-stage { padding: 4px 8px; border: 1px solid var(--border); border-radius: var(--radius-sm); }

    .trace-table { margin-top: 20px; display: flex; flex-direction: column; gap: 8px; }
    .trace-row {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      display: grid;
      grid-template-columns: 40px 130px 1fr 90px;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface);
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .trace-row:hover { border-color: var(--border-strong); }
    .trace-row.is-selected { border-color: var(--accent); background: var(--surface-raised); }
    .trace-row:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .row-id { font-size: 0.8125rem; font-weight: 700; color: var(--text); }
    .row-stage { font-size: 0.6875rem; color: var(--text-faint); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .timeline { position: relative; display: flex; height: 18px; border-radius: 4px; overflow: hidden; background: var(--surface-elevated); border: 1px solid var(--border); min-width: 120px; }
    .seg { height: 100%; flex-shrink: 0; }
    .seg-cpu { background: var(--c-cpu); }
    .seg-io { background: var(--waiting); }
    .seg-queue { background: var(--c-queue); }
    .seg-db { background: var(--c-thread); }

    .row-state { justify-self: end; }

    .legend { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 14px; font-size: 0.6875rem; color: var(--text-faint); }
    .legend-item { display: inline-flex; align-items: center; gap: 6px; }
    .dot { display: inline-block; width: 9px; height: 9px; border-radius: 2px; }

    .inspector { margin-top: 22px; padding: 16px 18px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-elevated); }
    .inspector-title { font-size: 0.75rem; color: var(--accent-2); letter-spacing: 0.05em; margin: 0 0 12px; }
    .inspector-grid { display: grid; grid-template-columns: 1fr; gap: 4px 12px; margin: 0; }
    @media (min-width: 720px) { .inspector-grid { grid-template-columns: 190px 1fr; } }
    .inspector-grid dt { font-size: 0.75rem; color: var(--text-faint); margin-top: 10px; }
    .inspector-grid dd { margin: 2px 0 0; color: var(--text-muted); font-size: 0.9375rem; }
    .breakdown { font-size: 0.8125rem; color: var(--text-muted); }
  `,
})
export class ServerConcurrencyTrace implements OnDestroy {
  protected readonly stageStrip = ['HTTP layer', 'Request handler', 'Async operation', 'Database', 'Response'];
  protected readonly isRunning = signal(false);
  protected readonly selectedId = signal<string | null>(null);
  private readonly elapsedMs = signal(0);

  private timer: ReturnType<typeof setInterval> | null = null;
  private readonly tickMs = 60;

  protected readonly liveRequests = computed<LiveRequest[]>(() => {
    const now = this.elapsedMs();
    return REQUEST_DEFS.map((def) => this.computeLive(def, now));
  });

  protected readonly selectedInfo = computed<LiveRequest | undefined>(() => {
    const id = this.selectedId();
    if (!id) return undefined;
    return this.liveRequests().find((r) => r.def.id === id);
  });

  private computeLive(def: RequestDef, now: number): LiveRequest {
    const localElapsed = Math.max(0, now - def.startDelay);
    const total = def.segments.reduce((s, seg) => s + seg.ms, 0);
    const capped = Math.min(localElapsed, total);

    // Determine stage index proportional to progress through the pipeline (5 real stages + done).
    const progressRatio = total === 0 ? 1 : capped / total;
    const stageCount = STAGE_ORDER.length - 1; // excluding 'done'
    let stageIndex = Math.min(stageCount - 1, Math.floor(progressRatio * stageCount));
    const finished = localElapsed >= total && now >= def.startDelay;
    if (finished) stageIndex = STAGE_ORDER.length - 1;
    if (now < def.startDelay) stageIndex = 0;

    return { def, elapsed: capped, stageIndex, finished };
  }

  protected stageLabel(r: LiveRequest): string {
    if (this.elapsedMs() < r.def.startDelay) return 'Queued (not started)';
    return STAGE_LABEL[STAGE_ORDER[r.stageIndex]];
  }

  protected visibleSegments(r: LiveRequest): Segment[] {
    const out: Segment[] = [];
    let remaining = r.elapsed;
    for (const seg of r.def.segments) {
      if (remaining <= 0) break;
      const used = Math.min(seg.ms, remaining);
      out.push({ kind: seg.kind, ms: used });
      remaining -= used;
    }
    return out;
  }

  protected segWidthPct(def: RequestDef, seg: Segment): number {
    const total = this.totalMs(def);
    return total === 0 ? 0 : (seg.ms / total) * 100;
  }

  protected totalMs(def: RequestDef): number {
    return def.segments.reduce((s, seg) => s + seg.ms, 0);
  }

  protected kindLabel(kind: Segment['kind']): string {
    return KIND_LABEL[kind];
  }

  protected stateOf(r: LiveRequest): ReqState {
    if (this.elapsedMs() < r.def.startDelay) return 'WAITING';
    if (r.finished) return 'DONE';
    const activeSeg = this.activeSegmentKind(r);
    if (activeSeg === 'cpu') return 'RUNNING';
    if (activeSeg === 'queue' || activeSeg === 'db') return r.def.blockedOn ? 'BLOCKED' : 'WAITING';
    return 'WAITING';
  }

  private activeSegmentKind(r: LiveRequest): Segment['kind'] | null {
    let acc = 0;
    for (const seg of r.def.segments) {
      acc += seg.ms;
      if (r.elapsed < acc) return seg.kind;
    }
    return null;
  }

  protected pillClassFor(r: LiveRequest): string {
    const state = this.stateOf(r);
    if (state === 'RUNNING') return 'pill-yes';
    if (state === 'BLOCKED') return 'pill-no';
    if (state === 'DONE') return 'pill-yes';
    return 'pill-conditional';
  }

  protected cpuTimeSoFar(r: LiveRequest): number {
    let acc = 0;
    let cpu = 0;
    for (const seg of r.def.segments) {
      const start = acc;
      acc += seg.ms;
      if (r.elapsed <= start) break;
      const used = Math.min(seg.ms, r.elapsed - start);
      if (seg.kind === 'cpu') cpu += used;
    }
    return Math.round(cpu);
  }

  protected waitTimeSoFar(r: LiveRequest): number {
    return Math.round(r.elapsed - this.cpuTimeSoFar(r));
  }

  protected select(id: string): void {
    this.selectedId.set(this.selectedId() === id ? null : id);
  }

  protected run(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.elapsedMs.set(0);
    this.selectedId.set(null);

    const maxTotal = Math.max(...REQUEST_DEFS.map((d) => d.startDelay + this.totalMs(d)));
    this.timer = setInterval(() => {
      const next = this.elapsedMs() + this.tickMs;
      this.elapsedMs.set(next);
      if (next >= maxTotal + this.tickMs) {
        this.stopTimer();
        this.isRunning.set(false);
      }
    }, this.tickMs);
  }

  protected reset(): void {
    this.stopTimer();
    this.isRunning.set(false);
    this.elapsedMs.set(0);
    this.selectedId.set(null);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
