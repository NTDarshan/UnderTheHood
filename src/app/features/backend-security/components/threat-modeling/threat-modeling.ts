import { Component, computed, signal } from '@angular/core';

type ComponentKey = 'browser' | 'api' | 'database' | 'payment' | 'storage' | 'admin';

interface SystemComponent {
  key: ComponentKey;
  label: string;
  x: number;
  y: number;
  colorVar: string;
  holds: string;
  accessedBy: string;
  attackerControls: string;
  ifCompromised: string;
}

const COMPONENTS: SystemComponent[] = [
  {
    key: 'browser',
    label: 'Browser',
    x: 30,
    y: 100,
    colorVar: 'var(--c-client)',
    holds: 'Session cookie, cart contents, whatever the page renders into the DOM.',
    accessedBy: 'The customer, and anyone who steals their session or runs script in their browser.',
    attackerControls: 'Every request the client sends — URL, headers, form fields, cookies.',
    ifCompromised: 'One customer\'s account and session are exposed; not the backend itself.',
  },
  {
    key: 'api',
    label: 'API',
    x: 190,
    y: 60,
    colorVar: 'var(--c-server)',
    holds: 'Business logic, request-handling code, and the credentials it uses to reach everything downstream.',
    accessedBy: 'Every client request, authenticated or not, plus internal calls from other services.',
    attackerControls: 'Any input the API accepts and trusts without fully validating it.',
    ifCompromised: 'Full blast radius — the API usually holds the keys to the database, storage, and payment service.',
  },
  {
    key: 'database',
    label: 'Database',
    x: 190,
    y: 180,
    colorVar: 'var(--c-db)',
    holds: 'Customer records, order history, password hashes, product catalog.',
    accessedBy: 'Only the API, in a well-designed system — never the browser directly.',
    attackerControls: 'Nothing directly — unless a query built from unsanitized input lets them control its structure.',
    ifCompromised: 'Mass data breach: every customer record the database holds is exposed at once.',
  },
  {
    key: 'payment',
    label: 'Payment Service',
    x: 350,
    y: 30,
    colorVar: 'var(--c-server)',
    holds: 'Payment tokens, transaction records — rarely raw card numbers if PCI scope is minimized correctly.',
    accessedBy: 'The API, via a scoped service credential, during checkout.',
    attackerControls: 'Whatever fields the checkout flow forwards to it, if the API doesn\'t constrain them.',
    ifCompromised: 'Financial fraud, PCI exposure, and regulatory and reputational fallout.',
  },
  {
    key: 'storage',
    label: 'Object Storage',
    x: 350,
    y: 130,
    colorVar: '#a3a3a3',
    holds: 'Uploaded files — product images, user avatars, invoices, exports.',
    accessedBy: 'The API for writes; sometimes the browser directly via signed URLs for reads.',
    attackerControls: 'The content and metadata of anything they can upload, plus any filename or path the API doesn\'t constrain.',
    ifCompromised: 'Malicious files served to other users, or private files exposed publicly.',
  },
  {
    key: 'admin',
    label: 'Admin Panel',
    x: 260,
    y: 220,
    colorVar: 'var(--suspicious)',
    holds: 'Elevated controls — refunds, user management, inventory, direct data edits.',
    accessedBy: 'Staff only, in theory — but it usually runs on the same API and shares its trust model.',
    attackerControls: 'Any authorization check the admin routes forgot to enforce.',
    ifCompromised: 'Attacker gets the same power a trusted employee has — often the worst-case outcome in the system.',
  },
];

interface Term {
  term: string;
  def: string;
}

const TERMS: Term[] = [
  { term: 'Assets', def: 'The things worth protecting — data, credentials, money, availability itself.' },
  { term: 'Actors', def: 'Everyone who can interact with the system — legitimate users, staff, and attackers.' },
  { term: 'Trust boundaries', def: 'Lines where data crosses from one level of trust to another — client to API, API to database.' },
  { term: 'Entry points', def: 'The concrete places an actor can put data or requests into the system.' },
  { term: 'Threats', def: 'Specific ways an actor could abuse an entry point to reach or damage an asset.' },
  { term: 'Mitigations', def: 'The controls put in place to make a threat harder, detectable, or impossible.' },
];

