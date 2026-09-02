import { Component, computed, signal } from '@angular/core';

interface Principle {
  name: string;
  definition: string;
  example: string;
  failureMode: string;
  application: string;
}

const PRINCIPLES: Principle[] = [
  {
    name: 'Defense in depth',
    definition: 'No single control is trusted to stop every attack — layers of independent controls back each other up.',
    example: 'Input validation, parameterized queries, and least-privilege database credentials all guard the same query — an attacker has to beat all three, not one.',
    failureMode: 'One layer fails silently (e.g. validation is bypassed) and there is nothing behind it, so the whole system fails open.',
    application: 'Never rely on the frontend, or any single middleware check, as the only gate in front of a sensitive operation.',
  },
  {
    name: 'Least privilege',
    definition: 'Every identity — user, service, or process — gets only the access it needs to do its job, and nothing more.',
    example: 'A reporting service is granted read-only access to one schema, not admin rights across the whole database.',
    failureMode: 'A compromised low-value component (like a logging job) turns out to hold admin credentials, and the breach spreads far beyond its actual purpose.',
    application: 'Scope database roles, API keys, and IAM policies per service, and review them — permissions accumulate and are rarely revoked.',
  },
  {
    name: 'Fail securely',
    definition: 'When something breaks — an exception, a timeout, a misconfiguration — the system should default toward denied, not toward open.',
    example: 'An authorization check that throws an unexpected error should result in a 403, not in the request silently proceeding.',
    failureMode: 'A try/catch around an auth check swallows the exception and lets the request through "just to keep things working."',
    application: 'Wrap authorization and validation in code paths where every exit, including error paths, defaults to deny.',
  },
  {
    name: 'Secure defaults',
    definition: 'The out-of-the-box configuration should already be safe, so a developer has to opt into risk, not opt into safety.',
    example: 'A new S3-style bucket is private by default; a database ships with no default admin password rather than a well-known one.',
    failureMode: 'A framework ships with permissive CORS, verbose error messages, and default credentials — and most deployments never change them.',
    application: 'Choose frameworks and settings whose defaults are locked down, and treat every deviation from "closed" as a decision that needs a reason.',
  },
  {
    name: 'Zero trust',
    definition: 'A request is never trusted just because it originated "inside" the network — every request is verified, regardless of origin.',
    example: 'An internal microservice still has to present a valid token to call another internal service, rather than being trusted because it is on the same VPC.',
    failureMode: 'A perimeter firewall is treated as the only defense — once an attacker gets one foothold inside, everything internal is wide open.',
    application: 'Authenticate and authorize service-to-service calls the same way you would an external client, not just requests crossing the public edge.',
  },
  {
    name: 'Complete mediation',
    definition: 'Every access to every resource is checked, every time — not cached from a prior check, and not just enforced at the UI layer.',
    example: 'A "delete post" API checks ownership on every single delete call, even if the UI already hid the delete button for non-owners.',
    failureMode: 'A permission is checked once when a page loads, then a direct API call to the same endpoint skips the check entirely.',
    application: 'Put the authorization check in the request handler itself, never only in a UI conditional or a one-time session flag.',
  },
  {
    name: 'Separation of duties',
    definition: 'No single identity or role holds unchecked, end-to-end power over a sensitive process — meaningful actions require more than one party.',
    example: 'The engineer who deploys code cannot also be the sole approver of their own production database migration.',
    failureMode: 'One over-privileged admin account can both request and approve a wire transfer, with no second party required.',
    application: 'Require independent review or a second approver for actions like production deploys, refunds, or permission grants.',
  },
  {
    name: 'Minimize attack surface',
    definition: 'Fewer exposed entry points, fewer enabled features, fewer permissions, and fewer moving parts mean fewer places to attack.',
    example: 'A service that never needs outbound internet access has no outbound rule in its firewall policy at all.',
    failureMode: 'An unused admin endpoint, left enabled "just in case," becomes the exact path an attacker finds and uses.',
    application: 'Disable unused routes, ports, and feature flags in production, and question every new exposed endpoint before shipping it.',
  },
  {
    name: "Don't trust client input",
    definition: 'Anything the client sends — form fields, headers, hidden fields, cookies — can be altered by the caller before it ever reaches you.',
    example: 'A price sent from the client is never accepted directly; the server re-derives the price from its own catalog data.',
    failureMode: 'A "role" field in a request body is trusted as-is, letting a client simply set `"role": "admin"` on themselves.',
    application: 'Re-validate and re-derive anything security-relevant server-side — this is the same boundary enforced in validation-boundary.',
  },
  {
    name: 'Keep secrets secret',
    definition: 'API keys, credentials, and signing keys are never hardcoded, logged, or committed — they are stored and rotated deliberately.',
    example: 'A database password lives in a secrets manager injected at runtime, not in a `.env` file committed to source control.',
    failureMode: 'A leaked API key sits in a public GitHub repo for months before anyone notices the unusual billing activity.',
    application: 'Use the patterns covered in secrets-management: dedicated secret stores, short-lived credentials, and routine rotation.',
  },
  {
    name: 'Make security observable',
    definition: 'Security-relevant events — logins, failed auth, permission changes, unusual access — are logged in a way that lets you detect and investigate incidents.',
    example: 'A spike in failed login attempts from one IP triggers an alert long before any account is actually compromised.',
    failureMode: 'A breach goes unnoticed for months because no one was logging, or logging existed but no one was watching it.',
    application: 'Emit structured security events and set up alerting on them, as covered in security-logging-auditing — visibility is itself a control.',
  },
];

