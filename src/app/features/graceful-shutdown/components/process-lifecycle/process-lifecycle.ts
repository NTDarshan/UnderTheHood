import { Component, computed, signal } from '@angular/core';

type LifecycleId = 'starting' | 'running' | 'shutdown-requested' | 'draining' | 'cleanup' | 'terminated';

interface LifecycleState {
  id: LifecycleId;
  label: string;
  happening: string;
  allowed: string;
  blocked: string;
  delay: string;
}

const STATES: LifecycleState[] = [
  {
    id: 'starting',
    label: 'STARTING',
    happening:
      'The process has been launched — the runtime is booting, config is loading, connection pools, caches, and listeners are being initialized.',
    allowed:
      'Internal setup work only: reading config, opening database and cache connections, warming caches, registering signal handlers.',
    blocked:
      'No traffic is served yet. The process is usually not registered with the load balancer / service registry, so nothing routes real requests here.',
    delay:
      'A slow dependency (database, config server, cache warm-up) can stretch this phase, but it does not delay shutdown — shutdown has not been requested yet.',
  },
  {
    id: 'running',
    label: 'RUNNING',
    happening:
      'Steady state. The process is registered as healthy, accepting connections, and actively serving requests, jobs, or messages.',
    allowed:
      'Everything: new requests, background jobs, scheduled tasks, new connections — the process is fully open for business.',
    blocked:
      'Nothing is blocked in this state — it is the normal operating mode.',
    delay:
      'Not applicable — no shutdown is in progress, so there is nothing to delay.',
  },
  {
    id: 'shutdown-requested',
    label: 'SHUTDOWN REQUESTED',
    happening:
      'A termination signal (typically SIGTERM) or an orchestrator directive arrives. The shutdown handler fires and the process begins transitioning out of RUNNING.',
    allowed:
      'The shutdown handler runs: it can still accept a signal, log the event, and begin flipping internal flags.',
    blocked:
      'Nothing is blocked yet at the instant the signal lands — this state is the trigger, not the drain itself.',
    delay:
      'If no signal handler is registered at all, the runtime default action for SIGTERM runs instead (immediate termination) — so a missing handler effectively skips graceful shutdown entirely.',
  },
  {
    id: 'draining',
    label: 'DRAINING',
    happening:
      'The process marks itself unready (fails health/readiness checks) so the load balancer stops routing new traffic to it, while existing work is given a chance to finish.',
    allowed:
      'In-flight requests, transactions, and jobs already accepted are allowed to run to completion (or be explicitly cancelled), within a shutdown timeout budget.',
    blocked:
      'No new work is accepted: new incoming requests are refused or routed elsewhere, new jobs are not pulled off the queue.',
    delay:
      'Long-running requests, slow downstream calls, large in-flight jobs, or open streaming/websocket connections can all stretch draining right up to the shutdown timeout, after which the process may be forcibly killed anyway.',
  },
  {
    id: 'cleanup',
    label: 'CLEANUP',
    happening:
      'With in-flight work finished or abandoned, the process releases resources: closing database and cache connections, flushing logs and metrics, deregistering from service discovery.',
    allowed:
      'Idempotent teardown operations — closing sockets, flushing buffers, releasing locks, final log writes.',
    blocked:
      'No new work of any kind — requests, jobs, or connections — is accepted at this point.',
    delay:
      'A connection pool that hangs while closing, or a flush to a slow/unreachable log sink, can delay this phase — most runtimes cap it with the same shutdown timeout as draining.',
  },
  {
    id: 'terminated',
    label: 'TERMINATED',
    happening:
      'The process has exited. Its PID is gone, all memory and file descriptors are reclaimed by the OS.',
    allowed:
      'Nothing — there is no running code left to allow or forbid anything.',
    blocked:
      'Everything, by definition — the process no longer exists.',
    delay:
      'Not applicable — termination is the end state; nothing can delay something that has already happened.',
  },
];

const AUTO_PATH: LifecycleId[] = [
  'starting',
  'running',
  'shutdown-requested',
  'draining',
  'cleanup',
  'terminated',
];

