import { Component, computed, signal } from '@angular/core';

type SourceKey = 'metrics' | 'logs' | 'traces' | 'user-activity' | 'authz-failures';

interface Source {
  key: SourceKey;
  index: number;
  label: string;
  timelineLabel: string;
}

const SOURCES: Source[] = [
  { key: 'metrics', index: 1, label: 'Metrics', timelineLabel: 'Attack started' },
  { key: 'logs', index: 2, label: 'Logs', timelineLabel: 'Authentication probing' },
  { key: 'traces', index: 3, label: 'Request traces', timelineLabel: 'Repeated pattern confirmed' },
  { key: 'user-activity', index: 4, label: 'User activity', timelineLabel: 'Accounts targeted' },
  { key: 'authz-failures', index: 5, label: 'Authorization failures', timelineLabel: 'Blocked requests' },
];

const METRIC_POINTS = [4, 5, 3, 6, 5, 42, 68, 51, 12, 6];

const LOG_LINES = [
  "ip=198.51.100.9 user=jsmith result=bad_password",
  "ip=198.51.100.9 user=mchen result=bad_password",
  "ip=198.51.100.9 user=agupta result=bad_password",
  "ip=198.51.100.9 user=rking result=bad_password",
  "ip=198.51.100.9 user=tlee result=bad_password",
];

const TARGETED_USERS = ['jsmith', 'mchen', 'agupta', 'rking', 'tlee', '+ 32 more'];

