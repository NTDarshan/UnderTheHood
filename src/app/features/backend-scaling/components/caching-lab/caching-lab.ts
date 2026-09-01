import { Component, computed, signal } from '@angular/core';

type LastOutcome = 'none' | 'hit' | 'miss';
type Mode = 'single' | 'stream';

const MISS_LATENCY_MS = 180;
const HIT_LATENCY_MS = 5;
const STREAM_REQUEST_COUNT = 200;

@Component({
  selector: 'app-caching-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="caching-lab">
      <div class="container">
        <p class="lab-index">14 — CACHING</p>
        <h2 class="lab-title">Don't do expensive work again if the answer hasn't changed.</h2>
        <p class="lab-lede">
          A cache sits between your API and your database. The first time a piece of data is asked for, someone
          has to actually go compute or fetch it. Every time after that — until the answer changes or expires —
          the cache can just hand back what it already has.
        </p>

        <div class="lab-panel">
          <div class="mode-row">
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'single'" (click)="mode.set('single')">Single request</button>
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'stream'" (click)="mode.set('stream')">Hit-rate stream</button>
          </div>

          @if (mode() === 'single') {
            <div class="arch-strip">
              <div class="lab-node arch-node" style="--node-color: var(--c-client)">CLIENT</div>
              <span class="lab-flow-arrow arch-arrow" [class.is-lit]="anim() !== 'idle'">→</span>
              <div class="lab-node arch-node" style="--node-color: var(--c-compute)">API</div>
              <span class="lab-flow-arrow arch-arrow" [class.is-lit]="anim() !== 'idle'">→</span>
              <div class="lab-node arch-node" [class.is-active-node]="anim() !== 'idle'" style="--node-color: var(--c-cache)">CACHE</div>
              <span class="lab-flow-arrow arch-arrow" [class.is-lit]="anim() === 'miss'">→</span>
              <div class="lab-node arch-node" [class.is-active-node]="anim() === 'miss'" style="--node-color: var(--c-db)">DATABASE</div>
            </div>

            @if (anim() !== 'idle') {
              <p class="anim-caption mono" [class.is-hit]="anim() === 'hit'" [class.is-miss]="anim() === 'miss'">
                @if (anim() === 'hit') {
                  CACHE HIT — API asked the cache, cache already had the answer. Database never touched.
                } @else {
                  CACHE MISS — cache had nothing. API fell through to the database, then stored the result in
                  cache for next time.
                }
              </p>
            }

            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" (click)="fireRequest()">Fire request</button>
              <button type="button" class="lab-btn lab-btn-danger" (click)="expireCache()">Expire cache</button>
            </div>

            <div class="stats-row">
              <div class="stat-box">
                <p class="stat-label mono">LATENCY (LAST REQUEST)</p>
                <p class="stat-value mono" [class.is-hit]="lastOutcome() === 'hit'" [class.is-miss]="lastOutcome() === 'miss'">
                  {{ lastLatency() === null ? '—' : lastLatency() + 'ms' }}
                </p>
              </div>
              <div class="stat-box">
                <p class="stat-label mono">DB LOAD (HITS ON DB)</p>
                <p class="stat-value mono">{{ dbHits() }}</p>
              </div>
              <div class="stat-box">
                <p class="stat-label mono">CACHE HIT RATE</p>
                <p class="stat-value mono">{{ hitRatePct() }}%</p>
              </div>
            </div>

            <p class="lab-note">
              Fire the request once and it's a <strong>miss</strong> — nothing is cached yet, so the API falls
              through to the database and pays the full cost. Fire it again and it's a <strong>hit</strong>: the
              cache already holds the answer, so the database is skipped entirely. Press "expire cache" to clear
              the entry and watch the next request miss again.
            </p>
          }

          @if (mode() === 'stream') {
            <div class="lab-field stream-field">
              <label for="hitrate-slider">Simulated hit rate — {{ streamHitRate() }}%</label>
              <input
                id="hitrate-slider"
                type="range"
                min="0"
                max="99"
                [value]="streamHitRate()"
                (input)="onSliderInput($event)"
              />
            </div>

            <p class="lab-note">
              Imagine {{ requestCount }} requests arriving for this key, with a hit rate of {{ streamHitRate() }}%.
              As the slider moves toward 99%, the database is asked for the answer less and less often — most
              traffic never leaves the cache.
            </p>

            <div class="stats-row">
              <div class="stat-box">
                <p class="stat-label mono">AVG LATENCY</p>
                <p class="stat-value mono">{{ streamAvgLatency() }}ms</p>
              </div>
              <div class="stat-box">
                <p class="stat-label mono">DB LOAD ({{ requestCount }} REQS)</p>
                <p class="stat-value mono">{{ streamDbLoad() }}</p>
              </div>
              <div class="stat-box">
                <p class="stat-label mono">CACHE HIT RATE</p>
                <p class="stat-value mono">{{ streamHitRate() }}%</p>
              </div>
            </div>

            <div class="load-bar-track">
              <div class="load-bar-fill" [style.width.%]="streamDbLoadPct()"></div>
            </div>
            <p class="load-bar-caption mono">DB LOAD RELATIVE TO A 0% HIT RATE</p>
          }
        </div>

        <p class="lab-note lab-note-warn">
          A higher hit rate isn't automatically "better" in every sense — it only helps if the cached answer is
          still correct. A cache that never expires and just returns stale data would also have a perfect hit
          rate. Hit rate is a load metric, not a correctness metric — see the next lab on invalidation.
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

    .mode-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }

    .arch-strip {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      padding: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .arch-node {
      padding: 10px 16px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      color: var(--node-color);
      background: color-mix(in srgb, var(--node-color) 10%, var(--surface-elevated));
      transition: box-shadow 0.3s ease, border-color 0.3s ease;
    }

    .arch-node.is-active-node {
      border-color: var(--node-color);
      box-shadow: 0 0 16px color-mix(in srgb, var(--node-color) 45%, transparent);
    }

    .arch-arrow { font-size: 1.1rem; transition: color 0.3s ease, text-shadow 0.3s ease; }
    .arch-arrow.is-lit { color: var(--accent-strong); text-shadow: 0 0 8px var(--glow-accent); }

    .anim-caption { margin-top: 14px; font-size: 0.8125rem; line-height: 1.6; padding: 10px 14px; border-radius: var(--radius-sm); border-left: 2px solid var(--border-strong); }
    .anim-caption.is-hit { color: var(--c-cache); border-left-color: var(--c-cache); }
    .anim-caption.is-miss { color: var(--warn); border-left-color: var(--warn); }

    .stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 24px; }
    .stat-box { padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .stat-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; margin-bottom: 6px; }
    .stat-value { font-size: 1.25rem; color: var(--text); }
    .stat-value.is-hit { color: var(--c-cache); }
    .stat-value.is-miss { color: var(--warn); }

    .stream-field { max-width: 420px; }
    .stream-field input[type='range'] { accent-color: var(--c-cache); padding: 0; height: 28px; }

    .load-bar-track { margin-top: 16px; height: 14px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); overflow: hidden; }
    .load-bar-fill { height: 100%; background: linear-gradient(90deg, var(--c-db), var(--warn)); transition: width 0.25s ease; }
    .load-bar-caption { margin-top: 8px; font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; }

    @media (max-width: 640px) {
      .stats-row { grid-template-columns: 1fr; }
    }
  `,
})
export class CachingLab {
  protected readonly requestCount = STREAM_REQUEST_COUNT;

  protected readonly mode = signal<Mode>('single');

  // Single-request mode state
  protected readonly cached = signal(false);
  protected readonly anim = signal<'idle' | 'hit' | 'miss'>('idle');
  protected readonly lastOutcome = signal<LastOutcome>('none');
  protected readonly lastLatency = signal<number | null>(null);
  protected readonly dbHits = signal(0);
  protected readonly totalRequests = signal(0);
  protected readonly totalHits = signal(0);

  protected readonly hitRatePct = computed(() => {
    const total = this.totalRequests();
    if (total === 0) return 0;
    return Math.round((this.totalHits() / total) * 100);
  });

  // Stream mode state
  protected readonly streamHitRate = signal(70);

  protected readonly streamDbLoad = computed(() => {
    const missRate = 1 - this.streamHitRate() / 100;
    return Math.round(this.requestCount * missRate);
  });

  protected readonly streamAvgLatency = computed(() => {
    const hr = this.streamHitRate() / 100;
    const avg = hr * HIT_LATENCY_MS + (1 - hr) * MISS_LATENCY_MS;
    return Math.round(avg);
  });

  protected readonly streamDbLoadPct = computed(() => {
    return Math.round((this.streamDbLoad() / this.requestCount) * 100);
  });

  fireRequest(): void {
    this.totalRequests.update((n) => n + 1);

    if (this.cached()) {
      this.anim.set('hit');
      this.lastOutcome.set('hit');
      this.lastLatency.set(HIT_LATENCY_MS);
      this.totalHits.update((n) => n + 1);
    } else {
      this.anim.set('miss');
      this.lastOutcome.set('miss');
      this.lastLatency.set(MISS_LATENCY_MS);
      this.dbHits.update((n) => n + 1);
      this.cached.set(true);
    }
  }

  expireCache(): void {
    this.cached.set(false);
    this.anim.set('idle');
    this.lastOutcome.set('none');
    this.lastLatency.set(null);
  }

  onSliderInput(ev: Event): void {
    const value = Number((ev.target as HTMLInputElement).value);
    this.streamHitRate.set(value);
  }
}
