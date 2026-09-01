import { Component, signal } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';

interface LoopStep {
  n: number;
  label: string;
  detail: string;
}

interface TradeoffCard {
  name: string;
  benefits: string[];
  costs: string[];
}

const LOOP_STEPS: LoopStep[] = [
  { n: 1, label: 'Define the workload', detail: 'What traffic, data volume, and latency target are we actually optimizing for?' },
  { n: 2, label: 'Measure', detail: 'Collect real numbers — latency, throughput, resource usage — before touching anything.' },
  { n: 3, label: 'Find the bottleneck', detail: 'Identify the single component actually limiting the system right now.' },
  { n: 4, label: 'Optimize the hot path', detail: 'Improve the code or query that dominates the time budget.' },
  { n: 5, label: 'Remove unnecessary work', detail: 'The fastest work is work that never runs — cut redundant calls and payload.' },
  { n: 6, label: 'Cache when appropriate', detail: 'Avoid recomputation for data that is expensive and safe to reuse.' },
  { n: 7, label: 'Move slow work async', detail: 'Defer non-critical work so the request path stays fast.' },
  { n: 8, label: 'Scale the bottleneck', detail: 'Add resources or replicas specifically where the constraint lives.' },
  { n: 9, label: 'Add capacity headroom', detail: 'Leave margin above expected peak, not just enough to survive average load.' },
  { n: 10, label: 'Test again', detail: 'Re-measure under load — then the loop returns to step 2.' },
];

const TRADEOFFS: TradeoffCard[] = [
  {
    name: 'Caching',
    benefits: ['Faster reads — serves from memory instead of recomputation'],
    costs: ['Stale data risk', 'Invalidation complexity — knowing when to evict is the hard part'],
  },
  {
    name: 'Horizontal scaling',
    benefits: ['More capacity by adding machines', 'Better availability — no single instance is a single point of failure'],
    costs: ['Distributed system complexity — coordination, state, and networking between nodes'],
  },
  {
    name: 'Read replicas',
    benefits: ['Read scalability — spreads read load across multiple copies'],
    costs: ['Replication lag — replicas can serve slightly stale data'],
  },
  {
    name: 'Async processing',
    benefits: ['Faster request response — the caller doesn’t wait on the slow part'],
    costs: ['Eventual completion, not immediate', 'Operational complexity — queues, retries, and failure handling'],
  },
  {
    name: 'Microservices',
    benefits: ['Independent scaling — scale only the service that needs it'],
    costs: ['Distributed system complexity — network calls, versioning, and partial failure replace function calls'],
  },
  {
    name: 'CDN',
    benefits: ['Lower origin load', 'Lower latency for cacheable content — served from a nearby edge'],
    costs: ['Cache invalidation across edges', 'Not suitable for everything — dynamic, per-user content doesn’t cache well'],
  },
];