@Component({
  selector: 'app-incident-investigation',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="incident-investigation">
      <div class="container">
        <p class="lab-index">31 &mdash; INCIDENT INVESTIGATION</p>
        <h2 class="lab-title">Detection is only half the job. Investigation closes the loop.</h2>

        <div class="alert-banner" role="alert">
          <span class="alert-dot" aria-hidden="true"></span>
          <span class="mono alert-text">ALERT &mdash; Unusual authentication activity</span>
        </div>

        <p class="lab-lede">
          Step through each data source in order. As you visit each one, the reconstructed timeline below
          builds up with what that source reveals.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row" role="tablist" aria-label="Investigation data sources">
            @for (s of sources; track s.key) {
              <button
                type="button"
                class="lab-btn"
                role="tab"
                [class.is-active]="active().key === s.key"
                [class.is-visited]="visited().has(s.key)"
                [attr.aria-selected]="active().key === s.key"
                (click)="select(s)"
              >
                {{ s.index }}. {{ s.label }}
              </button>
            }
          </div>

          <div class="source-panel">
            @switch (active().key) {
              @case ('metrics') {
                <p class="source-desc">Failed-login count spikes sharply, then falls off after mitigation.</p>
                <svg class="metric-svg" viewBox="0 0 300 100" role="img" aria-label="Failed login count over time, spiking then dropping">
                  <polyline [attr.points]="metricPoints" fill="none" stroke="var(--suspicious)" stroke-width="2.5" />
                  <line x1="0" y1="90" x2="300" y2="90" stroke="var(--border-strong)" stroke-width="1" />
                </svg>
                <p class="source-readout mono">PEAK: 68 failed logins/min &mdash; baseline is ~5/min</p>
              }
              @case ('logs') {
                <p class="source-desc">The same source IP fails login against a different username each time.</p>
                <pre class="lab-code log-block">@for (line of logLines; track line) {
{{ line }}
}</pre>
              }
              @case ('traces') {
                <p class="source-desc">Requests arrive from one client at near-identical, machine-fast intervals.</p>
                <div class="trace-row" aria-label="Request timing trace">
                  @for (t of traceTicks; track $index) {
                    <span class="trace-tick"></span>
                  }
                </div>
                <p class="source-readout mono">INTERVAL: ~180ms between attempts &mdash; not human-paced</p>
              }
              @case ('user-activity') {
                <p class="source-desc">Dozens of distinct accounts were targeted from the same source IP.</p>
                <div class="user-chip-row">
                  @for (u of targetedUsers; track u) {
                    <span class="user-chip mono">{{ u }}</span>
                  }
                </div>
              }
              @case ('authz-failures') {
                <p class="source-desc">A handful of attempts succeeded past login but were denied at authorization.</p>
                <pre class="lab-code">user=mchen resource=/account/billing result=<span class="tok-status-err">403_forbidden</span>
user=tlee resource=/account/settings result=<span class="tok-status-err">403_forbidden</span></pre>
              }
            }
          </div>

          <p class="side-label mono">RECONSTRUCTED TIMELINE</p>
          <div class="timeline" role="list" aria-label="Reconstructed incident timeline">
            @for (s of sources; track s.key) {
              <div class="timeline-step" role="listitem" [class.step-visible]="visited().has(s.key)">
                <span class="step-dot" [class.step-dot-on]="visited().has(s.key)" aria-hidden="true"></span>
                <span class="step-label">{{ s.timelineLabel }}</span>
                @if (s.index < sources.length) {
                  <span class="step-arrow" aria-hidden="true">&rarr;</span>
                }
              </div>
            }
          </div>

          @if (allVisited()) {
            <p class="lab-note">
              <strong>Security isn't only prevention &mdash; it's also detection and response.</strong> A control
              that stops an attack in progress is only useful if someone (or something) actually notices the
              attack happening.
            </p>
          } @else {
            <p class="lab-note">Visit all five sources to complete the timeline.</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      --trust: #4ade80;
      --suspicious: var(--accent);
      --attack: var(--danger);
      --compromised: #dc2626;
      --blocked: #4fd3e8;
      --c-client: var(--accent-2);
      --c-server: #60a5fa;
      --c-db: #a78bfa;
      --c-attacker: #f472b6;
    }

    .alert-banner {
      margin-top: 20px;
      display: inline-flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      border: 1px solid var(--suspicious);
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--suspicious) 12%, var(--surface));
    }
    .alert-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--suspicious); box-shadow: 0 0 8px color-mix(in srgb, var(--suspicious) 60%, transparent); }
    .alert-text { font-size: 0.8125rem; color: var(--suspicious); letter-spacing: 0.04em; }

    .is-visited:not(.is-active) { border-color: var(--accent-2-dim); color: var(--accent-2); }

    .source-panel { margin-top: 22px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 18px; min-height: 140px; }
    .source-desc { font-size: 0.9375rem; color: var(--text-muted); max-width: 560px; }
    .source-readout { margin-top: 12px; font-size: 0.75rem; color: var(--suspicious); }

    .metric-svg { width: 100%; max-width: 460px; height: auto; margin-top: 14px; display: block; }

    .log-block { margin-top: 14px; }

    .trace-row { display: flex; gap: 6px; margin-top: 16px; flex-wrap: wrap; }
    .trace-tick { width: 10px; height: 24px; background: var(--c-attacker); border-radius: 2px; opacity: 0.85; }

    .user-chip-row { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 14px; }
    .user-chip { font-size: 0.75rem; padding: 5px 10px; border-radius: 999px; border: 1px solid var(--border-strong); color: var(--text-muted); }

    .side-label { margin-top: 26px; color: var(--text-faint); letter-spacing: 0.1em; font-size: 0.6875rem; }

    .timeline { margin-top: 12px; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
    .timeline-step { display: inline-flex; align-items: center; gap: 8px; opacity: 0.35; transition: opacity 0.3s ease; }
    .step-visible { opacity: 1; }
    .step-dot { width: 9px; height: 9px; border-radius: 50%; background: var(--border-strong); flex-shrink: 0; }
    .step-dot-on { background: var(--blocked); box-shadow: 0 0 8px color-mix(in srgb, var(--blocked) 60%, transparent); }
    .step-label { font-size: 0.8125rem; color: var(--text); white-space: nowrap; }
    .step-arrow { color: var(--text-faint); }
  `,
})
export class IncidentInvestigation {
  protected readonly sources = SOURCES;
  protected readonly logLines = LOG_LINES;
  protected readonly targetedUsers = TARGETED_USERS;
  protected readonly traceTicks = Array.from({ length: 14 });

  protected readonly metricPoints = METRIC_POINTS.map((v, i) => {
    const x = (i / (METRIC_POINTS.length - 1)) * 300;
    const y = 90 - (v / 70) * 80;
    return `${x},${y}`;
  }).join(' ');

  protected readonly active = signal<Source>(SOURCES[0]);
  protected readonly visited = signal<Set<SourceKey>>(new Set([SOURCES[0].key]));

  select(s: Source): void {
    this.active.set(s);
    const next = new Set(this.visited());
    next.add(s.key);
    this.visited.set(next);
  }

  protected readonly allVisited = computed(() => this.visited().size === this.sources.length);
}
