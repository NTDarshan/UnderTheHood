import { Component, signal } from '@angular/core';

type PillarKey = 'confidentiality' | 'integrity' | 'availability';

interface Pillar {
  key: PillarKey;
  label: string;
  definition: string;
}

const PILLARS: Pillar[] = [
  { key: 'confidentiality', label: 'Confidentiality', definition: 'Only the right people can read it.' },
  { key: 'integrity', label: 'Integrity', definition: "Data isn't silently altered." },
  { key: 'availability', label: 'Availability', definition: 'The system stays usable under load and attack.' },
];

type ConcernKey =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'secrets'
  | 'sessions'
  | 'infrastructure'
  | 'dependencies'
  | 'logs';

interface Concern {
  key: ConcernKey;
  label: string;
  detail: string;
}

const CONCERNS: Concern[] = [
  { key: 'authentication', label: 'Authentication', detail: 'Proving who is making the request — passwords, tokens, MFA, and everywhere those checks can be skipped or forged.' },
  { key: 'authorization', label: 'Authorization', detail: 'Deciding what an authenticated identity is actually allowed to do or see — separate from proving who they are.' },
  { key: 'validation', label: 'Data validation', detail: 'Checking that input matches what the system expects before it is trusted, stored, or passed to another system.' },
  { key: 'secrets', label: 'Secrets', detail: 'API keys, credentials, and signing keys — where they live, how they rotate, and what happens if one leaks.' },
  { key: 'sessions', label: 'Sessions', detail: 'How a login stays valid across requests, and how that state can be stolen, replayed, or outlive its usefulness.' },
  { key: 'infrastructure', label: 'Infrastructure', detail: 'Servers, networks, and cloud configuration — misconfigured access is one of the most common real-world breaches.' },
  { key: 'dependencies', label: 'Dependencies', detail: 'Third-party libraries and services your code trusts — a vulnerability in one becomes a vulnerability in yours.' },
  { key: 'logs', label: 'Logs', detail: 'The record of what happened — needed to detect an attack, investigate it, and prove what was and wasn\'t affected.' },
];

interface EntryMarker {
  x: number;
  y: number;
  label: string;
}

const ENTRY_MARKERS: EntryMarker[] = [
  { x: 150, y: 60, label: 'query params' },
  { x: 190, y: 130, label: 'headers' },
  { x: 230, y: 60, label: 'body fields' },
  { x: 270, y: 130, label: 'cookies' },
  { x: 150, y: 130, label: 'uploaded files' },
  { x: 310, y: 90, label: 'third-party webhooks' },
];

