import { Component, OnDestroy, computed, signal } from '@angular/core';

const TASK_DURATION_MS = 6000;
const TASK_TICK_MS = 100;

const PAYMENT_SERVICE_DELAY_MS = 9000;
const WAIT_TICK_MS = 400;

type TaskStatus = 'idle' | 'running' | 'cancelled' | 'completed-wasted' | 'completed';
type CallStatus = 'idle' | 'waiting' | 'timeout' | 'success';

@Component({
  selector: 'app-cancellation-timeouts',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cx-scene" id="cancellation-timeouts">
      <div class="container">
        <p class="lab-index">33-34 — CANCELLATION &amp; TIMEOUTS</p>
        <h2 class="lab-title">Cancellation and timeouts</h2>
        <p class="lab-lede">
          Work that nobody is waiting for anymore should stop. Cancellation propagates a "stop" signal down into a
          running task; a timeout is a cancellation that fires automatically once something has taken too long.
        </p>

        <div class="lab-panel">
          <p class="lab-node">CLIENT REQUEST &rarr; LONG-RUNNING TASK</p>

          <div class="lab-btn-row" role="group" aria-label="Cancellation support">
            <button
              type="button"
              class="lab-btn"
              [class.is-active]="cancellationEnabled()"
              [attr.aria-pressed]="cancellationEnabled()"
              (click)="toggleCancellation()"
            >
              Cancellation enabled: {{ cancellationEnabled() ? 'ON' : 'OFF' }}
            </button>
          </div>

          <div class="task-row">
            <div class="task-box" [class.is-running]="taskStatus() === 'running'" [class.is-cancelled]="taskStatus() === 'cancelled'" [class.is-wasted]="taskStatus() === 'completed-wasted'">
              <div class="task-bar-track" role="img" [attr.aria-label]="'Task progress ' + taskProgress().toFixed(0) + ' percent'">
                <div class="task-bar-fill" [style.width.%]="taskProgress()"></div>
              </div>
              <div class="task-meta">
                <span class="mono">{{ taskProgress().toFixed(0) }}%</span>
                @switch (taskStatus()) {
                  @case ('running') { <span class="pill pill-conditional">RUNNING</span> }
                  @case ('cancelled') { <span class="pill pill-no">CANCELLED — RESOURCES RELEASED</span> }
                  @case ('completed-wasted') { <span class="pill pill-no">COMPLETED (WASTED WORK)</span> }
                  @case ('completed') { <span class="pill pill-yes">COMPLETED</span> }
                  @default { <span class="pill">IDLE</span> }
                }
              </div>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="startTask()" [disabled]="taskStatus() === 'running'">
              Start request
            </button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="disconnectClient()" [disabled]="taskStatus() !== 'running'">
              Client disconnects
            </button>
          </div>

          <div class="lab-code" aria-live="polite">
            @if (taskStatus() === 'idle') {
              waiting to start...
            } @else if (taskStatus() === 'running' && !clientDisconnected()) {
              task running, client still attached, resources held
            } @else if (taskStatus() === 'running' && clientDisconnected()) {
              client disconnected — cancellation disabled, task keeps burning CPU/DB/memory for a client that
              already left
            } @else if (taskStatus() === 'cancelled') {
              cancellation signal delivered — task unwound immediately, connections/handles/memory freed
            } @else if (taskStatus() === 'completed-wasted') {
              task ran to completion anyway — every bit of that work was thrown away, nobody was listening
            } @else {
              task completed normally
            }
          </div>
        </div>

        <div class="lab-panel">
          <p class="lab-node">EXTERNAL CALL &rarr; PAYMENT SERVICE (slow)</p>

          <div class="lab-btn-row" role="group" aria-label="Timeout threshold">
            @for (t of timeoutOptions; track t) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="timeoutMs() === t"
                [attr.aria-pressed]="timeoutMs() === t"
                (click)="setTimeout(t)"
              >
                {{ t / 1000 }}s timeout
              </button>
            }
          </div>

          <div class="call-box" [class.is-waiting]="callStatus() === 'waiting'" [class.is-timeout]="callStatus() === 'timeout'" [class.is-success]="callStatus() === 'success'">
            <div class="call-meta">
              <span class="mono">elapsed: {{ (elapsedMs() / 1000).toFixed(1) }}s / timeout {{ (timeoutMs() / 1000).toFixed(0) }}s</span>
              @switch (callStatus()) {
                @case ('waiting') { <span class="pill pill-conditional">WAITING</span> }
                @case ('timeout') { <span class="pill pill-no">TIMEOUT — REQUEST ABORTED</span> }
                @case ('success') { <span class="pill pill-yes">SUCCESS</span> }
                @default { <span class="pill">IDLE</span> }
              }
            </div>
            <div class="call-bar-track">
              <div class="call-bar-fill" [class.is-danger]="elapsedMs() >= timeoutMs() * 0.7" [style.width.%]="callBarPct()"></div>
            </div>
            <p class="mono waiting-line" aria-live="polite">{{ waitingLine() }}</p>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="startCall()" [disabled]="callStatus() === 'waiting'">
              Call payment service
            </button>
          </div>
        </div>

        <p class="lab-note">
          Timeout, cancellation, and retry are one mechanism: a timeout decides when to give up waiting,
          cancellation is how that "give up" actually stops the in-flight work, and a retry is what happens next.
          But retrying blindly after a timeout is dangerous — if the original request is slow because the
          downstream service is overloaded, firing another request at it just adds load. Retries need their own
          rules, which is exactly what backoff and jitter are for.
        </p>
      </div>
    </section>
  `,
  styles: `
    .task-row { margin-top: 20px; }
    .task-box {
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .task-box.is-running { border-color: var(--waiting); }
    .task-box.is-cancelled { border-color: var(--blocked); background: color-mix(in srgb, var(--blocked) 8%, var(--surface)); }
    .task-box.is-wasted { border-color: var(--blocked); background: color-mix(in srgb, var(--blocked) 12%, var(--surface)); }

    .task-bar-track, .call-bar-track {
      width: 100%;
      height: 14px;
      border-radius: 999px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      overflow: hidden;
    }
    .task-bar-fill {
      height: 100%;
      background: var(--waiting);
      transition: width 0.1s linear;
    }
    .task-box.is-cancelled .task-bar-fill { background: var(--blocked); }
    .task-box.is-wasted .task-bar-fill { background: var(--blocked); }

    .task-meta { margin-top: 10px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .call-box {
      margin-top: 20px;
      padding: 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
    }
    .call-box.is-waiting { border-color: var(--waiting); }
    .call-box.is-timeout { border-color: var(--blocked); background: color-mix(in srgb, var(--blocked) 8%, var(--surface)); }
    .call-box.is-success { border-color: var(--running); }

    .call-meta { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
    .call-bar-fill { height: 100%; background: var(--c-cpu); transition: width 0.1s linear; }
    .call-bar-fill.is-danger { background: var(--waiting); }
    .call-box.is-timeout .call-bar-fill { background: var(--blocked); }
    .call-box.is-success .call-bar-fill { background: var(--running); }

    .waiting-line { margin: 12px 0 0; color: var(--text-muted); font-size: 0.8125rem; min-height: 1.2em; }
  `,
})
export class CancellationTimeouts implements OnDestroy {
  protected readonly timeoutOptions = [1000, 5000, 30000];

  protected readonly cancellationEnabled = signal(true);
  protected readonly taskStatus = signal<TaskStatus>('idle');
  protected readonly taskProgress = signal(0);
  protected readonly clientDisconnected = signal(false);

  protected readonly callStatus = signal<CallStatus>('idle');
  protected readonly timeoutMs = signal(5000);
  protected readonly elapsedMs = signal(0);

  protected readonly callBarPct = computed(() => Math.min(100, (this.elapsedMs() / this.timeoutMs()) * 100));

  private taskInterval: ReturnType<typeof setInterval> | null = null;
  private callInterval: ReturnType<typeof setInterval> | null = null;
  private callTimeoutHandle: ReturnType<typeof setTimeout> | null = null;
  private callResolveHandle: ReturnType<typeof setTimeout> | null = null;

  protected readonly waitingLine = computed(() => {
    if (this.callStatus() !== 'waiting') return '';
    const dots = Math.max(1, Math.floor(this.elapsedMs() / WAIT_TICK_MS) % 4);
    return 'waiting' + '...'.repeat(dots);
  });

  ngOnDestroy(): void {
    this.clearTaskInterval();
    this.clearCallTimers();
  }

  protected toggleCancellation(): void {
    this.cancellationEnabled.set(!this.cancellationEnabled());
  }

  protected startTask(): void {
    this.clearTaskInterval();
    this.taskStatus.set('running');
    this.taskProgress.set(0);
    this.clientDisconnected.set(false);

    const steps = TASK_DURATION_MS / TASK_TICK_MS;
    let step = 0;
    this.taskInterval = setInterval(() => {
      step += 1;
      this.taskProgress.set(Math.min(100, (step / steps) * 100));
      if (step >= steps) {
        this.clearTaskInterval();
        this.taskStatus.set(this.clientDisconnected() ? 'completed-wasted' : 'completed');
      }
    }, TASK_TICK_MS);
  }

  protected disconnectClient(): void {
    this.clientDisconnected.set(true);
    if (this.cancellationEnabled()) {
      this.clearTaskInterval();
      this.taskStatus.set('cancelled');
    }
    // if cancellation is disabled, the task keeps running in the background until it finishes on its own
  }

  private clearTaskInterval(): void {
    if (this.taskInterval) {
      clearInterval(this.taskInterval);
      this.taskInterval = null;
    }
  }

  protected setTimeout(ms: number): void {
    this.timeoutMs.set(ms);
  }

  protected startCall(): void {
    this.clearCallTimers();
    this.callStatus.set('waiting');
    this.elapsedMs.set(0);

    this.callInterval = setInterval(() => {
      this.elapsedMs.update((v) => v + WAIT_TICK_MS);
    }, WAIT_TICK_MS);

    this.callTimeoutHandle = setTimeout(() => {
      this.clearCallTimers();
      this.callStatus.set('timeout');
    }, this.timeoutMs());

    this.callResolveHandle = setTimeout(() => {
      this.clearCallTimers();
      this.callStatus.set('success');
    }, PAYMENT_SERVICE_DELAY_MS);
  }

  private clearCallTimers(): void {
    if (this.callInterval) {
      clearInterval(this.callInterval);
      this.callInterval = null;
    }
    if (this.callTimeoutHandle) {
      clearTimeout(this.callTimeoutHandle);
      this.callTimeoutHandle = null;
    }
    if (this.callResolveHandle) {
      clearTimeout(this.callResolveHandle);
      this.callResolveHandle = null;
    }
  }
}
