import { Component, signal } from '@angular/core';

interface ArchitectStep {
  label: string;
  summary: string;
  detail: string;
}

interface QualityAttribute {
  name: string;
  summary: string;
  detail: string;
}

const ARCHITECT_STEPS: ArchitectStep[] = [
  {
    label: 'Clarify the problem',
    summary: 'What are we actually building, and for whom?',
    detail: 'Before any diagram, pin down the real problem in plain language. Vague scope produces vague architecture — ask what "done" looks like before deciding how to get there.',
  },
  {
    label: 'Gather requirements',
    summary: 'Separate what it must do from how well it must do it.',
    detail: 'Functional requirements are the features. Non-functional requirements are the qualities those features need — scale, speed, uptime. Both shape the design, in different ways.',
  },
  {
    label: 'Estimate scale',
    summary: 'Users, requests per second, data volume, growth rate.',
    detail: 'Rough numbers beat no numbers. "A few thousand users" and "a few hundred million" are different systems entirely — estimate early so the design fits the actual problem, not an imagined one.',
  },
  {
    label: 'Identify constraints',
    summary: 'Team size, budget, timeline, existing systems.',
    detail: "The best architecture on paper can be the wrong one for a three-person team on a six-week deadline. Constraints aren't obstacles to the design — they're part of it.",
  },
  {
    label: 'Make trade-offs explicit',
    summary: 'Consistency vs availability, cost vs latency, build vs buy.',
    detail: "Every architecture gives something up. Naming the trade-off out loud — and why it's the right one here — is what separates a decision from a guess.",
  },
  {
    label: 'Design for failure',
    summary: 'Assume every component can and will fail.',
    detail: 'Networks partition, disks fail, dependencies time out. A good design decides in advance what happens when each piece breaks, instead of discovering it during an incident.',
  },
];

const QUALITY_ATTRIBUTES: QualityAttribute[] = [
  { name: 'Scalability', summary: 'Handles growth in users or traffic without a redesign.', detail: 'A scalable system absorbs 10x traffic by adding resources, not by rewriting the architecture.' },
  { name: 'Availability', summary: 'Stays up and reachable, measured in nines.', detail: '99.9% uptime allows about 8.7 hours of downtime a year; 99.99% allows about 52 minutes. Each extra nine costs real engineering effort.' },
  { name: 'Latency', summary: 'How fast a single request completes.', detail: 'Usually measured at percentiles (p50, p95, p99) rather than an average, since averages hide the slow requests users actually notice.' },
  { name: 'Throughput', summary: 'How many requests the system handles per second.', detail: 'Latency and throughput trade against each other — batching improves throughput but often adds latency per request.' },
  { name: 'Consistency', summary: 'Whether every reader sees the same data at the same time.', detail: 'Strong consistency is simpler to reason about; eventual consistency usually scales further. Distributed systems force a choice between them.' },
  { name: 'Durability', summary: 'Whether written data survives failures.', detail: 'A write can be fast but not durable — durability means it survives a crash, a disk failure, or a restart.' },
  { name: 'Security', summary: 'Protects data and access from misuse.', detail: 'Spans authentication, authorization, encryption, and everything in between — a constraint on every other requirement, not a feature on its own.' },
  { name: 'Maintainability', summary: 'How easily the system can be understood, changed, and operated.', detail: 'The system that is fastest to ship is rarely the one that is cheapest to run two years later.' },
  { name: 'Cost', summary: 'What it takes to build and run, in money and people.', detail: 'The most technically elegant design is the wrong one if it costs more than the problem is worth solving.' },
];

