import { Component, OnDestroy, computed, signal } from '@angular/core';

type StageKey = 'requested' | 'stop-traffic' | 'drain' | 'background' | 'cleanup' | 'exit';
type StageStatus = 'pending' | 'active' | 'done';
type ReqState = 'pending' | 'draining' | 'done';

interface Stage {
  key: StageKey;
  label: string;
  detail: string;
  durationMs: number;
}

interface GracefulRequest {
  id: number;
  label: string;
  state: ReqState;
  finishAt: number;
}

const STAGES: Stage[] = [
  { key: 'requested', label: 'SHUTDOWN REQUESTED', detail: 'SIGTERM received — shutdown sequence begins.', durationMs: 700 },
  { key: 'stop-traffic', label: 'STOP NEW TRAFFIC', detail: 'Load balancer deregisters this instance; health checks start failing on purpose.', durationMs: 900 },
  { key: 'drain', label: 'DRAIN ACTIVE REQUESTS', detail: 'In-flight requests are allowed to finish; no new work is accepted.', durationMs: 3600 },
  { key: 'background', label: 'HANDLE BACKGROUND WORK', detail: 'Background jobs are finished or checkpointed so they can resume safely.', durationMs: 1600 },
  { key: 'cleanup', label: 'CLEANUP', detail: 'Database connections, file handles, and other resources are closed.', durationMs: 900 },
  { key: 'exit', label: 'EXIT', detail: 'Process exits cleanly with no work abandoned.', durationMs: 500 },
];

const REQUEST_TEMPLATE: Array<{ id: number; label: string; finishAt: number }> = [
  { id: 101, label: 'processing request body', finishAt: 900 },
  { id: 102, label: 'reading from database', finishAt: 1800 },
  { id: 103, label: 'waiting on external API', finishAt: 3000 },
  { id: 104, label: 'writing response', finishAt: 500 },
];

