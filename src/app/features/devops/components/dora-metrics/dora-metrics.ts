import { Component, computed, signal } from '@angular/core';

type Band = 'Elite' | 'High' | 'Medium' | 'Low';

@Component({
  selector: 'app-dora-metrics',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-dora-metrics">
      <div class="container">
        <p class="lab-index mono">02 — MEASURING DELIVERY, NOT BUSYNESS</p>
        <h2 class="lab-title">The four DORA metrics</h2>
        <p class="lab-lede">
          The DORA (DevOps Research and Assessment) metrics measure how well a team ships software — not how many
          hours anyone worked. Nudge the dials below and watch the health band respond. Values here are a simulation
          to build intuition, not live data.
        </p>

        <div class="lab-panel">
          <div class="controls-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="nudge('deployments', 1)">
              + MORE DEPLOYMENTS
            </button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="nudge('failures', 1)">
              + MORE FAILURES
            </button>
            <button type="button" class="lab-btn" (click)="nudge('recovery', 1)">FASTER RECOVERY</button>
            <button type="button" class="lab-btn" (click)="nudge('leadTime', 1)">FASTER LEAD TIME</button>
            <button type="button" class="lab-btn" (click)="reset()">RESET</button>
          </div>

          <div class="health-band mono" [attr.data-band]="band()">
            <span class="band-label">SOFTWARE DELIVERY PERFORMANCE</span>
            <span class="band-value">{{ band() }} PERFORMER</span>
          </div>

          <div class="metric-grid">
            <div class="metric-card">
              <p class="metric-name mono">DEPLOYMENT FREQUENCY</p>
              <p class="metric-value mono">{{ deploysPerWeek() }}<span class="metric-unit">/week</span></p>
              <p class="metric-desc">How often code reaches production.</p>
              <input
                type="range"
                min="0"
                max="70"
                [value]="deploysPerWeek()"
                (input)="deploysPerWeek.set(+$any($event.target).value)"
              />
            </div>
            <div class="metric-card">
              <p class="metric-name mono">LEAD TIME FOR CHANGES</p>
              <p class="metric-value mono">{{ leadTimeHours() }}<span class="metric-unit">h</span></p>
              <p class="metric-desc">Time from commit to running in production.</p>
              <input
                type="range"
                min="1"
                max="720"
                [value]="leadTimeHours()"
                (input)="leadTimeHours.set(+$any($event.target).value)"
              />
            </div>
            <div class="metric-card">
              <p class="metric-name mono">CHANGE FAILURE RATE</p>
              <p class="metric-value mono">{{ changeFailureRate() }}<span class="metric-unit">%</span></p>
              <p class="metric-desc">Share of deployments that cause a production failure.</p>
              <input
                type="range"
                min="0"
                max="60"
                [value]="changeFailureRate()"
                (input)="changeFailureRate.set(+$any($event.target).value)"
              />
            </div>
            <div class="metric-card">
              <p class="metric-name mono">TIME TO RESTORE</p>
              <p class="metric-value mono">{{ restoreHours() }}<span class="metric-unit">h</span></p>
              <p class="metric-desc">How long an incident takes to resolve.</p>
              <input
                type="range"
                min="0.1"
                max="200"
                step="0.1"
                [value]="restoreHours()"
                (input)="restoreHours.set(+$any($event.target).value)"
              />
            </div>
          </div>

          <p class="lab-note">
            These four metrics correlate with organizational performance across large-scale DORA research — but they
            describe the delivery <strong>system</strong>, not any individual's output. A team can be "elite" with a
            small number of very safe, very fast changes.
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
      --do-pending: #fbbf24;
    }

    .controls-row { display: flex; flex-wrap: wrap; gap: 10px; }

    .health-band {
      margin-top: 24px;
      padding: 16px 20px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      background: var(--surface);
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px;
      transition: border-color 0.3s ease;
    }
    .band-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .band-value { font-size: 0.9375rem; font-weight: 700; }
    .health-band[data-band='Elite'] { border-color: var(--do-success); }
    .health-band[data-band='Elite'] .band-value { color: var(--do-success); }
    .health-band[data-band='High'] { border-color: var(--do-cyan); }
    .health-band[data-band='High'] .band-value { color: var(--do-cyan); }
    .health-band[data-band='Medium'] { border-color: var(--do-warning); }
    .health-band[data-band='Medium'] .band-value { color: var(--do-warning); }
    .health-band[data-band='Low'] { border-color: var(--do-danger); }
    .health-band[data-band='Low'] .band-value { color: var(--do-danger); }

    .metric-grid {
      margin-top: 24px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }
    @media (min-width: 640px) { .metric-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 1000px) { .metric-grid { grid-template-columns: repeat(4, 1fr); } }

    .metric-card {
      display: flex;
      flex-direction: column;
      gap: 6px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
    }
    .metric-name { font-size: 0.625rem; letter-spacing: 0.06em; color: var(--text-faint); }
    .metric-value { font-size: 1.5rem; font-weight: 700; color: var(--text); }
    .metric-unit { font-size: 0.75rem; color: var(--text-faint); font-weight: 500; margin-left: 2px; }
    .metric-desc { font-size: 0.75rem; color: var(--text-muted); line-height: 1.5; min-height: 2.2em; }
    .metric-card input[type='range'] { accent-color: var(--do-accent); width: 100%; margin-top: 4px; }
  `,
})
export class DoraMetrics {
  protected readonly deploysPerWeek = signal(3);
  protected readonly leadTimeHours = signal(48);
  protected readonly changeFailureRate = signal(20);
  protected readonly restoreHours = signal(8);

  protected readonly band = computed<Band>(() => {
    const deploys = this.deploysPerWeek();
    const lead = this.leadTimeHours();
    const failRate = this.changeFailureRate();
    const restore = this.restoreHours();

    let score = 0;
    if (deploys >= 7) score += 3;
    else if (deploys >= 1) score += 2;
    else score += 1;

    if (lead <= 24) score += 3;
    else if (lead <= 168) score += 2;
    else score += 1;

    if (failRate <= 15) score += 3;
    else if (failRate <= 30) score += 2;
    else score += 1;

    if (restore <= 1) score += 3;
    else if (restore <= 24) score += 2;
    else score += 1;

    if (score >= 11) return 'Elite';
    if (score >= 8) return 'High';
    if (score >= 5) return 'Medium';
    return 'Low';
  });

  protected nudge(metric: 'deployments' | 'failures' | 'recovery' | 'leadTime', dir: number): void {
    switch (metric) {
      case 'deployments':
        this.deploysPerWeek.update((v) => Math.min(70, v + 5 * dir));
        break;
      case 'failures':
        this.changeFailureRate.update((v) => Math.min(60, Math.max(0, v + 5 * dir)));
        break;
      case 'recovery':
        this.restoreHours.update((v) => Math.max(0.1, +(v / 2).toFixed(1)));
        break;
      case 'leadTime':
        this.leadTimeHours.update((v) => Math.max(1, Math.round(v / 1.6)));
        break;
    }
  }

  protected reset(): void {
    this.deploysPerWeek.set(3);
    this.leadTimeHours.set(48);
    this.changeFailureRate.set(20);
    this.restoreHours.set(8);
  }
}