@Component({
  selector: 'app-what-is-security',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wis-scene" id="what-is-security">
      <div class="container">
        <p class="lab-index">01 — WHAT IS BACKEND SECURITY?</p>
        <h2 class="lab-title">Backend security is the practice of keeping a system trustworthy while it talks to the outside world.</h2>
        <p class="lab-lede">
          Every request your API accepts is, by default, from someone you haven't met. Backend security is the set
          of decisions and defenses that let the system still do useful work without handing that stranger more
          trust than they've earned.
        </p>

        <div class="lab-panel">
          <div class="stage">
            <div class="node node-client"><span class="node-label mono">CLIENT</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node node-server"><span class="node-label mono">API</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node node-db"><span class="node-label mono">DATABASE</span></div>
          </div>

          <p class="part-label mono">WHAT ARE WE PROTECTING?</p>
          @if (!showPillars()) {
            <button type="button" class="lab-btn" (click)="showPillars.set(true)">Reveal the CIA triad</button>
          } @else {
            <div class="pillars-grid">
              @for (p of pillars; track p.key) {
                <div class="pillar-card">
                  <span class="pillar-name">{{ p.label }}</span>
                  <span class="pillar-def">{{ p.definition }}</span>
                </div>
              }
            </div>
          }

          <p class="part-label mono concerns-label">CONCRETE CONCERNS THIS SHOWS UP AS</p>
          <div class="chips-row" role="group" aria-label="Security concerns">
            @for (c of concerns; track c.key) {
              <button
                type="button"
                class="lab-btn chip"
                [class.is-active]="expanded() === c.key"
                [attr.aria-pressed]="expanded() === c.key"
                (click)="toggle(c.key)"
              >
                {{ c.label }}
              </button>
            }
          </div>
          @if (activeConcern(); as c) {
            <p class="concern-detail">{{ c.detail }}</p>
          }

          <p class="part-label mono surface-label">ATTACK SURFACE</p>
          <p class="lab-lede surface-lede">
            Every place external input can enter this same architecture is a place trust has to be decided. Toggle
            the markers on to see them.
          </p>

          <div class="surface-wrap">
            <svg class="surface-diagram" viewBox="0 0 420 190" role="img" aria-label="Client to API to database with external entry points marked">
              <line x1="60" y1="95" x2="150" y2="95" class="flow-line" />
              <line x1="270" y1="95" x2="360" y2="95" class="flow-line" />

              <g>
                <rect x="10" y="70" width="90" height="50" rx="8" class="surf-node surf-client" />
                <text x="55" y="99" text-anchor="middle" class="surf-text mono">CLIENT</text>
              </g>
              <g>
                <rect x="150" y="70" width="120" height="50" rx="8" class="surf-node surf-server" />
                <text x="210" y="99" text-anchor="middle" class="surf-text mono">API</text>
              </g>
              <g>
                <rect x="360" y="70" width="50" height="50" rx="8" class="surf-node surf-db" />
                <text x="385" y="99" text-anchor="middle" class="surf-text mono">DB</text>
              </g>

              @if (showMarkers()) {
                @for (m of markers; track m.label) {
                  <g [attr.transform]="'translate(' + m.x + ',' + m.y + ')'">
                    <circle r="5" class="entry-dot" />
                    <title>{{ m.label }}</title>
                  </g>
                }
              }
            </svg>

            <button type="button" class="lab-btn" [class.is-active]="showMarkers()" [attr.aria-pressed]="showMarkers()" (click)="showMarkers.set(!showMarkers())">
              {{ showMarkers() ? 'Hide' : 'Show' }} entry points
            </button>

            @if (showMarkers()) {
              <ul class="marker-list mono">
                @for (m of markers; track m.label) {
                  <li><span class="marker-dot" aria-hidden="true"></span>{{ m.label }}</li>
                }
              </ul>
            }
          </div>

          <p class="lab-note lab-note-warn">
            Every input is a potential trust boundary — the moment data crosses from "outside" to "inside," the
            system has to decide how much to believe it.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wis-scene {
      --trust: #4ade80;
      --suspicious: var(--accent);
      --attack: var(--danger);
      --compromised: #dc2626;
      --blocked: #4fd3e8;
      --c-client: var(--accent-2);
      --c-server: #60a5fa;
      --c-db: #a78bfa;
      --c-attacker: #f472b6;
      display: block;
    }

    .stage { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .node { flex: 1; min-width: 100px; display: flex; align-items: center; justify-content: center; padding: 16px 10px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .node-client { border-color: var(--c-client); }
    .node-server { border-color: var(--c-server); }
    .node-db { border-color: var(--c-db); }
    .node-label { font-size: 0.75rem; color: var(--text); letter-spacing: 0.06em; font-weight: 600; }

    .part-label { margin-top: 28px; color: var(--text-faint); letter-spacing: 0.12em; font-size: 0.75rem; margin-bottom: 4px; }
    .concerns-label, .surface-label { margin-top: 32px; }

    .pillars-grid { margin-top: 16px; display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 640px) { .pillars-grid { grid-template-columns: repeat(3, 1fr); } }
    .pillar-card { display: flex; flex-direction: column; gap: 8px; padding: 16px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); }
    .pillar-name { font-weight: 700; color: var(--text); }
    .pillar-def { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }

    .chips-row { margin-top: 14px; display: flex; flex-wrap: wrap; gap: 8px; }
    .concern-detail { margin-top: 14px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; max-width: 620px; padding: 12px 14px; background: var(--surface); border-left: 2px solid var(--accent-2); border-radius: var(--radius-sm); }

    .surface-lede { margin-top: 8px; max-width: 560px; }
    .surface-wrap { margin-top: 16px; }
    .surface-diagram { width: 100%; max-width: 480px; height: auto; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); display: block; }
    .flow-line { stroke: var(--border-strong); stroke-width: 1.5; }
    .surf-node { fill: var(--surface-elevated); stroke: var(--border-strong); stroke-width: 1.5; }
    .surf-client { stroke: var(--c-client); }
    .surf-server { stroke: var(--c-server); }
    .surf-db { stroke: var(--c-db); }
    .surf-text { fill: var(--text); font-size: 10px; font-weight: 600; letter-spacing: 0.04em; }
    .entry-dot { fill: var(--suspicious); stroke: var(--surface); stroke-width: 1.5; }

    .marker-list { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 10px 18px; font-size: 0.75rem; color: var(--text-muted); }
    .marker-list li { display: inline-flex; align-items: center; gap: 6px; }
    .marker-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--suspicious); display: inline-block; }
  `,
})
export class WhatIsSecurity {
  protected readonly pillars = PILLARS;
  protected readonly concerns = CONCERNS;
  protected readonly markers = ENTRY_MARKERS;

  protected readonly showPillars = signal(false);
  protected readonly expanded = signal<ConcernKey | null>(null);
  protected readonly showMarkers = signal(false);

  toggle(key: ConcernKey): void {
    this.expanded.update((cur) => (cur === key ? null : key));
  }

  protected activeConcern(): Concern | undefined {
    const key = this.expanded();
    return key ? this.concerns.find((c) => c.key === key) : undefined;
  }
}
