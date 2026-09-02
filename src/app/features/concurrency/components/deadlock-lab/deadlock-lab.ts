import { Component, OnDestroy, computed, signal } from '@angular/core';

type ThreadStatus = 'idle' | 'running' | 'waiting' | 'blocked' | 'done';
type LockId = 1 | 2;

interface DeadlockStep {
  label: string;
  aStatus: ThreadStatus;
  aHolds: LockId[];
  aWants: LockId | null;
  bStatus: ThreadStatus;
  bHolds: LockId[];
  bWants: LockId | null;
  lock1Owner: 'A' | 'B' | null;
  lock2Owner: 'A' | 'B' | null;
  deadlock: boolean;
}

const UNSAFE_STEPS: DeadlockStep[] = [
  {
    label: 'Idle — press Run to start the scenario.',
    aStatus: 'idle', aHolds: [], aWants: null,
    bStatus: 'idle', bHolds: [], bWants: null,
    lock1Owner: null, lock2Owner: null, deadlock: false,
  },
  {
    label: 'Thread A acquires LOCK 1.',
    aStatus: 'running', aHolds: [1], aWants: null,
    bStatus: 'idle', bHolds: [], bWants: null,
    lock1Owner: 'A', lock2Owner: null, deadlock: false,
  },
  {
    label: 'Thread B acquires LOCK 2.',
    aStatus: 'running', aHolds: [1], aWants: null,
    bStatus: 'running', bHolds: [2], bWants: null,
    lock1Owner: 'A', lock2Owner: 'B', deadlock: false,
  },
  {
    label: 'Thread A tries to acquire LOCK 2 — BLOCKED, held by B.',
    aStatus: 'blocked', aHolds: [1], aWants: 2,
    bStatus: 'running', bHolds: [2], bWants: null,
    lock1Owner: 'A', lock2Owner: 'B', deadlock: false,
  },
  {
    label: 'Thread B tries to acquire LOCK 1 — BLOCKED, held by A. Neither thread can proceed.',
    aStatus: 'blocked', aHolds: [1], aWants: 2,
    bStatus: 'blocked', bHolds: [2], bWants: 1,
    lock1Owner: 'A', lock2Owner: 'B', deadlock: true,
  },
];

const FIXED_STEPS: DeadlockStep[] = [
  {
    label: 'Idle — press Run to start the scenario.',
    aStatus: 'idle', aHolds: [], aWants: null,
    bStatus: 'idle', bHolds: [], bWants: null,
    lock1Owner: null, lock2Owner: null, deadlock: false,
  },
  {
    label: 'Thread A acquires LOCK 1 (both threads always take LOCK 1 first).',
    aStatus: 'running', aHolds: [1], aWants: null,
    bStatus: 'idle', bHolds: [], bWants: null,
    lock1Owner: 'A', lock2Owner: null, deadlock: false,
  },
  {
    label: 'Thread B tries to acquire LOCK 1 — waits. It never touches LOCK 2 first, so it holds nothing while waiting.',
    aStatus: 'running', aHolds: [1], aWants: null,
    bStatus: 'waiting', bHolds: [], bWants: 1,
    lock1Owner: 'A', lock2Owner: null, deadlock: false,
  },
  {
    label: 'Thread A acquires LOCK 2 — uncontended, because B never took it.',
    aStatus: 'running', aHolds: [1, 2], aWants: null,
    bStatus: 'waiting', bHolds: [], bWants: 1,
    lock1Owner: 'A', lock2Owner: 'A', deadlock: false,
  },
  {
    label: 'Thread A finishes and releases LOCK 1 and LOCK 2.',
    aStatus: 'done', aHolds: [], aWants: null,
    bStatus: 'waiting', bHolds: [], bWants: 1,
    lock1Owner: null, lock2Owner: null, deadlock: false,
  },
  {
    label: 'Thread B acquires LOCK 1, then LOCK 2, and completes normally. No deadlock.',
    aStatus: 'done', aHolds: [], aWants: null,
    bStatus: 'done', bHolds: [], bWants: null,
    lock1Owner: null, lock2Owner: null, deadlock: false,
  },
];

const CONDITION_INFO = [
  { id: 'mutex', label: 'Mutual exclusion', body: 'A lock can be held by only one thread at a time.' },
  { id: 'holdAndWait', label: 'Hold-and-wait', body: 'A thread holds one lock while blocked waiting for another.' },
  { id: 'noPreemption', label: 'No preemption', body: 'A lock cannot be forcibly taken away from the thread holding it.' },
  { id: 'circularWait', label: 'Circular wait', body: 'A chain of threads each waiting on a lock the next one holds, looping back on itself.' },
] as const;

