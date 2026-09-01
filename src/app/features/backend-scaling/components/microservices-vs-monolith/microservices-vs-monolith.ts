import { Component, computed, signal } from '@angular/core';

interface TradeoffCard {
  title: string;
  body: string;
}

const TRADEOFFS: TradeoffCard[] = [
  {
    title: 'Network calls replace function calls',
    body: 'What was an in-process function call inside the monolith is now a network call between services — with real latency and a real chance of failure.',
  },
  {
    title: 'Distributed tracing becomes necessary',
    body: 'A single request can hop across several services. Following it end-to-end usually requires distributed tracing — debugging by reading one stack trace no longer works.',
  },
  {
    title: 'Deployment complexity multiplies',
    body: 'Instead of deploying and versioning one application, there are now many independent services to deploy, version, and keep compatible with each other.',
  },
  {
    title: 'Failure can propagate',
    body: "One slow or failing service can cascade into timeouts and errors for every caller that depends on it, unless those calls are isolated (timeouts, circuit breakers, retries).",
  },
  {
    title: 'Data consistency gets harder',
    body: 'A single database transaction can no longer span service boundaries. Keeping data consistent across services requires patterns like eventual consistency or sagas instead.',
  },
];

@Component({
  selector: 'app-microservices-vs-monolith',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="microservices-vs-monolith">
      <div class="container">
        <p class="lab-index">22 — MICROSERVICES VS MONOLITH</p>
        <h2 class="lab-title">Neither architecture is "correct" — they trade different problems for each other.</h2>
        <p class="lab-lede">
          Spike traffic to a single function and watch what each architecture has to do about it. That's the real,
          concrete tradeoff — not a vibe about which one is more "modern."
        </p>

        <div class="lab-panel">
          <div class="lab-field slider-field">
            <label for="orders-slider">Orders traffic (spiking) — Users &amp; Payments traffic stays flat</label>
            <input
              id="orders-slider"
              type="range"
              min="1"
              max="10"
              step="1"
              [value]="ordersLoad()"
              (input)="setOrdersLoad($event)"
            />
            <span class="mono field-readout">{{ ordersLoad() }}&times; baseline load on Orders</span>
          </div>

          <div class="arch-grid">
            <!-- MONOLITH -->
            <div class="arch-col">
              <p class="lab-node arch-heading">MONOLITH</p>
              <div class="arch-diagram">
                <div class="box client-box"><span class="lab-node">CLIENT</span></div>
                <span class="lab-flow-arrow">&rarr;</span>

                <div class="instances-wrap">
                  @for (i of monolithInstances(); track i) {
                    <div class="box app-box" [class.is-scaled]="i > 0">
                      <span class="lab-node">APPLICATION</span>
                      <div class="sub-regions">
                        <span class="sub-region">Orders</span>
                        <span class="sub-region">Users</span>
                        <span class="sub-region">Payments</span>
                      </div>
                    </div>
                  }
                </div>

                <span class="lab-flow-arrow">&rarr;</span>
                <div class="box db-box"><span class="lab-node">DATABASE</span></div>
              </div>

              <p class="mono scale-readout">
                instances running: <strong [class.is-crit]="monolithInstances().length > 1">{{ monolithInstances().length }}</strong>
              </p>
              <p class="arch-verdict" [class.is-crit]="monolithInstances().length > 1">
                {{ monolithInstances().length > 1
                  ? 'The whole application had to scale — Users and Payments logic gets duplicated too, even though they saw no extra traffic.'
                  : 'Traffic is within normal range — one instance handles everything.' }}
              </p>
            </div>

            <!-- MICROSERVICES -->
            <div class="arch-col">
              <p class="lab-node arch-heading">MICROSERVICES</p>
              <div class="arch-diagram">
                <div class="box client-box"><span class="lab-node">CLIENT</span></div>
                <span class="lab-flow-arrow">&rarr;</span>
                <div class="box gateway-box"><span class="lab-node">API GATEWAY</span></div>
                <span class="lab-flow-arrow">&rarr;</span>

                <div class="services-col">
                  <div class="service-row">
                    <span class="service-name mono">Orders</span>
                    <div class="instances-wrap">
                      @for (i of ordersInstances(); track i) {
                        <div class="box svc-box" [class.is-scaled]="i > 0"><span class="lab-node">svc</span></div>
                      }
                    </div>
                    <div class="box store-box" title="Orders database/queue"><span class="lab-node">DB</span></div>
                  </div>
                  <div class="service-row">
                    <span class="service-name mono">Users</span>
                    <div class="instances-wrap">
                      <div class="box svc-box"><span class="lab-node">svc</span></div>
                    </div>
                    <div class="box store-box" title="Users database"><span class="lab-node">DB</span></div>
                  </div>
                  <div class="service-row">
                    <span class="service-name mono">Payments</span>
                    <div class="instances-wrap">
                      <div class="box svc-box"><span class="lab-node">svc</span></div>
                    </div>
                    <div class="box store-box" title="Payments database"><span class="lab-node">DB</span></div>
                  </div>
                </div>
              </div>

              <p class="mono scale-readout">
                Orders instances: <strong [class.is-ok]="ordersInstances().length > 1">{{ ordersInstances().length }}</strong>
                &middot; Users: 1 &middot; Payments: 1
              </p>
              <p class="arch-verdict" [class.is-ok]="ordersInstances().length > 1">
                {{ ordersInstances().length > 1
                  ? 'Only the Orders service scaled out. Users and Payments stay at one instance each — no wasted capacity.'
                  : 'Traffic is within normal range — one instance per service.' }}
              </p>
            </div>
          </div>
        </div>

        <div class="lab-panel tradeoffs-panel">
          <p class="lab-node">WHAT MICROSERVICES COST</p>
          <p class="part-lede">
            Independent scaling is real. So is this list — it's the price paid for it.
          </p>
          <div class="tradeoff-grid">
            @for (card of tradeoffs; track card.title) {
              <div class="tradeoff-card">
                <p class="tradeoff-title">{{ card.title }}</p>
                <p class="tradeoff-body">{{ card.body }}</p>
              </div>
            }
          </div>
        </div>

        <p class="lab-note">
          <strong>Architecture should follow requirements, not fashion.</strong> Microservices are not inherently
          faster than a monolith — they trade one set of problems (scaling the whole app for one hot function,
          large coupled deploys) for another (network calls, distributed tracing, deployment complexity, failure
          propagation, cross-service data consistency).
        </p>
      </div>
    </section>
  `,
  styles: `
    :host {
      --ok: #4ade80;
      --warn: var(--accent);
      --crit: var(--danger);
      --c-client: var(--accent-2);
      --c-compute: #60a5fa;
      --c-db: #a78bfa;
      --c-cache: #2dd4bf;
      --c-queue: #fbbf24;
      display: block;
    }

    .slider-field { max-width: 480px; }
    .field-readout { color: var(--text-muted); font-size: 0.75rem; }

    .arch-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 28px; }
    @media (min-width: 860px) { .arch-grid { grid-template-columns: 1fr 1fr; } }

    .arch-heading { color: var(--c-compute); margin-bottom: 14px; }

    .arch-diagram {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      row-gap: 12px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      min-height: 160px;
    }

    .box {
      padding: 10px 12px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      display: flex;
      flex-direction: column;
      gap: 6px;
      align-items: center;
    }

    .client-box { color: var(--c-client); border-color: var(--c-client); }
    .client-box .lab-node { color: var(--c-client); }
    .gateway-box .lab-node { color: var(--c-compute); }
    .gateway-box { border-color: var(--c-compute); }
    .db-box .lab-node, .store-box .lab-node { color: var(--c-db); }
    .db-box, .store-box { border-color: var(--c-db); border-style: dashed; padding: 8px 10px; }

    .instances-wrap { display: flex; gap: 6px; flex-wrap: wrap; }

    .app-box { min-width: 150px; }
    .app-box.is-scaled { border-color: var(--crit); box-shadow: 0 0 0 1px var(--crit) inset; }
    .app-box.is-scaled .lab-node { color: var(--crit); }

    .sub-regions { display: flex; gap: 4px; flex-wrap: wrap; justify-content: center; }
    .sub-region {
      font-family: var(--font-mono);
      font-size: 0.625rem;
      color: var(--text-faint);
      border: 1px solid var(--border);
      border-radius: 999px;
      padding: 2px 7px;
    }

    .services-col { display: flex; flex-direction: column; gap: 10px; width: 100%; }
    .service-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .service-name { width: 62px; color: var(--text-muted); font-size: 0.75rem; }

    .svc-box { min-width: 40px; padding: 8px 10px; }
    .svc-box.is-scaled { border-color: var(--ok); box-shadow: 0 0 0 1px var(--ok) inset; }
    .svc-box.is-scaled .lab-node { color: var(--ok); }

    .scale-readout { margin-top: 14px; font-size: 0.8125rem; color: var(--text-muted); }
    .scale-readout strong { color: var(--text); }
    .scale-readout strong.is-crit { color: var(--crit); }
    .scale-readout strong.is-ok { color: var(--ok); }

    .arch-verdict { margin-top: 8px; font-size: 0.8125rem; color: var(--text-faint); line-height: 1.5; min-height: 40px; }
    .arch-verdict.is-crit { color: var(--crit); }
    .arch-verdict.is-ok { color: var(--ok); }

    .tradeoffs-panel { margin-top: 24px; }
    .part-lede { margin-top: 10px; color: var(--text-muted); font-size: 0.9375rem; }

    .tradeoff-grid { margin-top: 20px; display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 640px) { .tradeoff-grid { grid-template-columns: 1fr 1fr; } }

    .tradeoff-card {
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 2px solid var(--warn);
      border-radius: var(--radius-md);
    }
    .tradeoff-title { color: var(--text); font-weight: 600; font-size: 0.9375rem; }
    .tradeoff-body { margin-top: 6px; color: var(--text-muted); font-size: 0.8437rem; line-height: 1.55; }
  `,
})
export class MicroservicesVsMonolith {
  protected readonly tradeoffs = TRADEOFFS;

  protected readonly ordersLoad = signal(1);

  protected readonly monolithInstances = computed(() => {
    const n = this.ordersLoad() >= 6 ? 3 : this.ordersLoad() >= 3 ? 2 : 1;
    return Array.from({ length: n }, (_, i) => i);
  });

  protected readonly ordersInstances = computed(() => {
    const n = this.ordersLoad() >= 8 ? 4 : this.ordersLoad() >= 6 ? 3 : this.ordersLoad() >= 3 ? 2 : 1;
    return Array.from({ length: n }, (_, i) => i);
  });

  setOrdersLoad(ev: Event): void {
    this.ordersLoad.set(+(ev.target as HTMLInputElement).value);
  }
}