interface TradeoffScenario {
  name: string;
  leftLabel: string;
  rightLabel: string;
  leftDesc: string;
  rightDesc: string;
  consequenceAt: (v: number) => string;
}

const TRADEOFFS: TradeoffScenario[] = [
  {
    name: 'Session lifetime',
    leftLabel: 'Short-lived (secure)',
    rightLabel: 'Long-lived (convenient)',
    leftDesc: 'Tokens expire quickly, shrinking the window a stolen session is useful.',
    rightDesc: 'Users stay logged in for days or weeks without re-authenticating.',
    consequenceAt: (v) =>
      v < 35
        ? 'A stolen token is nearly useless within minutes — but users re-authenticate often.'
        : v > 65
        ? 'Users rarely see a login screen — but a stolen token stays valid for a long, dangerous window.'
        : 'A balanced expiry — re-auth is infrequent, and a leaked token has a bounded, moderate lifetime.',
  },
  {
    name: 'Rate limiting strictness',
    leftLabel: 'Aggressive (blocks abuse)',
    rightLabel: 'Lenient (avoids false positives)',
    leftDesc: 'Low thresholds stop scraping and brute force fast.',
    rightDesc: 'High thresholds let legitimate traffic spikes through untouched.',
    consequenceAt: (v) =>
      v < 35
        ? 'Abuse is throttled quickly — but a genuine traffic spike (a sale, a viral post) risks being throttled too.'
        : v > 65
        ? 'Real users never hit the ceiling — but a scripted abuser has a lot of room to operate before being noticed.'
        : 'A moderate threshold — most abuse is slowed, most real spikes pass, tuned against observed traffic.',
  },
  {
    name: 'Input validation strictness',
    leftLabel: 'Strict (rejects more bad input)',
    rightLabel: 'Flexible (accepts more variety)',
    leftDesc: 'Tight schemas and allow-lists reject almost anything unexpected.',
    rightDesc: 'Loose validation accepts a wider range of legitimate-but-unusual input.',
    consequenceAt: (v) =>
      v < 35
        ? 'Malformed and malicious input is rejected reliably — but some valid, just-unusual input (an uncommon name, a new format) gets rejected too.'
        : v > 65
        ? 'Almost every legitimate input is accepted — but so is a wider range of malformed or malicious input.'
        : 'A workable middle ground — validation catches structurally wrong input while tolerating reasonable edge cases.',
  },
  {
    name: 'Authorization check depth',
    leftLabel: 'Thorough (safer)',
    rightLabel: 'Minimal (simpler)',
    leftDesc: 'Every action re-checks ownership, role, and resource state explicitly.',
    rightDesc: 'Checks are centralized and lighter, trusting broader assumptions.',
    consequenceAt: (v) =>
      v < 35
        ? 'Access is tightly controlled — but there are more code paths, more edge cases, and more surface for a bug in the checks themselves.'
        : v > 65
        ? 'The authorization logic stays simple and easy to reason about — but broader assumptions mean a missed edge case has a larger blast radius.'
        : 'A reasonable middle — critical actions get explicit checks, low-risk actions rely on shared, well-tested logic.',
  },
];

