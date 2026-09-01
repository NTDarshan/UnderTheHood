import { Component, OnDestroy, computed, signal } from '@angular/core';

type Mode = 'sync' | 'async';
type JobStatus = 'idle' | 'in-flight' | 'complete';

const SIM_DURATION_S = 20; // labeled duration of the "slow" PDF generation
const SIM_REAL_MS = 4000; // compressed real-time duration of the animation
const ASYNC_LATENCY_MS = 45; // simulated near-instant request latency in async mode
const TICK_MS = 60;

@Component({
  selector: 'app-async-queue-workers',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="async-queue-workers">
      <div class="container">
        <p class="lab-index">21 — ASYNCHRONOUS PROCESSING</p>
        <h2 class="lab-title">Async doesn't make work finish faster. It changes who waits for it.</h2>
        <p class="lab-lede">
          Generating a PDF takes about 20 seconds either way. The question is whether the caller's HTTP request
          stays open for all 20 seconds, or gets an answer immediately while the work continues somewhere else.
        </p>

        <div class="lab-panel">
          <div class="mode-row" role="group" aria-label="Processing mode">
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'sync'" (click)="setMode('sync')">SYNC</button>
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'async'" (click)="setMode('async')">ASYNC</button>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isRunning()" (click)="generate()">
              {{ isRunning() ? 'Generating…' : 'Generate PDF (20s job)' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <!-- FLOW DIAGRAM -->
          <div class="flow" [class.is-async]="mode() === 'async'">
            <div class="node client" [class.is-active]="phase() !== 'idle'">
              <span class="lab-node">CLIENT</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node api" [class.is-active]="phase() === 'requesting' || phase() === 'enqueued' || phase() === 'blocked'">
              <span class="lab-node">API</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>

            @if (mode() === 'sync') {
              <div class="node work" [class.is-active]="phase() === 'blocked'">
                <span class="lab-node">GENERATING PDF</span>
                <div class="mini-bar">
                  <div class="mini-bar-fill sync-fill" [style.width.%]="workPct()"></div>
                </div>
              </div>
              <span class="lab-flow-arrow">&rarr;</span>
              <div class="node response" [class.is-active]="phase() === 'complete'">
                <span class="lab-node">RESPONSE</span>
              </div>
            } @else {
              <div class="node queue" [class.is-active]="phase() === 'enqueued' || phase() === 'working'">
                <span class="lab-node">QUEUE</span>
                @if (jobStatus() !== 'idle') {
                  <span class="mono queue-id">job {{ jobId() }}</span>
                }
              </div>
              <span class="lab-flow-arrow">&rarr;</span>
              <div class="node response" [class.is-active]="phase() === 'accepted' || phase() === 'working' || phase() === 'complete'">
                <span class="lab-node">202 ACCEPTED</span>
              </div>
            }
          </div>

          @if (mode() === 'async') {
            <div class="worker-row">
              <span class="lab-node worker-label">WORKER — processing in the background</span>
              <div class="mini-bar wide">
                <div class="mini-bar-fill async-fill" [style.width.%]="workPct()"></div>
              </div>
              <span class="mono job-status" [class.is-complete]="jobStatus() === 'complete'">
                job status: {{ jobStatusLabel() }}
              </span>
            </div>
          }

          @if (mode() === 'sync' && phase() === 'blocked') {
            <p class="mono blocking-line">
              <span class="spinner" aria-hidden="true"></span> waiting… the connection is held open, nothing else can happen on it
            </p>
          }

          <!-- STAT CALLOUTS -->
          <div class="stat-pair">
            <div class="stat-card" [class.is-hot]="mode() === 'sync'">
              <span class="stat-card-label mono">REQUEST LATENCY</span>
              <span class="stat-card-value mono">{{ requestLatencyLabel() }}</span>
              <span class="stat-card-sub">time until the caller gets a response</span>
            </div>
            <div class="stat-card">
              <span class="stat-card-label mono">WORK COMPLETION TIME</span>
              <span class="stat-card-value mono">{{ workCompletionLabel() }}</span>
              <span class="stat-card-sub">time until the PDF actually exists</span>
            </div>
          </div>

          <p class="mono same-diff-line" [class.is-diff]="mode() === 'async'">
            {{ mode() === 'sync' ? 'SAME number in sync mode — the caller cannot find out sooner than the work finishes.' : 'DIFFERENT numbers in async mode — the caller finds out ~instantly; the work still takes 20s.' }}
          </p>

          <p class="lab-note">
            <strong>Asynchronous processing can remove long-running work from the synchronous request path</strong>
            — it does not make the work disappear or complete instantly. It changes <em>when</em> the caller finds
            out the work is done: immediately with a job reference (async), or only once everything has finished
            (sync).
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
      display: block;
    }

    .mode-row { display: flex; gap: 10px; }

    .flow {
      margin-top: 26px;
      display: flex;
      align-items: stretch;
      flex-wrap: wrap;
      gap: 10px;
      row-gap: 16px;
    }

    .node {
      flex: 1 1 130px;
      min-width: 120px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      justify-content: center;
      padding: 14px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }

    .node.is-active {
      border-color: var(--c-compute);
      box-shadow: 0 0 0 1px var(--c-compute) inset, 0 0 18px var(--glow-accent-2);
    }

    .node.queue.is-active { border-color: var(--c-queue); box-shadow: 0 0 0 1px var(--c-queue) inset, 0 0 18px rgba(251, 191, 36, 0.28); }
    .node.queue.is-active .lab-node { color: var(--c-queue); }
    .node.response.is-active { border-color: var(--ok); box-shadow: 0 0 0 1px var(--ok) inset, 0 0 18px rgba(74, 222, 128, 0.25); }
    .node.response.is-active .lab-node { color: var(--ok); }
    .node.client.is-active .lab-node { color: var(--c-client); }
    .node.work.is-active { border-color: var(--warn); }
    .node.work.is-active .lab-node { color: var(--warn); }

    .queue-id { color: var(--text-faint); font-size: 0.6875rem; }

    .mini-bar { height: 8px; border-radius: 999px; background: var(--surface-elevated); border: 1px solid var(--border-strong); overflow: hidden; }
    .mini-bar.wide { margin-top: 10px; }
    .mini-bar-fill { height: 100%; width: 0%; transition: width 0.08s linear; }
    .sync-fill { background: linear-gradient(90deg, var(--warn), var(--crit)); }
    .async-fill { background: linear-gradient(90deg, var(--c-queue), var(--ok)); }

    .worker-row {
      margin-top: 20px;
      padding: 16px;
      background: var(--surface);
      border: 1px dashed var(--c-queue);
      border-radius: var(--radius-md);
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .worker-label { color: var(--c-queue); }
    .job-status { font-size: 0.8125rem; color: var(--text-muted); margin-top: 4px; }
    .job-status.is-complete { color: var(--ok); }

    .blocking-line { margin-top: 18px; color: var(--crit); font-size: 0.875rem; display: flex; align-items: center; gap: 10px; }
    .spinner {
      width: 14px; height: 14px; border-radius: 50%;
      border: 2px solid var(--border-strong);
      border-top-color: var(--crit);
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @media (prefers-reduced-motion: reduce) { .spinner { animation: none; } }

    .stat-pair { margin-top: 26px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .stat-card {
      display: flex; flex-direction: column; gap: 6px;
      padding: 18px; background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }
    .stat-card.is-hot { border-color: var(--crit); }
    .stat-card-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .stat-card-value { font-size: 1.6rem; color: var(--text); }
    .stat-card.is-hot .stat-card-value { color: var(--crit); }
    .stat-card-sub { font-size: 0.75rem; color: var(--text-muted); }

    .same-diff-line { margin-top: 14px; font-size: 0.8125rem; color: var(--text-muted); }
    .same-diff-line.is-diff { color: var(--ok); }

    @media (min-width: 640px) {
      .flow { flex-wrap: nowrap; }
    }
  `,
})
export class AsyncQueueWorkers implements OnDestroy {
  protected readonly mode = signal<Mode>('sync');
  protected readonly jobStatus = signal<JobStatus>('idle');
  protected readonly jobId = signal('');
  protected readonly elapsedMs = signal(0);
  protected readonly requestResolvedMs = signal<number | null>(null);

  protected readonly phase = computed<
    'idle' | 'requesting' | 'blocked' | 'complete' | 'enqueued' | 'accepted' | 'working'
  >(() => {
    const status = this.jobStatus();
    if (status === 'idle') return 'idle';
    if (this.mode() === 'sync') {
      return status === 'complete' ? 'complete' : 'blocked';
    }
    if (status === 'complete') return 'complete';
    return this.elapsedMs() < 120 ? 'accepted' : 'working';
  });

  protected readonly isRunning = computed(() => this.jobStatus() === 'in-flight');

  protected readonly workPct = computed(() => Math.min(100, (this.elapsedMs() / SIM_REAL_MS) * 100));

  protected readonly jobStatusLabel = computed(() => {
    const status = this.jobStatus();
    if (status === 'idle') return 'waiting to be enqueued';
    if (status === 'complete') return 'complete';
    return this.workPct() < 5 ? 'processing' : `processing (${(this.workPct()).toFixed(0)}%)`;
  });

  protected readonly requestLatencyLabel = computed(() => {
    if (this.jobStatus() === 'idle') return '—';
    if (this.mode() === 'async') {
      return this.requestResolvedMs() !== null ? `${ASYNC_LATENCY_MS}ms` : '…';
    }
    const resolved = this.requestResolvedMs();
    if (resolved !== null) return `${this.simSeconds(resolved).toFixed(1)}s`;
    return `${this.simSeconds(this.elapsedMs()).toFixed(1)}s`;
  });

  protected readonly workCompletionLabel = computed(() => {
    if (this.jobStatus() === 'idle') return '—';
    if (this.jobStatus() === 'complete') return `${SIM_DURATION_S.toFixed(1)}s`;
    return `${this.simSeconds(this.elapsedMs()).toFixed(1)}s (in progress)`;
  });

  private timerId: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.clearTimer();
  }

  setMode(m: Mode): void {
    if (this.isRunning()) return;
    this.mode.set(m);
    this.reset();
  }

  generate(): void {
    if (this.isRunning()) return;
    this.reset();
    this.jobStatus.set('in-flight');
    this.jobId.set(Math.random().toString(16).slice(2, 8));

    if (this.mode() === 'async') {
      setTimeout(() => this.requestResolvedMs.set(ASYNC_LATENCY_MS), ASYNC_LATENCY_MS);
    }

    this.timerId = setInterval(() => {
      this.elapsedMs.update((v) => v + TICK_MS);
      if (this.elapsedMs() >= SIM_REAL_MS) {
        this.elapsedMs.set(SIM_REAL_MS);
        this.jobStatus.set('complete');
        if (this.mode() === 'sync') {
          this.requestResolvedMs.set(SIM_REAL_MS);
        }
        this.clearTimer();
      }
    }, TICK_MS);
  }

  reset(): void {
    this.clearTimer();
    this.jobStatus.set('idle');
    this.jobId.set('');
    this.elapsedMs.set(0);
    this.requestResolvedMs.set(null);
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private simSeconds(realMs: number): number {
    return (realMs / SIM_REAL_MS) * SIM_DURATION_S;
  }
}
