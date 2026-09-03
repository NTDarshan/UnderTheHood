import { Component, OnDestroy, computed, signal } from '@angular/core';

type BreakKey =
  | 'longRequests'
  | 'slowDb'
  | 'slowExternalApi'
  | 'infiniteWorker'
  | 'noCancellation'
  | 'noReadiness'
  | 'shortTimeout'
  | 'largeQueue'
  | 'unsafeRetry';

type FixKey =
  | 'readiness'
  | 'draining'
  | 'cancellation'
  | 'timeouts'
  | 'deadline'
  | 'durableQueues'
  | 'idempotency'
  | 'resourceCleanup'
  | 'observability'
  | 'rollingDeployment';

type OutcomeKey =
  | 'newTrafficStops'
  | 'requestsDrain'
  | 'safeWorkPreserved'
  | 'resourcesClose'
  | 'newVersionTraffic'
  | 'oldVersionExits';

interface Toggle<K> {
  key: K;
  label: string;
  hint: string;
}

const BREAKS: Toggle<BreakKey>[] = [
  { key: 'longRequests', label: 'Long-running requests', hint: 'Some requests legitimately take 10-30s (report generation, uploads).' },
  { key: 'slowDb', label: 'Slow DB', hint: 'Database queries take much longer than usual under load.' },
  { key: 'slowExternalApi', label: 'Slow external API', hint: 'A downstream payment/geocoding/etc. call is dragging its feet.' },
  { key: 'infiniteWorker', label: 'Infinite worker', hint: 'A background worker loop with no exit condition — never checks for shutdown.' },
  { key: 'noCancellation', label: 'No cancellation', hint: 'In-flight work has no way to be told "stop, the caller is gone".' },
  { key: 'noReadiness', label: 'No readiness', hint: 'The instance never reports itself unready — the load balancer never learns to stop routing.' },
  { key: 'shortTimeout', label: 'Too-short timeout', hint: 'The shutdown grace period is set far shorter than real work needs to finish.' },
  { key: 'largeQueue', label: 'Large queue', hint: 'A big backlog of background jobs sitting in an in-memory (non-durable) queue.' },
  { key: 'unsafeRetry', label: 'Unsafe retry', hint: 'Clients/orchestrator retry on failure with no idempotency guarantee.' },
];

const FIXES: Toggle<FixKey>[] = [
  { key: 'readiness', label: 'Readiness', hint: 'Flip a readiness probe off the instant shutdown begins, before anything else.' },
  { key: 'draining', label: 'Connection draining', hint: 'Let already-accepted connections/requests finish instead of cutting them off.' },
  { key: 'cancellation', label: 'Cancellation', hint: 'Propagate a cancellation signal so in-flight work can stop cooperatively.' },
  { key: 'timeouts', label: 'Timeouts', hint: 'Bound every downstream call so nothing waits forever on a slow dependency.' },
  { key: 'deadline', label: 'Shutdown deadline', hint: 'A hard, sane grace-period budget that everything above operates inside of.' },
  { key: 'durableQueues', label: 'Durable queues', hint: 'Persist queued work outside the process so an in-flight job is never just lost.' },
  { key: 'idempotency', label: 'Idempotency', hint: 'Make retried/requeued operations safe to run more than once.' },
  { key: 'resourceCleanup', label: 'Resource cleanup', hint: 'Explicitly close DB connections, sockets, files, and workers on the way out.' },
  { key: 'observability', label: 'Observability', hint: 'Emit metrics/logs through the shutdown sequence so a stuck drain is visible, not silent.' },
  { key: 'rollingDeployment', label: 'Rolling deployment', hint: 'Bring the new instance up and healthy before routing traffic away from the old one.' },
];

const OUTCOMES: { key: OutcomeKey; label: string }[] = [
  { key: 'newTrafficStops', label: 'New traffic stops' },
  { key: 'requestsDrain', label: 'Existing requests drain' },
  { key: 'safeWorkPreserved', label: 'Safe work is preserved' },
  { key: 'resourcesClose', label: 'Resources close' },
  { key: 'newVersionTraffic', label: 'New version receives traffic' },
  { key: 'oldVersionExits', label: 'Old version exits' },
];