@Component({
  selector: 'app-intro-to-system-design',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section sd-scene" id="sd-why-it-matters">
      <div class="container">
        <p class="lab-index mono">01 — WHY IT MATTERS</p>
        <h2 class="lab-title">Code that works isn't the same as a system that survives.</h2>
        <p class="lab-lede">
          A feature that works for ten users in a demo and a system that keeps working for ten million users under
          real load are built differently — system design is the discipline that closes that gap on purpose,
          before production forces it on you.
        </p>

        <div class="sd-compare">
          <div class="sd-compare-panel">
            <p class="sd-compare-label mono">10 USERS</p>
            <div class="sd-compare-diagram">
              <span class="sd-node sd-node-client">Client</span>
              <span class="sd-compare-arrow">→</span>
              <span class="sd-node sd-node-server">Single server + database</span>
            </div>
            <div class="sd-compare-stats mono">
              <span>Latency: <strong class="sd-good">40ms</strong></span>
              <span>Errors: <strong class="sd-good">~0%</strong></span>
            </div>
          </div>

          <div class="sd-compare-panel">
            <p class="sd-compare-label mono">10 MILLION USERS</p>
            <div class="sd-compare-diagram">
              <span class="sd-node sd-node-client">Clients</span>
              <span class="sd-compare-arrow">→</span>
              <span class="sd-node sd-node-server sd-node-strained">Same server + database</span>
            </div>
            <div class="sd-compare-stats mono">
              <span>Latency: <strong class="sd-bad">3200ms</strong></span>
              <span>Errors: <strong class="sd-bad">18%</strong></span>
            </div>
          </div>
        </div>

        <ul class="sd-points">
          <li>Every design decision is a trade-off — speed vs. cost, consistency vs. availability, simplicity vs. flexibility.</li>
          <li>Problems invisible at small scale — a single point of failure, an N+1 query, a chatty service call — become the whole incident at large scale.</li>
          <li>System design is choosing those trade-offs deliberately, instead of discovering them during an outage.</li>
        </ul>
      </div>
    </section>

    <section class="lab-section sd-scene" id="sd-architect-mindset">
      <div class="container">
        <p class="lab-index mono">02 — THE ARCHITECT'S MINDSET</p>
        <h2 class="lab-title">Ask questions before you draw boxes.</h2>
        <p class="lab-lede">
          A solution architect doesn't start with technology. They build a shared, precise understanding of the
          problem first, then let the actual constraints choose the technology — not the other way around.
        </p>

        <ol class="sd-steps">
          @for (step of steps; track step.label; let i = $index) {
            <li>
              <button
                type="button"
                class="sd-step-button"
                [class.is-active]="selectedStep() === i"
                [attr.aria-expanded]="selectedStep() === i"
                (click)="toggleStep(i)"
              >
                <span class="sd-step-index mono">{{ (i + 1).toString().padStart(2, '0') }}</span>
                <span class="sd-step-copy">
                  <span class="sd-step-label">{{ step.label }}</span>
                  <span class="sd-step-summary">{{ step.summary }}</span>
                </span>
                <span class="sd-step-caret mono">{{ selectedStep() === i ? '−' : '+' }}</span>
              </button>
              @if (selectedStep() === i) {
                <p class="sd-step-detail">{{ step.detail }}</p>
              }
            </li>
          }
        </ol>

        <div class="sd-callout">
          <p class="sd-callout-text">
            There is no single "correct" architecture — only one that fits the actual constraints. A good architect
            can explain <strong>why</strong>, not just recite <strong>what</strong>.
          </p>
        </div>
      </div>
    </section>

    <section class="lab-section sd-scene" id="sd-functional-requirements">
      <div class="container">
        <p class="lab-index mono">03 — FUNCTIONAL REQUIREMENTS</p>
        <h2 class="lab-title">What the system must actually do.</h2>
        <p class="lab-lede">
          Functional requirements are the concrete behaviors a system exposes — the verbs. If you can write it as
          "the system shall…", it's functional. They usually come from product or business, and they answer
          <strong>what</strong>, not <strong>how</strong>.
        </p>

        <div class="sd-panel">
          <p class="sd-panel-heading mono">EXAMPLE — A FOOD DELIVERY APP</p>
          <ul class="sd-shall-list mono">
            <li><span class="sd-shall">The system shall</span> let a user browse restaurants near their location.</li>
            <li><span class="sd-shall">The system shall</span> let a user place an order and pay online.</li>
            <li><span class="sd-shall">The system shall</span> let a restaurant mark an order as ready for pickup.</li>
            <li><span class="sd-shall">The system shall</span> notify a user when their order is out for delivery.</li>
          </ul>
        </div>
      </div>
    </section>

    <section class="lab-section sd-scene" id="sd-non-functional-requirements">
      <div class="container">
        <p class="lab-index mono">04 — NON-FUNCTIONAL REQUIREMENTS</p>
        <h2 class="lab-title">How well the system needs to do it.</h2>
        <p class="lab-lede">
          Non-functional requirements are quality attributes and constraints. They don't add features — they shape
          how every feature has to be built.
        </p>

        <div class="sd-nfr-grid">
          @for (attr of attributes; track attr.name; let i = $index) {
            <button
              type="button"
              class="sd-nfr-card"
              [class.is-active]="selectedAttr() === i"
              [attr.aria-expanded]="selectedAttr() === i"
              (click)="toggleAttr(i)"
            >
              <span class="sd-nfr-name">{{ attr.name }}</span>
              <span class="sd-nfr-summary">{{ attr.summary }}</span>
              @if (selectedAttr() === i) {
                <span class="sd-nfr-detail">{{ attr.detail }}</span>
              }
            </button>
          }
        </div>

        <p class="sd-closing">Functional requirements make a system work. Non-functional requirements make it worth trusting.</p>
      </div>
    </section>
  `,
  styles: `
    .sd-scene {
      --sd-accent: var(--accent-2);
      --sd-good: #4ade80;
      --sd-bad: var(--danger);
    }

    /* ── Why it matters ─────────────────────────────────────────────── */

    .sd-compare {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 16px;
      margin-top: 32px;
    }

    .sd-compare-panel {
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      padding: 18px;
    }

    .sd-compare-label {
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      color: var(--text-faint);
      margin-bottom: 14px;
    }

    .sd-compare-diagram {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }

    .sd-node {
      padding: 8px 12px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      background: var(--bg);
      font-size: 0.8125rem;
    }

    .sd-node-strained {
      border-color: color-mix(in srgb, var(--sd-bad) 50%, var(--border-strong));
      color: var(--sd-bad);
    }

    .sd-compare-arrow {
      color: var(--text-faint);
    }

    .sd-compare-stats {
      display: flex;
      gap: 16px;
      margin-top: 14px;
      font-size: 0.75rem;
      color: var(--text-faint);
    }

    .sd-good { color: var(--sd-good); }
    .sd-bad { color: var(--sd-bad); }

    .sd-points {
      margin-top: 28px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      list-style: none;
    }

    .sd-points li {
      position: relative;
      padding-left: 18px;
      font-size: 0.9375rem;
      line-height: 1.55;
      color: var(--text-muted);
    }

    .sd-points li::before {
      content: '';
      position: absolute;
      left: 0;
      top: 8px;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--sd-accent);
    }

    /* ── Architect mindset ───────────────────────────────────────────── */

    .sd-steps {
      margin-top: 28px;
      display: flex;
      flex-direction: column;
      gap: 1px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .sd-step-button {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 14px 16px;
      background: var(--surface);
      border: none;
      text-align: left;
      transition: background 0.15s ease;
    }

    .sd-step-button:hover {
      background: var(--surface-elevated);
    }

    .sd-step-button.is-active {
      background: var(--surface-elevated);
    }

    .sd-step-index {
      flex-shrink: 0;
      font-size: 0.75rem;
      color: var(--sd-accent);
    }

    .sd-step-copy {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .sd-step-label {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text);
    }

    .sd-step-summary {
      font-size: 0.8125rem;
      color: var(--text-faint);
    }

    .sd-step-caret {
      flex-shrink: 0;
      color: var(--text-faint);
      font-size: 1rem;
    }

    .sd-step-detail {
      padding: 4px 16px 18px 46px;
      background: var(--bg);
      font-size: 0.875rem;
      line-height: 1.6;
      color: var(--text-muted);
    }

    .sd-callout {
      margin-top: 24px;
      padding: 16px 18px;
      border: 1px solid var(--border);
      border-left: 3px solid var(--sd-accent);
      border-radius: var(--radius-sm);
      background: var(--surface);
    }

    .sd-callout-text {
      font-size: 0.9375rem;
      line-height: 1.6;
      color: var(--text-muted);
    }

    .sd-callout-text strong {
      color: var(--text);
    }

    /* ── Functional requirements ─────────────────────────────────────── */

    .sd-panel {
      margin-top: 28px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      padding: 20px;
    }

    .sd-panel-heading {
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      color: var(--sd-accent);
      margin-bottom: 14px;
    }

    .sd-shall-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .sd-shall-list li {
      font-size: 0.8125rem;
      line-height: 1.6;
      color: var(--text-muted);
    }

    .sd-shall {
      color: var(--sd-accent);
      margin-right: 4px;
    }

    /* ── Non-functional requirements ─────────────────────────────────── */

    .sd-nfr-grid {
      margin-top: 28px;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 10px;
    }

    .sd-nfr-card {
      display: flex;
      flex-direction: column;
      gap: 6px;
      text-align: left;
      padding: 14px 16px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--surface);
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .sd-nfr-card:hover {
      border-color: var(--border-strong);
      background: var(--surface-elevated);
    }

    .sd-nfr-card.is-active {
      border-color: color-mix(in srgb, var(--sd-accent) 45%, var(--border-strong));
      background: var(--surface-elevated);
    }

    .sd-nfr-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text);
    }

    .sd-nfr-summary {
      font-size: 0.8125rem;
      line-height: 1.5;
      color: var(--text-faint);
    }

    .sd-nfr-detail {
      margin-top: 6px;
      padding-top: 10px;
      border-top: 1px solid var(--border);
      font-size: 0.8125rem;
      line-height: 1.55;
      color: var(--text-muted);
    }

    .sd-closing {
      margin-top: 28px;
      font-size: 1.0625rem;
      color: var(--text);
      text-align: center;
    }

    @media (prefers-reduced-motion: reduce) {
      .sd-step-button, .sd-nfr-card { transition: none; }
    }
  `,
})
export class IntroToSystemDesign {
  protected readonly steps = ARCHITECT_STEPS;
  protected readonly attributes = QUALITY_ATTRIBUTES;

  protected readonly selectedStep = signal<number | null>(0);
  protected readonly selectedAttr = signal<number | null>(null);

  protected toggleStep(index: number): void {
    this.selectedStep.update((current) => (current === index ? null : index));
  }

  protected toggleAttr(index: number): void {
    this.selectedAttr.update((current) => (current === index ? null : index));
  }
}
