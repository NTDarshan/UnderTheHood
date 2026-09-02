import { Component, OnDestroy, computed, signal } from '@angular/core';

type NodeId = 'stack' | 'eventloop' | 'taskqueue' | 'io';

interface EventLoopStep {
  caption: string;
  active: NodeId[];
  stack: string[];
  taskQueue: string[];
  ioStatus: string | null;
}

const STEPS: EventLoopStep[] = [
  {
    caption: 'A request arrives. The runtime pushes a frame onto the call stack to handle it.',
    active: ['stack'],
    stack: ['handleRequest()'],
    taskQueue: [],
    ioStatus: null,
  },
  {
    caption: 'handleRequest() starts a database operation and hands it off to the I/O subsystem.',
    active: ['stack', 'io'],
    stack: ['handleRequest()', 'db.query()'],
    taskQueue: [],
    ioStatus: 'query running…',
  },
  {
    caption: 'Crucially, it does not block: db.query() returns immediately and the call stack empties.',
    active: ['stack'],
    stack: [],
    taskQueue: [],
    ioStatus: 'query running…',
  },
  {
    caption: 'With the stack empty, the thread is free — other, unrelated work runs on the same stack.',
    active: ['stack'],
    stack: ['handleOtherRequest()'],
    taskQueue: [],
    ioStatus: 'query running…',
  },
  {
    caption: 'Meanwhile, the database finishes. The I/O subsystem has a result ready to deliver.',
    active: ['io'],
    stack: [],
    taskQueue: [],
    ioStatus: 'query complete',
  },
  {
    caption: 'The completion callback becomes a runnable task, placed on the task queue — not run yet.',
    active: ['io', 'taskqueue'],
    stack: [],
    taskQueue: ['dbCallback(rows)'],
    ioStatus: 'delivered to queue',
  },
  {
    caption: 'The event loop keeps checking: "is the call stack empty?" It is, so it schedules the continuation.',
    active: ['eventloop', 'taskqueue', 'stack'],
    stack: [],
    taskQueue: ['dbCallback(rows)'],
    ioStatus: null,
  },
  {
    caption: 'The continuation executes on the call stack, using the result that was waiting for it.',
    active: ['stack'],
    stack: ['dbCallback(rows)'],
    taskQueue: [],
    ioStatus: null,
  },
];

const AUTOPLAY_SPEEDS: Record<number, number> = { 1: 2200, 2: 1500, 3: 1000, 4: 600 };