// Which fixes are required, per active break, for a given outcome to hold.
const REQUIREMENTS: Record<OutcomeKey, Partial<Record<BreakKey, FixKey[]>>> = {
  newTrafficStops: {
    noReadiness: ['readiness'],
  },
  requestsDrain: {
    longRequests: ['draining', 'deadline'],
    slowDb: ['draining', 'timeouts'],
    slowExternalApi: ['draining', 'timeouts'],
    noCancellation: ['cancellation'],
    shortTimeout: ['deadline'],
  },
  safeWorkPreserved: {
    largeQueue: ['durableQueues'],
    shortTimeout: ['durableQueues'],
    unsafeRetry: ['idempotency'],
  },
  resourcesClose: {
    infiniteWorker: ['resourceCleanup', 'deadline'],
    slowDb: ['resourceCleanup'],
  },
  newVersionTraffic: {
    noReadiness: ['rollingDeployment', 'readiness'],
    infiniteWorker: ['rollingDeployment', 'deadline'],
  },
  oldVersionExits: {
    infiniteWorker: ['deadline', 'cancellation'],
    noCancellation: ['deadline'],
    longRequests: ['deadline'],
  },
};

interface OutcomeResult {
  key: OutcomeKey;
  label: string;
  satisfied: boolean;
  reason: string;
}

const BREAK_NARRATIVE: Record<BreakKey, { broken: string; fixed: string }> = {
  longRequests: {
    broken: 'Long-running requests were still mid-flight when the process gave up on them.',
    fixed: 'Long-running requests were given room to finish inside the drain window.',
  },
  slowDb: {
    broken: 'Slow database calls held connections open past the point the process tried to exit.',
    fixed: 'Slow database calls were bounded and connections closed cleanly afterward.',
  },
  slowExternalApi: {
    broken: 'A slow external API call had no bound, so the request behind it never finished on time.',
    fixed: 'The external call was bounded, so a slow dependency no longer blocked shutdown.',
  },
  infiniteWorker: {
    broken: 'The background worker loop has no exit check — it never noticed shutdown was happening at all.',
    fixed: 'The worker checks for shutdown and stops within the deadline instead of running forever.',
  },
  noCancellation: {
    broken: 'In-flight work had no way to be told to stop, so it kept running after the deadline.',
    fixed: 'A cancellation signal let in-flight work stop cooperatively when told to.',
  },
  noReadiness: {
    broken: 'The instance never reported itself unready, so the load balancer kept sending it new traffic after shutdown started.',
    fixed: 'Readiness flipped off immediately, so the load balancer stopped routing new traffic right away.',
  },
  shortTimeout: {
    broken: 'The grace period was too short for real work to finish, so valid in-flight requests were cut off mid-response.',
    fixed: 'The shutdown deadline was sized to what real work actually needs, so it was not cut off arbitrarily.',
  },
  largeQueue: {
    broken: 'The in-memory queue was not durable — everything still sitting in it vanished when the process exited.',
    fixed: 'Queued work lived outside the process, so nothing in the backlog was lost on exit.',
  },
  unsafeRetry: {
    broken: 'Retries with no idempotency guarantee mean interrupted work may have been double-applied.',
    fixed: 'Retried or requeued work is safe to run more than once, so interruption no longer risks duplication.',
  },
};

function requiredFixesFor(breakKey: BreakKey): FixKey[] {
  const set = new Set<FixKey>();
  for (const outcome of Object.keys(REQUIREMENTS) as OutcomeKey[]) {
    const req = REQUIREMENTS[outcome][breakKey];
    if (req) req.forEach((f) => set.add(f));
  }
  return [...set];
}

function evaluateOutcomes(breaks: Set<BreakKey>, fixes: Set<FixKey>): OutcomeResult[] {
  return OUTCOMES.map(({ key, label }) => {
    const req = REQUIREMENTS[key];
    const triggeredBreaks = (Object.keys(req) as BreakKey[]).filter((b) => breaks.has(b));

    if (triggeredBreaks.length === 0) {
      return { key, label, satisfied: true, reason: 'No active misconfiguration threatens this outcome.' };
    }

    const missing = new Set<FixKey>();
    for (const b of triggeredBreaks) {
      for (const f of req[b] ?? []) {
        if (!fixes.has(f)) missing.add(f);
      }
    }

    if (missing.size === 0) {
      return { key, label, satisfied: true, reason: 'Countered by: ' + triggeredBreaks.map((b) => BREAKS.find((x) => x.key === b)!.label).join(', ') + '.' };
    }

    const fixLabels = [...missing].map((f) => FIXES.find((x) => x.key === f)!.label).join(', ');
    return { key, label, satisfied: false, reason: `Missing: ${fixLabels}.` };
  });
}

