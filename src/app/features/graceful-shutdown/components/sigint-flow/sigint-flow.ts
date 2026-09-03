import { Component, signal } from '@angular/core';

interface FlowStage {
  id: string;
  label: string;
  detail: string;
}

const STAGES: FlowStage[] = [
  { id: 'terminal', label: 'TERMINAL', detail: 'A developer is running the process directly in an interactive terminal session — a local dev server, a script, a REPL.' },
  { id: 'ctrl-c', label: 'CTRL + C', detail: 'The terminal driver captures the key combination and translates it into a signal for the foreground process group.' },
  { id: 'sigint', label: 'SIGINT', detail: 'The kernel delivers SIGINT to the process — an interrupt request, same catchability as SIGTERM.' },
  { id: 'application', label: 'APPLICATION', detail: 'If the application registered a handler for SIGINT, the same graceful shutdown logic used for SIGTERM can run here too.' },
];

const COMPARISON = [
  { field: 'Who sends it', sigint: 'The interactive terminal user (Ctrl+C)', sigterm: 'A process manager or orchestrator (Kubernetes, systemd, PM2, ECS)' },
  { field: 'Typical context', sigint: 'Local development, manual scripts, debugging sessions', sigterm: 'Production deployments — rolling updates, autoscaling, node drains' },
  { field: 'Catchable?', sigint: 'Yes', sigterm: 'Yes' },
  { field: 'Can trigger graceful shutdown?', sigint: 'Yes, in well-written code', sigterm: 'Yes, in well-written code' },
];

@Component({
  selector: 'app-sigint-flow',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="gs-sigint">
      <div class="container">
        <p class="lab-index">07 — THE SIGINT FLOW</p>
        <h2 class="lab-title">Ctrl+C is a signal too</h2>
        <p class="lab-lede">
          SIGINT is the signal behind every Ctrl+C. It is shorter to trigger than SIGTERM but no less catchable —
          step through the chain, then compare the two side by side.
        </p>

        <div class="lab-panel gs-scene sigint-scene">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="isPlaying()" (click)="play()">
              {{ isPlaying() ? 'Playing…' : '▶ Step through' }}
            </button>
            <button type="button" class="lab-btn" (click)="stepOnce()" [disabled]="isPlaying()">Step once</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <ol class="flow-list" aria-label="SIGINT flow">
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

          <div class="compare-wrap">
            <h3 class="compare-title mono">SIGINT VS SIGTERM</h3>
            <div class="compare-table-scroll">
              <table class="compare-table">
                <thead>
                  <tr>
                    <th scope="col">&nbsp;</th>
                    <th scope="col" class="col-sigint">SIGINT</th>
                    <th scope="col" class="col-sigterm">SIGTERM</th>
                  </tr>
                </thead>
                <tbody>
                  @for (row of comparison; track row.field) {
                    <tr>
                      <th scope="row">{{ row.field }}</th>
                      <td>{{ row.sigint }}</td>
                      <td>{{ row.sigterm }}</td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <p class="lab-note">
          Different sender, different typical environment — but in well-written code, the same shutdown handler can
          answer to both.
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
      max-width: 420px;
      padding: 12px 16px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      transition: box-shadow 0.2s ease, border-color 0.2s ease, background 0.2s ease, color 0.2s ease;
    }
    .flow-node:hover { border-color: var(--resource); }
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
      border-color: var(--resource);
      background: color-mix(in srgb, var(--resource) 14%, var(--surface-raised));
      box-shadow: 0 0 0 2px var(--resource);
    }
    .flow-node.is-active .flow-step-label { color: var(--resource); }

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
      color: var(--resource);
      letter-spacing: 0.04em;
    }
    .detail-text {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .compare-wrap {
      margin-top: 32px;
    }
    .compare-title {
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
      margin: 0 0 12px;
    }
    .compare-table-scroll {
      overflow-x: auto;
    }
    .compare-table {
      width: 100%;
      border-collapse: collapse;
      min-width: 480px;
      font-size: 0.8125rem;
    }
    .compare-table th, .compare-table td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      color: var(--text-muted);
      vertical-align: top;
    }
    .compare-table thead th {
      color: var(--text-faint);
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      border-bottom: 1px solid var(--border-strong);
    }
    .compare-table tbody th {
      color: var(--text);
      font-weight: 600;
      white-space: nowrap;
    }
    .col-sigint { color: var(--resource); }
    .col-sigterm { color: var(--signal); }
  `,
})
export class SigintFlow {
  protected readonly stages = STAGES;
  protected readonly comparison = COMPARISON;
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
    }, 900);
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
