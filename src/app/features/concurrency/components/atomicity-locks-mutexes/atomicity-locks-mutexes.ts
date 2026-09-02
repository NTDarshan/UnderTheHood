import { Component, OnDestroy, computed, signal } from '@angular/core';

type ThreadId = 'A' | 'B';
type ThreadStatus = 'idle' | 'running' | 'waiting' | 'done';
type Mode = 'plain' | 'atomic';

interface Frame {
  description: string;
  statuses: Record<ThreadId, ThreadStatus>;
  counter: number;
  hitA?: 'READ' | 'MODIFY' | 'WRITE';
  hitB?: 'READ' | 'MODIFY' | 'WRITE';
}

const PLAIN_FRAMES: Frame[] = [
  { description: 'Thread A reads counter (0) into its local tmp.', statuses: { A: 'running', B: 'idle' }, counter: 0, hitA: 'READ' },
  { description: 'Thread B reads counter (0) — before A has written anything back.', statuses: { A: 'running', B: 'running' }, counter: 0, hitB: 'READ' },
  { description: 'Thread A computes tmp + 1 = 1, locally.', statuses: { A: 'running', B: 'running' }, counter: 0, hitA: 'MODIFY' },
  { description: 'Thread B computes tmp + 1 = 1, locally — using its own stale read of 0.', statuses: { A: 'running', B: 'running' }, counter: 0, hitB: 'MODIFY' },
  { description: 'Thread A writes counter = 1.', statuses: { A: 'done', B: 'running' }, counter: 1, hitA: 'WRITE' },
  { description: "Thread B writes counter = 1 — overwriting A's update. One increment is lost.", statuses: { A: 'done', B: 'done' }, counter: 1, hitB: 'WRITE' },
];

const ATOMIC_FRAMES: Frame[] = [
  { description: 'Thread A performs an atomic increment: read, modify and write happen as one indivisible step. Thread B must wait.', statuses: { A: 'running', B: 'waiting' }, counter: 1 },
  { description: 'Thread A finishes. Thread B was blocked from starting its own atomic increment until now.', statuses: { A: 'done', B: 'running' }, counter: 1 },
  { description: 'Thread B performs its atomic increment on the now-current value.', statuses: { A: 'done', B: 'done' }, counter: 2 },
];

