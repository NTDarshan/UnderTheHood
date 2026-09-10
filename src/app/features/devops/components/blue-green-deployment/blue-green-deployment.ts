import { Component, OnDestroy, signal } from '@angular/core';

type Phase = 'idle' | 'green-deploying' | 'green-idle' | 'green-testing' | 'green-tested' | 'switched';

const POD_COUNT = 3;

@Component({
  selector: 'app-do-blue-green-deployment',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-blue-green-deployment">
      <div class="container">
        <p class="lab-index mono">08 — BLUE-GREEN DEPLOYMENT, SLOWED DOWN</p>
        <h2 class="lab-title">Two full environments. One atomic switch.</h2>
        <p class="lab-lede">
          Instead of replacing pods in place, blue-green runs two complete environments side by side. GREEN gets
          built and tested while BLUE keeps serving every request — then traffic flips in one instant, and BLUE
          stays warm as an instant rollback target. The cost: you're running double the infrastructure while both
          exist.
        </p>

        <div class="lab-panel">
          <div class="envs-row">
            <div class="env-col env-blue" [class.is-standby]="phase() === 'switched'">
              <p class="env-title mono">BLUE &mdash; {{ phase() === 'switched' ? 'STANDBY' : 'PRODUCTION' }}</p>
              <div class="pod-grid">
                @for (i of podRange; track i) {
                  <div class="pod-box is-v1">
                    <span class="mono">V1</span>
                  </div>
                }
              </div>
            </div>

            <div class="traffic-col">
              <div class="traffic-line" [class.points-green]="phase() === 'switched'" aria-hidden="true">
                <span class="traffic-arrow mono">{{ phase() === 'switched' ? '&darr;' : '&uarr;' }}</span>
              </div>
              <span class="traffic-label mono">LIVE TRAFFIC</span>
            </div>

            <div
              class="env-col env-green"
              [class.is-idle]="phase() === 'idle'"
              [class.is-deploying]="phase() === 'green-deploying'"
              [class.is-testing]="phase() === 'green-testing'"
              [class.is-ready]="phase() === 'green-tested' || phase() === 'switched'"
            >
              <p class="env-title mono">GREEN &mdash; {{ greenLabel() }}</p>
              <div class="pod-grid">
                @if (phase() === 'idle') {
                  <div class="pod-empty mono">not deployed</div>
                } @else {
                  @for (i of podRange; track i) {
                    <div class="pod-box is-v2">
                      <span class="mono">V2</span>
                    </div>
                  }
                }
              </div>
            </div>
          </div>

          <div class="lab-code" aria-live="polite">{{ statusLine() }}</div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="deployGreen()" [disabled]="phase() !== 'idle'">
              Deploy GREEN
            </button>
            <button type="button" class="lab-btn" (click)="testGreen()" [disabled]="phase() !== 'green-idle'">
              Test GREEN
            </button>
            <button type="button" class="lab-btn lab-btn-primary" (click)="switchTraffic()" [disabled]="phase() !== 'green-tested'">
              Switch traffic
            </button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="rollback()" [disabled]="phase() !== 'switched'">
              Rollback
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>
        </div>

        <p class="lab-note">
          <strong>Switch traffic</strong> doesn't fade or stagger — it's a single routing change (load balancer or
          DNS target) that moves every request from BLUE to GREEN in one instant. That's the core trade blue-green
          makes against rolling deployments: no gradual exposure window, but you pay for two full environments to
          get it. Rollback is just as atomic — click it and traffic snaps straight back to BLUE, no redeploy needed.
        </p>
      </div>
    </section>
  `,
  styles: `
    .do-scene {
      --do-accent: var(--accent);
      --do-cyan: var(--accent-2);
      --do-violet: #a78bfa;
      --do-success: #4ade80;
      --do-warning: #fbbf24;
      --do-danger: var(--danger);
      --do-pending: #60a5fa;
    }

    .envs-row {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 16px;
      align-items: center;
    }
    @media (max-width: 640px) {
      .envs-row { grid-template-columns: 1fr; }
      .traffic-col { flex-direction: row; justify-content: center; }
    }

    .env-col {
      padding: 18px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface);
      transition: border-color 0.3s ease, opacity 0.3s ease, background 0.3s ease;
    }
    .env-title { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; color: var(--text); margin-bottom: 12px; }

    .env-blue { border-color: var(--do-cyan); }
    .env-blue.is-standby { opacity: 0.5; border-color: var(--border-strong); background: var(--surface); }
    .env-blue.is-standby .env-title { color: var(--text-faint); }

    .env-green { border-color: var(--border-strong); }
    .env-green.is-idle { opacity: 0.5; }
    .env-green.is-deploying, .env-green.is-testing { border-color: var(--do-warning); }
    .env-green.is-ready { border-color: var(--do-violet); }

    .pod-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; min-height: 60px; }
    .pod-box {
      padding: 12px 6px;
      border-radius: var(--radius-sm);
      background: var(--surface-elevated);
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid var(--border);
    }
    .pod-box.is-v1 { border-color: var(--do-cyan); }
    .pod-box.is-v2 { border-color: var(--do-violet); }
    .pod-empty {
      grid-column: 1 / -1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-faint);
      font-size: 0.75rem;
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-sm);
    }

    .traffic-col {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }
    .traffic-line {
      font-size: 1.5rem;
      color: var(--do-accent);
      transition: color 0.15s ease;
    }
    .traffic-arrow { display: inline-block; }
    .traffic-label { font-size: 0.625rem; color: var(--text-faint); writing-mode: horizontal-tb; }

    @media (prefers-reduced-motion: reduce) {
      .env-col { transition: none; }
    }
  `,
})
export class BlueGreenDeployment implements OnDestroy {
  protected readonly podRange = Array.from({ length: POD_COUNT }, (_, i) => i + 1);

  protected readonly phase = signal<Phase>('idle');
  protected readonly statusLine = signal('BLUE is production, serving all live traffic. GREEN has not been deployed yet.');

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected greenLabel(): string {
    switch (this.phase()) {
      case 'idle':
        return 'NOT DEPLOYED';
      case 'green-deploying':
        return 'DEPLOYING…';
      case 'green-idle':
        return 'IDLE — NO TRAFFIC';
      case 'green-testing':
        return 'RUNNING SMOKE TESTS…';
      case 'green-tested':
        return 'TESTED — READY';
      case 'switched':
        return 'PRODUCTION';
    }
  }

  protected deployGreen(): void {
    if (this.phase() !== 'idle') return;
    this.phase.set('green-deploying');
    this.statusLine.set('Standing up GREEN — a full copy of the fleet running V2, receiving no traffic yet…');
    this.after(1000, () => {
      this.phase.set('green-idle');
      this.statusLine.set('GREEN is up and healthy, but idle. BLUE is still serving 100% of traffic.');
    });
  }

  protected testGreen(): void {
    if (this.phase() !== 'green-idle') return;
    this.phase.set('green-testing');
    this.statusLine.set('Running smoke tests against GREEN directly — traffic still has not moved…');
    this.after(1100, () => {
      this.phase.set('green-tested');
      this.statusLine.set('Smoke tests passed. GREEN is verified and ready — switch traffic whenever you choose.');
    });
  }

  protected switchTraffic(): void {
    if (this.phase() !== 'green-tested') return;
    this.phase.set('switched');
    this.statusLine.set('Traffic switched — atomically. Every request now goes to GREEN. BLUE stays warm as an instant rollback target.');
  }

  protected rollback(): void {
    if (this.phase() !== 'switched') return;
    this.phase.set('green-tested');
    this.statusLine.set('Rolled back — traffic snapped straight back to BLUE, instantly, no redeploy required.');
  }

  protected reset(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.phase.set('idle');
    this.statusLine.set('BLUE is production, serving all live traffic. GREEN has not been deployed yet.');
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
