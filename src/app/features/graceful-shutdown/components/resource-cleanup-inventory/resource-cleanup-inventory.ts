import { Component, OnDestroy, computed, signal } from '@angular/core';

type ResourceState = 'ACTIVE' | 'STOP' | 'DRAIN' | 'FLUSH' | 'CLOSE' | 'CLOSED';

interface Resource {
  id: string;
  label: string;
  icon: string;
  /** Whether this resource's second transition step is labeled DRAIN or FLUSH. */
  secondStep: 'DRAIN' | 'FLUSH';
  state: ResourceState;
  delay: number;
}

const RESOURCE_DEFS: { id: string; label: string; icon: string; secondStep: 'DRAIN' | 'FLUSH' }[] = [
  { id: 'db', label: 'Database connections', icon: '🗄', secondStep: 'DRAIN' },
  { id: 'sockets', label: 'Sockets', icon: '🔌', secondStep: 'DRAIN' },
  { id: 'files', label: 'File handles', icon: '📄', secondStep: 'FLUSH' },
  { id: 'workers', label: 'Workers', icon: '⚙', secondStep: 'DRAIN' },
  { id: 'consumers', label: 'Queue consumers', icon: '📬', secondStep: 'DRAIN' },
  { id: 'timers', label: 'Timers', icon: '⏱', secondStep: 'DRAIN' },
  { id: 'http', label: 'HTTP clients', icon: '🌐', secondStep: 'DRAIN' },
  { id: 'telemetry', label: 'Telemetry exporters', icon: '📡', secondStep: 'FLUSH' },
];

const STEP_MS = 550;
const STAGGER_MS = 180;

