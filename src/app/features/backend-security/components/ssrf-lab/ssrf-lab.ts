import { Component, computed, signal } from '@angular/core';

interface Defense {
  id: string;
  label: string;
  detail: string;
}

const DEFENSES: Defense[] = [
  {
    id: 'allowlist',
    label: 'Allowlist destinations',
    detail: 'Only fetch from a known-safe set of hosts. The internal URL is rejected before any request is made.',
  },
  {
    id: 'validate',
    label: 'Validate URLs',
    detail: 'Reject unexpected schemes, hosts, or redirects — not just a surface string check on the input.',
  },
  {
    id: 'protocols',
    label: 'Restrict protocols',
    detail: 'Block non-http(s) schemes like file:// so the fetch can never be repointed at the local filesystem.',
  },
  {
    id: 'network',
    label: 'Network-level controls',
    detail: 'The server itself simply cannot route to internal-only addresses — a backstop even if application logic has a bug.',
  },
];

const PUBLIC_URL = 'https://example.com/image.jpg';
const INTERNAL_URL = 'http://internal.local/admin';

type Outcome = 'idle' | 'public-ok' | 'internal-compromised' | 'internal-blocked';

@Component({
  selector: 'app-ssrf-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="ssrf-lab">
      <div class="container">
        <p class="lab-index">25 — SSRF (SERVER-SIDE REQUEST FORGERY)</p>
        <h2 class="lab-title">The attacker never touches the internal service. They convince your server to do it.</h2>
        <p class="lab-lede">
          This app has a "preview a link" feature: give it a URL, and the server fetches it on your behalf. That
          server-side fetch runs from inside the network — reachable to places the public internet is not.
        </p>

        <div class="zone-map">
          <div class="zone public-zone">
            <p class="lab-node">PUBLIC INTERNET</p>
            <p class="zone-example mono">{{ publicUrl }}</p>
          </div>
          <div class="zone internal-zone">
            <p class="lab-node">INTERNAL NETWORK</p>
            <p class="zone-example mono">{{ internalUrl }}</p>
            <p class="zone-caption">Private-only services the server can reach but the public internet cannot.</p>
          </div>
        </div>

        <div class="lab-panel">
          <div class="actor-flow mono">
            <span class="lab-node actor-attacker">ATTACKER</span>
            <span class="lab-flow-arrow">submits URL →</span>
            <span class="lab-node actor-server">SERVER</span>
            <span class="lab-flow-arrow">makes HTTP request →</span>
            <span class="lab-node actor-target" [class.is-internal]="isInternalUrl()">{{ isInternalUrl() ? 'INTERNAL SERVICE' : 'PUBLIC HOST' }}</span>
          </div>

          <div class="lab-field url-field">
            <label for="ssrf-url">Feature input — URL to fetch</label>
            <input
              id="ssrf-url"
              type="text"
              [value]="url()"
              (input)="onUrlInput($event)"
              [attr.aria-describedby]="'ssrf-result'"
            />
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="setUrl(publicUrl)">Use public URL</button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="setUrl(internalUrl)">Use internal URL</button>
            <button type="button" class="lab-btn lab-btn-primary" (click)="fetchUrl()">Fetch</button>
          </div>

          <div class="result-box" id="ssrf-result" role="status">
            @switch (outcome()) {
              @case ('idle') {
                <p class="result-line">No request made yet.</p>
              }
              @case ('public-ok') {
                <p class="pill pill-yes">ALLOWED</p>
                <p class="result-line">Server fetched a public resource, as expected. Result returned to the requester.</p>
              }
              @case ('internal-compromised') {
                <p class="pill pill-no result-pill-attack">ATTACK SUCCEEDED</p>
                <p class="result-line result-attack">
                  The attacker doesn't connect to the internal service directly — they tricked the trusted server
                  into doing it for them, using the server's own network position. The server returned internal
                  data the attacker could never have reached on their own.
                </p>
              }
              @case ('internal-blocked') {
                <p class="pill pill-yes result-pill-blocked">BLOCKED</p>
                <p class="result-line result-blocked">
                  A defense below caught this request before it ever left the server.
                </p>
              }
            }
          </div>

          <p class="defenses-heading mono">DEFENSES — toggle to see the effect on the same request</p>
          <div class="defense-grid" role="group" aria-label="Toggle defenses">
            @for (d of defenses; track d.id) {
              <button
                type="button"
                class="lab-btn defense-btn"
                [class.is-active]="isDefenseOn(d.id)"
                [attr.aria-pressed]="isDefenseOn(d.id)"
                (click)="toggleDefense(d.id)"
              >
                <span class="defense-label">{{ d.label }}</span>
                <span class="defense-state mono">{{ isDefenseOn(d.id) ? 'ON' : 'OFF' }}</span>
              </button>
            }
          </div>
          <div class="defense-detail-list">
            @for (d of defenses; track d.id) {
              <p class="defense-detail" [class.is-on]="isDefenseOn(d.id)">
                <span class="mono">[{{ isDefenseOn(d.id) ? 'x' : ' ' }}]</span> {{ d.detail }}
              </p>
            }
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          Avoid blindly fetching arbitrary URLs where the feature doesn't strictly need to — the safest version of
          "fetch whatever URL the user gives us" is often to not build that feature as broadly as it first sounds.
        </p>
      </div>
    </section>
  `,
  styles: `
    :host {
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

    .zone-map { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 700px) { .zone-map { grid-template-columns: 1fr 1fr; } }
    .zone { border: 1px solid var(--border-strong); border-radius: var(--radius-md); padding: 16px; background: var(--surface); }
    .public-zone { border-color: var(--trust); }
    .internal-zone { border-color: var(--c-attacker); }
    .zone-example { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); }
    .zone-caption { margin-top: 8px; font-size: 0.75rem; color: var(--text-faint); }

    .actor-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 0.75rem; }
    .actor-attacker { color: var(--c-attacker); }
    .actor-server { color: var(--c-server); }
    .actor-target { color: var(--trust); }
    .actor-target.is-internal { color: var(--attack); }

    .url-field { margin-top: 20px; max-width: 480px; }
    .url-field input { width: 100%; }

    .result-box { margin-top: 20px; padding: 14px 16px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); min-height: 60px; }
    .result-line { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }
    .result-attack { color: var(--text); }
    .result-pill-attack { color: var(--attack); border-color: var(--attack); }
    .result-pill-blocked { color: var(--blocked); border-color: var(--blocked); }
    .result-blocked { color: var(--text); }

    .defenses-heading { margin-top: 28px; font-size: 0.6875rem; letter-spacing: 0.1em; color: var(--text-faint); }
    .defense-grid { margin-top: 12px; display: grid; grid-template-columns: 1fr; gap: 10px; }
    @media (min-width: 640px) { .defense-grid { grid-template-columns: 1fr 1fr; } }
    .defense-btn { justify-content: space-between; width: 100%; }
    .defense-label { text-transform: none; letter-spacing: normal; font-family: var(--font-sans); font-weight: 500; }
    .defense-state { color: var(--text-faint); }
    .defense-btn.is-active .defense-state { color: var(--trust); }

    .defense-detail-list { margin-top: 14px; display: flex; flex-direction: column; gap: 6px; }
    .defense-detail { font-size: 0.75rem; color: var(--text-faint); line-height: 1.5; }
    .defense-detail.is-on { color: var(--text-muted); }
  `,
})
export class SsrfLab {
  protected readonly defenses = DEFENSES;
  protected readonly publicUrl = PUBLIC_URL;
  protected readonly internalUrl = INTERNAL_URL;

  protected readonly url = signal(PUBLIC_URL);
  protected readonly outcome = signal<Outcome>('idle');
  protected readonly activeDefenses = signal<Set<string>>(new Set());

  protected readonly isInternalUrl = computed(() => this.looksInternal(this.url()));

  protected onUrlInput(event: Event): void {
    this.url.set((event.target as HTMLInputElement).value);
  }

  protected setUrl(value: string): void {
    this.url.set(value);
  }

  protected isDefenseOn(id: string): boolean {
    return this.activeDefenses().has(id);
  }

  protected toggleDefense(id: string): void {
    this.activeDefenses.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected fetchUrl(): void {
    const internal = this.looksInternal(this.url());
    if (!internal) {
      this.outcome.set('public-ok');
      return;
    }
    const blocked = this.activeDefenses().size > 0;
    this.outcome.set(blocked ? 'internal-blocked' : 'internal-compromised');
  }

  private looksInternal(value: string): boolean {
    return /internal\.local|169\.254\.169\.254|localhost|127\.0\.0\.1|file:\/\//i.test(value);
  }
}
