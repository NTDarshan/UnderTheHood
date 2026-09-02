import { Component, computed, signal } from '@angular/core';

interface QuestionOption {
  id: string;
  label: string;
  note: string;
  tone: 'trust' | 'suspicious' | 'neutral';
}

interface Question {
  id: string;
  prompt: string;
  considerations: string;
  options: QuestionOption[];
}

interface Scenario {
  id: string;
  tabLabel: string;
  title: string;
  intro: string;
  questions: Question[];
  checklistIntro: string;
  fixedChecklist: string[];
  linkNote?: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'own-orders',
    tabLabel: 'USERS ACCESS THEIR OWN ORDERS',
    title: 'I need users to access their own orders.',
    intro: 'This looks like a single permission check. It is actually three separate ones, and skipping the third is one of the most common real-world vulnerabilities.',
    questions: [
      {
        id: 'authn',
        prompt: 'Do you need authentication?',
        considerations: 'Yes — you must know who is asking before anything else can be decided. Without a verified identity, "their own orders" has no meaning.',
        options: [
          { id: 'yes', label: 'Yes, verify identity first', note: 'Correct — every later check depends on knowing who this is.', tone: 'trust' },
          { id: 'no', label: 'Skip it, orders aren’t sensitive', note: 'Order history reveals purchase habits, addresses, and payment patterns — treat it as sensitive.', tone: 'suspicious' },
        ],
      },
      {
        id: 'authz',
        prompt: 'Do you need authorization?',
        considerations: 'Yes — being logged in only proves identity. You still need a rule that says "authenticated users may view orders" as a class of action.',
        options: [
          { id: 'yes', label: 'Yes, check they can view orders in general', note: 'Correct — this confirms the action type is permitted for this identity.', tone: 'trust' },
          { id: 'no', label: 'If they’re logged in, that’s enough', note: 'This is exactly the authentication/authorization conflation this chapter warned about.', tone: 'suspicious' },
        ],
      },
      {
        id: 'bola',
        prompt: 'Do you need object-level authorization?',
        considerations: 'Yes — and this is the step that is most often missing. "Can view orders" is not the same as "can view THIS order." Without checking that the specific order belongs to the requesting user, any authenticated user can view any order by changing an ID in the URL — this is the BOLA/IDOR pattern.',
        options: [
          { id: 'yes', label: 'Yes, check this order belongs to this user', note: 'Correct — this is the check that actually stops BOLA/IDOR. Every object-level request needs this, every time.', tone: 'trust' },
          { id: 'no', label: 'General authorization already covers it', note: 'This is precisely the gap BOLA/IDOR exploits: /orders/1042 belonging to someone else, returned anyway.', tone: 'suspicious' },
        ],
      },
      {
        id: 'sessionOrToken',
        prompt: 'Session or token?',
        considerations: 'Either can work here — this is a genuine trade-off, not a right-or-wrong question. A session is easy to revoke instantly but needs server-side state; a token (e.g. JWT) is stateless and scales easily but is hard to revoke before it expires. Pick based on which trade-off your system can tolerate.',
        options: [
          { id: 'session', label: 'Session — server-side, revocable', note: 'Good fit if you need instant logout/revocation and can afford shared session storage.', tone: 'neutral' },
          { id: 'token', label: 'Token — stateless, scales easily', note: 'Good fit for distributed services, at the cost of harder immediate revocation.', tone: 'neutral' },
        ],
      },
    ],
    checklistIntro: 'Recommended checklist for this scenario:',
    fixedChecklist: [
      'Verify identity (authentication) before evaluating anything else',
      'Confirm the identity is permitted to view orders as a class of action (authorization)',
      'Confirm THIS specific order belongs to THIS specific user on every single request (object-level authorization)',
      'Choose session or token deliberately, based on revocation needs vs. statelessness — not by default',
    ],
  },
  {
    id: 'service-to-service',
    tabLabel: 'SERVICE-TO-SERVICE COMMUNICATION',
    title: 'I need service-to-service communication.',
    intro: 'There is no single correct mechanism here — the right answer depends on how many services are involved, how sensitive the data is, and how much operational complexity you can support. Walk through the trade-offs rather than reaching for a default.',
    questions: [
      {
        id: 'apikey',
        prompt: 'Static API key?',
        considerations: 'Simple to implement and understand. The trade-off: it’s a long-lived static secret — if it leaks, it works until someone notices and rotates it, and rotation itself requires careful coordination across every caller.',
        options: [
          { id: 'consider', label: 'Simple, but plan for storage & rotation', note: 'Fine for low-stakes, low-scale internal calls if you treat rotation as a real operational process, not an afterthought.', tone: 'neutral' },
        ],
      },
      {
        id: 'oauth',
        prompt: 'OAuth client credentials?',
        considerations: 'Adds token expiration and standardized scopes on top of a client secret — a leaked token is only valid until it expires, and scopes limit blast radius. The trade-off: you now need a token-issuing authority and clients need to handle token refresh.',
        options: [
          { id: 'consider', label: 'Adds expiration + scopes, more moving parts', note: 'Good fit when multiple services and teams need standardized, time-bound access with fine-grained scopes.', tone: 'neutral' },
        ],
      },
      {
        id: 'mtls',
        prompt: 'mTLS (mutual TLS)?',
        considerations: 'Both sides present certificates, establishing mutual, cryptographic trust at the transport layer. Stronger guarantees than a shared secret, but meaningfully higher operational complexity — certificate issuance, rotation, and revocation infrastructure all need to exist and be maintained.',
        options: [
          { id: 'consider', label: 'Strongest trust, highest operational cost', note: 'Worth it in high-security or regulated environments where the operational investment is justified.', tone: 'neutral' },
        ],
      },
      {
        id: 'other',
        prompt: 'Something else entirely?',
        considerations: 'Signed request payloads (HMAC), a service mesh with its own identity layer, or short-lived cloud-provider-issued tokens (e.g. workload identity) are all legitimate answers depending on your infrastructure. The point is not memorizing one mechanism — it’s recognizing the trade-off axis: secret complexity vs. operational overhead vs. blast radius if something leaks.',
        options: [
          { id: 'consider', label: 'Evaluate against your actual infrastructure', note: 'The right choice is contextual — there is no universally "correct" mechanism.', tone: 'neutral' },
        ],
      },
    ],
    checklistIntro: 'The trade-off summary for this scenario:',
    fixedChecklist: [
      'Static API key — simplest, but demands disciplined storage and rotation',
      'OAuth client credentials — adds expiration and scopes, at the cost of an issuing authority',
      'mTLS — strongest mutual trust, highest certificate-management overhead',
      'Choose based on scale, sensitivity, and how much operational complexity your team can sustain — not by default',
    ],
  },
  {
    id: 'file-upload',
    tabLabel: 'USERS UPLOAD FILES',
    title: 'I need users to upload files.',
    intro: 'File upload is one of the widest attack surfaces in a typical backend, and it connects directly back to the path-traversal risks covered earlier in this chapter. Each of these checks closes a distinct gap.',
    questions: [
      {
        id: 'size',
        prompt: 'Size limit?',
        considerations: 'Without an enforced upper bound, a single upload (or many concurrent ones) can exhaust disk, memory, or bandwidth — a trivial denial-of-service vector.',
        options: [
          { id: 'yes', label: 'Yes, enforce a hard size cap', note: 'Correct — reject oversized uploads before they are fully read into memory or storage.', tone: 'trust' },
        ],
      },
      {
        id: 'type',
        prompt: 'Type validation by content, not extension?',
        considerations: 'A file named photo.jpg can contain anything — an executable, a script, a malformed image designed to exploit a parser. Trusting the extension or the client-supplied MIME type is trusting the attacker’s own labeling.',
        options: [
          { id: 'content', label: 'Inspect actual file content/signature', note: 'Correct — validate against the file’s real binary signature, not what the client claims it is.', tone: 'trust' },
          { id: 'extension', label: 'Trust the file extension', note: 'An attacker fully controls the filename and extension — this check verifies nothing.', tone: 'suspicious' },
        ],
      },
      {
        id: 'isolation',
        prompt: 'Storage isolation?',
        considerations: 'Uploaded files must land outside any path the web server would ever execute as code, and outside the application’s own source tree — otherwise an uploaded file can become a path-traversal or remote-code-execution vector.',
        options: [
          { id: 'yes', label: 'Store outside executable paths', note: 'Correct — object storage or a dedicated non-executable directory, never inside the app’s served/executable tree.', tone: 'trust' },
        ],
      },
      {
        id: 'scanning',
        prompt: 'Scanning, where appropriate?',
        considerations: 'For user-generated content that other users will later access (not just the uploader), malware/content scanning adds a layer that content-type validation alone can’t provide.',
        options: [
          { id: 'yes', label: 'Scan when files are shared with other users', note: 'A reasonable proportional control — heavier for broadly-shared content, lighter for private-only uploads.', tone: 'neutral' },
        ],
      },
      {
        id: 'filename',
        prompt: 'Filename handling?',
        considerations: 'Never trust the client’s filename. A name like ../../etc/passwd or one containing null bytes or path separators is exactly how path traversal reaches the filesystem through an upload feature — this is the direct link back to the file-upload / path-traversal lesson earlier in the chapter.',
        options: [
          { id: 'generate', label: 'Generate a server-side filename/ID', note: 'Correct — never write the client-supplied filename to disk verbatim; store it as metadata only, if needed.', tone: 'trust' },
          { id: 'sanitize', label: 'Sanitize the client filename and use it', note: 'Sanitization logic is easy to get wrong; a generated name removes the entire risk class rather than filtering it.', tone: 'suspicious' },
        ],
      },
    ],
    checklistIntro: 'Recommended checklist for this scenario:',
    fixedChecklist: [
      'Enforce a hard file size limit before/while reading the upload',
      'Validate file type from actual content/signature, never from extension or client-supplied MIME type',
      'Store uploads outside any executable path, isolated from the application’s own source tree',
      'Scan content when it will be shared with other users',
      'Never trust the client-supplied filename — generate your own identifier server-side',
    ],
    linkNote: 'This scenario is the practical checklist version of the file-upload/path-traversal lesson earlier in this chapter.',
  },
];

