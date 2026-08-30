import { Component, signal } from '@angular/core';

interface Scenario {
  name: string;
  answer: string;
  reasoning: string;
}

const SCENARIOS: Scenario[] = [
  { name: 'Live chat', answer: 'WebSocket', reasoning: 'Both sides send unpredictably and latency matters — a textbook bidirectional, persistent-connection use case.' },
  { name: 'Live multiplayer game', answer: 'WebSocket (or lower-level UDP-based transport)', reasoning: 'Needs the lowest latency, frequent small messages in both directions.' },
  { name: 'Real-time collaborative editor', answer: 'WebSocket', reasoning: 'Every keystroke can be a bidirectional event; needs a standing channel, not repeated requests.' },
  { name: 'Live notifications', answer: 'WebSocket or SSE, depending on requirements', reasoning: 'If the client never needs to push data back over the same channel, SSE is simpler. If it does, WebSocket.' },
  { name: 'Server-sent progress bar', answer: 'SSE may be simpler', reasoning: 'Purely server → client, one direction, no need for the complexity of a full duplex protocol.' },
  { name: 'Live dashboard', answer: 'WebSocket or SSE, depending on directionality', reasoning: 'A read-only dashboard fits SSE; a dashboard with live controls sent back fits WebSocket.' },
  { name: 'Normal CRUD API', answer: 'HTTP', reasoning: 'Discrete, client-initiated operations with clear request/response semantics — exactly what HTTP is for.' },
  { name: 'File download', answer: 'HTTP', reasoning: 'A single request/response transfer, cacheable, resumable with byte ranges — no persistent channel needed.' },
  { name: 'Static content', answer: 'HTTP / CDN', reasoning: 'Cacheable, doesn\'t change per-request — the opposite of what a persistent connection is for.' },
];

@Component({
  selector: 'app-decision-guide',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="decision">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 018 — WHEN TO REACH FOR ONE</p>
        <h2 class="lab-title">"WebSocket is always better" is the wrong lesson.</h2>
        <p class="lab-lede">Click a scenario for the call — and why.</p>

        <div class="scenario-grid">
          @for (s of scenarios; track s.name) {
            <button type="button" class="scenario-card" [class.is-selected]="selected().name === s.name" (click)="selected.set(s)">
              {{ s.name }}
            </button>
          }
        </div>

        <div class="lab-panel answer-panel">
          <p class="answer-label mono">{{ selected().name.toUpperCase() }}</p>
          <p class="answer-value">→ {{ selected().answer }}</p>
          <p class="answer-reasoning">{{ selected().reasoning }}</p>
        </div>

        <h3 class="sub-heading">WebSocket does not replace HTTP</h3>
        <div class="split-row">
          <div class="split-col">
            <p class="split-heading mono">HTTP IS STILL RIGHT FOR</p>
            <ul><li>CRUD operations</li><li>Resource retrieval</li><li>Uploads and downloads</li><li>Normal request/response APIs</li><li>Cacheable resources</li></ul>
          </div>
          <div class="split-col">
            <p class="split-heading mono">WEBSOCKET IS RIGHT FOR</p>
            <ul><li>Persistent bidirectional communication</li><li>Real-time events</li><li>Interactive sessions</li><li>Live collaboration</li><li>Games and chat</li></ul>
          </div>
        </div>

        <div class="together-diagram mono">
          <span class="together-node">Browser</span>
          <span class="together-arrows">
            <span>← HTTP: fetch profile, save settings, upload avatar →</span>
            <span>⇄ WebSocket: live messages, presence, typing indicators ⇄</span>
          </span>
          <span class="together-node">Backend</span>
        </div>
        <p class="together-note">Most real production systems use both, side by side — HTTP for the resource operations, WebSocket for the standing real-time channel.</p>
      </div>
    </section>
  `,
  styles: `
    .scenario-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap: 8px; }
    .scenario-card { padding: 14px 16px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-elevated); color: var(--text-muted); font-size: 0.875rem; text-align: left; transition: border-color 0.15s ease, color 0.15s ease; }
    .scenario-card:hover { border-color: var(--accent-2); }
    .scenario-card.is-selected { border-color: var(--accent); color: var(--accent-strong); background: color-mix(in srgb, var(--accent) 10%, var(--surface-elevated)); }

    .answer-panel { margin-top: 20px; }
    .answer-label { color: var(--text-faint); font-size: 0.6875rem; letter-spacing: 0.06em; margin-bottom: 8px; }
    .answer-value { color: var(--accent); font-size: 1.125rem; font-weight: 700; }
    .answer-reasoning { margin-top: 10px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; }

    .sub-heading { margin-top: 44px; font-size: 1.25rem; color: var(--text); }
    .split-row { margin-top: 20px; display: grid; gap: 20px; grid-template-columns: 1fr; }
    @media (min-width: 640px) { .split-row { grid-template-columns: 1fr 1fr; } }
    .split-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-bottom: 10px; }
    .split-col ul { display: flex; flex-direction: column; gap: 6px; }
    .split-col li { position: relative; padding-left: 16px; font-size: 0.875rem; color: var(--text-muted); }
    .split-col li::before { content: '—'; position: absolute; left: 0; color: var(--text-faint); }

    .together-diagram { margin-top: 28px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 20px; }
    .together-node { padding: 10px 18px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface-elevated); font-size: 0.75rem; }
    .together-arrows { display: flex; flex-direction: column; gap: 8px; flex: 1; font-size: 0.75rem; color: var(--text-faint); }
    .together-note { margin-top: 12px; font-size: 0.875rem; color: var(--text-faint); }
  `,
})
export class DecisionGuide {
  protected readonly scenarios = SCENARIOS;
  protected readonly selected = signal<Scenario>(SCENARIOS[0]);
}
