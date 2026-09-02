import { Component, computed, signal } from '@angular/core';

interface SimResult {
  effCores: number;
  effThreads: number;
  effDbConnections: number;
  effDbLatency: number;
  effRetryMultiplier: number;
  arrivalRate: number;
  acceptedRate: number;
  rejectedRate: number;
  capacity: number;
  utilization: number;
  queueDepth: number;
  cpuPct: number;
  connectionExhaustionPct: number;
  raceActive: boolean;
  deadlockActive: boolean;
  starvationActive: boolean;
  retryAmplification: number;
  latencyMs: number;
  hangs: boolean;
  healthScore: number;
  health: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

type FixKey =
  | 'asyncIO'
  | 'threadPoolTuned'
  | 'concurrencyLimit'
  | 'backpressureOn'
  | 'timeoutsSet'
  | 'cancellationOn'
  | 'properLocking'
  | 'messagePassing'
  | 'connectionPoolSized'
  | 'cachingOn'
  | 'retryBackoffJitter';

interface FixDef {
  key: FixKey;
  label: string;
  hint: string;
}

const FIXES: FixDef[] = [
  { key: 'asyncIO', label: 'Enable async I/O', hint: 'Non-blocking I/O — one thread services many in-flight requests instead of blocking per request.' },
  { key: 'threadPoolTuned', label: 'Tune thread pool', hint: 'Cap thread count near a sane multiple of cores instead of thousands of contending threads.' },
  { key: 'concurrencyLimit', label: 'Set a concurrency limit', hint: 'Cap in-flight requests so excess load is shed or queued, not accepted unconditionally.' },
  { key: 'backpressureOn', label: 'Enable backpressure', hint: 'Signal upstream to slow down once the queue is full, instead of growing it without bound.' },
  { key: 'timeoutsSet', label: 'Set timeouts', hint: 'Force every call to give up after a bound, instead of holding resources indefinitely.' },
  { key: 'cancellationOn', label: 'Enable cancellation', hint: 'Free resources immediately when a caller gives up, instead of finishing wasted work.' },
  { key: 'properLocking', label: 'Re-enable proper locking / atomic ops', hint: 'Guard shared state with correct synchronization or lock-free atomics — removes lost updates.' },
  { key: 'messagePassing', label: 'Switch to message passing', hint: 'Threads stop sharing mutable state directly, communicating over channels instead — no locks to deadlock on.' },
  { key: 'connectionPoolSized', label: 'Size the connection pool sensibly', hint: 'Right-size the DB pool to what the database can actually serve, not an arbitrary number.' },
  { key: 'cachingOn', label: 'Enable caching', hint: 'Absorb repeat reads before they reach the database, cutting effective DB latency.' },
  { key: 'retryBackoffJitter', label: 'Retry backoff + jitter', hint: 'Retries back off exponentially with jitter instead of amplifying load in lockstep.' },
];

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

@Component({
  selector: 'app-break-fix-the-system',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="break-the-system">
      <div class="container">
        <p class="lab-index">49-51 — BREAK THE SYSTEM, THEN FIX IT</p>
        <h2 class="lab-title">Break the system, then fix it</h2>
        <p class="lab-lede">
          <strong>The scenario:</strong> an API receives up to 10,000 requests per second. Resources: 8 CPU cores,
          a pool of up to 100 DB connections, an external payment API, and a Redis cache. Push the controls below
          into unsafe territory and watch the failure modes appear live — then apply real fixes on top and watch
          the same metrics recover.
        </p>

        <div class="lab-panel health-panel" aria-live="polite">
          <div class="health-row">
            <span class="lab-node">System health</span>
            <span class="pill health-pill" [class.pill-yes]="sim().health === 'HEALTHY'"
                  [class.pill-conditional]="sim().health === 'DEGRADED'"
                  [class.pill-no]="sim().health === 'CRITICAL'">
              {{ sim().health }}
            </span>
            <span class="health-score mono">score {{ sim().healthScore }}/100</span>
          </div>
          <div class="health-bar">
            <div class="health-bar-fill" [style.width.%]="sim().healthScore"
                 [class.is-good]="sim().health === 'HEALTHY'"
                 [class.is-warn]="sim().health === 'DEGRADED'"
                 [class.is-bad]="sim().health === 'CRITICAL'"></div>
          </div>
        </div>

        <div class="lab-panel">
          <div class="panel-header-row">
            <h3 class="panel-heading">Break it</h3>
            <button type="button" class="lab-btn" (click)="jumpToFixes($event)">Jump to fixes &darr;</button>
          </div>
          <p class="lab-note">Push traffic up and resources down until the metrics below turn red.</p>

          <div class="controls-grid">
            <label class="lab-field">
              <span>Request rate: {{ requestsPerSec() }} req/s</span>
              <input type="range" min="100" max="20000" step="100" [value]="requestsPerSec()"
                     (input)="requestsPerSec.set(+$any($event.target).value)" />
            </label>

            <label class="lab-field">
              <span>CPU cores available: {{ cpuCores() }}</span>
              <input type="range" min="1" max="8" step="1" [value]="cpuCores()"
                     (input)="cpuCores.set(+$any($event.target).value)" />
            </label>

            <label class="lab-field">
              <span>DB connection pool size: {{ dbConnections() }}</span>
              <input type="range" min="5" max="100" step="5" [value]="dbConnections()"
                     (input)="dbConnections.set(+$any($event.target).value)" />
            </label>

            <label class="lab-field">
              <span>DB query latency: {{ dbLatencyMs() }} ms</span>
              <input type="range" min="5" max="500" step="5" [value]="dbLatencyMs()"
                     (input)="dbLatencyMs.set(+$any($event.target).value)" />
            </label>

            <label class="lab-field">
              <span>Thread count: {{ threadCount() }}</span>
              <input type="range" min="10" max="5000" step="10" [value]="threadCount()"
                     (input)="threadCount.set(+$any($event.target).value)" />
            </label>

            <label class="lab-field">
              <span>Queue capacity: {{ queueSize() }}</span>
              <input type="range" min="100" max="50000" step="100" [value]="queueSize()"
                     (input)="queueSize.set(+$any($event.target).value)" />
            </label>

            <label class="lab-field">
              <span>Retry rate: {{ retryMultiplier() }}&times;</span>
              <input type="range" min="1" max="10" step="0.5" [value]="retryMultiplier()"
                     (input)="retryMultiplier.set(+$any($event.target).value)" />
            </label>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" [attr.aria-pressed]="lockContentionHigh()"
                    (click)="lockContentionHigh.set(!lockContentionHigh())">
              Lock contention: {{ lockContentionHigh() ? 'HIGH' : 'low' }}
            </button>
            <button type="button" class="lab-btn lab-btn-danger" [attr.aria-pressed]="synchronizationOff()"
                    (click)="synchronizationOff.set(!synchronizationOff())">
              Synchronization: {{ synchronizationOff() ? 'OFF (unsafe)' : 'on' }}
            </button>
            <button type="button" class="lab-btn lab-btn-danger" [attr.aria-pressed]="timeoutsOff()"
                    (click)="timeoutsOff.set(!timeoutsOff())">
              Timeouts: {{ timeoutsOff() ? 'OFF' : 'on' }}
            </button>
            <button type="button" class="lab-btn" (click)="resetAll()">Reset scenario</button>
          </div>
        </div>

        <div class="lab-panel metrics-panel">
          <h3 class="panel-heading">Live consequences</h3>
          <div class="metric-grid">
            <div class="metric-card" [class.is-bad]="sim().queueDepth > queueSize() * 0.6">
              <p class="metric-label mono">QUEUE DEPTH</p>
              <p class="metric-value">{{ formatNumber(sim().queueDepth) }}</p>
              <p class="metric-sub">of {{ formatNumber(queueSize()) }} capacity</p>
            </div>

            <div class="metric-card" [class.is-warn]="sim().cpuPct >= 70 && sim().cpuPct < 92" [class.is-bad]="sim().cpuPct >= 92">
              <p class="metric-label mono">CPU SATURATION</p>
              <p class="metric-value">{{ sim().cpuPct }}%</p>
              <div class="metric-gauge"><div class="metric-gauge-fill" [style.width.%]="sim().cpuPct"></div></div>
            </div>

            <div class="metric-card" [class.is-warn]="sim().connectionExhaustionPct >= 70 && sim().connectionExhaustionPct < 95" [class.is-bad]="sim().connectionExhaustionPct >= 95">
              <p class="metric-label mono">DB CONNECTION USE</p>
              <p class="metric-value">{{ sim().connectionExhaustionPct }}%</p>
              <div class="metric-gauge"><div class="metric-gauge-fill" [style.width.%]="sim().connectionExhaustionPct"></div></div>
            </div>

            <div class="metric-card" [class.is-bad]="sim().raceActive">
              <p class="metric-label mono">RACE CONDITION</p>
              <span class="pill" [class.pill-yes]="!sim().raceActive" [class.pill-no]="sim().raceActive">
                {{ sim().raceActive ? 'ACTIVE' : 'safe' }}
              </span>
              <p class="metric-sub">unsynchronized shared state under concurrent writes</p>
            </div>

            <div class="metric-card" [class.is-bad]="sim().deadlockActive">
              <p class="metric-label mono">DEADLOCK</p>
              <span class="pill" [class.pill-yes]="!sim().deadlockActive" [class.pill-no]="sim().deadlockActive">
                {{ sim().deadlockActive ? 'ACTIVE' : 'safe' }}
              </span>
              <p class="metric-sub">contended locks, no ordering, no timeout to break the cycle</p>
            </div>

            <div class="metric-card" [class.is-bad]="sim().starvationActive">
              <p class="metric-label mono">STARVATION</p>
              <span class="pill" [class.pill-yes]="!sim().starvationActive" [class.pill-no]="sim().starvationActive">
                {{ sim().starvationActive ? 'ACTIVE' : 'safe' }}
              </span>
              <p class="metric-sub">some threads never win the scheduler or the lock</p>
            </div>

            <div class="metric-card" [class.is-warn]="sim().retryAmplification >= 2 && sim().retryAmplification < 4" [class.is-bad]="sim().retryAmplification >= 4">
              <p class="metric-label mono">RETRY-STORM AMPLIFICATION</p>
              <p class="metric-value">{{ sim().retryAmplification.toFixed(1) }}&times;</p>
              <p class="metric-sub">effective load vs. real client demand</p>
            </div>

            <div class="metric-card" [class.is-warn]="!sim().hangs && sim().latencyMs >= 500 && sim().latencyMs < 3000" [class.is-bad]="sim().hangs || sim().latencyMs >= 3000">
              <p class="metric-label mono">OVERALL LATENCY</p>
              @if (sim().hangs) {
                <p class="metric-value metric-value-bad">HANGS</p>
                <p class="metric-sub">no timeout — requests never give up</p>
              } @else {
                <p class="metric-value">{{ formatNumber(sim().latencyMs) }} ms</p>
                <p class="metric-sub">p99-ish, approximate</p>
              }
            </div>
          </div>
        </div>

        <div id="fix-the-system" class="lab-panel fix-panel">
          <h3 class="panel-heading">Fix it</h3>
          <p class="lab-note">
            Apply engineering fixes on top of whatever you broke above. Each one targets specific failure modes —
            watch which metric cards recover as you toggle them.
          </p>
          <div class="fix-grid">
            @for (fix of fixes; track fix.key) {
              <button
                type="button"
                class="lab-btn lab-btn-primary fix-btn"
                [class.is-active]="fixesOn().has(fix.key)"
                [attr.aria-pressed]="fixesOn().has(fix.key)"
                (click)="toggleFix(fix.key)"
                [title]="fix.hint"
              >
                {{ fixesOn().has(fix.key) ? '✓ ' : '' }}{{ fix.label }}
              </button>
            }
          </div>
          <p class="lab-note">
            {{ appliedFixCount() }} of {{ fixes.length }} fixes applied.
            @if (appliedFixCount() === fixes.length && sim().health === 'HEALTHY') {
              <strong> Every lever is now working with the system instead of against it.</strong>
            }
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .health-panel { padding: 18px 24px; }
    .health-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .health-score { color: var(--text-faint); font-size: 0.75rem; }
    .health-bar { margin-top: 12px; height: 8px; border-radius: 999px; background: var(--surface); overflow: hidden; border: 1px solid var(--border); }
    .health-bar-fill { height: 100%; border-radius: 999px; transition: width 0.25s ease, background 0.25s ease; background: var(--danger); }
    .health-bar-fill.is-good { background: var(--running); }
    .health-bar-fill.is-warn { background: var(--waiting); }
    .health-bar-fill.is-bad { background: var(--blocked); }

    .panel-header-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .panel-heading { font-size: 1.125rem; color: var(--text); margin: 0; }

    .controls-grid { margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .controls-grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1000px) { .controls-grid { grid-template-columns: 1fr 1fr 1fr; } }
    .controls-grid input[type='range'] { accent-color: var(--accent); width: 100%; }

    .metrics-panel { border-color: var(--border-strong); }
    .metric-grid { margin-top: 18px; display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 640px) { .metric-grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1000px) { .metric-grid { grid-template-columns: repeat(4, 1fr); } }

    .metric-card {
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .metric-card.is-warn { border-color: var(--waiting); box-shadow: 0 0 0 1px var(--waiting) inset; }
    .metric-card.is-bad { border-color: var(--blocked); box-shadow: 0 0 0 1px var(--blocked) inset; }

    .metric-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .metric-value { margin-top: 6px; font-size: 1.375rem; font-weight: 700; color: var(--text); }
    .metric-value-bad { color: var(--blocked); }
    .metric-sub { margin-top: 4px; font-size: 0.75rem; color: var(--text-faint); line-height: 1.4; }

    .metric-gauge { margin-top: 8px; height: 6px; border-radius: 999px; background: var(--surface-elevated); overflow: hidden; }
    .metric-gauge-fill { height: 100%; background: var(--running); transition: width 0.25s ease, background 0.25s ease; }
    .metric-card.is-warn .metric-gauge-fill { background: var(--waiting); }
    .metric-card.is-bad .metric-gauge-fill { background: var(--blocked); }

    .fix-panel { border-color: var(--accent-2); }
    .fix-grid { margin-top: 18px; display: grid; grid-template-columns: 1fr; gap: 10px; }
    @media (min-width: 640px) { .fix-grid { grid-template-columns: 1fr 1fr; } }
    .fix-btn { justify-content: flex-start; text-align: left; white-space: normal; }
    .fix-btn:not(.is-active) { background: var(--surface-elevated); border-color: var(--border-strong); color: var(--text-muted); }
  `,
})
export class BreakFixTheSystem {
  protected readonly fixes = FIXES;

  // Break controls
  protected readonly requestsPerSec = signal(800);
  protected readonly cpuCores = signal(8);
  protected readonly dbConnections = signal(100);
  protected readonly dbLatencyMs = signal(15);
  protected readonly threadCount = signal(100);
  protected readonly queueSize = signal(2000);
  protected readonly retryMultiplier = signal(1);
  protected readonly lockContentionHigh = signal(false);
  protected readonly synchronizationOff = signal(false);
  protected readonly timeoutsOff = signal(false);

  // Fix controls
  protected readonly fixesOn = signal<Set<FixKey>>(new Set());

  protected readonly appliedFixCount = computed(() => this.fixesOn().size);

  protected readonly sim = computed<SimResult>(() => {
    const fixes = this.fixesOn();
    const has = (k: FixKey) => fixes.has(k);

    const effCores = Math.max(1, this.cpuCores());
    const effThreads = has('threadPoolTuned')
      ? Math.min(this.threadCount(), effCores * 12)
      : this.threadCount();

    const effDbConnections = has('connectionPoolSized')
      ? clamp(this.dbConnections(), effCores * 8, effCores * 25)
      : this.dbConnections();

    const effDbLatency = has('cachingOn') ? this.dbLatencyMs() * 0.4 : this.dbLatencyMs();

    const effRetryMultiplier = has('retryBackoffJitter')
      ? 1 + (this.retryMultiplier() - 1) * 0.15
      : this.retryMultiplier();

    const arrivalRate = this.requestsPerSec() * effRetryMultiplier;

    const concurrencyCap = has('concurrencyLimit') ? effCores * 40 : Number.POSITIVE_INFINITY;
    const acceptedRate = Math.min(arrivalRate, concurrencyCap);
    const rejectedRate = Math.max(0, arrivalRate - acceptedRate);

    const perCoreThroughput = has('asyncIO') ? 900 : 120;
    const oversubscribed = !has('asyncIO') && effThreads > effCores * 30;
    const threadPenalty = oversubscribed ? 0.55 : 1;
    const capacity = Math.max(
      1,
      (effCores * perCoreThroughput * threadPenalty) / (1 + effDbLatency / 40),
    );

    const utilization = acceptedRate / capacity;

    const rawOverflow = Math.max(0, acceptedRate - capacity) * 3;
    const queueDepth = has('backpressureOn')
      ? Math.min(rawOverflow, this.queueSize())
      : rawOverflow;

    const cpuPct = clamp(Math.round(utilization * 80 + (oversubscribed ? 15 : 0)), 0, 100);

    const dbCapacity = effDbConnections * (1000 / Math.max(5, effDbLatency));
    const connectionExhaustionPct = clamp(Math.round((acceptedRate / Math.max(1, dbCapacity)) * 100), 0, 100);

    const properSync = has('properLocking') || has('messagePassing');
    const raceActive = this.synchronizationOff() && !properSync;

    const hasTimeoutSafety = has('timeoutsSet') || has('cancellationOn') || !this.timeoutsOff();
    const deadlockActive =
      this.lockContentionHigh() && !this.synchronizationOff() && !properSync && !hasTimeoutSafety;

    const starvationActive =
      this.lockContentionHigh() &&
      effThreads > effCores * 50 &&
      !properSync &&
      !has('concurrencyLimit');

    const retryAmplification = effRetryMultiplier;

    const baseServiceTime = has('asyncIO') ? 5 : 15;
    const queueingDelay = acceptedRate > 0 ? (queueDepth / Math.max(acceptedRate, 1)) * 1000 : 0;
    const dbComponent = effDbLatency * (1 + connectionExhaustionPct / 100);
    const raceCost = raceActive ? 50 : 0;
    const deadlockCost = deadlockActive ? 4000 : 0;

    const rawLatency = baseServiceTime + queueingDelay + dbComponent + raceCost + deadlockCost;
    const hangs = this.timeoutsOff() && !has('timeoutsSet') && !has('cancellationOn') && (deadlockActive || rawLatency > 5000);
    const latencyMs = Math.round(Math.min(rawLatency, 999999));

    const penalties = [
      cpuPct > 85 ? 20 : cpuPct > 60 ? 8 : 0,
      connectionExhaustionPct > 85 ? 20 : connectionExhaustionPct > 60 ? 8 : 0,
      raceActive ? 15 : 0,
      deadlockActive ? 20 : 0,
      starvationActive ? 10 : 0,
      rejectedRate > 0 ? Math.min(10, Math.round((rejectedRate / Math.max(arrivalRate, 1)) * 20)) : 0,
      hangs ? 25 : latencyMs > 3000 ? 12 : latencyMs > 800 ? 5 : 0,
    ];
    const healthScore = clamp(100 - penalties.reduce((a, b) => a + b, 0), 0, 100);
    const health: SimResult['health'] = healthScore >= 80 ? 'HEALTHY' : healthScore >= 45 ? 'DEGRADED' : 'CRITICAL';

    return {
      effCores,
      effThreads,
      effDbConnections,
      effDbLatency,
      effRetryMultiplier,
      arrivalRate,
      acceptedRate,
      rejectedRate,
      capacity,
      utilization,
      queueDepth,
      cpuPct,
      connectionExhaustionPct,
      raceActive,
      deadlockActive,
      starvationActive,
      retryAmplification,
      latencyMs,
      hangs,
      healthScore,
      health,
    };
  });

  protected formatNumber(n: number): string {
    return Math.round(n).toLocaleString('en-US');
  }

  protected toggleFix(key: FixKey): void {
    this.fixesOn.update((set) => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  protected jumpToFixes(event: Event): void {
    event.preventDefault();
    document.getElementById('fix-the-system')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected resetAll(): void {
    this.requestsPerSec.set(800);
    this.cpuCores.set(8);
    this.dbConnections.set(100);
    this.dbLatencyMs.set(15);
    this.threadCount.set(100);
    this.queueSize.set(2000);
    this.retryMultiplier.set(1);
    this.lockContentionHigh.set(false);
    this.synchronizationOff.set(false);
    this.timeoutsOff.set(false);
    this.fixesOn.set(new Set());
  }
}
