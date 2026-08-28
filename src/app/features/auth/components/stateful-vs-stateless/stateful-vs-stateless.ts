import { Component, computed, signal } from '@angular/core';

interface Dimension {
  label: string;
  stateful: string;
  stateless: string;
}

const DIMENSIONS: Dimension[] = [
  { label: 'Server-side state', stateful: 'Required — session store holds identity', stateless: 'None needed — the token itself carries claims' },
  { label: 'Horizontal scaling', stateful: 'Needs a shared session store across servers', stateless: 'Any server can validate a token independently' },
  { label: 'Revocation', stateful: 'Immediate — delete the session record', stateless: 'Harder — a valid token stays valid until it expires' },
  { label: 'Token/session size', stateful: 'Small opaque identifier', stateless: 'Larger — claims travel with every request' },
  { label: 'Operational complexity', stateful: 'Session store to run and scale', stateless: 'Key management and validation logic to get right' },
  { label: 'Typical failure mode', stateful: 'Session store outage blocks all authentication', stateless: 'A leaked signing key compromises every token' },
];

@Component({
  selector: 'app-stateful-vs-stateless',
  standalone: true,
  template: `
    <section class="lab-section" id="stateful-vs-stateless">
      <div class="container">
        <p class="lab-index">AUTH / 17 — STATEFUL VS. STATELESS</p>
        <h2 class="lab-title">Where does the truth about "who is this?" live?</h2>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="mode() === 'stateful'" (click)="mode.set('stateful')">Stateful (session)</button>
          <button type="button" class="lab-btn" [class.is-active]="mode() === 'stateless'" (click)="mode.set('stateless')">Stateless (token)</button>
        </div>

        <div class="lab-panel arch-panel">
          @if (mode() === 'stateful') {
            <div class="flow-chain mono">
              <span>Client</span><span class="arrow">↓</span>
              <span>Session ID</span><span class="arrow">↓</span>
              <span>Server</span><span class="arrow">↓</span>
              <span>Session Store</span><span class="arrow">↓</span>
              <span>User</span>
            </div>
          } @else {
            <div class="flow-chain mono">
              <span>Client</span><span class="arrow">↓</span>
              <span>Token</span><span class="arrow">↓</span>
              <span>Server</span><span class="arrow">↓</span>
              <span>Validate token</span><span class="arrow">↓</span>
              <span>User / Claims</span>
            </div>
          }
        </div>

        <div class="dim-table">
          @for (d of dimensions; track d.label) {
            <div class="dim-row">
              <span class="dim-label mono">{{ d.label }}</span>
              <span class="dim-value" [class.is-current]="mode() === 'stateful'">{{ d.stateful }}</span>
              <span class="dim-value" [class.is-current]="mode() === 'stateless'">{{ d.stateless }}</span>
            </div>
          }
        </div>

        <p class="lab-note lab-note-warn">
          Neither model is universally "more secure." Security depends on how each is implemented and
          the specific threat model — not on the stateful/stateless label alone.
        </p>
      </div>
    </section>
  `,
  styles: `
    .arch-panel { margin-top: 24px; text-align: center; }
    .flow-chain { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.8125rem; color: var(--text-muted); }
    .flow-chain .arrow { color: var(--text-faint); }

    .dim-table { margin-top: 24px; display: flex; flex-direction: column; }
    .dim-row {
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
      padding: 14px 0;
      border-top: 1px solid var(--border);
    }
    @media (min-width: 800px) {
      .dim-row { grid-template-columns: 180px 1fr 1fr; align-items: center; }
    }
    .dim-label { font-size: 0.75rem; color: var(--accent-2); }
    .dim-value { font-size: 0.8125rem; color: var(--text-faint); transition: color 0.2s ease; }
    .dim-value.is-current { color: var(--text); font-weight: 600; }
  `,
})
export class StatefulVsStateless {
  protected readonly mode = signal<'stateful' | 'stateless'>('stateful');
  protected readonly dimensions = DIMENSIONS;
}