@Component({
  selector: 'app-security-decision-engine',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="security-decision-engine">
      <div class="container">
        <p class="lab-index">34 — THE SECURITY DECISION ENGINE</p>
        <h2 class="lab-title">Security is a series of decisions, not a checklist to memorize.</h2>
        <p class="lab-lede">
          Pick a real scenario. Walk through the questions in order — each one reveals the reasoning behind it, not
          just an answer — and watch the recommended controls build up at the end.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row scenario-tabs" role="tablist" aria-label="Scenario selection">
            @for (s of scenarios; track s.id) {
              <button
                type="button"
                role="tab"
                class="lab-btn"
                [class.is-active]="activeScenarioId() === s.id"
                [attr.aria-selected]="activeScenarioId() === s.id"
                (click)="selectScenario(s.id)"
              >{{ s.tabLabel }}</button>
            }
          </div>

          @if (activeScenario(); as sc) {
            <div class="scenario">
              <h3 class="scenario-title">{{ sc.title }}</h3>
              <p class="scenario-intro">{{ sc.intro }}</p>

              <div class="question-list">
                @for (q of sc.questions; track q.id; let qi = $index) {
                  <div class="question-block">
                    <button
                      type="button"
                      class="question-head"
                      [class.is-open]="isOpen(sc.id, q.id)"
                      [attr.aria-expanded]="isOpen(sc.id, q.id)"
                      (click)="toggleQuestion(sc.id, q.id)"
                    >
                      <span class="q-num mono">Q{{ qi + 1 }}</span>
                      <span class="q-prompt">{{ q.prompt }}</span>
                      <span class="q-chevron" aria-hidden="true">{{ isOpen(sc.id, q.id) ? '−' : '+' }}</span>
                    </button>
                    @if (isOpen(sc.id, q.id)) {
                      <div class="question-body">
                        <p class="considerations">{{ q.considerations }}</p>
                        <div class="option-row">
                          @for (o of q.options; track o.id) {
                            <button
                              type="button"
                              class="option-chip"
                              [class]="'tone-' + o.tone"
                              [class.is-picked]="pickedOption(sc.id, q.id) === o.id"
                              (click)="pickOption(sc.id, q.id, o.id)"
                            >{{ o.label }}</button>
                          }
                        </div>
                        @if (pickedOption(sc.id, q.id); as pick) {
                          <p class="option-note">{{ noteFor(q, pick) }}</p>
                        }
                      </div>
                    }
                  </div>
                }
              </div>

              <div class="checklist">
                <p class="checklist-title mono">{{ sc.checklistIntro }}</p>
                <ul class="checklist-items">
                  @for (item of sc.fixedChecklist; track item) {
                    <li>
                      <span class="pill pill-yes check-mark" aria-hidden="true">✓</span>
                      <span>{{ item }}</span>
                    </li>
                  }
                </ul>
                @if (sc.linkNote) {
                  <p class="link-note">{{ sc.linkNote }}</p>
                }
              </div>
            </div>
          }
        </div>

        <p class="lab-note">
          None of these scenarios have one universally "correct" mechanism for every axis — session vs. token, API
          key vs. OAuth vs. mTLS are genuine trade-offs. What is non-negotiable is the reasoning process: know who is
          asking, know what they're allowed to do in general, and — critically — know whether they're allowed to do
          it to <em>this specific object</em>.
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

    .scenario-tabs { flex-wrap: wrap; }

    .scenario { margin-top: 28px; }

    .scenario-title { font-size: 1.1875rem; color: var(--text); }

    .scenario-intro {
      margin-top: 10px;
      font-size: 0.9375rem;
      color: var(--text-muted);
      line-height: 1.6;
      max-width: 640px;
    }

    .question-list {
      margin-top: 24px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .question-block {
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      overflow: hidden;
    }

    .question-head {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      background: transparent;
      border: none;
      color: var(--text);
      text-align: left;
    }

    .question-head.is-open { background: var(--surface-raised); }

    .q-num {
      font-size: 0.6875rem;
      color: var(--accent-2);
      flex-shrink: 0;
    }

    .q-prompt {
      flex: 1;
      font-size: 0.9375rem;
      font-weight: 600;
    }

    .q-chevron {
      font-size: 1.125rem;
      color: var(--text-faint);
      flex-shrink: 0;
    }

    .question-body {
      padding: 4px 16px 18px;
      border-top: 1px solid var(--border);
    }

    .considerations {
      margin-top: 14px;
      font-size: 0.8438rem;
      color: var(--text-muted);
      line-height: 1.65;
    }

    .option-row {
      margin-top: 14px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .option-chip {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text-muted);
      transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease;
    }

    .option-chip:hover { border-color: var(--text-muted); }

    .option-chip.is-picked.tone-trust { border-color: var(--trust); color: var(--trust); background: color-mix(in srgb, var(--trust) 12%, var(--surface-raised)); }
    .option-chip.is-picked.tone-suspicious { border-color: var(--suspicious); color: var(--suspicious); background: color-mix(in srgb, var(--suspicious) 12%, var(--surface-raised)); }
    .option-chip.is-picked.tone-neutral { border-color: var(--c-server); color: var(--c-server); background: color-mix(in srgb, var(--c-server) 12%, var(--surface-raised)); }

    .option-note {
      margin-top: 12px;
      font-size: 0.8125rem;
      color: var(--text);
      line-height: 1.55;
      padding-left: 12px;
      border-left: 2px solid var(--border-strong);
    }

    .checklist {
      margin-top: 28px;
      padding: 20px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .checklist-title {
      font-size: 0.75rem;
      letter-spacing: 0.08em;
      color: var(--accent-2);
    }

    .checklist-items {
      margin-top: 14px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .checklist-items li {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.5;
    }

    .check-mark { flex-shrink: 0; margin-top: 1px; }

    .link-note {
      margin-top: 14px;
      font-size: 0.8125rem;
      color: var(--text-faint);
      font-style: italic;
    }
  `,
})
export class SecurityDecisionEngine {
  protected readonly scenarios = SCENARIOS;
  protected readonly activeScenarioId = signal<string>(SCENARIOS[0].id);
  protected readonly openQuestions = signal<Set<string>>(new Set());
  protected readonly picks = signal<Map<string, string>>(new Map());

  protected readonly activeScenario = computed(() =>
    this.scenarios.find((s) => s.id === this.activeScenarioId()) ?? null,
  );

  selectScenario(id: string): void {
    this.activeScenarioId.set(id);
  }

  private key(scenarioId: string, questionId: string): string {
    return `${scenarioId}::${questionId}`;
  }

  isOpen(scenarioId: string, questionId: string): boolean {
    return this.openQuestions().has(this.key(scenarioId, questionId));
  }

  toggleQuestion(scenarioId: string, questionId: string): void {
    const k = this.key(scenarioId, questionId);
    const next = new Set(this.openQuestions());
    if (next.has(k)) {
      next.delete(k);
    } else {
      next.add(k);
    }
    this.openQuestions.set(next);
  }

  pickedOption(scenarioId: string, questionId: string): string | undefined {
    return this.picks().get(this.key(scenarioId, questionId));
  }

  pickOption(scenarioId: string, questionId: string, optionId: string): void {
    const next = new Map(this.picks());
    next.set(this.key(scenarioId, questionId), optionId);
    this.picks.set(next);
  }

  noteFor(question: Question, optionId: string): string {
    return question.options.find((o) => o.id === optionId)?.note ?? '';
  }
}
