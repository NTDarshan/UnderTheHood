import { Component, computed, signal } from '@angular/core';

type Strategy = 'ttl' | 'explicit' | 'write-through' | 'cache-aside';

interface StrategyInfo {
  id: Strategy;
  label: string;
  mechanism: string;
}

const STRATEGIES: StrategyInfo[] = [
  { id: 'ttl', label: 'TTL', mechanism: 'The cache entry carries an expiry time and is discarded automatically once it passes — staleness can persist until that timer fires.' },
  { id: 'explicit', label: 'Explicit invalidation', mechanism: 'The write path knows exactly which cache key changed and deletes or updates it the instant the write happens.' },
  { id: 'write-through', label: 'Write-through', mechanism: 'Every write goes to the database and the cache in the same operation — the cache is never allowed to fall behind.' },
  { id: 'cache-aside', label: 'Cache-aside', mechanism: 'The app writes to the database, then simply deletes the cache key — the next read repopulates the cache from the database.' },
];

const TTL_SECONDS = 5;

@Component({
  selector: 'app-cache-invalidation',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="cache-invalidation">
      <div class="container">
        <p class="lab-index">15 — CACHE INVALIDATION</p>
        <h2 class="lab-title">The cache doesn't know the truth changed — unless you tell it.</h2>
        <p class="lab-lede">
          Caching only works if the cached answer is still correct. When the underlying data changes and the
          cache doesn't find out, clients keep reading a value that's wrong. That's the "aha" moment below —
          watch the database update while the cache silently doesn't.
        </p>

        <div class="lab-panel">
          <div class="boxes-row">
            <div class="data-box">
              <p class="box-label mono" style="color: var(--c-db)">DATABASE</p>
              <p class="box-price mono">₹{{ dbPrice() }}</p>
            </div>
            <div class="data-box">
              <p class="box-label mono" style="color: var(--c-cache)">CACHE</p>
              <p class="box-price mono" [class.is-stale]="isStale()">₹{{ cachePrice() }}</p>
              @if (isStale()) {
                <span class="pill stale-pill">STALE</span>
              }
              @if (cacheEmpty()) {
                <span class="pill empty-pill">EMPTY</span>
              }
              @if (ttlCountdown() !== null) {
                <p class="ttl-countdown mono">expires in {{ ttlCountdown() }}s</p>
              }
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="updatePrice()">Update price to ₹120</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset scenario</button>
          </div>

          @if (cacheEmpty()) {
            <p class="lab-note empty-note">
              Cache-aside: the key was deleted after the write. The cache is empty — the next read will hit the
              database and repopulate it.
            </p>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn" (click)="simulateRead()">Simulate next read</button>
            </div>
          }

          <p class="strategy-heading mono">INVALIDATION STRATEGY</p>
          <div class="lab-btn-row">
            @for (s of strategies; track s.id) {
              <button
                type="button"
                class="lab-btn"
                [class.is-active]="strategy() === s.id"
                [attr.aria-pressed]="strategy() === s.id"
                (click)="selectStrategy(s.id)"
              >
                {{ s.label }}
              </button>
            }
          </div>
          <p class="strategy-mechanism">{{ activeStrategyInfo().mechanism }}</p>
        </div>

        <p class="lab-note lab-note-warn">
          None of these strategies is universally "correct" — they trade off write cost, read cost, and how long
          staleness can last. A perfect cache hit rate that keeps serving ₹100 after the price changed to ₹120
          isn't a win; it's a bug. Correctness has to come before hit rate.
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

    .boxes-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    @media (max-width: 560px) { .boxes-row { grid-template-columns: 1fr; } }

    .data-box {
      position: relative;
      padding: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      text-align: center;
    }

    .box-label { font-size: 0.75rem; letter-spacing: 0.08em; margin-bottom: 10px; }
    .box-price { font-size: 1.75rem; color: var(--text); transition: color 0.3s ease; }
    .box-price.is-stale { color: var(--crit); }

    .stale-pill, .empty-pill { margin-top: 10px; display: inline-flex; }
    .stale-pill { color: var(--crit); border-color: var(--crit); }
    .empty-pill { color: var(--warn); border-color: var(--warn); }

    .ttl-countdown { margin-top: 8px; font-size: 0.75rem; color: var(--warn); }

    .empty-note { border-left: 2px solid var(--warn); padding-left: 14px; }

    .strategy-heading { margin-top: 28px; font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); margin-bottom: 10px; }
    .strategy-mechanism { margin-top: 14px; max-width: 640px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }
  `,
})
export class CacheInvalidation {
  protected readonly strategies = STRATEGIES;

  protected readonly dbPrice = signal(100);
  protected readonly cachePrice = signal(100);
  protected readonly cacheEmpty = signal(false);
  protected readonly strategy = signal<Strategy>('ttl');
  protected readonly ttlCountdown = signal<number | null>(null);

  private ttlTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly isStale = computed(() => !this.cacheEmpty() && this.cachePrice() !== this.dbPrice());

  protected readonly activeStrategyInfo = computed(
    () => this.strategies.find((s) => s.id === this.strategy())!,
  );

  selectStrategy(id: Strategy): void {
    this.strategy.set(id);
    this.reset();
  }

  updatePrice(): void {
    const nextPrice = this.dbPrice() === 100 ? 120 : 100;
    this.dbPrice.set(nextPrice);

    switch (this.strategy()) {
      case 'ttl': {
        // Cache keeps its old value until the TTL timer fires.
        this.startTtlCountdown();
        break;
      }
      case 'explicit': {
        this.cachePrice.set(nextPrice);
        this.cacheEmpty.set(false);
        break;
      }
      case 'write-through': {
        this.cachePrice.set(nextPrice);
        this.cacheEmpty.set(false);
        break;
      }
      case 'cache-aside': {
        this.cacheEmpty.set(true);
        this.clearTtlTimer();
        this.ttlCountdown.set(null);
        break;
      }
    }
  }

  simulateRead(): void {
    if (!this.cacheEmpty()) return;
    this.cachePrice.set(this.dbPrice());
    this.cacheEmpty.set(false);
  }

  reset(): void {
    this.clearTtlTimer();
    this.dbPrice.set(100);
    this.cachePrice.set(100);
    this.cacheEmpty.set(false);
    this.ttlCountdown.set(null);
  }

  private startTtlCountdown(): void {
    this.clearTtlTimer();
    this.ttlCountdown.set(TTL_SECONDS);
    this.ttlTimer = setInterval(() => {
      const remaining = (this.ttlCountdown() ?? 1) - 1;
      if (remaining <= 0) {
        this.cachePrice.set(this.dbPrice());
        this.ttlCountdown.set(null);
        this.clearTtlTimer();
      } else {
        this.ttlCountdown.set(remaining);
      }
    }, 1000);
  }

  private clearTtlTimer(): void {
    if (this.ttlTimer !== null) {
      clearInterval(this.ttlTimer);
      this.ttlTimer = null;
    }
  }
}