@Component({
  selector: 'app-resource-cleanup-inventory',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="gs-resource-cleanup">
      <div class="container">
        <p class="lab-index">20 — RESOURCE CLEANUP INVENTORY</p>
        <h2 class="lab-title">Everything a server is holding, at the moment it's told to stop.</h2>
        <p class="lab-lede">
          A running server isn't just handling requests — it's holding open connections, file handles, timers, and
          background workers. A graceful shutdown has to walk every one of them through the same lifecycle before
          the process can safely exit: <strong>active, stop accepting new work, drain or flush what's in flight,
          then close.</strong>
        </p>

        <div class="gs-scene inventory-scene lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="runCleanup()" [disabled]="running()">
              {{ running() ? 'Cleaning up…' : 'Run cleanup' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="running()">Reset</button>
          </div>

          <div class="resource-grid">
            @for (r of resources(); track r.id) {
              <div class="resource-card" [class]="'state-' + r.state.toLowerCase()">
                <div class="resource-head">
                  <span class="resource-icon" aria-hidden="true">{{ r.icon }}</span>
                  <span class="resource-label">{{ r.label }}</span>
                </div>
                <div class="resource-state mono" [attr.aria-label]="'State: ' + r.state">
                  <span class="state-dot" aria-hidden="true"></span>
                  {{ r.state === 'CLOSED' ? 'CLOSED' : r.state }}
                </div>
                <div class="resource-track" role="img" [attr.aria-label]="'Progress: ' + r.state">
                  @for (step of stepsFor(r); track step) {
                    <span class="track-step" [class.is-done]="isStepDone(r, step)" [class.is-current]="r.state === step"></span>
                  }
                </div>
              </div>
            }
          </div>

          <div class="count-band mono" [class.is-zero]="remainingCount() === 0">
            RESOURCE COUNT = {{ remainingCount() }}
          </div>
        </div>

        <p class="lab-note">
          Notice the order within each resource: it stops taking <em>new</em> work before it deals with work already
          in flight, and it only closes once that in-flight work has drained or flushed. Skip a step — close a
          database pool while queries are still running, for example — and you turn a clean shutdown into dropped
          work or corrupted state.
        </p>
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

    .inventory-scene { display: flex; flex-direction: column; gap: 22px; }

    .resource-grid {
      display: grid;
      grid-template-columns: repeat(1, 1fr);
      gap: 14px;
    }
    @media (min-width: 640px) { .resource-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1000px) { .resource-grid { grid-template-columns: repeat(4, 1fr); } }

    .resource-card {
      display: flex;
      flex-direction: column;
      gap: 10px;
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      transition: border-color 0.25s ease, background 0.25s ease;
    }

    .resource-head { display: flex; align-items: center; gap: 8px; }
    .resource-icon { font-size: 1.1rem; }
    .resource-label { font-size: 0.8125rem; font-weight: 600; color: var(--text); }

    .resource-state {
      display: flex;
      align-items: center;
      gap: 7px;
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      color: var(--text-muted);
    }

    .state-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--running);
      flex-shrink: 0;
    }

    .state-active .state-dot { background: var(--running); }
    .state-active { border-color: color-mix(in srgb, var(--running) 40%, var(--border)); }

    .state-stop .state-dot,
    .state-drain .state-dot,
    .state-flush .state-dot {
      background: var(--draining);
      animation: gs-pulse 1s ease-in-out infinite;
    }
    .state-stop, .state-drain, .state-flush {
      border-color: color-mix(in srgb, var(--draining) 45%, var(--border));
      background: color-mix(in srgb, var(--draining) 6%, var(--surface));
    }

    .state-close .state-dot { background: var(--stopped); }
    .state-close { border-color: color-mix(in srgb, var(--stopped) 45%, var(--border)); }

    .state-closed .state-dot { background: var(--idle); }
    .state-closed {
      border-color: var(--border);
      background: var(--surface);
      opacity: 0.6;
    }

    @keyframes gs-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }

    @media (prefers-reduced-motion: reduce) {
      .state-stop .state-dot, .state-drain .state-dot, .state-flush .state-dot { animation: none; }
    }

    .resource-track { display: flex; gap: 4px; }
    .track-step {
      flex: 1;
      height: 4px;
      border-radius: 2px;
      background: var(--border);
      transition: background 0.25s ease;
    }
    .track-step.is-done { background: var(--idle); }
    .track-step.is-current { background: var(--draining); }

    .count-band {
      align-self: flex-start;
      padding: 10px 16px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      font-size: 0.8125rem;
      color: var(--text-muted);
      letter-spacing: 0.04em;
    }
    .count-band.is-zero {
      color: var(--running);
      border-color: var(--running);
      background: color-mix(in srgb, var(--running) 10%, var(--surface));
    }
  `,
})
export class ResourceCleanupInventory implements OnDestroy {
  protected readonly resources = signal<Resource[]>(
    RESOURCE_DEFS.map((d) => ({ ...d, state: 'ACTIVE' as ResourceState, delay: 0 }))
  );

  protected readonly running = signal(false);

  protected readonly remainingCount = computed(
    () => this.resources().filter((r) => r.state !== 'CLOSED').length
  );

  private timeouts: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.clearTimeouts();
  }

  protected stepsFor(r: Resource): ResourceState[] {
    return ['ACTIVE', 'STOP', r.secondStep, 'CLOSE'];
  }

  protected isStepDone(r: Resource, step: ResourceState): boolean {
    const order = ['ACTIVE', 'STOP', r.secondStep, 'CLOSE', 'CLOSED'];
    const currentIdx = order.indexOf(r.state);
    const stepIdx = order.indexOf(step);
    return stepIdx < currentIdx;
  }

  protected runCleanup(): void {
    if (this.running()) return;
    this.clearTimeouts();
    this.running.set(true);

    this.resources().forEach((res, i) => {
      const path: ResourceState[] = ['STOP', res.secondStep, 'CLOSE', 'CLOSED'];
      const baseDelay = i * STAGGER_MS;

      path.forEach((state, stepIdx) => {
        const t = setTimeout(() => {
          this.resources.update((list) =>
            list.map((r) => (r.id === res.id ? { ...r, state } : r))
          );
          if (i === this.resources().length - 1 && stepIdx === path.length - 1) {
            this.running.set(false);
          }
        }, baseDelay + STEP_MS * (stepIdx + 1));
        this.timeouts.push(t);
      });
    });
  }

  protected reset(): void {
    this.clearTimeouts();
    this.running.set(false);
    this.resources.set(RESOURCE_DEFS.map((d) => ({ ...d, state: 'ACTIVE' as ResourceState, delay: 0 })));
  }

  private clearTimeouts(): void {
    this.timeouts.forEach((t) => clearTimeout(t));
    this.timeouts = [];
  }
}
