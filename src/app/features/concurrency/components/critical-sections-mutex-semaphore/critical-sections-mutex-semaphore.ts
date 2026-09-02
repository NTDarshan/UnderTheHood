import { Component, OnDestroy, computed, signal } from '@angular/core';

type CsPhase = 'idle' | 'outside-before' | 'critical' | 'outside-after' | 'done';
type CsSize = 'small' | 'large';

type MutexThread = 'X' | 'Y';
type SemThread = 'A' | 'B' | 'C' | 'D';

const TICK_MS = 400;

@Component({
  selector: 'app-critical-sections-mutex-semaphore',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="critical-sections-mutex-semaphore">
      <div class="container">
        <p class="lab-index">24-25 — CRITICAL SECTIONS, MUTEXES &amp; SEMAPHORES</p>
        <h2 class="lab-title">Critical sections, mutexes and semaphores</h2>
        <p class="lab-lede">
          A critical section is the specific stretch of code that touches shared state and must run without
          interruption from other threads. Everything else — the "outside" code — can run freely in parallel. The
          size of that protected stretch has a direct performance cost.
        </p>

        <div class="lab-panel">
          <p class="lab-node">Thread A's code, phase by phase</p>

          <div class="phase-track">
            <div class="phase-chip" [class.is-current]="csPhase() === 'outside-before'">outside critical section</div>
            <span class="lab-flow-arrow">→</span>
            <div class="phase-chip is-lock" [class.is-current]="csPhase() === 'critical' && csElapsedInPhase() === 0">LOCK</div>
            <span class="lab-flow-arrow">→</span>
            <div class="phase-chip is-critical" [class.is-current]="csPhase() === 'critical'">CRITICAL SECTION</div>
            <span class="lab-flow-arrow">→</span>
            <div class="phase-chip is-lock" [class.is-current]="csPhase() === 'outside-after' && csJustUnlocked()">UNLOCK</div>
            <span class="lab-flow-arrow">→</span>
            <div class="phase-chip" [class.is-current]="csPhase() === 'outside-after'">outside critical section</div>
          </div>

          <div class="lab-btn-row" role="group" aria-label="Critical section size">
            <button type="button" class="lab-btn" [class.is-active]="csSize() === 'small'" [attr.aria-pressed]="csSize() === 'small'" [disabled]="csRunning()" (click)="setCsSize('small')">
              Normal critical section
            </button>
            <button type="button" class="lab-btn" [class.is-active]="csSize() === 'large'" [attr.aria-pressed]="csSize() === 'large'" [disabled]="csRunning()" (click)="setCsSize('large')">
              Make critical section too large
            </button>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="csRunning()" (click)="runCriticalSection()">Run Thread A</button>
            <button type="button" class="lab-btn" [disabled]="csRunning()" (click)="resetCriticalSection()">Reset</button>
          </div>

          <div class="waiters-row">
            @for (t of ['B', 'C']; track t) {
              <div class="waiter-card" [class.is-waiting]="csPhase() === 'critical'">
                <p class="lab-node">Thread {{ t }}</p>
                <span class="status-pill mono" [attr.data-status]="csPhase() === 'critical' ? 'waiting' : (csPhase() === 'done' ? 'done' : 'idle')">
                  {{ csPhase() === 'critical' ? 'WAITING' : (csPhase() === 'done' ? 'PROCEEDED' : 'IDLE') }}
                </span>
              </div>
            }
          </div>

          <p class="live-status mono" aria-live="polite">{{ csStatusText() }}</p>

          @if (csPhase() === 'done') {
            <p class="lab-note" [class.lab-note-warn]="csSize() === 'large'">
              Threads B and C were blocked for {{ csWaitedMs() }}ms while Thread A held the lock —
              {{ csSize() === 'large' ? 'far longer than necessary, because unrelated work was left inside the lock.' : 'roughly the time actually needed to touch the shared data.' }}
            </p>
          }
        </div>

        <div class="lab-panel">
          <p class="lab-node">Mutex vs. semaphore</p>
          <p class="lab-lede compare-lede">
            A mutex allows exactly one owner at a time. A semaphore generalizes this to N concurrent owners — think
            of it as a pool of N interchangeable permits.
          </p>

          <div class="compare-grid">
            <div class="compare-col">
              <p class="col-title mono">MUTEX <span class="tok-dim">— 1 owner</span></p>
              <div class="mutex-threads">
                @for (t of mutexThreadIds; track t) {
                  <div class="mini-thread-card">
                    <p class="lab-node">Thread {{ t }}</p>
                    <span class="status-pill mono" [attr.data-status]="mutexOwner() === t ? 'done' : (mutexWaiting() === t ? 'waiting' : 'idle')">
                      {{ mutexOwner() === t ? '🔒 OWNS LOCK' : (mutexWaiting() === t ? 'WAITING' : 'IDLE') }}
                    </span>
                    <div class="lab-btn-row">
                      <button type="button" class="lab-btn" [disabled]="mutexOwner() === t" (click)="requestMutex(t)">Lock</button>
                      <button type="button" class="lab-btn lab-btn-danger" [disabled]="mutexOwner() !== t" (click)="releaseMutex(t)">Unlock</button>
                    </div>
                  </div>
                }
              </div>
            </div>

            <div class="compare-col">
              <p class="col-title mono">SEMAPHORE <span class="tok-dim">— 3 permits</span></p>
              <div class="permit-slots" aria-label="Connection pool">
                @for (slot of permitSlots(); track $index) {
                  <div class="permit-slot" [class.is-filled]="slot !== null">{{ slot ?? '' }}</div>
                }
              </div>
              <p class="lab-note permit-note">{{ semHeld().length }} / 3 connections in use.</p>
              <div class="sem-threads">
                @for (t of semThreadIds; track t) {
                  <div class="mini-thread-card">
                    <p class="lab-node">Thread {{ t }}</p>
                    <span class="status-pill mono" [attr.data-status]="semHeld().includes(t) ? 'done' : (semWaiting().includes(t) ? 'waiting' : 'idle')">
                      {{ semHeld().includes(t) ? '✓ ACTIVE' : (semWaiting().includes(t) ? 'WAITING' : 'IDLE') }}
                    </span>
                    <div class="lab-btn-row">
                      <button type="button" class="lab-btn" [disabled]="semHeld().includes(t) || semWaiting().includes(t)" (click)="requestSemaphore(t)">Request</button>
                      <button type="button" class="lab-btn lab-btn-danger" [disabled]="!semHeld().includes(t)" (click)="releaseSemaphore(t)">Release</button>
                    </div>
                  </div>
                }
              </div>
            </div>
          </div>
        </div>

        <p class="lab-note">
          A mutex protects exclusive ownership — exactly one thread may be inside the critical section at once. A
          semaphore controls a number of concurrent permits — up to N threads may hold one simultaneously, and the
          (N+1)th must wait for a permit to free up. A mutex is simply a semaphore with N = 1.
        </p>
      </div>
    </section>
  `,
  styles: `
    .phase-track { margin-top: 16px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .phase-chip {
      padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong);
      background: var(--surface); font-family: var(--font-mono); font-size: 0.75rem; color: var(--text-muted);
      transition: box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    }
    .phase-chip.is-lock { color: var(--c-lock); border-color: color-mix(in srgb, var(--c-lock) 50%, var(--border-strong)); }
    .phase-chip.is-critical { color: var(--danger); border-color: color-mix(in srgb, var(--danger) 40%, var(--border-strong)); font-weight: 600; }
    .phase-chip.is-current { box-shadow: 0 0 0 2px var(--accent); background: color-mix(in srgb, var(--accent) 10%, var(--surface)); }

    .waiters-row { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; max-width: 420px; }
    .waiter-card { border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 14px; background: var(--surface); transition: border-color 0.2s ease; }
    .waiter-card.is-waiting { border-color: var(--waiting); }

    .status-pill { display: inline-block; margin-top: 8px; font-size: 0.6875rem; letter-spacing: 0.05em; padding: 3px 8px; border-radius: 999px; border: 1px solid var(--border-strong); color: var(--text-muted); }
    .status-pill[data-status='waiting'] { color: var(--waiting); border-color: var(--waiting); }
    .status-pill[data-status='done'] { color: var(--running); border-color: var(--running); }

    .live-status { margin-top: 16px; min-height: 20px; font-size: 0.8125rem; color: var(--accent-2); }

    .compare-lede { margin-top: 6px; max-width: none; font-size: 0.875rem; }
    .compare-grid { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 24px; }
    @media (min-width: 800px) { .compare-grid { grid-template-columns: 1fr 1fr; } }
    .col-title { font-size: 0.8125rem; color: var(--text); margin-bottom: 14px; }

    .mutex-threads, .sem-threads { display: grid; grid-template-columns: 1fr; gap: 10px; }
    @media (min-width: 500px) and (max-width: 799px) { .mutex-threads, .sem-threads { grid-template-columns: 1fr 1fr; } }
    .mini-thread-card { border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 14px; background: var(--surface); }

    .permit-slots { display: flex; gap: 8px; }
    .permit-slot {
      width: 48px; height: 48px; display: flex; align-items: center; justify-content: center;
      border: 1px dashed var(--border-strong); border-radius: var(--radius-sm); font-family: var(--font-mono);
      font-size: 0.8125rem; color: var(--text-faint); background: var(--surface);
    }
    .permit-slot.is-filled { border-style: solid; border-color: var(--c-queue); background: color-mix(in srgb, var(--c-queue) 12%, var(--surface)); color: var(--text); font-weight: 700; }
    .permit-note { margin-top: 10px; font-size: 0.75rem; }
  `,
})
export class CriticalSectionsMutexSemaphore implements OnDestroy {
  // --- Critical-section size demo ---

  protected readonly csSize = signal<CsSize>('small');
  protected readonly csPhase = signal<CsPhase>('idle');
  protected readonly csRunning = signal(false);
  protected readonly csTicks = signal(0);
  private csTimer: ReturnType<typeof setInterval> | null = null;

  private readonly csCriticalTicks = computed(() => (this.csSize() === 'small' ? 2 : 6));

  protected readonly csElapsedInPhase = signal(0);
  protected readonly csJustUnlocked = signal(false);

  protected readonly csWaitedMs = computed(() => this.csCriticalTicks() * TICK_MS);

  protected readonly csStatusText = computed(() => {
    switch (this.csPhase()) {
      case 'idle': return 'Ready. Press "Run Thread A" to step through its code.';
      case 'outside-before': return 'Thread A is running unrelated code — no lock held yet.';
      case 'critical': return 'Thread A holds the lock and is inside the critical section. B and C must wait.';
      case 'outside-after': return this.csJustUnlocked() ? 'Thread A releases the lock and returns to unrelated code.' : 'Thread A is back to running unrelated code.';
      case 'done': return `Done. B and C were unblocked after ${this.csWaitedMs()}ms.`;
    }
  });

  protected setCsSize(size: CsSize): void {
    this.csSize.set(size);
    this.resetCriticalSection();
  }

  protected runCriticalSection(): void {
    this.resetCriticalSection();
    this.csRunning.set(true);
    this.csPhase.set('outside-before');
    let tick = 0;
    this.csTimer = setInterval(() => {
      tick++;
      if (tick === 1) {
        this.csPhase.set('critical');
        this.csElapsedInPhase.set(0);
      } else if (tick > 1 && tick <= this.csCriticalTicks()) {
        this.csElapsedInPhase.set(tick - 1);
      } else if (tick === this.csCriticalTicks() + 1) {
        this.csPhase.set('outside-after');
        this.csJustUnlocked.set(true);
      } else if (tick === this.csCriticalTicks() + 2) {
        this.csJustUnlocked.set(false);
        this.csPhase.set('done');
        this.stopCsTimer();
        this.csRunning.set(false);
      }
    }, TICK_MS);
  }

  protected resetCriticalSection(): void {
    this.stopCsTimer();
    this.csRunning.set(false);
    this.csPhase.set('idle');
    this.csElapsedInPhase.set(0);
    this.csJustUnlocked.set(false);
  }

  private stopCsTimer(): void {
    if (this.csTimer !== null) {
      clearInterval(this.csTimer);
      this.csTimer = null;
    }
  }

  // --- Mutex mini-demo ---

  protected readonly mutexThreadIds: MutexThread[] = ['X', 'Y'];
  protected readonly mutexOwner = signal<MutexThread | null>(null);
  protected readonly mutexWaiting = signal<MutexThread | null>(null);

  protected requestMutex(t: MutexThread): void {
    const owner = this.mutexOwner();
    if (owner === null) {
      this.mutexOwner.set(t);
      if (this.mutexWaiting() === t) this.mutexWaiting.set(null);
    } else if (owner !== t) {
      this.mutexWaiting.set(t);
    }
  }

  protected releaseMutex(t: MutexThread): void {
    if (this.mutexOwner() !== t) return;
    this.mutexOwner.set(null);
    const waiter = this.mutexWaiting();
    if (waiter && waiter !== t) {
      this.mutexOwner.set(waiter);
      this.mutexWaiting.set(null);
    }
  }

  // --- Semaphore demo ---

  protected readonly semThreadIds: SemThread[] = ['A', 'B', 'C', 'D'];
  protected readonly semPermits = 3;
  protected readonly semHeld = signal<SemThread[]>([]);
  protected readonly semWaiting = signal<SemThread[]>([]);

  protected readonly permitSlots = computed<(SemThread | null)[]>(() => {
    const held = this.semHeld();
    const slots: (SemThread | null)[] = [];
    for (let i = 0; i < this.semPermits; i++) {
      slots.push(held[i] ?? null);
    }
    return slots;
  });

  protected requestSemaphore(t: SemThread): void {
    if (this.semHeld().includes(t) || this.semWaiting().includes(t)) return;
    if (this.semHeld().length < this.semPermits) {
      this.semHeld.update((list) => [...list, t]);
    } else {
      this.semWaiting.update((list) => [...list, t]);
    }
  }

  protected releaseSemaphore(t: SemThread): void {
    if (!this.semHeld().includes(t)) return;
    this.semHeld.update((list) => list.filter((x) => x !== t));

    const queue = this.semWaiting();
    if (queue.length > 0) {
      const [next, ...rest] = queue;
      this.semWaiting.set(rest);
      this.semHeld.update((list) => [...list, next]);
    }
  }

  ngOnDestroy(): void {
    this.stopCsTimer();
  }
}
