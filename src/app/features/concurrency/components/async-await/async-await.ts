import { Component, OnDestroy, signal } from '@angular/core';

interface Phase {
  key: string;
  label: string;
  desc: string;
  taskAState: string;
  taskBState: string;
  taskAPct: number;
  taskBPct: number;
}

const PHASES: Phase[] = [
  {
    key: 'start',
    label: 'START',
    desc: 'getOrder(482) begins executing. It is running on some worker thread, like any normal function call.',
    taskAState: 'running',
    taskBState: 'idle',
    taskAPct: 8,
    taskBPct: 0,
  },
  {
    key: 'call-io',
    label: 'CALL I/O',
    desc: 'db.findOrder(482) is called and the network/database request is issued.',
    taskAState: 'running (issuing call)',
    taskBState: 'idle',
    taskAPct: 22,
    taskBPct: 0,
  },
  {
    key: 'suspend',
    label: 'SUSPEND',
    desc: 'Execution of getOrder is suspended at the await. Critically, the worker thread is NOT blocked — it is released back to the runtime.',
    taskAState: 'suspended (awaiting)',
    taskBState: 'idle',
    taskAPct: 22,
    taskBPct: 0,
  },
  {
    key: 'io-running',
    label: 'I/O RUNS · OTHER WORK PROGRESSES',
    desc: 'The database driver waits on the network in the background — no CPU work happens for it. The freed thread picks up an unrelated Task B and actually executes it.',
    taskAState: 'suspended (awaiting)',
    taskBState: 'running (using the freed thread)',
    taskAPct: 22,
    taskBPct: 65,
  },
  {
    key: 'io-complete',
    label: 'I/O COMPLETES',
    desc: 'The database returns a result. This schedules the continuation of getOrder to resume — it does not resume instantly or synchronously.',
    taskAState: 'scheduled to resume',
    taskBState: 'running',
    taskAPct: 22,
    taskBPct: 90,
  },
  {
    key: 'resume',
    label: 'CONTINUATION RESUMES',
    desc: 'getOrder resumes exactly where it left off — order now holds the result — and finishes. Logically it is the same flow; physically it may run on any available thread.',
    taskAState: 'running (resumed) → complete',
    taskBState: 'running',
    taskAPct: 100,
    taskBPct: 100,
  },
];

@Component({
  selector: 'app-async-await',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="async-await">
      <div class="container">
        <p class="lab-index">16 — ASYNC/AWAIT</p>
        <h2 class="lab-title">What actually happens at an <span class="mono">await</span></h2>
        <p class="lab-lede">
          <span class="mono">async</span>/<span class="mono">await</span> is a way of writing "do this later, when
          the result is ready" as if it were sequential code. Step through a real request and watch the thread get
          released — not blocked — while it waits.
        </p>

        <div class="lab-panel">
          <div class="lab-code">
            <p><span class="tok-method">async function</span> getOrder(orderId) &#123;</p>
            <p class="indent">order = <span class="tok-key">await</span> db.findOrder(orderId);</p>
            <p class="indent">return order;</p>
            <p>&#125;</p>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="run()">
              {{ isRunning() ? 'Running…' : 'Run getOrder(482)' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="timeline" aria-live="polite">
            @for (p of phases; track p.key; let i = $index; let last = $last) {
              <div class="phase-node" [class.is-active]="stepIndex() === i" [class.is-done]="stepIndex() > i">
                <span class="phase-label mono">{{ p.label }}</span>
                <span class="phase-desc">{{ p.desc }}</span>
              </div>
              @if (!last) {
                <span class="lab-flow-arrow phase-arrow">&darr;</span>
              }
            }
          </div>

          <div class="lanes">
            <div class="lane">
              <p class="lane-label mono">TASK A — getOrder(482)</p>
              <div class="lane-bar">
                <div class="lane-fill lane-fill-a" [style.width.%]="currentPhase().taskAPct"></div>
              </div>
              <p class="lane-state mono">{{ currentPhase().taskAState }}</p>
            </div>
            <div class="lane">
              <p class="lane-label mono">TASK B — unrelated request</p>
              <div class="lane-bar">
                <div class="lane-fill lane-fill-b" [style.width.%]="currentPhase().taskBPct"></div>
              </div>
              <p class="lane-state mono">{{ currentPhase().taskBState }}</p>
            </div>
          </div>
        </div>

        <p class="lab-note-warn">
          <span class="mono">async</span>/<span class="mono">await</span> does not inherently create a new
          thread. It's a way of expressing "do this later, when the result is ready" without blocking whatever
          thread was running it. The suspend/resume above is a programming model for continuations — not a hop
          onto a second CPU core.
        </p>
      </div>
    </section>
  `,
  styles: `
    .lab-code { margin-top: 8px; }
    .lab-code .indent { padding-left: 1.5em; }

    .timeline { margin-top: 24px; display: flex; flex-direction: column; align-items: stretch; gap: 2px; }
    .phase-node {
      padding: 12px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
    }
    .phase-node.is-active {
      border-color: var(--waiting);
      box-shadow: 0 0 0 1px var(--waiting) inset, 0 0 16px var(--glow-accent-2, rgba(255, 138, 61, 0.25));
    }
    .phase-node.is-done { border-color: var(--running); }
    .phase-node.is-done .phase-label { color: var(--running); }
    .phase-label { display: block; font-size: 0.75rem; letter-spacing: 0.05em; color: var(--text-faint); margin-bottom: 4px; }
    .phase-node.is-active .phase-label { color: var(--waiting); }
    .phase-desc { margin: 0; font-size: 0.8437rem; color: var(--text-muted); line-height: 1.5; }
    .phase-arrow { align-self: center; color: var(--text-faint); }

    .lanes { margin-top: 26px; display: grid; grid-template-columns: 1fr; gap: 16px; padding-top: 20px; border-top: 1px solid var(--border); }
    @media (min-width: 640px) { .lanes { grid-template-columns: 1fr 1fr; } }

    .lane { display: flex; flex-direction: column; gap: 8px; }
    .lane-label { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--text-faint); }
    .lane-bar { height: 10px; border-radius: 999px; background: var(--surface-elevated); border: 1px solid var(--border-strong); overflow: hidden; }
    .lane-fill { height: 100%; width: 0%; transition: width 0.5s ease; }
    .lane-fill-a { background: linear-gradient(90deg, var(--c-task), var(--running)); }
    .lane-fill-b { background: linear-gradient(90deg, var(--c-thread), var(--c-cpu)); }
    .lane-state { margin: 0; font-size: 0.75rem; color: var(--text-muted); }
  `,
})
export class AsyncAwait implements OnDestroy {
  protected readonly phases = PHASES;
  protected readonly stepIndex = signal(0);
  protected readonly isRunning = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;

  protected currentPhase(): Phase {
    return this.phases[this.stepIndex()];
  }

  run(): void {
    if (this.isRunning()) return;
    this.reset();
    this.isRunning.set(true);

    this.timer = setInterval(() => {
      const next = this.stepIndex() + 1;
      if (next >= this.phases.length) {
        this.clearTimer();
        this.isRunning.set(false);
        return;
      }
      this.stepIndex.set(next);
      if (next === this.phases.length - 1) {
        this.clearTimer();
        this.isRunning.set(false);
      }
    }, 1100);
  }

  reset(): void {
    this.clearTimer();
    this.isRunning.set(false);
    this.stepIndex.set(0);
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