interface MindsetQuestion {
  q: string;
  a: string;
}

const MINDSET_QUESTIONS: MindsetQuestion[] = [
  { q: 'Who can call it?', a: 'Anyone with the URL, not just the users you designed the UI for — including unauthenticated callers if there is no check.' },
  { q: 'What can they control?', a: 'Every parameter, header, cookie, and body field is attacker-controlled input, no matter what the client-side code intends to send.' },
  { q: 'What happens if they lie (send false data)?', a: 'A client claiming a price, a role, or an ownership relation that is not actually true must not be believed without server-side verification.' },
  { q: 'What happens if they repeat the request?', a: 'A replayed request — the same payment, the same vote, the same transfer — should not be processed twice unless it is explicitly idempotent.' },
  { q: 'What happens if they change an ID?', a: 'Incrementing or guessing an ID in the URL should hit an authorization check, not just a "does this ID exist" lookup.' },
  { q: 'What happens if they send malformed data?', a: 'Missing fields, wrong types, oversized payloads, or unexpected nesting should be rejected cleanly, not crash the handler or fall through unchecked.' },
  { q: 'What happens if they call it 100,000 times?', a: 'Without rate limiting, a cheap endpoint becomes a scraping, brute-force, or denial-of-service vector at scale.' },
  { q: 'What happens if authentication is bypassed?', a: 'Ask what an anonymous caller could still do — every sensitive action needs its own authorization check, not just a login gate in front of the app.' },
  { q: 'What happens if the database leaks?', a: 'Hashed passwords, encrypted sensitive fields, and minimal stored data limit the damage of a breach that will eventually happen to someone.' },
];