@Component({
  selector: 'app-mental-model-tradeoffs',
  standalone: true,
  imports: [RevealDirective],
  template: `
    <section class="lab-section" id="mental-model">
      <div class="container">
        <p class="lab-index">31 &mdash; THE PERFORMANCE ENGINEERING MENTAL MODEL</p>
        <h2 class="lab-title">Performance work is a loop, not a checklist you finish once.</h2>
        <p class="lab-lede">
          Every durable performance fix follows the same ten-step cycle. Skipping straight to
          "add a cache" or "scale horizontally" without measuring first is how teams optimize
          the wrong thing.
        </p>

        <div class="lab-panel loop-panel">
          <div class="loop-track">
            @for (step of loopSteps; track step.n) {
              <div class="loop-row" appReveal [appRevealDelay]="step.n * 60">
                <div class="loop-node lab-node">
                  <span class="loop-num mono">{{ step.n }}</span>
                  <span class="loop-label">{{ step.label }}</span>
                </div>
                <p class="loop-detail">{{ step.detail }}</p>
              </div>
              @if (step.n < loopSteps.length) {
                <div class="lab-flow-arrow loop-arrow" aria-hidden="true">&#8595;</div>
              }
            }
            <div class="loop-back" appReveal [appRevealDelay]="700">
              <div class="loop-back-arrow" aria-hidden="true">&#8630;</div>
              <p class="loop-back-text mono">LOOPS BACK TO STEP 2 &mdash; MEASURE</p>
            </div>
          </div>
          <p class="lab-note loop-caption">Performance engineering is an iterative process.</p>
        </div>

        <h3 class="tradeoff-heading">Six techniques, six trade-offs</h3>
        <p class="lab-lede">
          Every technique below buys something and costs something. Click a card to see both
          sides &mdash; there is no free lunch in performance engineering.
        </p>

        <div class="tradeoff-grid">
          @for (card of tradeoffs; track card.name) {
            <button
              type="button"
              class="tradeoff-card"
              [class.is-flipped]="flipped().has(card.name)"
              (click)="toggle(card.name)"
              [attr.aria-pressed]="flipped().has(card.name)"
            >
              <p class="tradeoff-name">{{ card.name }}</p>
              @if (!flipped().has(card.name)) {
                <p class="tradeoff-hint mono">CLICK FOR TRADE-OFFS &rarr;</p>
              } @else {
                <div class="tradeoff-body">
                  <div class="tradeoff-side benefit-side">
                    <p class="side-label mono">BENEFIT</p>
                    @for (b of card.benefits; track b) {
                      <p class="side-line benefit-line">+ {{ b }}</p>
                    }
                  </div>
                  <div class="tradeoff-side cost-side">
                    <p class="side-label mono">COST</p>
                    @for (c of card.costs; track c) {
                      <p class="side-line cost-line">&minus; {{ c }}</p>
                    }
                  </div>
                </div>
              }
            </button>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
    }

    .loop-panel { display: flex; flex-direction: column; }
    .loop-track { display: flex; flex-direction: column; align-items: center; }

    .loop-row {
      width: 100%;
      max-width: 520px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 18px;
    }

    .loop-node { display: flex; align-items: center; gap: 10px; color: var(--text); }
    .loop-num {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: var(--accent-dim);
      color: var(--accent-strong);
      font-size: 0.6875rem;
    }
    .loop-label { text-transform: none; letter-spacing: 0; font-size: 0.875rem; }
    .loop-detail { margin-top: 6px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }

    .loop-arrow { margin-block: 4px; font-size: 1rem; }

    .loop-back {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }
    .loop-back-arrow { font-size: 1.75rem; color: var(--accent-2); }
    .loop-back-text { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.08em; }

    .loop-caption { text-align: center; margin-top: 24px; }

    .tradeoff-heading { margin-top: 56px; font-size: 1.25rem; color: var(--text); }

    .tradeoff-grid {
      margin-top: 24px;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 14px;
    }

    .tradeoff-card {
      text-align: left;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 18px 20px;
      color: var(--text);
      transition: border-color 0.15s ease;
    }
    .tradeoff-card:hover { border-color: var(--accent-2-dim); }
    .tradeoff-card.is-flipped { border-color: var(--border-strong); }

    .tradeoff-name { font-size: 1.0625rem; font-weight: 700; }
    .tradeoff-hint { margin-top: 10px; font-size: 0.75rem; color: var(--text-faint); }

    .tradeoff-body { margin-top: 14px; display: flex; flex-direction: column; gap: 12px; }
    .side-label { font-size: 0.6875rem; letter-spacing: 0.08em; margin-bottom: 4px; }
    .benefit-side .side-label { color: var(--ok); }
    .cost-side .side-label { color: var(--warn); }

    .side-line { font-size: 0.8125rem; line-height: 1.5; padding: 4px 8px; border-radius: var(--radius-sm); margin-top: 2px; }
    .benefit-line { color: var(--text); background: color-mix(in srgb, var(--ok) 12%, transparent); }
    .cost-line { color: var(--text); background: color-mix(in srgb, var(--crit) 12%, transparent); }
  `,
})
export class MentalModelTradeoffs {
  protected readonly loopSteps = LOOP_STEPS;
  protected readonly tradeoffs = TRADEOFFS;
  protected readonly flipped = signal<Set<string>>(new Set());

  toggle(name: string): void {
    this.flipped.update((set) => {
      const next = new Set(set);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }
}