@Component({
  selector: 'app-process-lifecycle',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="gs-lifecycle">
      <div class="container">
        <p class="lab-index">04 — PROCESS LIFECYCLE</p>
        <h2 class="lab-title">A server process has a lifecycle, not an on/off switch</h2>
        <p class="lab-lede">
          Between "started" and "gone," a backend process passes through states that decide whether shutdown is
          graceful or abrupt. Click any state to see exactly what it allows, what it blocks, and what can stretch
          it out.
        </p>

        <div class="lab-panel gs-scene lifecycle-scene">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isPlaying()" (click)="play()">
              {{ isPlaying() ? 'Playing…' : '▶ Play lifecycle' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="flow" role="list" aria-label="Process lifecycle states">
            @for (s of states; track s.id; let last = $last) {
              <button
                type="button"
                role="listitem"
                class="lab-node flow-node"
                [class]="'state-' + s.id"
                [class.is-active]="current() === s.id"
                [attr.aria-pressed]="current() === s.id"
                (click)="select(s.id)"
              >
                <span class="node-dot" aria-hidden="true"></span>
                {{ s.label }}
              </button>
              @if (!last) {
                <span class="lab-flow-arrow flow-arrow" aria-hidden="true">→</span>
              }
            }
          </div>

          @if (activeInfo(); as info) {
            <div class="detail" aria-live="polite">
              <div class="detail-head">
                <span class="pill" [class]="pillClassFor(info.id)">{{ info.label }}</span>
              </div>
              <dl class="detail-grid">
                <div class="detail-field">
                  <dt class="mono">WHAT IS HAPPENING?</dt>
                  <dd>{{ info.happening }}</dd>
                </div>
                <div class="detail-field">
                  <dt class="mono field-allowed">WHAT WORK IS ALLOWED?</dt>
                  <dd>{{ info.allowed }}</dd>
                </div>
                <div class="detail-field">
                  <dt class="mono field-blocked">WHAT WORK IS BLOCKED?</dt>
                  <dd>{{ info.blocked }}</dd>
                </div>
                <div class="detail-field">
                  <dt class="mono field-delay">WHAT CAN DELAY SHUTDOWN?</dt>
                  <dd>{{ info.delay }}</dd>
                </div>
              </dl>
            </div>
          }
        </div>

        <p class="lab-note">
          Notice that DRAINING is where almost every graceful-shutdown bug lives: it is the only state where the
          process is simultaneously still working <em>and</em> already refusing new work.
        </p>
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

    .flow {
      margin-top: 22px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: center;
      gap: 6px;
    }

    @media (max-width: 640px) {
      .flow { flex-direction: column; align-items: stretch; }
      .flow-arrow { align-self: center; transform: rotate(90deg); }
    }

    .flow-node {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      min-width: 132px;
      justify-content: center;
      padding: 12px 14px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      transition: box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease, transform 0.15s ease;
    }
    .flow-node:hover { transform: translateY(-1px); }
    .flow-node:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .node-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: currentColor;
      flex: none;
    }

    .state-starting { color: var(--idle); }
    .state-running { color: var(--running); }
    .state-shutdown-requested { color: var(--signal); }
    .state-draining { color: var(--draining); }
    .state-cleanup { color: var(--resource); }
    .state-terminated { color: var(--stopped); }

    .flow-node.is-active {
      background: color-mix(in srgb, currentColor 14%, var(--surface-raised));
      box-shadow: 0 0 0 2px currentColor;
    }

    @media (prefers-reduced-motion: reduce) {
      .flow-node { transition: none; }
      .flow-node:hover { transform: none; }
    }

    .detail {
      margin-top: 24px;
      padding: 20px 22px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
    }

    .detail-head { display: flex; align-items: center; gap: 12px; }

    .detail-grid {
      margin-top: 16px;
      display: grid;
      gap: 16px;
    }
    @media (min-width: 720px) {
      .detail-grid { grid-template-columns: 1fr 1fr; }
    }

    .detail-field dt {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
      margin-bottom: 6px;
    }
    .field-allowed { color: var(--running); }
    .field-blocked { color: var(--danger); }
    .field-delay { color: var(--queue); }

    .detail-field dd {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
    }
  `,
})
export class ProcessLifecycle {
  protected readonly states = STATES;
  protected readonly current = signal<LifecycleId>('running');
  protected readonly isPlaying = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly activeInfo = computed<LifecycleState | undefined>(() =>
    STATES.find((s) => s.id === this.current()),
  );

  protected select(id: LifecycleId): void {
    this.stopTimer();
    this.isPlaying.set(false);
    this.current.set(id);
  }

  protected pillClassFor(id: LifecycleId): string {
    if (id === 'running') return 'pill-yes';
    if (id === 'terminated') return 'pill-no';
    return 'pill-conditional';
  }

  protected play(): void {
    if (this.isPlaying()) return;
    this.isPlaying.set(true);
    let step = 0;
    this.current.set(AUTO_PATH[0]);

    this.timer = setInterval(() => {
      step += 1;
      if (step >= AUTO_PATH.length) {
        this.stopTimer();
        this.isPlaying.set(false);
        return;
      }
      this.current.set(AUTO_PATH[step]);
    }, 1200);
  }

  protected reset(): void {
    this.stopTimer();
    this.isPlaying.set(false);
    this.current.set('running');
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
