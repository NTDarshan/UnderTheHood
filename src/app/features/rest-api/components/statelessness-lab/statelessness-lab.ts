import { Component, signal } from '@angular/core';

interface SampleRequest {
  id: string;
  method: string;
  path: string;
  auth: string;
  params: string;
}

const REQUESTS: SampleRequest[] = [
  { id: 'r1', method: 'GET', path: '/books/42', auth: 'Authorization: Bearer tok_ab12', params: '(none)' },
  { id: 'r2', method: 'GET', path: '/books/43', auth: 'Authorization: Bearer tok_ab12', params: '(none)' },
];

@Component({
  selector: 'app-statelessness-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="statelessness">
      <div class="container">
        <p class="lab-index">REST API / 05 — STATELESSNESS</p>
        <h2 class="lab-title">Two requests. Neither one remembers the other.</h2>

        <div class="lab-panel">
          <div class="req-grid">
            @for (r of requests; track r.id) {
              <div class="req-card mono" [class.is-highlighted]="highlighted() === r.id" (mouseenter)="highlighted.set(r.id)" (mouseleave)="highlighted.set(null)">
                <p class="req-line"><span class="tok-method">{{ r.method }}</span> <span class="tok-key">{{ r.path }}</span></p>
                <p class="req-detail tok-dim">{{ r.auth }}</p>
                <p class="req-detail tok-dim">params: {{ r.params }}</p>
              </div>
            }
          </div>

          <p class="lab-note">
            Each request is self-contained — its own auth header, its own parameters. Neither request depends
            on anything the server remembers from the other one.
          </p>

          <div class="lab-note lab-note-warn">
            <strong>Stateless does not mean the server has no data.</strong> The server can absolutely store
            users, orders, books, and sessions in a database. Statelessness means the server doesn't rely on
            conversational state kept in memory between one client's individual requests, the way a stateful
            protocol would. Each request carries what's needed to understand it — the server isn't tracking
            "where the client left off" between calls.
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .req-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
    @media (min-width: 640px) {
      .req-grid { grid-template-columns: 1fr 1fr; }
    }
    .req-card { padding: 16px 18px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); transition: border-color 0.15s ease, box-shadow 0.15s ease; }
    .req-card.is-highlighted { border-color: var(--accent-2); box-shadow: 0 0 18px var(--glow-accent-2); }
    .req-line { font-size: 0.875rem; }
    .req-detail { margin-top: 8px; font-size: 0.75rem; }
  `,
})
export class StatelessnessLab {
  protected readonly requests = REQUESTS;
  protected readonly highlighted = signal<string | null>(null);
}
