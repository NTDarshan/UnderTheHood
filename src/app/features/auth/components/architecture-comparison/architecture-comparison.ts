import { Component, computed, signal } from '@angular/core';

type ArchId = 'session' | 'jwt' | 'api-key' | 'oauth';

interface ArchInfo {
  id: ArchId;
  name: string;
  issuer: string;
  state: string;
  clientSends: string;
  validation: string;
  revocation: string;
  useCase: string;
  tradeoff: string;
}

const ARCHITECTURES: ArchInfo[] = [
  {
    id: 'session',
    name: 'Session',
    issuer: 'The application server, at login',
    state: 'Server-side session store',
    clientSends: 'An opaque session ID (usually via cookie)',
    validation: 'Look up the session ID in the store',
    revocation: 'Immediate — delete the server-side record',
    useCase: 'Traditional server-rendered or first-party web apps',
    tradeoff: 'Simple to revoke, but needs shared state to scale horizontally',
  },
  {
    id: 'jwt',
    name: 'JWT',
    issuer: 'An authentication/authorization service, at login',
    state: 'None required — claims travel in the token',
    clientSends: 'The signed token itself, usually as a bearer header',
    validation: 'Verify the signature and check claims (exp, aud, etc.)',
    revocation: 'Hard before expiration without extra infrastructure',
    useCase: 'Distributed APIs, microservices, mobile backends',
    tradeoff: 'Scales without shared state, but revocation and key management need care',
  },
  {
    id: 'api-key',
    name: 'API Key',
    issuer: 'A developer portal or admin panel, ahead of time',
    state: 'A stored key/secret record on the server',
    clientSends: 'The static key, usually as a header',
    validation: 'Look up the key and its associated permissions',
    revocation: 'Immediate — disable the key',
    useCase: 'Service-to-service or programmatic access',
    tradeoff: 'Simple, but long-lived and often coarse-grained',
  },
  {
    id: 'oauth',
    name: 'OAuth / OIDC',
    issuer: 'A separate Authorization Server, after user consent',
    state: 'Authorization Server tracks grants; Resource Server may be stateless',
    clientSends: 'An access token (and an ID token, for identity)',
    validation: 'Verify the token, and consult scopes for authorization',
    revocation: 'Depends on token type and Authorization Server support',
    useCase: 'Delegated access, third-party integrations, "sign in with X"',
    tradeoff: 'Powerful delegation model, but more moving parts to operate correctly',
  },
];

@Component({
  selector: 'app-architecture-comparison',
  standalone: true,
  template: `
    <section class="lab-section" id="architecture-comparison">
      <div class="container">
        <p class="lab-index">AUTH / 48 — ARCHITECTURE COMPARISON</p>
        <h2 class="lab-title">Four ways to answer "who is this, and can I trust it?"</h2>

        <div class="lab-btn-row">
          @for (a of architectures; track a.id) {
            <button type="button" class="lab-btn" [class.is-active]="selected() === a.id" (click)="selected.set(a.id)">{{ a.name }}</button>
          }
        </div>

        <div class="lab-panel arch-detail">
          <dl class="arch-facts">
            <div><dt>Who issues the credential?</dt><dd>{{ active().issuer }}</dd></div>
            <div><dt>Where is state?</dt><dd>{{ active().state }}</dd></div>
            <div><dt>What does the client send?</dt><dd>{{ active().clientSends }}</dd></div>
            <div><dt>How does the server validate?</dt><dd>{{ active().validation }}</dd></div>
            <div><dt>Revocation</dt><dd>{{ active().revocation }}</dd></div>
            <div><dt>Typical use case</dt><dd>{{ active().useCase }}</dd></div>
            <div><dt>Main tradeoff</dt><dd>{{ active().tradeoff }}</dd></div>
          </dl>
        </div>

        <p class="lab-note lab-note-warn">None of these is universally "the best." Each fits a different combination of scale, trust boundary, and operational reality.</p>
      </div>
    </section>
  `,
  styles: `
    .arch-detail { margin-top: 24px; }
    .arch-facts { display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 700px) { .arch-facts { grid-template-columns: 1fr 1fr; } }
    .arch-facts dt { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--accent-2); margin-bottom: 4px; }
    .arch-facts dd { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class ArchitectureComparison {
  protected readonly architectures = ARCHITECTURES;
  protected readonly selected = signal<ArchId>('session');
  protected readonly active = computed(() => this.architectures.find((a) => a.id === this.selected())!);
}
