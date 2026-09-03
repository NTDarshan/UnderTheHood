import { Component, signal } from '@angular/core';

interface FlowStage {
  id: string;
  label: string;
  detail: string;
}

const STAGES: FlowStage[] = [
  { id: 'manager', label: 'DEPLOYMENT / PROCESS MANAGER', detail: 'An orchestrator (Kubernetes, systemd, PM2, ECS) decides this instance should stop — a rolling deploy, a scale-down, a node drain.' },
  { id: 'sigterm', label: 'SIGTERM', detail: 'The manager sends SIGTERM to the process — a request, not a command it can enforce on its own.' },
  { id: 'application', label: 'APPLICATION', detail: 'The application process receives the signal. What happens next depends entirely on whether it registered a handler.' },
  { id: 'handler', label: 'SHUTDOWN HANDLER', detail: 'A registered signal handler runs application-defined shutdown code — this is the code the developer wrote, not a runtime default.' },
  { id: 'unready', label: 'MARK UNREADY', detail: 'The handler flips the readiness probe to failing, so the load balancer / service mesh stops routing new traffic here.' },
  { id: 'stop-new', label: 'STOP NEW WORK', detail: 'The server stops accepting new connections, jobs, or messages — the listening socket may close or refuse new accepts.' },
  { id: 'drain', label: 'DRAIN', detail: 'In-flight requests and jobs already accepted are given time to finish, up to a shutdown timeout.' },
  { id: 'cleanup', label: 'CLEANUP', detail: 'Database connections, file handles, and background timers are closed and released.' },
  { id: 'exit', label: 'EXIT', detail: 'The process calls exit with a normal status code — the OS reclaims everything that is left.' },
];

@Component({
  selector: 'app-sigterm-flow',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="gs-sigterm">
      <div class="container">
        <p class="lab-index">06 — THE SIGTERM FLOW</p>
        <h2 class="lab-title">What SIGTERM actually triggers</h2>
        <p class="lab-lede">
          SIGTERM is one signal, but a well-behaved shutdown is a chain of deliberate steps written by application
          code. Step through the chain to see each link.
        </p>

        <div class="lab-panel gs-scene sigterm-scene">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isPlaying()" (click)="play()">
              {{ isPlaying() ? 'Playing…' : '▶ Step through' }}
            </button>
            <button type="button" class="lab-btn" (click)="stepOnce()" [disabled]="isPlaying()">Step once</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <ol class="flow-list" aria-label="SIGTERM shutdown flow">
            @for (s of stages; track s.id; let i = $index; let last = $last) {
              <li class="flow-item">
                <button
                  type="button"
                  class="lab-node flow-node"
                  [class.is-active]="activeIndex() === i"
                  [class.is-done]="activeIndex() > i"
                  [attr.aria-current]="activeIndex() === i ? 'step' : null"
                  (click)="jumpTo(i)"
                >
                  <span class="flow-step-num mono">{{ pad(i + 1) }}</span>
                  <span class="flow-step-label">{{ s.label }}</span>
                </button>
                @if (!last) {
                  <span class="lab-flow-arrow flow-connector" aria-hidden="true">↓</span>
                }
              </li>
            }
          </ol>

          @if (activeStage(); as s) {
            <div class="detail" aria-live="polite">
              <p class="detail-title mono">STEP {{ pad(activeIndex() + 1) }} — {{ s.label }}</p>
              <p class="detail-text">{{ s.detail }}</p>
            </div>
          }
        </div>

        <p class="lab-note lab-note-warn">
          SIGTERM is a possible trigger for graceful shutdown. SIGTERM itself is <strong>not</strong> synonymous with
          graceful shutdown — the application code decides what happens after receiving it. A process with no
          handler registered simply dies on SIGTERM with none of these steps running.
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

    .flow-list {
      list-style: none;
      margin: 22px 0 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .flow-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 100%;
    }

    .flow-node {
      all: unset;
      cursor: pointer;
      box-sizing: border-box;
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      max-width: 480px;
      padding: 12px 16px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      transition: box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
    }
    .flow-node:hover { border-color: var(--signal); }
    .flow-node:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }

    .flow-step-num {
      font-size: 0.6875rem;
      color: var(--text-faint);
      flex: none;
    }
    .flow-step-label {
      font-size: 0.8125rem;
      font-weight: 600;
      letter-spacing: 0.03em;
      color: var(--text);
    }

    .flow-node.is-done {
      border-color: var(--running);
      color: var(--running);
    }
    .flow-node.is-done .flow-step-label { color: var(--running); }

    .flow-node.is-active {
      border-color: var(--signal);
      background: color-mix(in srgb, var(--signal) 14%, var(--surface-raised));
      box-shadow: 0 0 0 2px var(--signal);
    }
    .flow-node.is-active .flow-step-label { color: var(--signal); }

    .flow-connector {
      padding: 4px 0;
      font-size: 0.875rem;
    }

    @media (prefers-reduced-motion: reduce) {
      .flow-node { transition: none; }
    }

    .detail {
      margin-top: 22px;
      padding: 18px 20px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      max-width: 640px;
      margin-left: auto;
      margin-right: auto;
    }
    .detail-title {
      margin: 0 0 8px;
      font-size: 0.75rem;
      color: var(--signal);
      letter-spacing: 0.04em;
    }
    .detail-text {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
    }
  `,
})
export class SigtermFlow {
  protected readonly stages = STAGES;
  protected readonly activeIndex = signal(0);
  protected readonly isPlaying = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly activeStage = () => STAGES[this.activeIndex()];

  protected pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }

  protected jumpTo(i: number): void {
    this.stopTimer();
    this.isPlaying.set(false);
    this.activeIndex.set(i);
  }

  protected stepOnce(): void {
    this.stopTimer();
    this.isPlaying.set(false);
    this.activeIndex.set(Math.min(this.activeIndex() + 1, STAGES.length - 1));
  }

  protected play(): void {
    if (this.isPlaying()) return;
    this.isPlaying.set(true);
    this.activeIndex.set(0);

    this.timer = setInterval(() => {
      const next = this.activeIndex() + 1;
      if (next >= STAGES.length) {
        this.stopTimer();
        this.isPlaying.set(false);
        return;
      }
      this.activeIndex.set(next);
    }, 1000);
  }

  protected reset(): void {
    this.stopTimer();
    this.isPlaying.set(false);
    this.activeIndex.set(0);
  }

  private stopTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }
}