@Component({
  selector: 'app-graceful-shutdown-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene graceful-scene" id="gs-graceful-lab">
      <div class="container">
        <p class="lab-index">03 — GRACEFUL SHUTDOWN</p>
        <h2 class="lab-title">SIGTERM: the same requests, given a chance to finish</h2>
        <p class="lab-lede">
          Same starting requests and job as the hard-stop scenario. This time the server gets a signal it can react
          to, and runs through a defined shutdown sequence before it actually exits.
        </p>

        <div class="lab-panel">
          <div class="stage-track" role="list" aria-label="Shutdown lifecycle stages">
            @for (stage of stages; track stage.key) {
              <div class="stage-chip" role="listitem" [attr.data-status]="stageStatus(stage.key)">
                <span class="stage-dot" aria-hidden="true"></span>
                <span class="stage-name mono">{{ stage.label }}</span>
              </div>
            }
          </div>

          @if (currentStage(); as stage) {
            <p class="stage-detail mono" aria-live="polite">{{ stage.detail }}</p>
          } @else {
            <p class="stage-detail mono">Idle — server is RUNNING and accepting traffic.</p>
          }

          <div class="request-list" role="list" aria-label="In-flight requests">
            @for (req of requests(); track req.id) {
              <div class="request-row" [attr.data-state]="req.state" role="listitem">
                <span class="req-id mono">REQ {{ req.id }}</span>
                <span class="req-arrow mono">&rarr;</span>
                <span class="req-label mono">{{ req.label }}</span>
                @switch (req.state) {
                  @case ('done') { <span class="req-mark req-mark-done" aria-label="completed">&#10003;</span> }
                  @case ('draining') { <span class="req-mark req-mark-draining" aria-label="finishing">&#9679;</span> }
                  @default { <span class="req-mark req-mark-idle" aria-label="waiting">&#9675;</span> }
                }
              </div>
            }
            <div class="request-row job-row" [attr.data-state]="jobState()" role="listitem">
              <span class="req-id mono">JOB</span>
              <span class="req-arrow mono">&rarr;</span>
              <span class="req-label mono">background export job</span>
              @switch (jobState()) {
                @case ('done') { <span class="pill pill-yes small">CHECKPOINTED</span> }
                @case ('draining') { <span class="req-mark req-mark-draining" aria-label="finishing">&#9679;</span> }
                @default { <span class="req-mark req-mark-idle" aria-label="waiting">&#9675;</span> }
              }
            </div>
          </div>

          @if (isExited()) {
            <p class="exit-line mono" aria-live="polite">Process exited cleanly. No work abandoned.</p>
          }

          <div class="lab-btn-row">
            <button
              type="button"
              class="lab-btn lab-btn-primary"
              (click)="start()"
              [disabled]="isRunning()"
            >
              START GRACEFUL SHUTDOWN
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="!started()">
              Reset
            </button>
          </div>
        </div>

        <p class="lab-note">
          Compare this with the hard-stop lab above: same requests, same background job — but here every one of them
          reaches a defined end state instead of being cut off mid-flight.
        </p>
      </div>
    </section>
  `,
  styles: `
    .graceful-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .stage-track {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .stage-chip {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface-elevated);
      transition: border-color 0.25s ease, background 0.25s ease, box-shadow 0.25s ease;
    }
    .stage-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--idle); flex-shrink: 0; }
    .stage-name { font-size: 0.6875rem; color: var(--text-muted); letter-spacing: 0.04em; }

    .stage-chip[data-status='active'] {
      border-color: var(--draining);
      box-shadow: 0 0 14px color-mix(in srgb, var(--draining) 35%, transparent);
    }
    .stage-chip[data-status='active'] .stage-dot { background: var(--draining); animation: dotPulse 0.9s ease-in-out infinite; }
    .stage-chip[data-status='active'] .stage-name { color: var(--draining); font-weight: 700; }

    .stage-chip[data-status='done'] { border-color: var(--running); }
    .stage-chip[data-status='done'] .stage-dot { background: var(--running); }
    .stage-chip[data-status='done'] .stage-name { color: var(--text); }

    @media (prefers-reduced-motion: reduce) {
      .stage-chip[data-status='active'] .stage-dot { animation: none; }
    }
    @keyframes dotPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }

    .stage-detail { margin-top: 16px; font-size: 0.8125rem; color: var(--text-muted); min-height: 1.4em; }

    .request-list { display: flex; flex-direction: column; gap: 8px; margin-top: 8px; }
    .request-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 14px;
      background: var(--surface-elevated);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      transition: border-color 0.3s ease, background 0.3s ease;
    }
    .request-row[data-state='draining'] { border-color: var(--draining); }
    .request-row[data-state='done'] {
      border-color: var(--running);
      background: color-mix(in srgb, var(--running) 8%, var(--surface-elevated));
    }

    .req-id { font-size: 0.75rem; color: var(--text); font-weight: 700; min-width: 56px; }
    .req-arrow { color: var(--text-faint); }
    .req-label { font-size: 0.75rem; color: var(--text-muted); flex: 1; }

    .req-mark { margin-left: auto; font-size: 0.9375rem; font-weight: 700; }
    .req-mark-idle { color: var(--idle); }
    .req-mark-draining { color: var(--draining); animation: dotPulse 0.9s ease-in-out infinite; }
    .req-mark-done { color: var(--running); }
    @media (prefers-reduced-motion: reduce) {
      .req-mark-draining { animation: none; }
    }

    .small { font-size: 0.625rem; padding: 3px 8px; margin-left: auto; }

    .exit-line { margin-top: 16px; color: var(--running); font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.04em; }
  `,
})
export class GracefulShutdownLab implements OnDestroy {
  protected readonly stages = STAGES;

  protected readonly requests = signal<GracefulRequest[]>(
    REQUEST_TEMPLATE.map((r) => ({ ...r, state: 'pending' as ReqState })),
  );
  protected readonly jobState = signal<ReqState>('pending');
  protected readonly activeStageIndex = signal(-1);
  protected readonly started = signal(false);
  protected readonly isExited = signal(false);

  protected readonly isRunning = computed(() => this.started() && !this.isExited());
  protected readonly currentStage = computed(() => {
    const idx = this.activeStageIndex();
    return idx >= 0 && idx < this.stages.length ? this.stages[idx] : null;
  });

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.clearTimers();
  }

  protected start(): void {
    if (this.isRunning()) return;
    this.reset();
    this.started.set(true);
    this.runStages(0);
  }

  protected reset(): void {
    this.clearTimers();
    this.requests.set(REQUEST_TEMPLATE.map((r) => ({ ...r, state: 'pending' as ReqState })));
    this.jobState.set('pending');
    this.activeStageIndex.set(-1);
    this.started.set(false);
    this.isExited.set(false);
  }

  protected stageStatus(key: StageKey): StageStatus {
    const idx = this.stages.findIndex((s) => s.key === key);
    const active = this.activeStageIndex();
    if (idx < active) return 'done';
    if (idx === active) return 'active';
    return 'pending';
  }

  private runStages(index: number): void {
    if (index >= this.stages.length) {
      this.activeStageIndex.set(this.stages.length);
      this.isExited.set(true);
      return;
    }

    this.activeStageIndex.set(index);
    const stage = this.stages[index];

    if (stage.key === 'drain') {
      this.startDraining();
    }
    if (stage.key === 'background') {
      this.startBackgroundJob();
    }

    const t = setTimeout(() => this.runStages(index + 1), stage.durationMs);
    this.timers.push(t);
  }

  private startDraining(): void {
    this.requests.update((list) => list.map((r) => ({ ...r, state: 'draining' as ReqState })));
    for (const req of this.requests()) {
      const t = setTimeout(() => {
        this.requests.update((list) =>
          list.map((r) => (r.id === req.id ? { ...r, state: 'done' as ReqState } : r)),
        );
      }, req.finishAt);
      this.timers.push(t);
    }
  }

  private startBackgroundJob(): void {
    this.jobState.set('draining');
    const t = setTimeout(() => this.jobState.set('done'), 1100);
    this.timers.push(t);
  }

  private clearTimers(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }
}