@Component({
  selector: 'app-break-fix-the-shutdown',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene bfs-scene" id="break-the-shutdown">
      <div class="container">
        <p class="lab-index mono">32 — CAN YOU BREAK THIS DEPLOYMENT?</p>
        <h2 class="lab-title">Break the shutdown, then fix it</h2>
        <p class="lab-lede">
          Toggle on any combination of misconfigurations below, then hit DEPLOY. Each one alone is bad; combined,
          they compound. Once you've broken it convincingly, scroll down and see how many engineering fixes it
          takes to make the same deployment boring again.
        </p>

        <div class="lab-panel">
          <div class="panel-head">
            <h3 class="panel-heading">Misconfigurations</h3>
            <span class="mono count-pill">{{ breaksOn().size }} active</span>
          </div>
          <p class="lab-note">Turn these on to simulate a badly-built service under deployment.</p>

          <div class="toggle-grid">
            @for (b of breaks; track b.key) {
              <button
                type="button"
                class="lab-btn lab-btn-danger toggle-btn"
                [class.is-active]="breaksOn().has(b.key)"
                [attr.aria-pressed]="breaksOn().has(b.key)"
                (click)="toggleBreak(b.key)"
                [title]="b.hint"
              >
                {{ breaksOn().has(b.key) ? '&#10003; ' : '' }}{{ b.label }}
              </button>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="runDeployment()" [disabled]="deploying()">
              {{ deploying() ? 'DEPLOYING…' : 'DEPLOY' }}
            </button>
            <button type="button" class="lab-btn" (click)="resetAll()" [disabled]="deploying()">Reset</button>
            <button type="button" class="lab-btn" (click)="jumpToFixes($event)">Jump to fixes &darr;</button>
          </div>
        </div>

        @if (hasRun()) {
          <div class="lab-panel report-panel" aria-live="polite">
            <h3 class="panel-heading">Deployment log</h3>
            <div class="progress-track">
              <div
                class="progress-fill"
                [style.width.%]="progress()"
                [class.is-stuck]="stuck()"
                [class.is-good]="!stuck() && progress() >= 100 && allSatisfied()"
                [class.is-bad]="!stuck() && progress() >= 100 && !allSatisfied()"
              ></div>
            </div>
            @if (stuck()) {
              <p class="stuck-note mono">&#9888; STALLED — waiting on a worker that will not stop.</p>
            }

            <div class="log-scroll">
              @for (line of deployLog(); track $index) {
                <p class="log-line mono">{{ line }}</p>
              }
            </div>

            <div class="error-row">
              <span class="lab-node">Failed / dropped requests</span>
              <span class="mono error-count" [class.is-bad]="errorCount() > 0">{{ errorCount() }}</span>
            </div>

            <h4 class="panel-subheading">Incident report</h4>
            @if (activeBreakCount() === 0) {
              <p class="lab-note">No misconfigurations were active — nothing to report.</p>
            } @else {
              <ul class="finding-list">
                @for (b of breaks; track b.key) {
                  @if (breaksOn().has(b.key)) {
                    <li class="finding-item" [class.is-fixed]="isMitigated(b.key)">
                      <span class="finding-mark mono">{{ isMitigated(b.key) ? '✓' : '✕' }}</span>
                      <span>{{ isMitigated(b.key) ? narrative(b.key).fixed : narrative(b.key).broken }}</span>
                    </li>
                  }
                }
              </ul>
            }
          </div>
        }

        <div id="fix-the-shutdown" class="lab-panel fix-panel">
          <h3 class="panel-heading">Fix it</h3>
          <p class="lab-note">
            Apply engineering controls on top of whatever is broken above, then run the deployment again. The
            checklist below is always live — it updates the moment you toggle a fix.
          </p>

          <div class="toggle-grid">
            @for (f of fixes; track f.key) {
              <button
                type="button"
                class="lab-btn lab-btn-primary toggle-btn"
                [class.is-active]="fixesOn().has(f.key)"
                [attr.aria-pressed]="fixesOn().has(f.key)"
                (click)="toggleFix(f.key)"
                [title]="f.hint"
              >
                {{ fixesOn().has(f.key) ? '&#10003; ' : '' }}{{ f.label }}
              </button>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="runDeployment()" [disabled]="deploying()">
              {{ deploying() ? 'DEPLOYING…' : 'APPLY FIXES & RUN DEPLOYMENT AGAIN' }}
            </button>
          </div>

          <h4 class="panel-subheading">Target outcomes</h4>
          <ul class="outcome-list" aria-live="polite">
            @for (o of liveOutcomes(); track o.key) {
              <li class="outcome-item">
                <span class="pill" [class.pill-yes]="o.satisfied" [class.pill-no]="!o.satisfied">
                  {{ o.satisfied ? '✓' : '✕' }} {{ o.label }}
                </span>
                <span class="outcome-reason">{{ o.reason }}</span>
              </li>
            }
          </ul>

          @if (allSatisfied() && activeBreakCount() > 0) {
            <p class="lab-note success-note mono">
              &#10003; ALL TARGET OUTCOMES MET — this deployment would be boring in production, which is the goal.
            </p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .gs-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .panel-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .panel-heading { font-size: 1.125rem; color: var(--text); margin: 0; }
    .panel-subheading { font-size: 0.9375rem; color: var(--text); margin: 22px 0 10px; }
    .count-pill { font-size: 0.75rem; color: var(--text-faint); }

    .toggle-grid { margin-top: 16px; display: grid; grid-template-columns: 1fr; gap: 10px; }
    @media (min-width: 640px) { .toggle-grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 1000px) { .toggle-grid { grid-template-columns: 1fr 1fr 1fr; } }

    .toggle-btn { justify-content: flex-start; text-align: left; white-space: normal; }
    .lab-btn-danger.toggle-btn:not(.is-active) { background: var(--surface-elevated); border-color: var(--border-strong); color: var(--text-muted); }
    .lab-btn-primary.toggle-btn:not(.is-active) { background: var(--surface-elevated); border-color: var(--border-strong); color: var(--text-muted); }

    .report-panel { border-color: var(--accent); }
    .progress-track { margin-top: 16px; height: 10px; border-radius: 999px; background: var(--surface); overflow: hidden; border: 1px solid var(--border); }
    .progress-fill { height: 100%; width: 0%; background: var(--draining); transition: width 0.3s ease, background 0.3s ease; }
    .progress-fill.is-good { background: var(--running); }
    .progress-fill.is-bad { background: var(--stopped); }
    .progress-fill.is-stuck { background: var(--queue); animation: bfsStuckPulse 1s ease-in-out infinite; }
    @keyframes bfsStuckPulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
    @media (prefers-reduced-motion: reduce) { .progress-fill.is-stuck { animation: none; } }

    .stuck-note { margin-top: 10px; color: var(--queue); font-size: 0.8125rem; }

    .log-scroll { margin-top: 14px; max-height: 220px; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    .log-line { font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; }

    .error-row { margin-top: 16px; display: flex; align-items: center; gap: 10px; }
    .error-count { font-size: 1.0625rem; color: var(--text); }
    .error-count.is-bad { color: var(--cancelled); }

    .finding-list { margin: 10px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .finding-item { display: flex; gap: 10px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
    .finding-mark { flex-shrink: 0; font-weight: 700; color: var(--stopped); }
    .finding-item.is-fixed .finding-mark { color: var(--running); }
    .finding-item.is-fixed { color: var(--text-faint); }

    .fix-panel { border-color: var(--accent-2); }

    .outcome-list { margin: 12px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 10px; }
    .outcome-item { display: flex; flex-wrap: wrap; align-items: center; gap: 10px; }
    .outcome-reason { font-size: 0.8125rem; color: var(--text-faint); }

    .success-note { margin-top: 18px; color: var(--running); }
  `,
})
export class BreakFixTheShutdown implements OnDestroy {
  protected readonly breaks = BREAKS;
  protected readonly fixes = FIXES;

  protected readonly breaksOn = signal<Set<BreakKey>>(new Set());
  protected readonly fixesOn = signal<Set<FixKey>>(new Set());

  protected readonly deploying = signal(false);
  protected readonly hasRun = signal(false);
  protected readonly progress = signal(0);
  protected readonly stuck = signal(false);
  protected readonly errorCount = signal(0);
  protected readonly deployLog = signal<string[]>([]);

  protected readonly activeBreakCount = computed(() => this.breaksOn().size);

  protected readonly liveOutcomes = computed<OutcomeResult[]>(() =>
    evaluateOutcomes(this.breaksOn(), this.fixesOn()),
  );

  protected readonly allSatisfied = computed(() => this.liveOutcomes().every((o) => o.satisfied));

  private timers: ReturnType<typeof setTimeout>[] = [];
  private errorTicker: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearTimers();
  }

  protected toggleBreak(key: BreakKey): void {
    this.breaksOn.update((set) => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  protected toggleFix(key: FixKey): void {
    this.fixesOn.update((set) => {
      const next = new Set(set);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  protected isMitigated(key: BreakKey): boolean {
    const required = requiredFixesFor(key);
    return required.every((f) => this.fixesOn().has(f));
  }

  protected narrative(key: BreakKey): { broken: string; fixed: string } {
    return BREAK_NARRATIVE[key];
  }

  protected jumpToFixes(event: Event): void {
    event.preventDefault();
    document.getElementById('fix-the-shutdown')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected resetAll(): void {
    this.clearTimers();
    this.breaksOn.set(new Set());
    this.fixesOn.set(new Set());
    this.deploying.set(false);
    this.hasRun.set(false);
    this.progress.set(0);
    this.stuck.set(false);
    this.errorCount.set(0);
    this.deployLog.set([]);
  }

  protected runDeployment(): void {
    if (this.deploying()) return;
    this.clearTimers();
    this.deploying.set(true);
    this.hasRun.set(true);
    this.progress.set(0);
    this.stuck.set(false);
    this.errorCount.set(0);
    this.deployLog.set([]);

    const breaks = this.breaksOn();
    const fixes = this.fixesOn();
    const outcomes = evaluateOutcomes(breaks, fixes);
    const bad = (k: OutcomeKey) => !outcomes.find((o) => o.key === k)?.satisfied;

    const hangRisk =
      breaks.has('infiniteWorker') && !(fixes.has('deadline') && fixes.has('cancellation'));

    const trafficLeak = bad('newTrafficStops');
    const drainFailing = bad('requestsDrain');

    const steps: { text: string; ms: number; pct: number }[] = [
      { text: 'SIGTERM sent to old instance.', ms: 300, pct: 10 },
      {
        text: trafficLeak
          ? 'Old instance still marked READY — load balancer keeps routing new requests to it.'
          : 'Old instance marked unready — load balancer stops routing new traffic.',
        ms: 500,
        pct: 25,
      },
      {
        text: drainFailing
          ? 'Draining in-flight requests… some are being cut off before finishing.'
          : 'Draining in-flight requests… all reach a normal completion.',
        ms: 700,
        pct: 45,
      },
      {
        text: bad('safeWorkPreserved')
          ? 'Handling queued/background work… some of it will not survive the exit.'
          : 'Handling queued/background work… everything in flight is preserved or safely requeued.',
        ms: 600,
        pct: 62,
      },
      {
        text: hangRisk
          ? 'Waiting for background worker to exit… it never checks for shutdown.'
          : bad('resourcesClose')
            ? 'Closing resources… some connections/handles are abandoned instead of closed.'
            : 'Closing resources… connections, sockets, and workers all shut down cleanly.',
        ms: 700,
        pct: hangRisk ? 82 : 85,
      },
      {
        text: bad('newVersionTraffic')
          ? 'New version is up, but rollover is unsafe with the old instance in this state.'
          : 'New version is healthy and now receiving traffic.',
        ms: 500,
        pct: 95,
      },
      {
        text: bad('oldVersionExits')
          ? hangRisk
            ? 'Grace period exceeded — orchestrator force-killed the old instance (SIGKILL), losing whatever it was doing.'
            : 'Old instance exceeded its deadline and was force-killed rather than exiting cleanly.'
          : 'Old instance exited cleanly. Deployment complete.',
        ms: 500,
        pct: 100,
      },
    ];

    if (trafficLeak || drainFailing) {
      this.errorTicker = setInterval(() => {
        this.errorCount.update((n) => n + Math.ceil(Math.random() * 3));
      }, 350);
    }

    let cumulative = 0;
    steps.forEach((step, idx) => {
      cumulative += step.ms;
      const t = setTimeout(() => {
        this.deployLog.update((lines) => [...lines, `[+${(cumulative / 1000).toFixed(1)}s] ${step.text}`]);

        if (hangRisk && step.pct === (steps.find((s) => s.text.includes('never checks'))?.pct ?? -1)) {
          this.stuck.set(true);
          this.progress.set(step.pct);
        } else {
          this.stuck.set(false);
          this.progress.set(step.pct);
        }

        if (idx === steps.length - 1) {
          this.deploying.set(false);
          if (this.errorTicker) {
            clearInterval(this.errorTicker);
            this.errorTicker = null;
          }
        }
      }, cumulative);
      this.timers.push(t);
    });
  }

  private clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
    if (this.errorTicker) {
      clearInterval(this.errorTicker);
      this.errorTicker = null;
    }
  }
}
