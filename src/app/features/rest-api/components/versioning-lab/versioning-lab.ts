import { Component, computed, signal } from '@angular/core';

type StrategyId = 'url' | 'header' | 'query';

interface Strategy {
  id: StrategyId;
  label: string;
  example: string;
  pros: string[];
  cons: string[];
}

const STRATEGIES: Strategy[] = [
  {
    id: 'url',
    label: 'URL versioning',
    example: '/api/v1/books',
    pros: [
      'Version is visible at a glance — easy to read in logs, docs, and browser bars.',
      'Trivial to route — a reverse proxy can send /v1 and /v2 to entirely different services.',
      'Easy for clients to pin: they just hardcode the path they tested against.',
    ],
    cons: [
      'The URL is supposed to identify a resource, not a protocol detail — the resource "looks different" per version even though it is the same thing.',
      'Encourages duplicating entire route trees even for one changed field.',
    ],
  },
  {
    id: 'header',
    label: 'Header-based (media type) versioning',
    example: 'Accept: application/vnd.example.v2+json',
    pros: [
      'The URL stays a pure resource identifier — /books always means /books.',
      'Fits REST’s content-negotiation model closely — the version is genuinely a representation detail.',
    ],
    cons: [
      'Invisible in browser bars, curl history, and casual debugging unless you know to look.',
      'Harder to test quickly — every request needs the right header set correctly.',
      'Some caches and proxies key on URL only, so header-based variants can collide in a cache.',
    ],
  },
  {
    id: 'query',
    label: 'Query-parameter versioning',
    example: '/books?version=2',
    pros: [
      'Easy to add without changing existing route structure.',
      'Still visible and copy-pasteable like URL versioning.',
    ],
    cons: [
      'Query parameters are conventionally for filtering/sorting/pagination, not protocol version — mixes concerns.',
      'Easy for a client to omit by accident, silently falling back to a default version.',
    ],
  },
];

@Component({
  selector: 'app-versioning-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="versioning">
      <div class="container">
        <p class="lab-index">REST API / 25 — API VERSIONING &amp; STRATEGIES</p>
        <h2 class="lab-title">The response shape you shipped last year is still live today.</h2>
        <p class="lab-lede">APIs evolve. Clients don’t all upgrade at the same time — some are still running code from a year ago. Every change has to consider who is still calling the old shape.</p>

        <div class="lab-panel">
          <p class="lab-node">SAME RESOURCE, TWO SHAPES IN PRODUCTION AT ONCE</p>
          <div class="version-grid">
            <div class="version-card">
              <p class="lab-node">CLIENT A → V1</p>
              <p class="lab-code">{{ '{' }} <span class="tok-key">"name"</span>: "John" {{ '}' }}</p>
            </div>
            <div class="version-card">
              <p class="lab-node">CLIENT B → V2</p>
              <p class="lab-code">{{ '{' }}
  <span class="tok-key">"firstName"</span>: "John",
  <span class="tok-key">"lastName"</span>: "Doe"
{{ '}' }}</p>
            </div>
          </div>
          <p class="lab-note">Both clients are hitting the same underlying resource, and both must keep working. A new version cannot simply overwrite the old contract while old clients are still deployed.</p>
        </div>

        <div class="lab-panel">
          <p class="lab-node">TRY IT — COMPARE VERSIONING STRATEGIES</p>
          <div class="lab-btn-row">
            @for (s of strategies; track s.id) {
              <button type="button" class="lab-btn" [class.is-active]="selected() === s.id" (click)="selected.set(s.id)">{{ s.label }}</button>
            }
          </div>

          <p class="lab-code">{{ current().example }}</p>

          <div class="pros-cons">
            <div>
              <p class="lab-node">TRADEOFFS FOR</p>
              @for (p of current().pros; track p) {
                <p class="lab-note">+ {{ p }}</p>
              }
            </div>
            <div>
              <p class="lab-node">TRADEOFFS AGAINST</p>
              @for (c of current().cons; track c) {
                <p class="lab-note lab-note-warn">− {{ c }}</p>
              }
            </div>
          </div>

          <p class="lab-note" style="margin-top: 20px;"><strong>No single strategy is universally "best."</strong> The right choice depends on how the organization deploys clients, whether it controls those clients directly, how caching infrastructure is set up, and how visible version info needs to be during debugging.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .version-grid { margin-top: 16px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 640px) { .version-grid { grid-template-columns: 1fr 1fr; } }
    .version-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; }

    .pros-cons { margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 640px) { .pros-cons { grid-template-columns: 1fr 1fr; } }
    .pros-cons .lab-note { margin-top: 8px; }
  `,
})
export class VersioningLab {
  protected readonly strategies = STRATEGIES;
  protected readonly selected = signal<StrategyId>('url');

  protected readonly current = computed(() => this.strategies.find((s) => s.id === this.selected())!);
}
