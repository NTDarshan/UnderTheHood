import { Component, signal } from '@angular/core';

interface Constraint {
  id: string;
  label: string;
  optional: boolean;
  what: string;
  why: string;
  example: string;
}

const CONSTRAINTS: Constraint[] = [
  {
    id: 'client-server',
    label: 'Client-Server',
    optional: false,
    what: 'The client (UI, consumer) and server (data, logic) are separated by a uniform interface.',
    why: 'Either side can evolve independently — a redesigned mobile app and an untouched backend can ship on separate schedules.',
    example: 'A web app, a mobile app, and a CLI can all call the same /books API without the server knowing which one is asking.',
  },
  {
    id: 'stateless',
    label: 'Statelessness',
    optional: false,
    what: 'Each request from a client contains all the information needed to understand it.',
    why: 'The server doesn\'t need to remember conversational state between calls, which makes any server instance able to handle any request.',
    example: 'GET /books/42 carries its own Authorization header rather than relying on a server-side "logged in as" session from a previous call.',
  },
  {
    id: 'cacheable',
    label: 'Cacheability',
    optional: false,
    what: 'Responses explicitly state whether they can be cached, and for how long.',
    why: 'Caching cuts latency and server load — but only where it\'s safe to reuse a response.',
    example: 'GET /books/42 returns Cache-Control: max-age=60, telling clients and proxies they can reuse it for a minute.',
  },
  {
    id: 'uniform',
    label: 'Uniform Interface',
    optional: false,
    what: 'Resources are identified by URLs, manipulated through representations, and interacted with via standard HTTP methods.',
    why: 'A consistent interface is what lets any HTTP client talk to any REST API without a custom client library.',
    example: 'GET /books/42, PUT /books/42, DELETE /books/42 — one resource, described through method + URL, not custom RPC calls.',
  },
  {
    id: 'layered',
    label: 'Layered System',
    optional: false,
    what: 'A client can\'t tell whether it\'s talking directly to the server or to an intermediary (load balancer, gateway, cache).',
    why: 'Layers can be added — auth gateways, caches, load balancers — without changing how clients make requests.',
    example: 'A CDN or API gateway can sit in front of /books and return a cached response without the client noticing.',
  },
  {
    id: 'code-on-demand',
    label: 'Code-on-Demand',
    optional: true,
    what: 'The server can temporarily extend client functionality by sending executable code (e.g. JavaScript).',
    why: 'It\'s the one REST constraint marked optional in the original definition — most REST APIs never use it.',
    example: 'A web page fetching a script from the server, rather than a typical JSON API response, would qualify — most APIs skip this entirely.',
  },
];

@Component({
  selector: 'app-rest-constraints',
  standalone: true,
  template: `
    <section class="lab-section" id="constraints">
      <div class="container">
        <p class="lab-index">REST API / 04 — REST CONSTRAINTS</p>
        <h2 class="lab-title">Six constraints. Five required, one optional.</h2>

        <div class="card-grid">
          @for (c of constraints; track c.id) {
            <div class="card lab-panel" [class.is-open]="expanded() === c.id">
              <button type="button" class="card-head" (click)="toggle(c.id)">
                <span class="card-label">{{ c.label }}</span>
                @if (c.optional) {
                  <span class="pill pill-conditional">OPTIONAL</span>
                } @else {
                  <span class="pill pill-yes">REQUIRED</span>
                }
              </button>

              @if (expanded() === c.id) {
                <div class="card-body">
                  <p class="card-row"><span class="card-key mono">WHAT</span>{{ c.what }}</p>
                  <p class="card-row"><span class="card-key mono">WHY</span>{{ c.why }}</p>
                  <p class="card-row"><span class="card-key mono">EXAMPLE</span>{{ c.example }}</p>
                </div>
              }
            </div>
          }
        </div>

        <p class="lab-note">
          Code-on-Demand is explicitly optional in Fielding's definition — a modern REST API that never uses it
          is not "less RESTful" for skipping it.
        </p>
      </div>
    </section>
  `,
  styles: `
    .card-grid { margin-top: 8px; display: grid; gap: 16px; grid-template-columns: 1fr; }
    @media (min-width: 720px) {
      .card-grid { grid-template-columns: 1fr 1fr; }
    }
    .card { margin-top: 0; padding: 0; overflow: hidden; }
    .card-head { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 20px 24px; background: transparent; border: none; color: var(--text); text-align: left; }
    .card-label { font-size: 0.9375rem; font-weight: 700; }
    .card.is-open .card-head { border-bottom: 1px solid var(--border); }
    .card-body { padding: 18px 24px 24px; display: flex; flex-direction: column; gap: 12px; }
    .card-row { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6; }
    .card-key { display: inline-block; min-width: 76px; color: var(--accent-2); font-size: 0.6875rem; letter-spacing: 0.08em; }
  `,
})
export class RestConstraints {
  protected readonly constraints = CONSTRAINTS;
  protected readonly expanded = signal<string | null>('client-server');

  toggle(id: string): void {
    this.expanded.set(this.expanded() === id ? null : id);
  }
}