@Component({
  selector: 'app-event-loop',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="event-loop">
      <div class="container">
        <p class="lab-index">14 — THE EVENT LOOP</p>
        <h2 class="lab-title">One thread, never blocked — because work that waits gets out of the way.</h2>
        <p class="lab-lede">
          Step through a single database-backed request and watch how the call stack, the event loop, the task
          queue, and I/O completion cooperate so the thread is never stuck waiting.
        </p>

        <div class="lab-panel">
          <div class="el-graph" aria-hidden="true">
            <div class="el-node" [class.is-active]="isActive('stack')">
              <p class="el-node-title mono">CALL STACK</p>
              <div class="el-frames">
                @for (frame of currentStep().stack; track frame) {
                  <span class="el-frame mono">{{ frame }}</span>
                } @empty {
                  <span class="el-empty mono">empty</span>
                }
              </div>
            </div>

            <div class="el-node" [class.is-active]="isActive('eventloop')">
              <p class="el-node-title mono">EVENT LOOP</p>
              <p class="el-sub mono">is the stack empty?</p>
            </div>

            <div class="el-node" [class.is-active]="isActive('taskqueue')">
              <p class="el-node-title mono">TASK QUEUE</p>
              <div class="el-frames">
                @for (item of currentStep().taskQueue; track item) {
                  <span class="el-frame mono">{{ item }}</span>
                } @empty {
                  <span class="el-empty mono">empty</span>
                }
              </div>
            </div>

            <div class="el-node" [class.is-active]="isActive('io')">
              <p class="el-node-title mono">I/O COMPLETION</p>
              <p class="el-sub mono">{{ currentStep().ioStatus ?? 'idle' }}</p>
            </div>
          </div>

          <div class="el-caption-box" aria-live="polite">
            <p class="el-step-label mono">STEP {{ stepIndex() + 1 }} / {{ steps.length }}</p>
            <p class="el-caption">{{ currentStep().caption }}</p>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isPlaying()" (click)="step()">Step</button>
            <button type="button" class="lab-btn" [disabled]="isPlaying() || isLastStep()" (click)="runExample()">Run example</button>
            <button type="button" class="lab-btn" [disabled]="!isPlaying()" (click)="stopPlaying()">Stop</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="lab-field el-speed-field">
            <label for="el-speed">Auto-play speed</label>
            <input id="el-speed" type="range" min="1" max="4" step="1" [value]="autoSpeed()" (input)="setAutoSpeed($event)" />
            <span class="mono field-readout">{{ autoSpeed() === 4 ? 'fastest' : autoSpeed() === 1 ? 'slowest' : 'level ' + autoSpeed() }}</span>
          </div>
        </div>

        <p class="lab-note">
          Blocking would mean the call stack sits there holding a frame until the database answers. Instead, the
          stack empties immediately, other work fills it, and the event loop only reconnects the result once that
          stack is clear again.
        </p>
      </div>
    </section>
  `,
  styles: `
    .el-graph { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 700px) { .el-graph { grid-template-columns: repeat(2, 1fr); } }

    .el-node {
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
      min-height: 92px;
    }
    .el-node.is-active { border-color: var(--waiting); box-shadow: 0 0 14px rgba(255, 138, 61, 0.25); }

    .el-node-title { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); margin-bottom: 10px; }
    .el-sub { font-size: 0.8125rem; color: var(--text-muted); }

    .el-frames { display: flex; flex-direction: column; gap: 6px; }
    .el-frame {
      padding: 6px 10px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      color: var(--c-task);
      width: fit-content;
    }
    .el-empty { font-size: 0.75rem; color: var(--text-faint); }

    .el-caption-box { margin-top: 20px; padding: 14px 16px; border-left: 3px solid var(--waiting); background: var(--surface-raised); border-radius: var(--radius-sm); }
    .el-step-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; margin-bottom: 6px; }
    .el-caption { font-size: 0.9375rem; color: var(--text); line-height: 1.5; }

    .el-speed-field { margin-top: 18px; max-width: 320px; }
    .field-readout { color: var(--text-muted); font-size: 0.75rem; }
  `,
})
export class EventLoop implements OnDestroy {
  protected readonly steps = STEPS;
  protected readonly stepIndex = signal(0);
  protected readonly isPlaying = signal(false);
  protected readonly autoSpeed = signal(2);

  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly currentStep = computed(() => this.steps[this.stepIndex()]);
  protected readonly isLastStep = computed(() => this.stepIndex() >= this.steps.length - 1);

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected isActive(node: NodeId): boolean {
    return this.currentStep().active.includes(node);
  }

  protected step(): void {
    if (this.isLastStep()) return;
    this.stepIndex.update((i) => Math.min(i + 1, this.steps.length - 1));
  }

  protected runExample(): void {
    if (this.isPlaying()) return;
    if (this.isLastStep()) this.stepIndex.set(0);
    this.isPlaying.set(true);
    this.timer = setInterval(() => {
      if (this.isLastStep()) {
        this.stopPlaying();
        return;
      }
      this.stepIndex.update((i) => i + 1);
    }, AUTOPLAY_SPEEDS[this.autoSpeed()]);
  }

  protected stopPlaying(): void {
    this.isPlaying.set(false);
    this.clearTimer();
  }

  protected setAutoSpeed(ev: Event): void {
    this.autoSpeed.set(+(ev.target as HTMLInputElement).value);
    if (this.isPlaying()) {
      this.clearTimer();
      this.timer = setInterval(() => {
        if (this.isLastStep()) {
          this.stopPlaying();
          return;
        }
        this.stepIndex.update((i) => i + 1);
      }, AUTOPLAY_SPEEDS[this.autoSpeed()]);
    }
  }

  protected reset(): void {
    this.stopPlaying();
    this.stepIndex.set(0);
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
