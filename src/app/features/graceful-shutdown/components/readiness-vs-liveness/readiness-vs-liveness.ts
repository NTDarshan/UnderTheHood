import { Component, signal } from '@angular/core';

type Phase = 'normal' | 'shutting-down';

@Component({
  selector: 'app-readiness-vs-liveness',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene rvl-scene" id="gs-readiness-liveness">
      <div class="container">
        <p class="lab-index">10 — READINESS VS LIVENESS</p>
        <h2 class="lab-title">Alive is not the same question as ready</h2>
        <p class="lab-lede">
          Liveness asks "is the process still running?" Readiness asks "should this instance receive traffic right
          now?" A shutting-down process can answer yes to the first and no to the second at the same time.
        </p>

        <div class="lab-panel">
          <div class="process-frame" [class.is-shutting-down]="phase() === 'shutting-down'">
            <div class="process-box">
              <span class="process-pulse" aria-hidden="true"></span>
              <span class="process-text mono">PID 4821 &mdash; PROCESS RUNNING</span>
            </div>

            <div class="checks-row">
              <div class="check-card">
                <p class="check-title mono">LIVENESS</p>
                <p class="check-question">Is the process alive?</p>
                <span class="pill pill-yes">&#10003; ALIVE</span>
              </div>
              <div class="check-card" [class.is-negative]="phase() === 'shutting-down'">
                <p class="check-title mono">READINESS</p>
                <p class="check-question">Should this instance receive traffic?</p>
                @if (phase() === 'normal') {
                  <span class="pill pill-yes">&#10003; READY</span>
                } @else {
                  <span class="pill pill-no">&#10007; NOT READY</span>
                }
              </div>
            </div>
          </div>

          <div class="lab-btn-row" role="group" aria-label="Process phase">
            <button type="button" class="lab-btn" [class.is-active]="phase() === 'normal'" [attr.aria-pressed]="phase() === 'normal'" (click)="setPhase('normal')">
              Normal operation
            </button>
            <button type="button" class="lab-btn lab-btn-danger" [class.is-active]="phase() === 'shutting-down'" [attr.aria-pressed]="phase() === 'shutting-down'" (click)="setPhase('shutting-down')">
              Begin shutdown
            </button>
          </div>

          <div class="lab-code" aria-live="polite">
            @if (phase() === 'normal') {
              liveness probe: OK &mdash; readiness probe: OK &mdash; load balancer sends traffic here
            } @else {
              liveness probe: still OK, the process has not crashed and is not restarted &mdash; readiness probe:
              failing on purpose &mdash; load balancer stops sending new traffic, existing connections continue
            }
          </div>
        </div>

        <p class="lab-note">
          This is the whole point of separating the two checks. If shutdown made liveness fail, an orchestrator
          like Kubernetes would restart the process mid-drain, cutting off in-flight requests. Instead the process
          stays alive and finishes its work, while flipping only its readiness signal so nothing new gets routed
          to it.
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

    .process-frame {
      display: flex;
      flex-direction: column;
      gap: 20px;
      padding: 18px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      transition: border-color 0.25s ease;
    }
    .process-frame.is-shutting-down { border-color: var(--draining); }

    .process-box {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 14px;
      border: 1px solid var(--running);
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--running) 8%, var(--surface-elevated));
    }
    .process-pulse {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--running);
      box-shadow: 0 0 10px color-mix(in srgb, var(--running) 60%, transparent);
      animation: rvl-pulse 1.5s ease-in-out infinite;
    }
    @keyframes rvl-pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.55; transform: scale(1.3); }
    }
    @media (prefers-reduced-motion: reduce) {
      .process-pulse { animation: none; }
    }
    .process-text { font-weight: 700; letter-spacing: 0.05em; font-size: 0.875rem; }

    .checks-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }
    @media (min-width: 640px) {
      .checks-row { grid-template-columns: 1fr 1fr; }
    }

    .check-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      transition: border-color 0.25s ease, background 0.25s ease;
    }
    .check-card.is-negative {
      border-color: var(--stopped);
      background: color-mix(in srgb, var(--stopped) 8%, var(--surface-elevated));
    }
    .check-title { font-size: 0.6875rem; letter-spacing: 0.1em; color: var(--text-faint); }
    .check-question { margin: 0; font-size: 0.9375rem; color: var(--text); }
  `,
})
export class ReadinessVsLiveness {
  protected readonly phase = signal<Phase>('normal');

  protected setPhase(p: Phase): void {
    this.phase.set(p);
  }
}
