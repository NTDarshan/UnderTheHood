import { Component, computed, signal } from '@angular/core';

interface LifecycleStep {
  id: string;
  label: string;
  detail: string;
  colorVar: string;
}

const LIFECYCLE: LifecycleStep[] = [
  { id: 'live', label: 'LIVE SERVER', detail: 'Serving traffic normally, holding open connections, running background work.', colorVar: '--running' },
  { id: 'requested', label: 'SHUTDOWN REQUESTED', detail: 'A signal arrives (SIGTERM, a platform stop event, a scale-down decision) — the clock on the grace period starts now.', colorVar: '--signal' },
  { id: 'unready', label: 'MARK UNREADY', detail: 'The readiness probe flips off first, before anything else changes — this is what tells the rest of the system to stop sending work here.', colorVar: '--signal' },
  { id: 'stop-traffic', label: 'STOP NEW TRAFFIC', detail: 'The load balancer / mesh / ingress observes the readiness change and deregisters this instance. No new request should arrive after this point.', colorVar: '--draining' },
  { id: 'drain', label: 'DRAIN IN-FLIGHT REQUESTS', detail: 'Requests already accepted are allowed to run to completion — this is what makes the shutdown "graceful" rather than a hard stop.', colorVar: '--draining' },
  { id: 'stop-work', label: 'STOP NEW BACKGROUND WORK', detail: 'Queue consumers and schedulers stop pulling new jobs. What is already claimed gets a chance to finish or checkpoint.', colorVar: '--queue' },
  { id: 'finish-or-cancel', label: 'FINISH / CANCEL / REQUEUE SAFE WORK', detail: 'Work that can finish in time, finishes. Work that cannot is cancelled cooperatively or safely requeued for someone else to pick up — nothing is silently dropped.', colorVar: '--cancelled' },
  { id: 'wait-deadline', label: 'WAIT WITH DEADLINE', detail: 'All of the above happens inside a bounded grace period, not an open-ended wait — a shutdown with no deadline is just a hang waiting to happen.', colorVar: '--queue' },
  { id: 'close', label: 'CLOSE RESOURCES', detail: 'Database connections, sockets, file handles, timers, and telemetry exporters are closed explicitly, in order, rather than abandoned.', colorVar: '--resource' },
  { id: 'exit', label: 'EXIT', detail: 'The process terminates with everything accounted for — no leaked resources, no silently lost work.', colorVar: '--stopped' },
];

interface DeployStep {
  id: string;
  label: string;
}

const OLD_LANE: DeployStep[] = [
  { id: 'old-drain', label: 'DRAIN' },
  { id: 'old-exit', label: 'EXIT' },
];

const NEW_LANE: DeployStep[] = [
  { id: 'new-ready', label: 'READY' },
  { id: 'new-traffic', label: 'TRAFFIC' },
];