@Component({
  selector: 'app-atomicity-locks-mutexes',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="atomicity-locks-mutexes">
      <div class="container">
        <p class="lab-index">22-23 — ATOMICITY, LOCKS &amp; MUTEXES</p>
        <h2 class="lab-title">Atomicity, locks and mutexes</h2>
        <p class="lab-lede">
          <span class="mono">counter++</span> looks like one operation. It isn't. It's three: read the value,
          modify it, write it back. Anything that can interrupt a thread between those steps can corrupt the
          result — which is exactly what an <strong>atomic</strong> operation is designed to prevent.
        </p>

        <div class="lab-panel">
          <p class="lab-node">counter++ is really three steps</p>
          <div class="breakdown">
            <div class="bd-step"><span class="bd-num mono">1</span><span class="mono">READ</span><span class="bd-text">tmp = counter</span></div>
            <span class="lab-flow-arrow">→</span>
            <div class="bd-step"><span class="bd-num mono">2</span><span class="mono">MODIFY</span><span class="bd-text">tmp = tmp + 1</span></div>
            <span class="lab-flow-arrow">→</span>
            <div class="bd-step"><span class="bd-num mono">3</span><span class="mono">WRITE</span><span class="bd-text">counter = tmp</span></div>
          </div>
          <p class="lab-note">
            None of these three steps are combined by the hardware into one — a thread can be paused after any of
            them, and another thread can run in the gap.
          </p>

          <div class="lab-btn-row" role="group" aria-label="Mode">
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'plain'" [attr.aria-pressed]="mode() === 'plain'" [disabled]="isRunning()" (click)="setMode('plain')">
              Plain counter++
            </button>
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'atomic'" [attr.aria-pressed]="mode() === 'atomic'" [disabled]="isRunning()" (click)="setMode('atomic')">
              Atomic increment
            </button>
          </div>

          <div class="threads-row">
            @for (t of threadIds; track t) {
              <div class="thread-card" [class.is-running]="statuses()[t] === 'running'" [class.is-waiting]="statuses()[t] === 'waiting'">
                <p class="lab-node">Thread {{ t }}</p>
                <span class="status-pill mono" [attr.data-status]="statuses()[t]">{{ statusLabel(statuses()[t]) }}</span>
                @if (mode() === 'plain') {
                  <p class="thread-code mono">
                    <span [class.is-hit]="currentFrame()?.hitA === 'READ' && t === 'A' || currentFrame()?.hitB === 'READ' && t === 'B'">READ</span>
                    <span [class.is-hit]="currentFrame()?.hitA === 'MODIFY' && t === 'A' || currentFrame()?.hitB === 'MODIFY' && t === 'B'">MODIFY</span>
                    <span [class.is-hit]="currentFrame()?.hitA === 'WRITE' && t === 'A' || currentFrame()?.hitB === 'WRITE' && t === 'B'">WRITE</span>
                  </p>
                }
              </div>
            }
          </div>

          <div class="counter-box mono">counter = <span class="counter-value">{{ counter() }}</span></div>

          <p class="live-status mono" aria-live="polite">{{ statusText() }}</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="run()">Run {{ mode() === 'plain' ? 'plain' : 'atomic' }} increment</button>
            <button type="button" class="lab-btn" [disabled]="isRunning()" (click)="reset()">Reset</button>
          </div>

          @if (finished()) {
            <div class="result-panel" [class.is-wrong]="!isCorrect()">
              <p class="mono result-line">Expected: <strong>2</strong> — Actual: <strong>{{ counter() }}</strong></p>
              <span class="pill" [class.pill-yes]="isCorrect()" [class.pill-no]="!isCorrect()">
                {{ isCorrect() ? 'CORRECT — atomic increment cannot be interrupted mid-way' : 'WRONG — lost update from a non-atomic counter++' }}
              </span>
            </div>
          }
        </div>

        <div class="lab-panel lock-panel">
          <p class="lab-node">Shared resource: DATABASE RECORD, guarded by a lock</p>
          <p class="lab-lede lock-lede">
            Two threads want to modify the same record. Only one may hold the lock at a time — the other must wait
            until it's released.
          </p>

          <div class="lock-threads">
            @for (t of threadIds; track t) {
              <div class="lock-thread-card">
                <p class="lab-node">Thread {{ t }}</p>
                <span class="status-pill mono" [attr.data-status]="lockStatusOf(t)">
                  {{ lockOwner() === t ? '🔒 OWNS LOCK' : (waiting() === t ? 'WAITING' : 'IDLE') }}
                </span>
                <div class="lab-btn-row">
                  <button type="button" class="lab-btn" [disabled]="lockOwner() === t" (click)="requestLock(t)">Lock</button>
                  <button type="button" class="lab-btn lab-btn-danger" [disabled]="lockOwner() !== t" (click)="unlock(t)">Unlock</button>
                </div>
              </div>
            }
          </div>

          <div class="record-box mono" [class.is-locked]="lockOwner() !== null">
            DATABASE RECORD — {{ lockOwner() ? ('locked by Thread ' + lockOwner()) : 'unlocked' }}
          </div>

          <p class="lab-node timeline-heading">Execution timeline</p>
          <ol class="event-log mono" aria-live="polite">
            @for (e of events(); track $index) {
              <li>{{ e }}</li>
            } @empty {
              <li class="event-empty">No events yet — press Lock on a thread.</li>
            }
          </ol>
        </div>

        <p class="lab-note">
          An atomic operation completes as a single, indivisible step — no other thread can observe or interleave
          with it partway through. A lock (mutex) achieves the same safety for arbitrary blocks of code by making
          every other thread wait its turn.
        </p>
      </div>
    </section>
  `,
  styles: `
    .breakdown { margin-top: 12px; display: flex; flex-wrap: wrap; align-items: stretch; gap: 8px; }
    .bd-step {
      display: flex; flex-direction: column; gap: 4px; align-items: flex-start;
      padding: 10px 14px; border: 1px solid var(--border-strong); border-radius: var(--radius-md);
      background: var(--surface); min-width: 120px;
    }
    .bd-num { color: var(--text-faint); font-size: 0.6875rem; }
    .bd-step .mono:nth-child(2) { color: var(--accent-2); font-size: 0.8125rem; font-weight: 600; }
    .bd-text { color: var(--text-muted); font-size: 0.75rem; }

    .threads-row { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 700px) { .threads-row { grid-template-columns: 1fr 1fr; } }

    .thread-card { border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; background: var(--surface); transition: border-color 0.2s ease, box-shadow 0.2s ease; }
    .thread-card.is-running { border-color: var(--running); box-shadow: 0 0 0 2px color-mix(in srgb, var(--running) 40%, transparent); }
    .thread-card.is-waiting { border-color: var(--waiting); box-shadow: 0 0 0 2px color-mix(in srgb, var(--waiting) 40%, transparent); }

    .status-pill { display: inline-block; margin-top: 8px; font-size: 0.6875rem; letter-spacing: 0.06em; padding: 3px 8px; border-radius: 999px; border: 1px solid var(--border-strong); color: var(--text-muted); }
    .status-pill[data-status='running'] { color: var(--running); border-color: var(--running); }
    .status-pill[data-status='waiting'] { color: var(--waiting); border-color: var(--waiting); }
    .status-pill[data-status='done'] { color: var(--text-faint); }

    .thread-code { margin-top: 10px; display: flex; gap: 8px; font-size: 0.75rem; color: var(--text-faint); }
    .thread-code .is-hit { color: var(--bg); background: var(--c-thread); border-radius: 3px; padding: 1px 6px; }

    .counter-box { margin-top: 20px; padding: 10px 16px; display: inline-flex; gap: 8px; border-radius: var(--radius-md); border: 1px solid var(--c-queue); background: color-mix(in srgb, var(--c-queue) 10%, var(--surface)); }
    .counter-value { font-weight: 700; color: var(--c-queue); }

    .live-status { margin-top: 14px; min-height: 20px; font-size: 0.8125rem; color: var(--accent-2); }

    .result-panel { margin-top: 20px; padding: 16px 18px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface-elevated); }
    .result-panel.is-wrong { border-color: color-mix(in srgb, var(--danger) 40%, var(--border)); }
    .result-line { font-size: 0.8125rem; color: var(--text-muted); margin: 0 0 8px; }
    .result-line strong { color: var(--text); }

    .lock-lede { margin-top: 6px; max-width: none; font-size: 0.875rem; }
    .lock-threads { margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 700px) { .lock-threads { grid-template-columns: 1fr 1fr; } }
    .lock-thread-card { border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; background: var(--surface); }

    .record-box {
      margin-top: 20px; padding: 14px 18px; border-radius: var(--radius-md); border: 1px dashed var(--border-strong);
      background: var(--surface); color: var(--text-muted); font-size: 0.8125rem; transition: border-color 0.2s ease, background 0.2s ease;
    }
    .record-box.is-locked { border-style: solid; border-color: var(--c-lock); background: color-mix(in srgb, var(--c-lock) 8%, var(--surface)); color: var(--text); }

    .timeline-heading { margin-top: 24px; }
    .event-log { margin-top: 10px; padding-left: 20px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.9; max-height: 220px; overflow-y: auto; }
    .event-empty { color: var(--text-faint); font-style: italic; list-style: none; margin-left: -20px; }
  `,
})
export class AtomicityLocksMutexes implements OnDestroy {
  protected readonly threadIds: ThreadId[] = ['A', 'B'];

  protected readonly mode = signal<Mode>('plain');
  protected readonly counter = signal(0);
  protected readonly statuses = signal<Record<ThreadId, ThreadStatus>>({ A: 'idle', B: 'idle' });
  protected readonly frameIndex = signal(-1);
  protected readonly isRunning = signal(false);
  protected readonly finished = signal(false);

  protected readonly currentFrame = computed<Frame | null>(() => {
    const idx = this.frameIndex();
    if (idx < 0) return null;
    const frames = this.mode() === 'plain' ? PLAIN_FRAMES : ATOMIC_FRAMES;
    return idx < frames.length ? frames[idx] : null;
  });

  protected readonly isCorrect = computed(() => this.counter() === 2);

  protected readonly statusText = computed(() => {
    const frame = this.currentFrame();
    if (frame) return frame.description;
    if (this.finished()) return `Done. Final counter = ${this.counter()}.`;
    return `Ready. Mode: ${this.mode() === 'plain' ? 'plain counter++' : 'atomic increment'}.`;
  });

  private timer: ReturnType<typeof setInterval> | null = null;

  // --- Atomicity demo ---

  protected setMode(mode: Mode): void {
    this.mode.set(mode);
    this.reset();
  }

  protected statusLabel(status: ThreadStatus): string {
    switch (status) {
      case 'running': return 'RUNNING';
      case 'waiting': return 'WAITING';
      case 'done': return 'DONE';
      default: return 'IDLE';
    }
  }

  protected run(): void {
    this.reset();
    this.isRunning.set(true);
    this.timer = setInterval(() => this.tick(), 900);
  }

  private tick(): void {
    const frames = this.mode() === 'plain' ? PLAIN_FRAMES : ATOMIC_FRAMES;
    const nextIdx = this.frameIndex() + 1;

    if (nextIdx >= frames.length) {
      this.stopTimer();
      this.isRunning.set(false);
      this.finished.set(true);
      return;
    }

    const frame = frames[nextIdx];
    this.frameIndex.set(nextIdx);
    this.statuses.set(frame.statuses);
    this.counter.set(frame.counter);
  }

  protected reset(): void {
    this.stopTimer();
    this.isRunning.set(false);
    this.finished.set(false);
    this.frameIndex.set(-1);
    this.counter.set(0);
    this.statuses.set({ A: 'idle', B: 'idle' });
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  // --- Lock demo ---

  protected readonly lockOwner = signal<ThreadId | null>(null);
  protected readonly waiting = signal<ThreadId | null>(null);
  protected readonly events = signal<string[]>([]);

  protected lockStatusOf(t: ThreadId): ThreadStatus {
    if (this.lockOwner() === t) return 'done';
    if (this.waiting() === t) return 'waiting';
    return 'idle';
  }

  protected requestLock(t: ThreadId): void {
    const owner = this.lockOwner();
    if (owner === null) {
      this.lockOwner.set(t);
      if (this.waiting() === t) this.waiting.set(null);
      this.pushEvent(`Thread ${t} acquires the lock.`);
    } else if (owner !== t) {
      this.waiting.set(t);
      this.pushEvent(`Thread ${t} is WAITING — lock held by Thread ${owner}.`);
    }
  }

  protected unlock(t: ThreadId): void {
    if (this.lockOwner() !== t) return;
    this.lockOwner.set(null);
    this.pushEvent(`Thread ${t} releases the lock.`);

    const waiter = this.waiting();
    if (waiter && waiter !== t) {
      this.lockOwner.set(waiter);
      this.waiting.set(null);
      this.pushEvent(`Thread ${waiter} immediately acquires the lock.`);
    }
  }

  private pushEvent(text: string): void {
    this.events.update((list) => [...list, text]);
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