const STEP_MS = 1100;

@Component({
  selector: 'app-deadlock-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="deadlock-lab">
      <div class="container">
        <p class="lab-index">28 — DEADLOCK</p>
        <h2 class="lab-title">Deadlock — build one yourself</h2>
        <p class="lab-lede">
          Thread A owns LOCK 1 and wants LOCK 2. Thread B owns LOCK 2 and wants LOCK 1. Neither will let go of what
          it already has. Run the scenario and watch both threads block forever — then flip the fix and re-run.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row" role="group" aria-label="Deadlock lab controls">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isPlaying()" (click)="run()">
              Run
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
            <button
              type="button"
              class="lab-btn"
              [class.is-active]="fixEnabled()"
              [attr.aria-pressed]="fixEnabled()"
              (click)="toggleFix()"
            >
              Fix: consistent lock ordering
            </button>
          </div>

          <div class="deadlock-grid">
            <div class="thread-card" [class]="'status-' + step().aStatus">
              <p class="lab-node">Thread A</p>
              <p class="status-pill mono">{{ statusLabel(step().aStatus) }}</p>
              <p class="thread-detail mono">
                Holds: {{ step().aHolds.length ? lockNames(step().aHolds) : '—' }}
              </p>
              <p class="thread-detail mono">
                Wants: {{ step().aWants ? lockName(step().aWants) : '—' }}
              </p>
            </div>

            <div class="lock-col">
              <div class="lock-card" [class.is-held]="step().lock1Owner !== null">
                <p class="lab-node">LOCK 1</p>
                <p class="lock-owner mono">{{ step().lock1Owner ? 'owned by ' + step().lock1Owner : 'free' }}</p>
              </div>
              <div class="lock-card" [class.is-held]="step().lock2Owner !== null">
                <p class="lab-node">LOCK 2</p>
                <p class="lock-owner mono">{{ step().lock2Owner ? 'owned by ' + step().lock2Owner : 'free' }}</p>
              </div>
            </div>

            <div class="thread-card" [class]="'status-' + step().bStatus">
              <p class="lab-node">Thread B</p>
              <p class="status-pill mono">{{ statusLabel(step().bStatus) }}</p>
              <p class="thread-detail mono">
                Holds: {{ step().bHolds.length ? lockNames(step().bHolds) : '—' }}
              </p>
              <p class="thread-detail mono">
                Wants: {{ step().bWants ? lockName(step().bWants) : '—' }}
              </p>
            </div>
          </div>

          <div class="step-log" aria-live="polite">
            <p class="step-label">{{ step().label }}</p>
            @if (step().deadlock) {
              <p class="deadlock-flag mono">⛔ DEADLOCK — system stuck. Both threads are permanently blocked.</p>
            }
          </div>

          <div class="conditions">
            <p class="conditions-title mono">Classic deadlock conditions</p>
            <ul class="conditions-list">
              @for (c of conditions(); track c.id) {
                <li class="condition-row">
                  <span class="pill" [class.pill-yes]="c.present" [class.pill-no]="!c.present">
                    {{ c.present ? 'present' : 'broken' }}
                  </span>
                  <span class="condition-text">
                    <strong>{{ c.label }}</strong> — {{ c.body }}
                  </span>
                </li>
              }
            </ul>
          </div>
        </div>

        <p class="lab-note" [class.lab-note-warn]="!fixEnabled()">
          @if (fixEnabled()) {
            Forcing every thread to acquire locks in the <strong>same global order</strong> (always LOCK 1 before
            LOCK 2) breaks circular wait: a thread can never end up holding a "later" lock while waiting for an
            "earlier" one that another thread wants. The other three conditions can still technically hold — but
            without a cycle, there is no deadlock.
          } @else {
            All four classic conditions — mutual exclusion, hold-and-wait, no preemption, and circular wait — must
            hold simultaneously for deadlock to occur. Break any one of them and the deadlock cannot happen. Toggle
            "Fix: consistent lock ordering" and run again to see it resolved.
          }
        </p>
      </div>
    </section>
  `,
  styles: `
    .deadlock-grid {
      margin-top: 24px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
      align-items: stretch;
    }
    @media (min-width: 720px) {
      .deadlock-grid { grid-template-columns: 1fr auto 1fr; gap: 16px; }
    }

    .thread-card {
      box-sizing: border-box;
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .thread-card.status-running { border-color: var(--running); background: color-mix(in srgb, var(--running) 8%, var(--surface)); }
    .thread-card.status-waiting { border-color: var(--waiting); background: color-mix(in srgb, var(--waiting) 8%, var(--surface)); }
    .thread-card.status-blocked { border-color: var(--blocked); background: color-mix(in srgb, var(--blocked) 10%, var(--surface)); }
    .thread-card.status-done { border-color: var(--c-task); background: color-mix(in srgb, var(--c-task) 8%, var(--surface)); }

    .status-pill {
      display: inline-block;
      margin-top: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .status-running .status-pill { color: var(--running); }
    .status-waiting .status-pill { color: var(--waiting); }
    .status-blocked .status-pill { color: var(--blocked); }
    .status-done .status-pill { color: var(--c-task); }
    .status-idle .status-pill { color: var(--idle); }

    .thread-detail { margin: 6px 0 0; font-size: 0.75rem; color: var(--text-muted); }

    .lock-col {
      display: flex;
      flex-direction: row;
      gap: 10px;
      justify-content: center;
    }
    @media (min-width: 720px) {
      .lock-col { flex-direction: column; justify-content: center; }
    }

    .lock-card {
      box-sizing: border-box;
      min-width: 108px;
      padding: 10px 14px;
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
      text-align: center;
    }
    .lock-card.is-held { border-style: solid; border-color: var(--c-lock); background: color-mix(in srgb, var(--c-lock) 10%, var(--surface-raised)); }
    .lock-owner { margin: 4px 0 0; font-size: 0.75rem; color: var(--text-muted); }

    .step-log {
      margin-top: 20px;
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
    }
    .step-label { margin: 0; color: var(--text); font-size: 0.9375rem; }
    .deadlock-flag { margin: 8px 0 0; color: var(--blocked); font-weight: 700; font-size: 0.8125rem; letter-spacing: 0.03em; }

    .conditions { margin-top: 20px; }
    .conditions-title { color: var(--text-faint); letter-spacing: 0.08em; text-transform: uppercase; font-size: 0.6875rem; margin-bottom: 10px; }
    .conditions-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px; }
    .condition-row { display: flex; align-items: flex-start; gap: 10px; }
    .condition-text { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }
    .condition-text strong { color: var(--text); }
  `,
})
export class DeadlockLab implements OnDestroy {
  private timer: ReturnType<typeof setInterval> | undefined;

  protected readonly fixEnabled = signal(false);
  protected readonly stepIndex = signal(0);
  protected readonly isPlaying = signal(false);

  private readonly steps = computed(() => (this.fixEnabled() ? FIXED_STEPS : UNSAFE_STEPS));
  protected readonly step = computed(() => this.steps()[this.stepIndex()]);

  protected readonly conditions = computed(() => {
    const s = this.step();
    const holdAndWait =
      (s.aHolds.length > 0 && s.aWants !== null) || (s.bHolds.length > 0 && s.bWants !== null);
    const aWantsOwnedByB = s.aWants !== null && this.ownerOf(s, s.aWants) === 'B';
    const bWantsOwnedByA = s.bWants !== null && this.ownerOf(s, s.bWants) === 'A';
    const circularWait = aWantsOwnedByB && bWantsOwnedByA;
    return CONDITION_INFO.map((c) => ({
      ...c,
      present:
        c.id === 'mutex' ? true : c.id === 'noPreemption' ? true : c.id === 'holdAndWait' ? holdAndWait : circularWait,
    }));
  });

  private ownerOf(s: DeadlockStep, lock: LockId): 'A' | 'B' | null {
    return lock === 1 ? s.lock1Owner : s.lock2Owner;
  }

  protected statusLabel(status: ThreadStatus): string {
    switch (status) {
      case 'idle': return 'idle';
      case 'running': return 'running';
      case 'waiting': return 'waiting';
      case 'blocked': return 'blocked';
      case 'done': return 'done';
    }
  }

  protected lockName(id: LockId | null): string {
    return id === null ? '—' : `LOCK ${id}`;
  }

  protected lockNames(ids: LockId[]): string {
    return ids.map((id) => this.lockName(id)).join(', ');
  }

  protected toggleFix(): void {
    this.stopTimer();
    this.fixEnabled.update((v) => !v);
    this.stepIndex.set(0);
    this.isPlaying.set(false);
  }

  protected run(): void {
    this.stopTimer();
    this.stepIndex.set(0);
    this.isPlaying.set(true);
    this.timer = setInterval(() => {
      const last = this.steps().length - 1;
      if (this.stepIndex() >= last) {
        this.stopTimer();
        this.isPlaying.set(false);
        return;
      }
      this.stepIndex.update((i) => i + 1);
    }, STEP_MS);
  }

  protected reset(): void {
    this.stopTimer();
    this.stepIndex.set(0);
    this.isPlaying.set(false);
  }

  private stopTimer(): void {
    if (this.timer !== undefined) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
