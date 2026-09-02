import { Component, computed, signal } from '@angular/core';

interface Stage {
  id: string;
  label: string;
  short: string;
  purpose: string;
  threat: string;
  defense: string;
  failureMode: string;
  linksTo?: string;
}

const STAGES: Stage[] = [
  {
    id: 'client',
    label: 'CLIENT',
    short: 'Origin of the request',
    purpose: 'The request begins here — a browser, mobile app, or another service constructing an HTTP call.',
    threat: 'Nothing about a client can be trusted by default: headers, cookies, body, even the claimed identity can all be forged before the request ever leaves the sender.',
    defense: 'The server never trusts client-supplied data at face value — every downstream stage exists precisely because the client is an untrusted boundary.',
    failureMode: 'A backend that implicitly trusts anything the client claims (a role, a user id, a price) skips straight to the vulnerabilities every later stage is built to catch.',
  },
  {
    id: 'tls',
    label: 'TLS',
    short: 'Encrypt the wire',
    purpose: 'Encrypts traffic in transit so the connection between client and server cannot be read or altered by anyone sitting on the network path.',
    threat: 'Without transport encryption, credentials, tokens, and session cookies travel in plaintext — trivially interceptable on shared networks, proxies, or compromised routers.',
    defense: 'TLS termination with modern cipher suites, valid certificates, and HSTS to prevent silent downgrade to plain HTTP.',
    failureMode: 'Requests are silently downgraded to HTTP, or a self-signed / expired certificate trains users and clients to click through warnings — the encryption exists on paper but is not actually protecting anything.',
  },
  {
    id: 'network',
    label: 'NETWORK',
    short: 'Edge & routing',
    purpose: 'The request crosses the network boundary — DNS, edge routing, and perimeter devices (WAF, load balancer) before it reaches application infrastructure.',
    threat: 'Malformed packets, known exploit signatures, DDoS floods, and IP-based abuse can all overwhelm or probe a system before a single line of application code runs.',
    defense: 'Edge filtering, DDoS protection, and network segmentation keep application servers unreachable from the raw internet except through the intended path.',
    failureMode: 'Application servers are directly internet-addressable with no perimeter in front of them — every downstream check is now the only line of defense against network-layer abuse.',
  },
  {
    id: 'rate-limit',
    label: 'RATE LIMIT',
    short: 'Throttle volume',
    purpose: 'Caps how many requests a given client, IP, or account can make in a window, protecting the system from being overwhelmed by any single source.',
    threat: 'Without a ceiling, brute-force login attempts, credential stuffing, and scraping can run at unlimited speed — and a single misbehaving client can degrade service for everyone.',
    defense: 'Per-identity and per-IP limits, exponential backoff on repeated failures, and a distinct (usually tighter) limit on sensitive endpoints like login and password reset.',
    failureMode: 'An attacker can attempt millions of password guesses or API calls per minute with no throttling — the limiting math from the rate-limiting section never gets a chance to run.',
    linksTo: 'rate-limiting-security',
  },
  {
    id: 'auth-n',
    label: 'AUTHENTICATION',
    short: 'Who is this?',
    purpose: 'Establishes identity — verifies the caller is who they claim to be, via credentials, a session, or a signed token.',
    threat: 'If identity is never actually verified (or verified weakly — no session expiry, forgeable tokens, no MFA on sensitive accounts), everything downstream is answering security questions about a caller nobody has confirmed.',
    defense: 'Strong password handling, properly verified session or token validation, and multi-factor authentication for sensitive accounts and actions.',
    failureMode: 'A request reaches business logic carrying an identity claim that was never actually verified — the system acts as if it knows who is asking when it does not.',
    linksTo: 'authentication-basics',
  },
  {
    id: 'auth-z',
    label: 'AUTHORIZATION',
    short: 'What are they allowed to do?',
    purpose: 'Checks whether the now-known identity is permitted to perform the specific action being requested — a separate question from authentication.',
    threat: 'Conflating "logged in" with "allowed" lets any authenticated user reach admin actions, other users’ data, or operations meant to be restricted by role.',
    defense: 'Explicit permission checks on every sensitive action, enforced server-side, re-checked on every request rather than cached from login time.',
    failureMode: 'A request reaches business logic despite the caller lacking permission for this specific action — an authenticated but under-privileged user performs an action reserved for a higher role.',
    linksTo: 'authorization-basics',
  },
  {
    id: 'validation',
    label: 'VALIDATION',
    short: 'Is this input well-formed?',
    purpose: 'Confirms every piece of input — body, headers, query params, file uploads — actually matches what the application expects before it is used for anything.',
    threat: 'Unvalidated input is the root cause behind injection, path traversal, oversized payloads, and type-confusion bugs — validation is the security boundary between "arbitrary data" and "data the rest of the system can safely act on."',
    defense: 'Strict allow-list validation of type, length, format, and range at the trust boundary, rejecting anything that does not conform rather than trying to sanitize it into shape.',
    failureMode: 'A malformed, oversized, or unexpectedly-typed payload flows straight into business logic or a query — the exact gap injection and traversal attacks are built to exploit.',
    linksTo: 'validation-boundary',
  },
  {
    id: 'transformation',
    label: 'TRANSFORMATION',
    short: 'Normalize & shape',
    purpose: 'Converts validated input into the internal representation the application actually works with — parsing, decoding, normalizing encodings.',
    threat: 'Transformation logic itself can reintroduce risk: double-decoding, charset confusion, or deserializing untrusted data into live objects can smuggle malicious payloads past validation that already ran.',
    defense: 'Deterministic, single-pass decoding before validation (not after), and avoiding unsafe deserialization of untrusted structures into executable objects.',
    failureMode: 'Data validated in one encoding is decoded again afterward, unmasking a payload (e.g. a double URL-encoded path segment) that the validation stage never actually saw.',
  },
  {
    id: 'business-logic',
    label: 'BUSINESS LOGIC',
    short: 'Do the actual work',
    purpose: 'Executes the operation the request asked for — the core application behavior everything else exists to protect.',
    threat: 'Logic flaws live here even when every earlier stage worked correctly: race conditions on balances, missing state checks (e.g. applying a coupon twice), or trusting a client-supplied price.',
    defense: 'Server-side enforcement of business invariants — recomputed prices, atomic state transitions, and explicit checks for the assumptions the logic depends on.',
    failureMode: 'Every security checkpoint passes correctly, yet the operation itself does something the business never intended — the vulnerability is in the rules, not the plumbing.',
  },
  {
    id: 'database',
    label: 'DATABASE',
    short: 'Persist & retrieve',
    purpose: 'Stores and retrieves the data the business logic operates on, using a data access layer that keeps queries and data cleanly separated.',
    threat: 'Building queries by concatenating request-derived strings lets attacker-controlled input change the meaning of a query — the classic SQL injection path.',
    defense: 'Parameterized queries / prepared statements everywhere, plus a database credential scoped to only the tables and operations that specific service actually needs.',
    failureMode: 'A query string is built by concatenating user input, so a crafted value changes the query’s logic instead of just supplying a value — data is read, altered, or destroyed outside what the application intended.',
    linksTo: 'parameterized-queries',
  },
  {
    id: 'response',
    label: 'RESPONSE',
    short: 'Shape what goes back',
    purpose: 'Builds the outgoing response — status code, headers, and body — that is sent back to the client.',
    threat: 'Over-sharing internal details (stack traces, verbose error messages, unrelated fields on a serialized object) hands an attacker a map of the system for free, and unescaped output re-opens the door to XSS.',
    defense: 'Minimal, purpose-built response payloads, generic error messages to the client with detail reserved for internal logs, and consistent output encoding.',
    failureMode: 'A response leaks a stack trace, an internal file path, or extra fields from a database row that were never meant to leave the server — information that should stay internal becomes attacker reconnaissance.',
  },
  {
    id: 'logging',
    label: 'SECURITY LOGGING',
    short: 'Record what happened',
    purpose: 'Records security-relevant events — auth attempts, authorization denials, sensitive data access — durably and independently of the request path itself.',
    threat: 'Without a record of what happened, a breach or an abuse pattern is invisible until the damage is already done, and there is no way to reconstruct what an attacker actually did.',
    defense: 'Structured, tamper-resistant logs of security events (never including secrets or full credentials), shipped somewhere the request-handling process itself cannot rewrite.',
    failureMode: 'An attacker probes and eventually succeeds, but nothing captured the earlier failed attempts — the compromise is discovered days or months later, if at all, with no trail to investigate.',
    linksTo: 'security-logging-auditing',
  },
];