@Component({
  selector: 'app-security-principles-mindset',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="security-principles">
      <div class="container">
        <p class="lab-index">36 — SECURITY PRINCIPLES &amp; MINDSET</p>
        <h2 class="lab-title">Security is a set of habits, not a checklist of features.</h2>
        <p class="lab-lede">
          These eleven principles show up in almost every vulnerability this chapter covers. Click one to see how it
          plays out in practice — and what breaks when it's ignored.
        </p>

        <!-- PART A: principle map -->
        <div class="principle-grid" role="group" aria-label="Security principles">
          @for (p of principles; track p.name) {
            <button
              type="button"
              class="lab-btn principle-chip"
              [class.is-active]="selected().name === p.name"
              [attr.aria-pressed]="selected().name === p.name"
              (click)="select(p)"
            >
              {{ p.name }}
            </button>
          }
        </div>

        <div class="lab-panel detail-panel">
          <p class="detail-name">{{ selected().name }}</p>

          <div class="detail-block">
            <p class="detail-label mono">DEFINITION</p>
            <p class="detail-text">{{ selected().definition }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono">EXAMPLE</p>
            <p class="detail-text">{{ selected().example }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono failure-label">FAILURE MODE</p>
            <p class="detail-text">{{ selected().failureMode }}</p>
          </div>

          <div class="detail-block">
            <p class="detail-label mono">PRACTICAL BACKEND APPLICATION</p>
            <p class="detail-text">{{ selected().application }}</p>
          </div>
        </div>

        <!-- PART B: trade-off scenarios -->
        <h3 class="section-subhead">Security vs. usability trade-offs</h3>
        <p class="lab-lede small-lede">
          Drag each slider. There is no "fully secure" end that has no cost — every position trades something away.
        </p>

        <div class="tradeoff-grid">
          @for (t of tradeoffs; track t.name; let i = $index) {
            <div class="lab-panel tradeoff-card">
              <p class="tradeoff-name mono">{{ t.name }}</p>
              <div class="tradeoff-poles mono">
                <span>{{ t.leftLabel }}</span>
                <span>{{ t.rightLabel }}</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                class="tradeoff-slider"
                [attr.aria-label]="t.name + ' trade-off slider'"
                [value]="sliderValues()[i]"
                (input)="onSlide(i, $event)"
              />
              <p class="tradeoff-consequence">{{ consequence(i) }}</p>
            </div>
          }
        </div>

        <p class="lab-note lab-note-warn">
          <strong>Security engineering is risk management, not simply "lock everything down."</strong>
          Every control has a cost, and the right amount of security depends on what's actually being protected.
        </p>

        <!-- PART C: the mindset exercise -->
        <h3 class="section-subhead">The security mindset exercise</h3>
        <div class="lab-panel mindset-panel">
          <p class="mindset-prompt mono">"Your API works perfectly."</p>
          <p class="mindset-followup">"...What can go wrong?"</p>

          <ul class="mindset-list">
            @for (item of mindsetQuestions; track item.q; let i = $index) {
              <li>
                <button
                  type="button"
                  class="mindset-q"
                  [attr.aria-expanded]="revealedSet().has(i)"
                  (click)="toggleMindset(i)"
                >
                  <span class="mindset-marker mono">{{ revealedSet().has(i) ? '−' : '+' }}</span>
                  {{ item.q }}
                </button>
                @if (revealedSet().has(i)) {
                  <p class="mindset-answer">{{ item.a }}</p>
                }
              </li>
            }
          </ul>

          <p class="mindset-closing">Think like an attacker. Design like a defender.</p>
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

    .principle-grid { margin-top: 24px; display: flex; flex-wrap: wrap; gap: 10px; }
    .principle-chip { font-size: 0.8125rem; }

    .detail-panel { margin-top: 24px; }
    .detail-name { font-size: 1.375rem; font-weight: 700; color: var(--accent-strong); }
    .detail-block { margin-top: 18px; }
    .detail-block:first-of-type { margin-top: 20px; }
    .detail-label { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 6px; }
    .failure-label { color: var(--attack); }
    .detail-text { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.55; }

    .section-subhead {
      margin-top: 48px;
      font-size: 1.125rem;
      color: var(--text);
    }
    .small-lede { margin-top: 8px; font-size: 0.9375rem; }

    .tradeoff-grid {
      margin-top: 20px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }
    .tradeoff-card { margin-top: 0; padding: 20px; }
    .tradeoff-name { font-size: 0.875rem; color: var(--text); font-weight: 600; }
    .tradeoff-poles {
      display: flex;
      justify-content: space-between;
      margin-top: 14px;
      font-size: 0.6875rem;
      color: var(--text-faint);
      letter-spacing: 0.02em;
    }
    .tradeoff-slider {
      width: 100%;
      margin-top: 8px;
      accent-color: var(--suspicious);
      cursor: pointer;
    }
    .tradeoff-consequence {
      margin-top: 14px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.5;
      min-height: 3.2em;
    }

    .mindset-panel { margin-top: 20px; }
    .mindset-prompt { font-size: 1.0625rem; color: var(--trust); }
    .mindset-followup { margin-top: 6px; font-size: 1.0625rem; color: var(--attack); font-weight: 600; }

    .mindset-list { margin-top: 20px; display: flex; flex-direction: column; gap: 4px; }
    .mindset-list li { border-top: 1px solid var(--border); }
    .mindset-list li:first-child { border-top: none; }

    .mindset-q {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      background: none;
      border: none;
      text-align: left;
      padding: 12px 4px;
      font-size: 0.9375rem;
      color: var(--text);
      font-family: var(--font-sans);
    }
    .mindset-q:hover { color: var(--accent-strong); }
    .mindset-marker { color: var(--accent-2); width: 1em; }

    .mindset-answer {
      padding: 0 4px 14px 30px;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.55;
    }

    .mindset-closing {
      margin-top: 20px;
      padding-top: 18px;
      border-top: 1px solid var(--border);
      font-size: 1rem;
      font-weight: 700;
      color: var(--accent-strong);
      text-align: center;
    }
  `,
})
export class SecurityPrinciplesMindset {
  protected readonly principles = PRINCIPLES;
  protected readonly tradeoffs = TRADEOFFS;
  protected readonly mindsetQuestions = MINDSET_QUESTIONS;

  protected readonly selected = signal<Principle>(PRINCIPLES[0]);
  protected readonly sliderValues = signal<number[]>(TRADEOFFS.map(() => 50));
  protected readonly revealedSet = signal<Set<number>>(new Set());

  select(p: Principle): void {
    this.selected.set(p);
  }

  onSlide(index: number, event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    this.sliderValues.update((values) => {
      const next = [...values];
      next[index] = value;
      return next;
    });
  }

  consequence(index: number): string {
    return this.tradeoffs[index].consequenceAt(this.sliderValues()[index]);
  }

  toggleMindset(index: number): void {
    this.revealedSet.update((set) => {
      const next = new Set(set);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }
}
