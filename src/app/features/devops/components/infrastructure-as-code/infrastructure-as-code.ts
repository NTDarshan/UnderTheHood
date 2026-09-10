import { Component, OnDestroy, computed, signal } from '@angular/core';

type ApplyPhase = 'idle' | 'planning' | 'planned' | 'applying' | 'applied';

@Component({
  selector: 'app-infrastructure-as-code',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-iac">
      <div class="container">
        <p class="lab-index mono">03 — INFRASTRUCTURE AS CODE</p>
        <h2 class="lab-title">Clicking through a cloud console doesn't leave a paper trail</h2>
        <p class="lab-lede">
          Infrastructure as Code replaces a sequence of undocumented manual changes with a file that declares the
          state you want — reviewed, versioned, and reproducible the same way every time.
        </p>

        <div class="lab-panel">
          <div class="compare-grid">
            <div class="compare-col">
              <p class="compare-heading mono">MANUAL INFRASTRUCTURE</p>
              <div class="click-row" aria-hidden="true">
                @for (c of clicks; track $index) {
                  <span class="click-icon">&#128433;</span>
                  @if (!$last) { <span class="click-arrow">&rarr;</span> }
                }
              </div>
              <ul class="compare-list">
                <li>Changed by hand in the console</li>
                <li>No record of who changed what, or why</li>
                <li>Hard to reproduce the same environment twice</li>
                <li>Easy to drift silently from what's documented</li>
              </ul>
            </div>

            <div class="compare-col">
              <p class="compare-heading mono">TERRAFORM</p>
              <div class="pipeline-row" aria-hidden="true">
                <span class="stage-icon mono">CODE</span>
                <span class="click-arrow">&rarr;</span>
                <span class="stage-icon mono">PLAN</span>
                <span class="click-arrow">&rarr;</span>
                <span class="stage-icon mono">APPLY</span>
                <span class="click-arrow">&rarr;</span>
                <span class="stage-icon mono">INFRA</span>
              </div>
              <ul class="compare-list">
                <li>Desired state declared in version-controlled files</li>
                <li>Every change is a reviewable diff before it happens</li>
                <li>Same code reproduces the same environment</li>
                <li>A state file tracks what Terraform believes is real</li>
              </ul>
            </div>
          </div>

          <div class="drift-lab">
            <p class="drift-heading mono">DRIFT SCENARIO</p>
            <div class="drift-row">
              <div class="drift-tile">
                <span class="drift-label mono">TERRAFORM SAYS</span>
                <span class="drift-value mono">{{ desiredInstances() }} instances</span>
              </div>
              <div class="drift-tile" [class.is-drifted]="isDrifted()">
                <span class="drift-label mono">CLOUD ACTUALLY HAS</span>
                <span class="drift-value mono">{{ actualInstances() }} instances</span>
              </div>
            </div>

            @if (isDrifted()) {
              <div class="drift-banner" role="alert">
                <span class="mono">DRIFT DETECTED</span>
                <span class="drift-banner-copy">
                  Someone added an instance directly in the console — outside Terraform. The state file no longer
                  matches reality.
                </span>
              </div>
            }

            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-danger" (click)="introduceDrift()" [disabled]="isDrifted() || isBusy()">
                SIMULATE A MANUAL CHANGE
              </button>
              <button type="button" class="lab-btn lab-btn-primary" (click)="runPlan()" [disabled]="!isDrifted() || isBusy()">
                {{ planButtonLabel() }}
              </button>
              @if (phase() === 'planned') {
                <button type="button" class="lab-btn" (click)="runApply()" [disabled]="isBusy()">APPLY &amp; RECONCILE</button>
              }
            </div>

            @if (planOutput()) {
              <pre class="lab-code plan-output">{{ planOutput() }}</pre>
            }
          </div>

          <p class="lab-note">
            <strong>plan</strong> only shows the diff between desired and actual state — nothing changes until
            <strong>apply</strong> runs. That separation is what makes IaC safe to review before it takes effect.
          </p>
        </div>
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
      --do-pending: #64748b;
    }

    .compare-grid { display: grid; gap: 20px; grid-template-columns: 1fr; }
    @media (min-width: 800px) { .compare-grid { grid-template-columns: 1fr 1fr; } }

    .compare-col {
      padding: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }
    .compare-heading { font-size: 0.75rem; letter-spacing: 0.08em; color: var(--text-faint); margin-bottom: 16px; }

    .click-row, .pipeline-row { display: flex; align-items: center; flex-wrap: wrap; gap: 6px; margin-bottom: 18px; }
    .click-icon { font-size: 1.25rem; opacity: 0.85; filter: grayscale(0.3); }
    .click-arrow { color: var(--text-faint); font-size: 0.75rem; }
    .stage-icon {
      font-size: 0.6875rem;
      font-weight: 700;
      letter-spacing: 0.05em;
      padding: 6px 10px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      color: var(--do-cyan);
      background: color-mix(in srgb, var(--do-cyan) 8%, var(--surface-elevated));
    }

    .compare-list { display: flex; flex-direction: column; gap: 8px; }
    .compare-list li {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.5;
      padding-left: 16px;
      position: relative;
    }
    .compare-list li::before {
      content: '—';
      position: absolute;
      left: 0;
      color: var(--text-faint);
    }

    .drift-lab { margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--border); }
    .drift-heading { font-size: 0.75rem; letter-spacing: 0.08em; color: var(--text-faint); margin-bottom: 14px; }

    .drift-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .drift-tile {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      transition: border-color 0.3s ease, background 0.3s ease;
    }
    .drift-tile.is-drifted { border-color: color-mix(in srgb, var(--do-danger) 50%, var(--border)); background: color-mix(in srgb, var(--do-danger) 8%, var(--surface)); }
    .drift-label { font-size: 0.625rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .drift-value { font-size: 1.25rem; font-weight: 700; color: var(--text); }

    .drift-banner {
      margin-top: 14px;
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      border: 1px solid color-mix(in srgb, var(--do-danger) 45%, var(--border));
      background: color-mix(in srgb, var(--do-danger) 10%, var(--surface));
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .drift-banner > span:first-child { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; color: var(--do-danger); }
    .drift-banner-copy { font-size: 0.8125rem; color: var(--text-muted); }

    .plan-output { margin-top: 16px; }
  `,
})
export class InfrastructureAsCode implements OnDestroy {
  protected readonly clicks = Array.from({ length: 5 });

  protected readonly desiredInstances = signal(2);
  protected readonly actualInstances = signal(2);
  protected readonly phase = signal<ApplyPhase>('idle');
  protected readonly planOutput = signal('');

  protected readonly isDrifted = computed(() => this.desiredInstances() !== this.actualInstances());

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected isBusy(): boolean {
    return this.phase() === 'planning' || this.phase() === 'applying';
  }

  protected planButtonLabel(): string {
    return this.phase() === 'planning' ? 'PLANNING…' : 'RUN TERRAFORM PLAN';
  }

  protected introduceDrift(): void {
    if (this.isDrifted() || this.isBusy()) return;
    this.actualInstances.update((n) => n + 1);
    this.phase.set('idle');
    this.planOutput.set('');
  }

  protected runPlan(): void {
    if (!this.isDrifted() || this.isBusy()) return;
    this.phase.set('planning');
    this.planOutput.set('Running terraform plan…');

    this.after(900, () => {
      this.phase.set('planned');
      this.planOutput.set(
        `~ resource "cloud_instance_group" "app" {\n    instance_count = ${this.actualInstances()} -> ${this.desiredInstances()}\n  }\n\nPlan: 0 to add, 1 to change, 1 to destroy.\nNothing has changed yet — review this diff, then apply.`,
      );
    });
  }

  protected runApply(): void {
    if (this.isBusy()) return;
    this.phase.set('applying');
    this.planOutput.set('Applying…');

    this.after(900, () => {
      this.actualInstances.set(this.desiredInstances());
      this.phase.set('applied');
      this.planOutput.set(`Apply complete. Cloud now matches Terraform: ${this.desiredInstances()} instances.`);
    });
    this.after(2200, () => {
      this.phase.set('idle');
      this.planOutput.set('');
    });
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
