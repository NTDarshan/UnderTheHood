import { Component, computed, signal } from '@angular/core';

type CoreState = 'idle' | 'running';

interface Core {
  id: number;
  state: CoreState;
  taskLabel: string | null;
}

interface TaskChip {
  id: number;
  stage: 'queue' | 'scheduler' | 'landed';
  coreId: number | null;
}

let taskSeq = 0;

@Component({
  selector: 'app-concurrency-hero',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene hero-section" id="cx-hero">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container">
        <p class="eyebrow mono">CONCURRENCY &amp; PARALLELISM</p>
        <h1 class="hero-title">Multiple things are happening. But are they happening together?</h1>
        <p class="lab-lede">
          Understand how computers actually handle concurrent work — from threads and event loops to async/await,
          races, and synchronization.
        </p>

        <div class="lab-panel">
          <div class="flow-col">
            <div class="lab-node flow-box">APPLICATION</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="lab-node flow-box queue-box" [class.is-hot]="queueChips().length > 0">
              TASK QUEUE
              @if (queueChips().length > 0) {
                <span class="chip-lane" aria-hidden="true">
                  @for (chip of queueChips(); track chip.id) {
                    <span class="task-chip"></span>
                  }
                </span>
              }
            </div>
            <div class="lab-flow-arrow">↓</div>
            <div class="lab-node flow-box scheduler-box" [class.is-hot]="schedulerChips().length > 0">
              SCHEDULER
              @if (schedulerChips().length > 0) {
                <span class="chip-lane" aria-hidden="true">
                  @for (chip of schedulerChips(); track chip.id) {
                    <span class="task-chip"></span>
                  }
                </span>
              }
            </div>
            <div class="lab-flow-arrow">↓</div>
          </div>

          <div class="cores-row" aria-live="polite">
            @for (core of cores(); track core.id) {
              <div class="core-box" [class.is-running]="core.state === 'running'">
                <p class="core-label mono">CORE {{ core.id }}</p>
                @if (core.state === 'running') {
                  <span class="core-pulse" aria-hidden="true"></span>
                  <p class="core-task mono">{{ core.taskLabel }}</p>
                  <span class="pill pill-yes">RUNNING</span>
                } @else {
                  <span class="pill pill-no">IDLE</span>
                }
              </div>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isAnimating()" (click)="sendTasks()">
              Send tasks
            </button>
          </div>
        </div>

        <div class="lab-btn-row">
          <a
            class="lab-btn lab-btn-primary"
            href="#race-conditions-lab"
            (click)="scrollToSection($event, 'race-conditions-lab')"
            >Enter the Concurrency Lab</a
          >
          <a
            class="lab-btn"
            href="#concurrency-vs-parallelism"
            (click)="scrollToSection($event, 'concurrency-vs-parallelism')"
            >Show me the difference</a
          >
        </div>
      </div>
    </section>
  `,
  styles: `
    .cx-scene {
      --running: #4ade80;
      --waiting: var(--accent);
      --blocked: var(--danger);
      --idle: #64748b;
      --c-cpu: #60a5fa;
      --c-thread: #a78bfa;
      --c-task: var(--accent-2);
      --c-lock: #f472b6;
      --c-queue: #fbbf24;
    }

    .hero-section { position: relative; padding-block: 96px 64px; overflow: hidden; border-top: none; }
    .hero-title { font-size: clamp(2rem, 1.5rem + 2.4vw, 3.25rem); max-width: 880px; }

    .flow-col { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .flow-box {
      position: relative;
      width: 100%;
      max-width: 320px;
      text-align: center;
      padding: 14px 18px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface);
      overflow: visible;
    }
    .queue-box.is-hot, .scheduler-box.is-hot { border-color: var(--c-queue); box-shadow: 0 0 14px rgba(251, 191, 36, 0.25); }

    .chip-lane { position: absolute; top: -10px; right: 12px; display: flex; gap: 4px; }
    .task-chip { width: 10px; height: 10px; border-radius: 3px; background: var(--c-task); box-shadow: 0 0 6px var(--c-task); }

    .cores-row { margin-top: 20px; display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    @media (min-width: 640px) { .cores-row { grid-template-columns: repeat(4, 1fr); } }

    .core-box {
      position: relative;
      padding: 16px 12px;
      text-align: center;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      transition: border-color 0.25s ease, box-shadow 0.25s ease;
    }
    .core-box.is-running { border-color: var(--running); box-shadow: 0 0 14px rgba(74, 222, 128, 0.25); }
    .core-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); margin-bottom: 8px; }
    .core-task { font-size: 0.75rem; color: var(--text-muted); margin: 6px 0; }

    .core-pulse {
      position: absolute;
      top: 10px;
      right: 10px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--running);
      box-shadow: 0 0 8px var(--running);
      animation: cx-pulse 1.1s ease-in-out infinite;
    }

    @keyframes cx-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.4; transform: scale(1.3); }
    }

    @media (prefers-reduced-motion: reduce) {
      .core-pulse { animation: none; }
    }
  `,
})
export class ConcurrencyHero {
  protected readonly cores = signal<Core[]>([
    { id: 1, state: 'idle', taskLabel: null },
    { id: 2, state: 'idle', taskLabel: null },
    { id: 3, state: 'idle', taskLabel: null },
    { id: 4, state: 'idle', taskLabel: null },
  ]);

  protected readonly tasks = signal<TaskChip[]>([]);
  protected readonly isAnimating = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly queueChips = computed(() => this.tasks().filter((t) => t.stage === 'queue'));
  protected readonly schedulerChips = computed(() => this.tasks().filter((t) => t.stage === 'scheduler'));

  protected sendTasks(): void {
    if (this.isAnimating()) return;
    this.isAnimating.set(true);

    this.cores.update((cores) => cores.map((c) => ({ ...c, state: 'idle', taskLabel: null })));

    const newTasks: TaskChip[] = Array.from({ length: 6 }, () => ({
      id: taskSeq++,
      stage: 'queue',
      coreId: null,
    }));
    this.tasks.set(newTasks);

    let tick = 0;
    this.timer = setInterval(() => {
      tick++;

      if (tick === 1) {
        this.tasks.update((tasks) => tasks.map((t) => ({ ...t, stage: 'scheduler' })));
      } else if (tick === 2) {
        const cores = this.cores();
        const availableCores = cores.filter((c) => c.state === 'idle');
        const toLand = this.tasks().slice(0, Math.min(availableCores.length, this.tasks().length));

        this.cores.update((prev) =>
          prev.map((core) => {
            const landing = toLand.find((_, i) => availableCores[i]?.id === core.id);
            if (!landing) return core;
            return { ...core, state: 'running', taskLabel: `task-${landing.id % 100}` };
          }),
        );

        this.tasks.update((tasks) =>
          tasks.map((t) => (toLand.includes(t) ? { ...t, stage: 'landed' } : t)),
        );
      } else if (tick === 3) {
        this.tasks.set(this.tasks().filter((t) => t.stage !== 'landed'));
        if (this.timer) clearInterval(this.timer);
        this.timer = null;
        this.isAnimating.set(false);
      }
    }, 550);
  }

  protected scrollToSection(event: Event, id: string): void {
    event.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
