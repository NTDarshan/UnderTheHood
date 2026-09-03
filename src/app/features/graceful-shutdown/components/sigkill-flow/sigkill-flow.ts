import { Component, signal } from '@angular/core';

type ProcState = 'running' | 'killed';

@Component({
  selector: 'app-sigkill-flow',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene sigkill-scene" id="gs-sigkill">
      <div class="container">
        <p class="lab-index">08 — SIGKILL</p>
        <h2 class="lab-title">SIGKILL: no warning, no cleanup, no appeal</h2>
        <p class="lab-lede">
          SIGTERM asks a process to stop; SIGKILL simply ends it. The kernel tears the process down directly —
          the application never gets a chance to run a single line of code in response.
        </p>

        <div class="lab-panel" [class.is-shake]="justKilled()">
          <p class="lab-node">PROCESS 4821</p>

          <div class="proc-stage">
            <div class="proc-box" [class.is-running]="state() === 'running'" [class.is-killed]="state() === 'killed'">
              @if (state() === 'running') {
                <span class="proc-pulse" aria-hidden="true"></span>
                <span class="proc-text mono">RUNNING PROCESS</span>
                <span class="pill pill-yes">PID 4821 &mdash; ALIVE</span>
              } @else {
                <span class="proc-text mono">PROCESS TERMINATED</span>
                <span class="pill pill-no">PID 4821 &mdash; GONE</span>
              }
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" (click)="sendSigkill()" [disabled]="state() === 'killed'">
              SEND SIGKILL
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="state() === 'running'">
              Reset
            </button>
          </div>

          @if (state() === 'killed') {
            <div class="cannot-list" role="list" aria-label="What could not happen">
              <p class="cannot-row" role="listitem">&#10060; Application cannot handle SIGKILL</p>
              <p class="cannot-row" role="listitem">&#10060; Application cannot defer termination</p>
              <p class="cannot-row" role="listitem">&#10060; Normal application cleanup cannot be performed</p>
            </div>
            <p class="mono kill-line" aria-live="polite">
              elapsed between signal and termination: 0ms &mdash; the OS reclaimed the process's memory and
              descriptors directly, there was no "after" for application code to run in.
            </p>
          }
        </div>

        <p class="lab-note lab-note-warn">
          Why does an unblockable kill switch need to exist at all? Because SIGTERM is a request, not a
          guarantee &mdash; a hung process, an infinite loop, a deadlock, or an application that simply ignores
          SIGTERM will never shut itself down. The OS (and operators, and orchestrators like Kubernetes after a
          grace period expires) need one signal that is guaranteed to end a process no matter what that process
          is doing. That guarantee only works because the application is given no opportunity to intervene.
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

    .lab-panel.is-shake {
      animation: gs-shake 0.28s ease-in-out;
    }
    @keyframes gs-shake {
      0% { transform: translate(0, 0); }
      20% { transform: translate(-6px, 1px); }
      40% { transform: translate(5px, -1px); }
      60% { transform: translate(-4px, 1px); }
      80% { transform: translate(3px, 0); }
      100% { transform: translate(0, 0); }
    }
    @media (prefers-reduced-motion: reduce) {
      .lab-panel.is-shake { animation: none; }
    }

    .proc-stage { margin-top: 20px; display: flex; justify-content: center; }
    .proc-box {
      width: 100%;
      max-width: 420px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      padding: 32px 20px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--surface);
    }
    .proc-box.is-running {
      border-color: var(--running);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--running) 25%, transparent);
    }
    .proc-box.is-killed {
      border-color: var(--stopped);
      background: var(--stopped);
      color: #1a0404;
      box-shadow: none;
    }
    .proc-box.is-killed .proc-text { color: #1a0404; }

    .proc-pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--running);
      box-shadow: 0 0 10px color-mix(in srgb, var(--running) 60%, transparent);
      animation: sk-pulse 1.5s ease-in-out infinite;
    }
    @keyframes sk-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.35); }
    }
    @media (prefers-reduced-motion: reduce) {
      .proc-pulse { animation: none; }
    }

    .proc-text { font-family: var(--font-mono); font-weight: 700; letter-spacing: 0.05em; font-size: 1rem; }

    .cannot-list { margin-top: 20px; display: flex; flex-direction: column; gap: 8px; }
    .cannot-row {
      margin: 0;
      font-family: var(--font-mono);
      font-size: 0.875rem;
      color: var(--text);
      padding: 10px 12px;
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      background: var(--surface-raised);
    }

    .kill-line { margin-top: 16px; color: var(--text-muted); font-size: 0.8125rem; }
  `,
})
export class SigkillFlow {
  protected readonly state = signal<ProcState>('running');
  protected readonly justKilled = signal(false);

  protected sendSigkill(): void {
    if (this.state() === 'killed') return;
    this.state.set('killed');
    this.justKilled.set(true);
    setTimeout(() => this.justKilled.set(false), 300);
  }

  protected reset(): void {
    this.state.set('running');
    this.justKilled.set(false);
  }
}
