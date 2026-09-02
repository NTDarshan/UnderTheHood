import { Component, OnDestroy, computed, signal } from '@angular/core';

type ThreadState = 'new' | 'ready' | 'running' | 'waiting' | 'terminated';

interface StateInfo {
  id: ThreadState;
  label: string;
  why: string;
  doing: string;
  cpu: string;
  leaves: string;
}

const STATES: StateInfo[] = [
  {
    id: 'new',
    label: 'NEW',
    why: 'The thread object has just been created (e.g. `new Thread(...)`), but it has not been handed to the OS scheduler yet.',
    doing: 'Nothing yet. It exists as a data structure — a stack, an id, a starting instruction pointer — but has not begun executing any code.',
    cpu: 'No. It has never been scheduled and holds no claim on the CPU.',
    leaves: 'A call to start it (e.g. `thread.start()`) moves it into READY, handing it to the scheduler for the first time.',
  },
  {
    id: 'ready',
    label: 'READY',
    why: 'The thread is runnable and waiting only for the scheduler to give it a turn on a CPU core.',
    doing: 'Sitting in the scheduler\'s ready queue alongside other runnable threads, fully able to run but not currently assigned a core.',
    cpu: 'No. It is eligible to run, but until the scheduler picks it, it consumes zero CPU time.',
    leaves: 'The scheduler dispatches it onto a free core, moving it into RUNNING.',
  },
  {
    id: 'running',
    label: 'RUNNING',
    why: 'The scheduler selected this thread and assigned it an actual CPU core to execute on.',
    doing: 'Actively executing instructions on a core — this is the only state in which real work happens.',
    cpu: 'Yes — this is the one state where the thread is consuming CPU cycles right now.',
    leaves: 'Three ways out: its time slice expires (→ READY, preempted), it blocks on I/O, a lock, or a wait condition (→ WAITING/BLOCKED), or it finishes (→ TERMINATED).',
  },
  {
    id: 'waiting',
    label: 'WAITING / BLOCKED',
    why: 'The thread asked for something it cannot have yet — a lock held by another thread, a network response, a `wait()`/`join()` condition, disk I/O.',
    doing: 'Parked by the OS. It is not in any run queue, so the scheduler will not even consider it for a core.',
    cpu: 'No. It cannot consume CPU while blocked, no matter how many cores are free.',
    leaves: 'The condition it was waiting on resolves (lock released, I/O completes, notified) — the OS moves it back to READY, not directly to RUNNING.',
  },
  {
    id: 'terminated',
    label: 'TERMINATED',
    why: 'The thread\'s run method returned, it threw an uncaught exception, or it was forcibly stopped.',
    doing: 'Finished. Its resources (stack, thread-local state) are eligible for cleanup by the OS/runtime.',
    cpu: 'No. This is a terminal state — it never runs again.',
    leaves: 'Nothing — TERMINATED has no outgoing transition. A new unit of work needs a new thread.',
  },
];

const AUTO_PATH: ThreadState[] = ['new', 'ready', 'running', 'waiting', 'ready', 'running', 'terminated'];