@Component({
  selector: 'app-final-shutdown-mental-model',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene fmm-scene" id="final-mental-model">
      <div class="container">
        <p class="lab-index mono">33 — THE COMPLETE MENTAL MODEL</p>
        <h2 class="lab-title">One process's shutdown, and one deployment's handoff</h2>
        <p class="lab-lede">
          Everything in this chapter collapses into a single vertical path. Click any stage for the reasoning, then
          look at how it plugs into the deployment-level picture on the right.
        </p>

        <div class="model-grid">
          <div class="lab-panel lifecycle-panel">
            <h3 class="panel-heading">Single-process lifecycle</h3>
            <div class="lifecycle-flow" role="list">
              @for (step of lifecycle; track step.id; let last = $last) {
                <button
                  type="button"
                  class="lab-node lifecycle-node"
                  role="listitem"
                  [style.--node-color]="'var(' + step.colorVar + ')'"
                  [class.is-active]="selected() === step.id"
                  [attr.aria-pressed]="selected() === step.id"
                  (click)="selected.set(step.id)"
                >
                  <span class="node-dot" aria-hidden="true"></span>
                  {{ step.label }}
                </button>
                @if (!last) {
                  <div class="lab-flow-arrow lifecycle-arrow" aria-hidden="true">&darr;</div>
                }
              }
            </div>
          </div>

          <div class="side-col">
            <div class="lab-panel detail-panel" aria-live="polite">
              <p class="detail-name">{{ activeStep().label }}</p>
              <p class="detail-text">{{ activeStep().detail }}</p>
            </div>

            <div class="lab-panel deploy-panel">
              <h3 class="panel-heading">The deployment-level picture</h3>
              <p class="lab-note">
                Zoom out one level and this same lifecycle is what's happening inside the "old instance" lane below —
                while a second instance runs its own, much shorter, path into service.
              </p>
              <div class="deploy-lanes">
                <div class="deploy-lane">
                  <p class="lane-label mono lane-old">OLD INSTANCE</p>
                  <div class="lane-flow">
                    @for (s of oldLane; track s.id; let last = $last) {
                      <span class="lab-node lane-node lane-node-old">{{ s.label }}</span>
                      @if (!last) { <span class="lab-flow-arrow" aria-hidden="true">&rarr;</span> }
                    }
                  </div>
                </div>
                <div class="deploy-lane">
                  <p class="lane-label mono lane-new">NEW INSTANCE</p>
                  <div class="lane-flow">
                    @for (s of newLane; track s.id; let last = $last) {
                      <span class="lab-node lane-node lane-node-new">{{ s.label }}</span>
                      @if (!last) { <span class="lab-flow-arrow" aria-hidden="true">&rarr;</span> }
                    }
                  </div>
                </div>
              </div>
              <p class="lab-note">
                Zero-downtime deployment is just these two lanes overlapping correctly: the new instance reaches
                TRAFFIC before — or right as — the old instance finishes DRAIN and reaches EXIT.
              </p>
            </div>
          </div>
        </div>

        <div class="closing-panel">
          <p class="closing-text">
            Graceful shutdown was never really about stopping a process. It's about controlling everything that
            happens between the moment the shutdown signal arrives and the moment the process actually disappears —
            who stops getting new work, who gets to finish, what gets saved, and what gets closed. Get that ordering
            right, and shutdown stops being an incident and goes back to being routine.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .gs-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .panel-heading { font-size: 1.0625rem; color: var(--text); margin: 0 0 16px; }

    .model-grid { display: grid; grid-template-columns: 1fr; gap: 20px; align-items: start; }
    @media (min-width: 980px) { .model-grid { grid-template-columns: 1fr 1fr; } }

    .side-col { display: flex; flex-direction: column; gap: 20px; }

    .lifecycle-flow { display: flex; flex-direction: column; align-items: stretch; }
    .lifecycle-node {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border: 1px solid var(--node-color);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      transition: box-shadow 0.2s ease, color 0.2s ease, background 0.2s ease;
    }
    .lifecycle-node:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
    .lifecycle-node.is-active {
      color: var(--text);
      background: color-mix(in srgb, var(--node-color) 16%, var(--surface-elevated));
      box-shadow: 0 0 0 2px var(--node-color);
    }
    .node-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--node-color); flex-shrink: 0; }
    .lifecycle-arrow { text-align: center; margin: 2px 0; }

    .detail-panel { background: var(--surface-elevated); }
    .detail-name { font-size: 1rem; font-weight: 700; color: var(--accent-strong); margin: 0 0 10px; }
    .detail-text { margin: 0; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; }

    .deploy-panel { border-color: var(--accent-2); }
    .deploy-lanes { display: flex; flex-direction: column; gap: 18px; margin-top: 16px; }
    .lane-label { font-size: 0.6875rem; letter-spacing: 0.08em; margin: 0 0 8px; }
    .lane-old { color: var(--stopped); }
    .lane-new { color: var(--running); }
    .lane-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .lane-node { border-color: var(--border-strong); }
    .lane-node-old { border-color: var(--stopped); color: var(--text); }
    .lane-node-new { border-color: var(--running); color: var(--text); }

    .closing-panel {
      margin-top: 32px;
      padding: 28px 24px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--accent-dim, var(--border-strong));
      background: linear-gradient(155deg, color-mix(in srgb, var(--accent) 10%, var(--surface-raised)), var(--surface-raised));
      text-align: center;
    }
    .closing-text {
      max-width: 720px;
      margin: 0 auto;
      font-size: 1.0625rem;
      line-height: 1.7;
      color: var(--text);
    }
  `,
})
export class FinalShutdownMentalModel {
  protected readonly lifecycle = LIFECYCLE;
  protected readonly oldLane = OLD_LANE;
  protected readonly newLane = NEW_LANE;

  protected readonly selected = signal<string>(LIFECYCLE[0].id);

  protected readonly activeStep = computed(
    () => this.lifecycle.find((s) => s.id === this.selected()) ?? LIFECYCLE[0],
  );
}