@Component({
  selector: 'app-threat-modeling',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section tm-scene" id="threat-modeling">
      <div class="container">
        <p class="lab-index">02 — THREAT MODELING</p>
        <h2 class="lab-title">Before you defend a system, you have to know what's actually in it.</h2>
        <p class="lab-lede">
          This is a small online store. Click each component to see what it holds, who can reach it, what an
          attacker could control there, and what a compromise of it would actually mean.
        </p>

        <div class="lab-panel">
          <svg class="store-diagram" viewBox="0 0 420 250" role="img" aria-label="Online store system diagram">
            <line x1="55" y1="100" x2="165" y2="70" class="flow-line" />
            <line x1="55" y1="100" x2="165" y2="180" class="flow-line" />
            <line x1="220" y1="60" x2="325" y2="35" class="flow-line" />
            <line x1="220" y1="65" x2="325" y2="125" class="flow-line" />
            <line x1="220" y1="75" x2="260" y2="215" class="flow-line" />

            @for (c of components; track c.key) {
              <g [attr.transform]="'translate(' + c.x + ',' + c.y + ')'" style="cursor:pointer" tabindex="0" role="button"
                 [attr.aria-pressed]="selected() === c.key"
                 [attr.aria-label]="c.label"
                 (click)="select(c.key)"
                 (keydown.enter)="select(c.key)"
                 (keydown.space)="select(c.key); $event.preventDefault()">
                <rect x="-42" y="-22" width="84" height="44" rx="8" class="comp-rect" [class.is-selected]="selected() === c.key" [style.--node-color]="c.colorVar" />
                <text text-anchor="middle" y="5" class="comp-text mono">{{ c.label.toUpperCase() }}</text>
              </g>
            }
          </svg>

          @if (activeComponent(); as c) {
            <div class="detail-panel" aria-live="polite">
              <p class="detail-title">{{ c.label }}</p>
              <dl class="detail-grid">
                <dt>What data does it hold?</dt>
                <dd>{{ c.holds }}</dd>
                <dt>Who can access it?</dt>
                <dd>{{ c.accessedBy }}</dd>
                <dt>What can an attacker control?</dt>
                <dd>{{ c.attackerControls }}</dd>
                <dt>What happens if it's compromised?</dt>
                <dd class="detail-compromised">{{ c.ifCompromised }}</dd>
              </dl>
            </div>
          } @else {
            <p class="lab-note">Select a component above to see its threat profile.</p>
          }

          <p class="part-label mono vocab-label">VOCABULARY</p>
          <div class="vocab-grid">
            @for (t of terms; track t.term) {
              <div class="vocab-card">
                <span class="vocab-term mono">{{ t.term }}</span>
                <span class="vocab-def">{{ t.def }}</span>
              </div>
            }
          </div>

          <p class="lab-note lab-note-warn closing-note">
            Security starts before writing code — threat modeling identifies risks at design time, when a fix is a
            line in a diagram instead of a rewrite in production.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .tm-scene {
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

    .store-diagram { width: 100%; max-width: 460px; height: auto; display: block; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .flow-line { stroke: var(--border-strong); stroke-width: 1.5; }
    .comp-rect { fill: var(--surface-elevated); stroke: var(--node-color, var(--border-strong)); stroke-width: 1.5; transition: box-shadow 0.15s ease, filter 0.15s ease; }
    .comp-rect.is-selected { filter: drop-shadow(0 0 6px color-mix(in srgb, var(--node-color, var(--accent)) 55%, transparent)); }
    .comp-text { fill: var(--text); font-size: 9.5px; font-weight: 600; letter-spacing: 0.02em; }

    g[role='button']:focus-visible .comp-rect { outline: 2px solid var(--accent); outline-offset: 2px; }

    .detail-panel { margin-top: 20px; padding: 18px 20px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); }
    .detail-title { font-weight: 700; color: var(--text); font-size: 1.0625rem; margin-bottom: 12px; }
    .detail-grid { display: grid; grid-template-columns: 1fr; gap: 4px 0; margin: 0; }
    .detail-grid dt { font-family: var(--font-mono); font-size: 0.6875rem; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-faint); margin-top: 12px; }
    .detail-grid dt:first-child { margin-top: 0; }
    .detail-grid dd { margin: 4px 0 0; font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }
    .detail-compromised { color: var(--attack); }

    .part-label { color: var(--text-faint); letter-spacing: 0.12em; font-size: 0.75rem; margin-bottom: 4px; }
    .vocab-label { margin-top: 32px; }

    .vocab-grid { margin-top: 14px; display: grid; grid-template-columns: 1fr; gap: 10px; }
    @media (min-width: 640px) { .vocab-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (min-width: 960px) { .vocab-grid { grid-template-columns: repeat(3, 1fr); } }
    .vocab-card { padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .vocab-term { display: block; color: var(--accent-2); font-size: 0.75rem; letter-spacing: 0.04em; margin-bottom: 6px; }
    .vocab-def { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }

    .closing-note { margin-top: 24px; }
  `,
})
export class ThreatModeling {
  protected readonly components = COMPONENTS;
  protected readonly terms = TERMS;

  protected readonly selected = signal<ComponentKey | null>(null);

  protected readonly activeComponent = computed(() => {
    const key = this.selected();
    return key ? this.components.find((c) => c.key === key) : undefined;
  });

  select(key: ComponentKey): void {
    this.selected.update((cur) => (cur === key ? null : key));
  }
}
