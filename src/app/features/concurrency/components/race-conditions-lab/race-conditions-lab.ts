import { Component, OnDestroy, computed, signal } from '@angular/core';

type ThreadId = 'A' | 'B';
type StepOp = 'READ' | 'WRITE';

interface Step {
  thread: ThreadId;
  op: StepOp;
}

interface Interleaving {
  label: string;
  steps: Step[];
}

/** All 6 valid interleavings of A(READ,WRITE) and B(READ,WRITE) that respect each
 *  thread's own program order (a thread's WRITE always comes after its own READ). */
function buildInterleavings(): Interleaving[] {
  const aReadFirst: Step[][] = [];
  const positions = [0, 1, 2, 3];

  // Choose which 2 of the 4 slots belong to thread A (in order READ,WRITE); rest go to B.
  const combos: number[][] = [
    [0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3],
  ];

  for (const combo of combos) {
    const steps: Step[] = new Array(4);
    let aIdx = 0;
    let bIdx = 0;
    for (const pos of positions) {
      if (combo.includes(pos)) {
        steps[pos] = { thread: 'A', op: aIdx === 0 ? 'READ' : 'WRITE' };
        aIdx++;
      } else {
        steps[pos] = { thread: 'B', op: bIdx === 0 ? 'READ' : 'WRITE' };
        bIdx++;
      }
    }
    aReadFirst.push(steps);
  }

  return aReadFirst.map((steps) => ({
    label: steps.map((s) => `${s.thread}:${s.op[0]}`).join(' → '),
    steps,
  }));
}

const INTERLEAVINGS = buildInterleavings();
// Index 2 = [A:READ, B:READ, A:WRITE, B:WRITE] — the classic lost-update race.
const DEFAULT_INDEX = INTERLEAVINGS.findIndex(
  (i) => i.steps[0].thread === 'A' && i.steps[0].op === 'READ' &&
    i.steps[1].thread === 'B' && i.steps[1].op === 'READ',
);

