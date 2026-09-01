import { Component, OnDestroy, OnInit, computed, signal } from '@angular/core';

const CAPACITY = 200; // req/sec the backend can actually sustain
const BUCKET_MAX = 20; // token bucket capacity (visual, not literal req/sec)
const REFILL_PER_TICK = 2; // tokens refilled per tick when enabled
const TICK_MS = 200;

@Component({
  selector: 'app-rate-limiting',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="rate-limiting">
      <div class="container">
        <p class="lab-index">24 — RATE LIMITING</p>
        <h2 class="lab-title">A backend has a capacity. Rate limiting decides what happens past it.</h2>
        <p class="lab-lede">
          Push traffic past what the backend can actually sustain and watch what happens with rate limiting off,
          then on. The backend's capacity doesn't change — only what happens to the requests it can't take.
        </p>

        <div class="lab-panel">
          <div class="lab-field slider-field">
            <label for="rate-slider">Incoming traffic (req/sec)</label>
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

          <div class="lab-btn-row" role="group" aria-label="Rate limiting toggle">
            <button type="button" class="lab-btn" [class.is-active]="!limitingOn()" (click)="limitingOn.set(false)">RATE LIMITING OFF</button>
            <button type="button" class="lab-btn" [class.is-active]="limitingOn()" (click)="limitingOn.set(true)">RATE LIMITING ON</button>
          </div>

          <!-- CAPACITY BAR -->
          <div class="capacity-bar-wrap">
            <div class="capacity-bar">
              <div class="capacity-threshold" [style.left.%]="thresholdPct"></div>
              <div class="capacity-fill" [class.is-crit]="isOverloaded()" [style.width.%]="capacityFillPct()"></div>
            </div>
            <span class="mono capacity-caption">
              {{ isOverloaded() ? 'INCOMING TRAFFIC EXCEEDS CAPACITY' : 'within capacity' }}
            </span>
          </div>

          @if (limitingOn()) {
            <!-- TOKEN BUCKET -->
            <div class="bucket-block">
              <p class="lab-node">TOKEN BUCKET</p>
              <p class="bucket-desc">
                The bucket holds up to {{ bucketMax }} tokens and refills at a steady rate. Each accepted request
                consumes one token; a request that arrives with no token available gets rejected.
              </p>
              <div class="bucket-visual">
                <div class="bucket">
                  <div class="bucket-tokens" [style.height.%]="bucketFillPct()"></div>
                </div>
                <span class="mono bucket-readout">{{ tokens() }} / {{ bucketMax }} tokens</span>
              </div>
            </div>

            <div class="split-row">
              <div class="split-col accepted-col">
                <p class="split-label mono">ACCEPTED</p>
                <p class="split-value mono">{{ acceptedRate() }} req/sec</p>
                <p class="split-sub">flows through normally, up to backend capacity</p>
              </div>
              <div class="split-col rejected-col">
                <p class="split-label mono">REJECTED</p>
                <p class="split-value mono">{{ rejectedRate() }} req/sec</p>
                <p class="split-sub">
                  @if (rejectedRate() > 0) {
                    bounced with <span class="pill pill-conditional">429 Too Many Requests</span>
                  } @else {
                    none — traffic is within the limit
                  }
                </p>
              </div>
            </div>

            <p class="mono status-line status-ok">backend status: HEALTHY — error rate ~0%</p>
          } @else {
            <div class="split-row">
              <div class="split-col accepted-col">
                <p class="split-label mono">ACCEPTED</p>
                <p class="split-value mono">{{ incomingRate() }} req/sec</p>
                <p class="split-sub">everything is let through, no matter what the backend can handle</p>
              </div>
              <div class="split-col" [class.rejected-col]="isOverloaded()">
                <p class="split-label mono">ERRORS (500s)</p>
                <p class="split-value mono" [class.is-crit]="isOverloaded()">{{ errorRate() }} req/sec</p>
                <p class="split-sub">requests the overloaded backend fails to service</p>
              </div>
            </div>

            <p class="mono status-line" [class.status-crit]="isOverloaded()" [class.status-ok]="!isOverloaded()">
              backend status: {{ isOverloaded() ? 'OVERLOADED — rising 500 error rate' : 'HEALTHY' }}
            </p>
          }

          <p class="lab-note-warn lab-note">
            Rate limiting protects system capacity, but poorly chosen limits can reject legitimate traffic — it's
            a tradeoff, not a free win. Set the limit too low and real users get 429s during ordinary spikes; set
            it too high and it stops protecting the backend at all.
          </p>
        </div>
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

    .slider-field { max-width: 520px; }
    .field-readout { color: var(--text-muted); font-size: 0.75rem; }

    .capacity-bar-wrap { margin-top: 26px; display: flex; flex-direction: column; gap: 8px; }
    .capacity-bar { position: relative; height: 16px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border-strong); overflow: hidden; }
    .capacity-fill { height: 100%; background: linear-gradient(90deg, var(--c-compute), var(--ok)); transition: width 0.2s ease, background 0.2s ease; }
    .capacity-fill.is-crit { background: linear-gradient(90deg, var(--warn), var(--crit)); }
    .capacity-threshold { position: absolute; top: -2px; bottom: -2px; width: 2px; background: var(--text-faint); }
    .capacity-caption { font-size: 0.75rem; color: var(--text-faint); }

    .bucket-block { margin-top: 26px; padding: 16px; background: var(--surface); border: 1px dashed var(--c-queue); border-radius: var(--radius-md); }
    .bucket-desc { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; max-width: 560px; }

    .bucket-visual { margin-top: 16px; display: flex; align-items: center; gap: 16px; }
    .bucket {
      position: relative;
      width: 54px;
      height: 72px;
      border: 2px solid var(--border-strong);
      border-top: none;
      border-radius: 0 0 10px 10px;
      background: var(--surface-elevated);
      overflow: hidden;
      display: flex;
      align-items: flex-end;
    }
    .bucket-tokens { width: 100%; background: linear-gradient(180deg, var(--c-queue), color-mix(in srgb, var(--c-queue) 55%, transparent)); transition: height 0.2s ease; }
    .bucket-readout { color: var(--c-queue); font-size: 0.875rem; }

    .split-row { margin-top: 22px; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .split-col { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .accepted-col { border-color: var(--ok); }
    .rejected-col { border-color: var(--crit); }
    .split-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .split-value { font-size: 1.35rem; color: var(--text); margin-top: 6px; }
    .split-value.is-crit { color: var(--crit); }
    .split-sub { margin-top: 6px; font-size: 0.75rem; color: var(--text-muted); }

    .status-line { margin-top: 18px; font-size: 0.875rem; }
    .status-ok { color: var(--ok); }
    .status-crit { color: var(--crit); }
  `,
})
export class RateLimiting implements OnInit, OnDestroy {
  protected readonly capacity = CAPACITY;
  protected readonly bucketMax = BUCKET_MAX;
  protected readonly thresholdPct = (CAPACITY / 1000) * 100;

  protected readonly incomingRate = signal(150);
  protected readonly limitingOn = signal(true);
  protected readonly tokens = signal(BUCKET_MAX);

  private timerId: ReturnType<typeof setInterval> | null = null;

  protected readonly isOverloaded = computed(() => this.incomingRate() > CAPACITY);

  protected readonly capacityFillPct = computed(() => Math.min(100, (this.incomingRate() / 1000) * 100));

  protected readonly acceptedRate = computed(() => Math.min(this.incomingRate(), CAPACITY));
  protected readonly rejectedRate = computed(() => Math.max(0, this.incomingRate() - CAPACITY));
  protected readonly errorRate = computed(() => (this.isOverloaded() ? this.incomingRate() - CAPACITY : 0));

  protected readonly bucketFillPct = computed(() => (this.tokens() / BUCKET_MAX) * 100);

  ngOnInit(): void {
    this.timerId = setInterval(() => this.tick(), TICK_MS);
  }

  ngOnDestroy(): void {
    if (this.timerId) clearInterval(this.timerId);
  }

  private tick(): void {
    if (!this.limitingOn()) {
      this.tokens.set(BUCKET_MAX);
      return;
    }
    // demand this tick, scaled down from req/sec to a visual per-tick draw
    const demand = this.incomingRate() > CAPACITY ? REFILL_PER_TICK + 3 : REFILL_PER_TICK;
    this.tokens.update((v) => {
      const refilled = Math.min(BUCKET_MAX, v + REFILL_PER_TICK);
      return Math.max(0, refilled - Math.min(demand, refilled));
    });
  }

  setIncomingRate(ev: Event): void {
    this.incomingRate.set(+(ev.target as HTMLInputElement).value);
  }
}
