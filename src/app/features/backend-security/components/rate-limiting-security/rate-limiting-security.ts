import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';

type Strategy = 'fixed' | 'sliding' | 'token-bucket';

interface ProtectionExample {
  title: string;
  desc: string;
}

const PROTECTIONS: ProtectionExample[] = [
  { title: 'Availability', desc: 'Protects overall capacity from being exhausted by any single client or spike.' },
  { title: 'Authentication endpoints', desc: 'Slows down credential-guessing against /login and /reset-password.' },
  { title: 'Expensive operations', desc: 'Caps calls to costly work like report generation or full-text search.' },
  { title: 'Abuse-sensitive APIs', desc: 'Limits actions with real-world cost or reach, like sending email or SMS.' },
];

const CAPACITY = 200;
const LIMIT_PER_WINDOW = 40; // per fixed/sliding window of WINDOW_MS
const WINDOW_MS = 1000;
const BUCKET_MAX = 20;
const REFILL_PER_TICK = 2;
const TICK_MS = 200;

@Component({
  selector: 'app-rate-limiting-security',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="rate-limiting-security">
      <div class="container">
        <p class="lab-index">18 — RATE LIMITING AS A SECURITY CONTROL</p>
        <h2 class="lab-title">Rate limiting isn't just about traffic spikes. It's a defense.</h2>
        <p class="lab-lede">
          The same mechanism that protects a backend from a legitimate traffic surge also blunts credential
          stuffing, scraping, and plain denial-of-service attempts — by making high request rates from one source
          expensive to sustain.
        </p>

        <div class="lab-panel">
          <div class="attack-flow">
            <div class="node attacker-node">
              <span class="mono node-label">ATTACKER</span>
              <span class="node-sub">automated client, many requests/sec</span>
            </div>
            <span class="lab-flow-arrow flow-big">&rarr;</span>
            <div class="node api-node" [class.is-strained]="isOverloaded()">
              <span class="mono node-label">API</span>
              <span class="node-sub">{{ isOverloaded() ? 'STRUGGLING' : 'healthy' }}</span>
            </div>
          </div>

          <div class="lab-field slider-field">
            <label for="rate-slider">Request rate (req/sec)</label>
            <input
              id="rate-slider"
              type="range"
              min="0"
              max="1000"
              step="10"
              [value]="incomingRate()"
              (input)="setIncomingRate($event)"
            />
            <span class="mono field-readout">{{ incomingRate() }} req/sec &middot; backend capacity: {{ capacity }} req/sec</span>
          </div>

          <div class="lab-btn-row" role="group" aria-label="Rate limiter toggle">
            <button type="button" class="lab-btn" [class.is-active]="!limiterOn()" (click)="limiterOn.set(false)">RATE LIMITER OFF</button>
            <button type="button" class="lab-btn" [class.is-active]="limiterOn()" (click)="limiterOn.set(true)">RATE LIMITER ON</button>
          </div>

          @if (!limiterOn()) {
            <div class="outcome-block" [class.is-crit]="isOverloaded()">
              <p class="mono outcome-line">
                {{ isOverloaded() ? 'API is overwhelmed — rising latency and 500 errors' : 'API is keeping up' }}
              </p>
              @if (isOverloaded()) {
                <p class="lab-note-warn lab-note outcome-note">
                  At this rate, this traffic pattern is consistent with several possibilities: a brute-force login
                  attempt, an automated scraping run, or a plain availability attack. Without a rate limiter, the
                  API can't tell the difference between "popular" and "under attack" — it just falls over.
                </p>
              }
            </div>
          } @else {
            <div class="split-row">
              <div class="split-col accepted-col">
                <p class="split-label mono">ALLOWED</p>
                <p class="split-value mono">{{ allowedRate() }} req/sec</p>
                <p class="split-sub">served normally, up to the configured limit</p>
              </div>
              <div class="split-col rejected-col">
                <p class="split-label mono">REJECTED</p>
                <p class="split-value mono">{{ rejectedRate() }} req/sec</p>
                <p class="split-sub">
                  @if (rejectedRate() > 0) {
                    bounced with <span class="pill pill-conditional">429 Too Many Requests</span>
                  } @else {
                    none — within the limit
                  }
                </p>
              </div>
            </div>
            <p class="mono status-line status-ok">API status: HEALTHY — attacker's request rate is capped, not the API's</p>
          }

          <div class="protection-grid">
            @for (p of protections; track p.title) {
              <div class="protection-card">
                <p class="mono protection-title">{{ p.title }}</p>
                <p class="protection-desc">{{ p.desc }}</p>
              </div>
            }
          </div>
        </div>

        <!-- STRATEGIES -->
        <div class="lab-panel">
          <p class="lab-node">RATE LIMITING STRATEGIES</p>
          <div class="lab-btn-row" role="tablist" aria-label="Rate limiting strategy">
            <button type="button" class="lab-btn" role="tab" [attr.aria-selected]="strategy() === 'fixed'" [class.is-active]="strategy() === 'fixed'" (click)="strategy.set('fixed')">FIXED WINDOW</button>
            <button type="button" class="lab-btn" role="tab" [attr.aria-selected]="strategy() === 'sliding'" [class.is-active]="strategy() === 'sliding'" (click)="strategy.set('sliding')">SLIDING WINDOW</button>
            <button type="button" class="lab-btn" role="tab" [attr.aria-selected]="strategy() === 'token-bucket'" [class.is-active]="strategy() === 'token-bucket'" (click)="strategy.set('token-bucket')">TOKEN BUCKET</button>
          </div>

          @if (strategy() === 'fixed') {
            <div class="strategy-body">
              <p class="strategy-desc">
                A counter resets every {{ windowSec }}s. Requests within the current window count against a fixed
                limit of {{ limitPerWindow }}.
              </p>
              <div class="window-diagram">
                <div class="window-block">
                  <span class="mono window-count">{{ limitPerWindow }} / {{ limitPerWindow }}</span>
                  <span class="window-caption mono">window N</span>
                </div>
                <div class="window-boundary">
                  <span class="boundary-line"></span>
                  <span class="mono boundary-label">reset boundary</span>
                </div>
                <div class="window-block">
                  <span class="mono window-count">{{ limitPerWindow }} / {{ limitPerWindow }}</span>
                  <span class="window-caption mono">window N+1</span>
                </div>
              </div>
              <p class="lab-note-warn lab-note">
                Edge case: a client can send {{ limitPerWindow }} requests at the very end of window N and another
                {{ limitPerWindow }} right at the start of window N+1 — up to <strong>{{ limitPerWindow * 2 }} requests
                in a short burst</strong> around the reset boundary, despite the limit being {{ limitPerWindow }} per
                window. Simple to implement, but boundary bursts are the tradeoff.
              </p>
            </div>
          } @else if (strategy() === 'sliding') {
            <div class="strategy-body">
              <p class="strategy-desc">
                Instead of a hard reset, the count is taken over a rolling {{ windowSec }}s window that moves with
                the current request, so no single instant can see double the limit.
              </p>
              <div class="sliding-diagram">
                <div class="sliding-track">
                  <div class="sliding-window"></div>
                </div>
                <span class="mono sliding-caption">rolling {{ windowSec }}s window, recalculated on every request</span>
              </div>
              <p class="lab-note">
                This avoids the fixed-window boundary burst, but requires tracking individual request timestamps
                (or a close approximation), which costs more memory and computation per request than a single
                counter.
              </p>
            </div>
          } @else {
            <div class="strategy-body">
              <p class="strategy-desc">
                A bucket holds up to {{ bucketMax }} tokens and refills steadily. Each request consumes a token;
                an empty bucket means the request is rejected — but a full bucket allows a burst up to its capacity.
              </p>
              <div class="bucket-visual">
                <div class="bucket">
                  <div class="bucket-tokens" [style.height.%]="bucketFillPct()"></div>
                </div>
                <span class="mono bucket-readout">{{ tokens() }} / {{ bucketMax }} tokens</span>
              </div>
              <p class="lab-note">
                Good at absorbing short, legitimate bursts (a user rapid-clicking, a retry storm) while still
                capping sustained rate over time — at the cost of a bit more implementation complexity than a
                plain counter.
              </p>
            </div>
          }

          <p class="lab-note lab-note-warn">
            No single strategy is universally "best." Fixed window is cheap but bursty at boundaries. Sliding
            window is smoother but costs more to compute. Token bucket tolerates bursts by design, which is
            sometimes exactly what you want and sometimes exactly what you don't. Choose based on the burst
            tolerance and implementation cost your system can actually afford.
          </p>
        </div>
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

    .attack-flow { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
    .node { padding: 16px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface); display: flex; flex-direction: column; gap: 4px; min-width: 180px; }
    .attacker-node { border-color: var(--c-attacker); }
    .attacker-node .node-label { color: var(--c-attacker); }
    .api-node { border-color: var(--c-server); }
    .api-node .node-label { color: var(--c-server); }
    .api-node.is-strained { border-color: var(--attack); box-shadow: 0 0 16px rgba(255, 93, 93, 0.3); }
    .api-node.is-strained .node-label { color: var(--attack); }
    .node-label { font-size: 0.8125rem; font-weight: 700; letter-spacing: 0.06em; }
    .node-sub { font-size: 0.75rem; color: var(--text-muted); }
    .flow-big { font-size: 1.5rem; }

    .slider-field { max-width: 520px; margin-top: 24px; }
    .field-readout { color: var(--text-muted); font-size: 0.75rem; }

    .outcome-block { margin-top: 20px; padding: 14px 16px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); }
    .outcome-block.is-crit { border-color: var(--attack); background: color-mix(in srgb, var(--attack) 8%, var(--surface)); }
    .outcome-line { font-size: 0.875rem; color: var(--text); }
    .outcome-note { margin-top: 10px; }

    .split-row { margin-top: 20px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .split-col { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .accepted-col { border-color: var(--trust); }
    .rejected-col { border-color: var(--blocked); }
    .split-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .split-value { font-size: 1.35rem; color: var(--text); margin-top: 6px; }
    .split-sub { margin-top: 6px; font-size: 0.75rem; color: var(--text-muted); }
    .status-line { margin-top: 16px; font-size: 0.875rem; }
    .status-ok { color: var(--trust); }

    .protection-grid { margin-top: 26px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; }
    .protection-card { padding: 14px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
    .protection-title { color: var(--accent-2); font-size: 0.8125rem; font-weight: 700; }
    .protection-desc { margin-top: 6px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }

    .strategy-body { margin-top: 20px; }
    .strategy-desc { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; max-width: 640px; }

    .window-diagram { margin-top: 18px; display: flex; align-items: center; gap: 0; }
    .window-block { flex: 1; padding: 16px; text-align: center; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); display: flex; flex-direction: column; gap: 6px; }
    .window-count { color: var(--attack); font-weight: 700; }
    .window-caption { color: var(--text-faint); font-size: 0.6875rem; }
    .window-boundary { width: 60px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .boundary-line { width: 2px; height: 40px; background: var(--suspicious); box-shadow: 0 0 8px var(--suspicious); }
    .boundary-label { font-size: 0.625rem; color: var(--suspicious); text-align: center; }

    .sliding-diagram { margin-top: 18px; }
    .sliding-track { position: relative; height: 28px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: 999px; overflow: hidden; }
    .sliding-window { position: absolute; top: 0; bottom: 0; width: 35%; background: linear-gradient(90deg, transparent, var(--blocked), transparent); animation: slide-across 4s linear infinite; }
    @keyframes slide-across { 0% { left: -35%; } 100% { left: 100%; } }
    .sliding-caption { display: block; margin-top: 8px; font-size: 0.6875rem; color: var(--text-faint); }

    .bucket-visual { margin-top: 18px; display: flex; align-items: center; gap: 16px; }
    .bucket { position: relative; width: 54px; height: 72px; border: 2px solid var(--border-strong); border-top: none; border-radius: 0 0 10px 10px; background: var(--surface-elevated); overflow: hidden; display: flex; align-items: flex-end; }
    .bucket-tokens { width: 100%; background: linear-gradient(180deg, var(--accent), color-mix(in srgb, var(--accent) 55%, transparent)); transition: height 0.2s ease; }
    .bucket-readout { color: var(--accent); font-size: 0.875rem; }

    @media (prefers-reduced-motion: reduce) {
      .sliding-window { animation: none; left: 0; }
    }
  `,
})
export class RateLimitingSecurity implements OnInit, OnDestroy {
  protected readonly capacity = CAPACITY;
  protected readonly limitPerWindow = LIMIT_PER_WINDOW;
  protected readonly windowSec = WINDOW_MS / 1000;
  protected readonly bucketMax = BUCKET_MAX;
  protected readonly protections = PROTECTIONS;

  protected readonly incomingRate = signal(150);
  protected readonly limiterOn = signal(true);
  protected readonly strategy = signal<Strategy>('fixed');
  protected readonly tokens = signal(BUCKET_MAX);

  private timerId: ReturnType<typeof setInterval> | null = null;

  protected readonly isOverloaded = computed(() => this.incomingRate() > this.capacity);
  protected readonly allowedRate = computed(() => Math.min(this.incomingRate(), this.capacity));
  protected readonly rejectedRate = computed(() => Math.max(0, this.incomingRate() - this.capacity));
  protected readonly bucketFillPct = computed(() => (this.tokens() / BUCKET_MAX) * 100);

  ngOnInit(): void {
    this.timerId = setInterval(() => this.tick(), TICK_MS);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  private tick(): void {
    if (!this.limiterOn()) {
      this.tokens.set(BUCKET_MAX);
      return;
    }
    const demand = this.incomingRate() > this.capacity ? REFILL_PER_TICK + 3 : REFILL_PER_TICK;
    this.tokens.update((v) => {
      const refilled = Math.min(BUCKET_MAX, v + REFILL_PER_TICK);
      return Math.max(0, refilled - Math.min(demand, refilled));
    });
  }

  setIncomingRate(ev: Event): void {
    this.incomingRate.set(+(ev.target as HTMLInputElement).value);
  }
}