@Component({
  selector: 'app-race-conditions-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="race-conditions-lab">
      <div class="container">
        <p class="lab-index">20-21 — RACE CONDITIONS</p>
        <h2 class="lab-title">Race conditions</h2>
        <p class="lab-lede">
          Two threads share one variable in memory: <span class="mono">counter</span>. Each thread does the exact
          same three things — read the current value, add 1 to it, write the result back. Run it below and watch
          the final value depend entirely on the order the CPU happens to interleave those steps in.
        </p>

        <div class="lab-panel">
          <div class="shared-mem">
            <p class="lab-node">Shared memory</p>
            <div class="counter-box mono" [class.is-updating]="isRunning()">
              counter = <span class="counter-value">{{ sharedCounter() }}</span>
            </div>
          </div>

          <div class="threads-row">
            @for (t of threadIds; track t) {
              <div class="thread-card" [class.is-active]="currentStep()?.thread === t">
                <p class="lab-node">Thread {{ t }}</p>
                <p class="thread-code mono">
                  <span [class.is-hit]="isHit(t, 'READ')">tmp = counter</span><br />
                  <span class="tok-dim">tmp = tmp + 1</span><br />
                  <span [class.is-hit]="isHit(t, 'WRITE')">counter = tmp</span>
                </p>
                <p class="thread-reg mono">local tmp: <strong>{{ registers()[t] === null ? '—' : registers()[t] }}</strong></p>
              </div>
            }
          </div>

          <div class="timeline" role="list" aria-label="Execution order">
            @for (step of currentOrder().steps; track $index) {
              <div
                class="tl-step"
                role="listitem"
                [class.is-thread-a]="step.thread === 'A'"
                [class.is-thread-b]="step.thread === 'B'"
                [class.is-done]="$index < stepIndex()"
                [class.is-current]="$index === stepIndex() && isRunning()"
              >
                <span class="tl-index mono">{{ $index + 1 }}</span>
                <span class="tl-label mono">{{ step.thread }}:{{ step.op }}</span>
              </div>
              @if (!$last) {
                <span class="lab-flow-arrow">→</span>
              }
            }
          </div>

          <p class="live-status mono" aria-live="polite">{{ statusText() }}</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="run()">
              Run interleaved
            </button>
            <button type="button" class="lab-btn" [disabled]="isRunning()" (click)="shuffle()">
              Shuffle interleaving
            </button>
            <button type="button" class="lab-btn" [disabled]="isRunning()" (click)="reset()">Reset</button>
          </div>

          @if (finished()) {
            <div class="result-panel" [class.is-wrong]="!isCorrect()">
              <p class="mono result-line">
                Order run: <strong>{{ currentOrder().label }}</strong>
              </p>
              <p class="mono result-line">
                Expected (two increments, no interference): <strong>2</strong> — Actual result:
                <strong>{{ sharedCounter() }}</strong>
              </p>
              <span class="pill" [class.pill-yes]="isCorrect()" [class.pill-no]="!isCorrect()">
                {{ isCorrect() ? 'CORRECT — no interleaving overlap' : 'WRONG — lost update' }}
              </span>
              @if (!isCorrect()) {
                <p class="lab-note lab-note-warn">
                  Both threads read <span class="mono">counter</span> before either one wrote back, so both
                  computed "0 + 1" independently. Thread B's write silently overwrote thread A's — one increment
                  was lost.
                </p>
              }
            </div>
          }
        </div>

        <p class="lab-note">
          A race condition occurs when the correctness of a result depends on the relative timing or interleaving
          of operations on shared state. The code for each thread is correct in isolation — the bug only exists in
          how the two executions can interleave.
        </p>
      </div>
    </section>
  `,
  styles: `
    .shared-mem { margin-bottom: 24px; }
    .counter-box {
      margin-top: 8px;
      display: inline-flex;
      align-items: baseline;
      gap: 8px;
      padding: 12px 20px;
      border-radius: var(--radius-md);
      border: 1px solid var(--c-queue);
      background: color-mix(in srgb, var(--c-queue) 10%, var(--surface));
      font-size: 1rem;
      color: var(--text);
      transition: box-shadow 0.2s ease;
    }
    .counter-box.is-updating { box-shadow: 0 0 0 2px var(--c-queue); }
    .counter-value { font-size: 1.25rem; font-weight: 700; color: var(--c-queue); }

    .threads-row { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 700px) { .threads-row { grid-template-columns: 1fr 1fr; } }

    .thread-card {
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 16px;
      background: var(--surface);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .thread-card.is-active { border-color: var(--c-thread); box-shadow: 0 0 0 2px color-mix(in srgb, var(--c-thread) 50%, transparent); }

    .thread-code { margin-top: 8px; font-size: 0.8125rem; line-height: 1.9; color: var(--text-muted); }
    .thread-code .is-hit { color: var(--bg); background: var(--c-thread); border-radius: 3px; padding: 1px 4px; }

    .thread-reg { margin-top: 8px; font-size: 0.75rem; color: var(--text-faint); }
    .thread-reg strong { color: var(--text); }

    .timeline {
      margin-top: 24px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .tl-step {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 10px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      opacity: 0.55;
      transition: opacity 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
    }
    .tl-step.is-thread-a { border-color: color-mix(in srgb, var(--c-thread) 60%, var(--border-strong)); }
    .tl-step.is-thread-b { border-color: color-mix(in srgb, var(--c-task) 60%, var(--border-strong)); }
    .tl-step.is-done { opacity: 1; }
    .tl-step.is-current { opacity: 1; box-shadow: 0 0 0 2px var(--accent); }
    .tl-index { color: var(--text-faint); font-size: 0.6875rem; }
    .tl-label { font-size: 0.75rem; color: var(--text); }

    .live-status {
      margin-top: 14px;
      min-height: 20px;
      font-size: 0.8125rem;
      color: var(--accent-2);
    }

    .result-panel {
      margin-top: 20px;
      padding: 16px 18px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
    }
    .result-panel.is-wrong { border-color: color-mix(in srgb, var(--danger) 40%, var(--border)); }
    .result-line { font-size: 0.8125rem; color: var(--text-muted); margin: 4px 0; }
    .result-line strong { color: var(--text); }
    .result-panel .pill { margin-top: 6px; }
  `,
})
export class RaceConditionsLab implements OnDestroy {
  protected readonly threadIds: ThreadId[] = ['A', 'B'];

  private readonly orderIndex = signal(DEFAULT_INDEX >= 0 ? DEFAULT_INDEX : 0);
  protected readonly currentOrder = computed(() => INTERLEAVINGS[this.orderIndex()]);

  protected readonly sharedCounter = signal(0);
  protected readonly registers = signal<Record<ThreadId, number | null>>({ A: null, B: null });
  protected readonly stepIndex = signal(0);
  protected readonly isRunning = signal(false);
  protected readonly finished = signal(false);

  protected readonly currentStep = computed<Step | null>(() => {
    const order = this.currentOrder();
    const idx = this.stepIndex();
    return this.isRunning() && idx < order.steps.length ? order.steps[idx] : null;
  });

  protected readonly isCorrect = computed(() => this.sharedCounter() === 2);

  protected readonly statusText = computed(() => {
    if (!this.isRunning() && !this.finished()) {
      return `Ready. Selected interleaving: ${this.currentOrder().label}`;
    }
    const step = this.currentStep();
    if (step) {
      return step.op === 'READ'
        ? `Thread ${step.thread} reads counter into its local tmp.`
        : `Thread ${step.thread} writes its local tmp back to counter.`;
    }
    if (this.finished()) {
      return `Done. Final counter = ${this.sharedCounter()}.`;
    }
    return '';
  });

  private timer: ReturnType<typeof setInterval> | null = null;
  private finishTimeout: ReturnType<typeof setTimeout> | null = null;

  protected isHit(thread: ThreadId, op: StepOp): boolean {
    const step = this.currentStep();
    return !!step && step.thread === thread && step.op === op;
  }

  protected run(): void {
    this.reset();
    this.isRunning.set(true);
    this.timer = setInterval(() => this.tick(), 900);
  }

  private tick(): void {
    const order = this.currentOrder();
    const idx = this.stepIndex();

    if (idx >= order.steps.length) {
      this.stopTimer();
      this.isRunning.set(false);
      this.finished.set(true);
      return;
    }

    const step = order.steps[idx];
    if (step.op === 'READ') {
      const regs = { ...this.registers() };
      regs[step.thread] = this.sharedCounter();
      this.registers.set(regs);
    } else {
      const tmp = this.registers()[step.thread];
      if (tmp !== null) {
        this.sharedCounter.set(tmp + 1);
      }
    }

    const nextIdx = idx + 1;

    if (nextIdx >= order.steps.length) {
      this.stopTimer();
      this.finishTimeout = setTimeout(() => {
        this.stepIndex.set(nextIdx);
        this.isRunning.set(false);
        this.finished.set(true);
        this.finishTimeout = null;
      }, 500);
      return;
    }

    this.stepIndex.set(nextIdx);
  }

  protected shuffle(): void {
    let next = this.orderIndex();
    while (next === this.orderIndex()) {
      next = Math.floor(Math.random() * INTERLEAVINGS.length);
    }
    this.orderIndex.set(next);
    this.reset();
  }

  protected reset(): void {
    this.stopTimer();
    this.isRunning.set(false);
    this.finished.set(false);
    this.stepIndex.set(0);
    this.sharedCounter.set(0);
    this.registers.set({ A: null, B: null });
  }

  private stopTimer(): void {
    if (this.timer !== null) {
      clearInterval(this.timer);
      this.timer = null;
    }
    if (this.finishTimeout !== null) {
      clearTimeout(this.finishTimeout);
      this.finishTimeout = null;
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