@Component({
  selector: 'app-secure-request-lifecycle',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="secure-request-lifecycle">
      <div class="container">
        <p class="lab-index">32 — THE SECURE REQUEST LIFECYCLE</p>
        <h2 class="lab-title">One request. Twelve independent checkpoints.</h2>
        <p class="lab-lede">
          Every request this chapter has examined actually passes through this many gates in sequence. Click any
          stage to see what it exists to catch, what happens when it's missing, and what a broken instance of it
          looks like in practice.
        </p>

        <div class="lab-panel">
          <div class="pipeline" role="list" aria-label="Secure request lifecycle stages">
            @for (s of stages; track s.id; let i = $index) {
              <button
                type="button"
                role="listitem"
                class="stage-btn"
                [class.is-active]="selectedId() === s.id"
                [attr.aria-pressed]="selectedId() === s.id"
                (click)="select(s.id)"
              >
                <span class="stage-num mono">{{ pad(i + 1) }}</span>
                <span class="stage-label">{{ s.label }}</span>
                <span class="stage-short">{{ s.short }}</span>
              </button>
              @if (i < stages.length - 1) {
                <span class="lab-flow-arrow stage-arrow" aria-hidden="true">→</span>
              }
            }
          </div>

          @if (selected(); as s) {
            <div class="detail" aria-live="polite">
              <div class="detail-head">
                <span class="pill pill-conditional">STAGE {{ pad(selectedIndex() + 1) }}</span>
                <h3 class="detail-title">{{ s.label }}</h3>
              </div>
              <dl class="detail-grid">
                <div class="detail-field">
                  <dt class="mono">PURPOSE</dt>
                  <dd>{{ s.purpose }}</dd>
                </div>
                <div class="detail-field">
                  <dt class="mono field-threat">THREAT</dt>
                  <dd>{{ s.threat }}</dd>
                </div>
                <div class="detail-field">
                  <dt class="mono field-defense">DEFENSE</dt>
                  <dd>{{ s.defense }}</dd>
                </div>
                <div class="detail-field">
                  <dt class="mono field-failure">FAILURE MODE</dt>
                  <dd>{{ s.failureMode }}</dd>
                </div>
              </dl>
            </div>
          }
        </div>

        <p class="lab-note lab-note-warn">
          <strong>This pipeline is the mental model for the whole chapter.</strong> A request passes through many
          independent checkpoints — transport, rate limiting, identity, permission, shape of the data, the query
          itself, what comes back, and whether any of it gets recorded. A weakness at any single one of them can
          undermine the whole system, no matter how well the others are built.
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

    .pipeline {
      display: flex;
      flex-wrap: wrap;
      align-items: stretch;
      gap: 6px;
    }

    .stage-arrow {
      display: none;
      align-self: center;
    }

    @media (min-width: 900px) {
      .stage-arrow { display: inline-flex; }
    }

    .stage-btn {
      flex: 1 1 130px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      align-items: flex-start;
      text-align: left;
      padding: 12px 12px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      transition: border-color 0.15s ease, background 0.15s ease, transform 0.15s ease;
    }

    .stage-btn:hover {
      border-color: var(--c-server);
      transform: translateY(-1px);
    }

    .stage-btn.is-active {
      border-color: var(--suspicious);
      background: color-mix(in srgb, var(--suspicious) 12%, var(--surface));
    }

    .stage-num {
      font-size: 0.625rem;
      color: var(--text-faint);
      letter-spacing: 0.08em;
    }

    .stage-label {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.04em;
      color: var(--text);
    }

    .stage-btn.is-active .stage-label { color: var(--suspicious); }

    .stage-short {
      font-size: 0.6875rem;
      color: var(--text-faint);
      line-height: 1.35;
    }

    .detail {
      margin-top: 28px;
      padding: 22px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
    }

    .detail-head {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .detail-title {
      font-size: 1.125rem;
      color: var(--text);
    }

    .detail-grid {
      margin-top: 18px;
      display: grid;
      gap: 16px;
    }

    @media (min-width: 720px) {
      .detail-grid { grid-template-columns: 1fr 1fr; }
    }

    .detail-field dt {
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      color: var(--text-faint);
      margin-bottom: 6px;
    }

    .field-threat { color: var(--attack); }
    .field-defense { color: var(--trust); }
    .field-failure { color: var(--suspicious); }

    .detail-field dd {
      margin: 0;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
    }
  `,
})
export class SecureRequestLifecycle {
  protected readonly stages = STAGES;
  protected readonly selectedId = signal<string>(STAGES[0].id);

  protected readonly selected = computed(() => this.stages.find((s) => s.id === this.selectedId()) ?? null);
  protected readonly selectedIndex = computed(() => this.stages.findIndex((s) => s.id === this.selectedId()));

  select(id: string): void {
    this.selectedId.set(id);
  }

  pad(n: number): string {
    return n < 10 ? `0${n}` : `${n}`;
  }
}