@Component({
  selector: 'app-thread-lifecycle',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="thread-lifecycle">
      <div class="container">
        <p class="lab-index">09 — THREAD LIFECYCLE</p>
        <h2 class="lab-title">The thread lifecycle</h2>
        <p class="lab-lede">
          Every thread moves through a small set of states between creation and completion. Press Run to watch a
          thread travel its typical path, or click any state directly to jump there and read what it means.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="run()">
              {{ isRunning() ? 'Running…' : 'Run' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="state-graph" aria-live="polite">
            <div class="graph-row">
              @for (s of topRow; track s; let last = $last) {
                <button
                  type="button"
                  class="lab-node state-node"
                  [class]="'state-' + s"
                  [class.is-current]="current() === s"
                  [attr.aria-pressed]="current() === s"
                  (click)="jumpTo(s)"
                >
                  {{ labelOf(s) }}
                </button>
                @if (!last) {
                  <span class="lab-flow-arrow">&rarr;</span>
                }
              }
            </div>

            <div class="graph-loop-row">
              <span class="loop-label mono">RUNNING &rarr; WAITING/BLOCKED &rarr; READY (loops back)</span>
            </div>

            <div class="graph-row">
              @for (s of bottomRow; track s; let last = $last) {
                <button
                  type="button"
                  class="lab-node state-node"
                  [class]="'state-' + s"
                  [class.is-current]="current() === s"
                  [attr.aria-pressed]="current() === s"
                  (click)="jumpTo(s)"
                >
                  {{ labelOf(s) }}
                </button>
                @if (!last) {
                  <span class="lab-flow-arrow">&rarr;</span>
                }
              }
            </div>
          </div>

          <div class="explain-panel">
            @if (activeInfo(); as info) {
              <p class="explain-title mono">{{ info.label }}</p>
              <dl class="explain-grid">
                <dt>Why did it enter this state?</dt>
                <dd>{{ info.why }}</dd>
                <dt>What is it doing?</dt>
                <dd>{{ info.doing }}</dd>
                <dt>Can it consume CPU right now?</dt>
                <dd>{{ info.cpu }}</dd>
                <dt>What causes it to leave?</dt>
                <dd>{{ info.leaves }}</dd>
              </dl>
            }
          </div>
        </div>

        <p class="lab-note">
          Notice WAITING/BLOCKED never transitions straight back to RUNNING — a blocked thread always re-enters
          READY first and waits for the scheduler to dispatch it again, even if a core is sitting idle at that
          exact moment.
        </p>
      </div>
    </section>
  `,
  styles: `
    .state-graph { margin-top: 22px; display: flex; flex-direction: column; gap: 10px; align-items: center; }
    .graph-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; justify-content: center; }
    .graph-loop-row { padding: 4px 0; }
    .loop-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.04em; }

    .state-node {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      min-width: 110px;
      text-align: center;
      padding: 12px 14px;
      font-size: 0.75rem;
      letter-spacing: 0.04em;
      border-radius: var(--radius-md);
      transition: box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    }
    .state-node:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .state-new { border-color: var(--idle); }
    .state-ready { border-color: var(--waiting); }
    .state-running { border-color: var(--running); }
    .state-waiting { border-color: var(--blocked); }
    .state-terminated { border-color: var(--idle); }

    .state-node.is-current {
      box-shadow: 0 0 0 2px currentColor;
      background: var(--surface-raised);
    }
    .state-new.is-current { color: var(--idle); }
    .state-ready.is-current { color: var(--waiting); }
    .state-running.is-current { color: var(--running); }
    .state-waiting.is-current { color: var(--blocked); }
    .state-terminated.is-current { color: var(--idle); }

    .explain-panel {
      margin-top: 22px;
      padding: 16px 18px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      min-height: 60px;
    }
    .explain-title { font-size: 0.9375rem; margin: 0 0 12px; color: var(--text); }
    .explain-grid { display: grid; grid-template-columns: 1fr; gap: 4px 12px; margin: 0; }
    @media (min-width: 720px) { .explain-grid { grid-template-columns: 260px 1fr; } }
    .explain-grid dt { font-size: 0.75rem; color: var(--text-faint); letter-spacing: 0.02em; margin-top: 10px; }
    .explain-grid dd { margin: 2px 0 0; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; }
  `,
})
export class ThreadLifecycle implements OnDestroy {
  protected readonly topRow: ThreadState[] = ['new', 'ready', 'running'];
  protected readonly bottomRow: ThreadState[] = ['terminated', 'waiting'];

  protected readonly current = signal<ThreadState>('new');
  protected readonly isRunning = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly activeInfo = computed<StateInfo | undefined>(() =>
    STATES.find((s) => s.id === this.current()),
  );

  protected labelOf(id: ThreadState): string {
    return STATES.find((s) => s.id === id)?.label ?? id;
  }

  protected jumpTo(id: ThreadState): void {
    this.stopTimer();
    this.isRunning.set(false);
    this.current.set(id);
  }

  protected run(): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    let step = 0;
    this.current.set(AUTO_PATH[0]);

    this.timer = setInterval(() => {
      step += 1;
      if (step >= AUTO_PATH.length) {
        this.stopTimer();
        this.isRunning.set(false);
        return;
      }
      this.current.set(AUTO_PATH[step]);
    }, 1100);
  }

  protected reset(): void {
    this.stopTimer();
    this.isRunning.set(false);
    this.current.set('new');
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
