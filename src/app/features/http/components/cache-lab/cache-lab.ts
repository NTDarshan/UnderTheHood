import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TermTip } from '../../../../shared/components/term-tip/term-tip';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type ReqOutcome = 'miss' | 'hit' | 'stale-revalidated';
type AnimPhase = 'idle' | 'to-cache' | 'to-server' | 'from-server' | 'from-cache';

interface CacheRequest {
  n: number;
  outcome: ReqOutcome;
  detail: string;
}

@Component({
  selector: 'app-cache-lab',
  standalone: true,
  imports: [FormsModule, TermTip, ExplainSimply],
  template: `
    <section class="lab-section" id="caching">
      <div class="container">
        <p class="lab-index">HTTP / 11 — CACHING</p>
        <h2 class="lab-title">HTTP caching lab — send requests, watch hit, miss, and revalidation.</h2>
        <p class="lab-lede">
          <span class="mono">GET /api/products</span> — send it repeatedly, let time pass, and watch how the
          cache responds differently each time.
        </p>

        <app-explain-simply>
          It's like keeping a photocopy of a document on your desk instead of walking to the file room every
          time you need it. As long as it's still fresh, you reuse your copy. Once it might be out of date,
          you check with the file room — and if nothing actually changed, you keep using the same copy anyway.
        </app-explain-simply>

        <div class="lab-panel cache-controls">
          <div class="lab-field">
            <label for="max-age">Cache-Control: max-age</label>
            <select id="max-age" [ngModel]="maxAge()" (ngModelChange)="maxAge.set(+$event)">
              <option [ngValue]="10">10s (simulated)</option>
              <option [ngValue]="30">30s (simulated)</option>
            </select>
          </div>
          <div class="lab-field">
            <label>
              <app-term def="A version identifier the server attaches to a response. If the resource hasn't changed, the same ETag comes back — so the client can ask &quot;is this still current?&quot; instead of re-downloading the whole thing.">ETag</app-term>
            </label>
            <span class="etag-value mono">"abc123"</span>
          </div>
        </div>

        <div class="cache-diagram" role="img" aria-label="Diagram of a request travelling from the client to the cache, and on to the server when needed">
          <div class="node" [class.is-active]="animPhase() !== 'idle'">
            <span class="node-label mono">CLIENT</span>
          </div>
          <div class="wire">
            <div class="packet" [class.is-flying]="animPhase() === 'to-cache'" aria-hidden="true"><span class="mono">GET</span></div>
            <div class="packet packet-return" [class.is-flying]="animPhase() === 'from-cache'" aria-hidden="true">
              <span class="mono">{{ lastAnimOutcome() === 'hit' ? '(cache)' : lastAnimOutcome() === 'stale-revalidated' ? '304' : '200' }}</span>
            </div>
          </div>
          <div class="node" [class.is-active]="animPhase() === 'to-cache' || animPhase() === 'from-cache' || animPhase() === 'to-server' || animPhase() === 'from-server'">
            <span class="node-label mono">CACHE</span>
          </div>
          <div class="wire">
            <div class="packet" [class.is-flying]="animPhase() === 'to-server'" aria-hidden="true"><span class="mono">GET</span></div>
            <div class="packet packet-return" [class.is-flying]="animPhase() === 'from-server'" aria-hidden="true">
              <span class="mono">{{ lastAnimOutcome() === 'stale-revalidated' ? '304' : '200' }}</span>
            </div>
          </div>
          <div class="node" [class.is-active]="animPhase() === 'to-server' || animPhase() === 'from-server'">
            <span class="node-label mono">SERVER</span>
          </div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="request()" [disabled]="animPhase() !== 'idle'">
            {{ animPhase() === 'idle' ? 'Request' : 'Travelling…' }}
          </button>
          <button type="button" class="lab-btn" (click)="advance(10)">Wait 10s</button>
          <button type="button" class="lab-btn" (click)="advance(30)">Wait 30s</button>
          <button type="button" class="lab-btn lab-btn-danger" (click)="clear()">Clear Cache</button>
        </div>

        <p class="clock mono">Simulated clock: {{ clock() }}s @if (cachedAt() !== null) { · stored at {{ cachedAt() }}s, expires {{ (cachedAt() ?? 0) + maxAge() }}s }</p>

        <div class="lab-panel history-panel">
          <p class="history-heading mono">REQUEST HISTORY</p>
          @if (history().length === 0) {
            <p class="history-empty">No requests sent yet.</p>
          }
          <ol class="history-list">
            @for (h of history(); track h.n) {
              <li class="history-item" [class]="'outcome-' + h.outcome">
                <span class="history-n mono">#{{ h.n }}</span>
                <span class="history-outcome mono">{{ h.outcome === 'miss' ? 'MISS' : h.outcome === 'hit' ? 'HIT' : 'STALE → VALIDATED' }}</span>
                <span class="history-detail">{{ h.detail }}</span>
              </li>
            }
          </ol>
        </div>

        <h3 class="cc-heading">Cache-Control playground</h3>
        <div class="cc-tabs mono">
          @for (opt of directives; track opt) {
            <button type="button" class="lab-btn" [class.is-active]="directive() === opt" (click)="directive.set(opt)">{{ opt }}</button>
          }
        </div>
        <div class="lab-panel cc-explain">
          <p>{{ directiveExplain() }}</p>
          @if (directive() === 'no-cache') {
            <p class="lab-note lab-note-warn"><strong>no-cache</strong> does not mean "do not cache." It means the stored response must be revalidated with the server before reuse.</p>
          }
          @if (directive() === 'no-store') {
            <p class="lab-note lab-note-warn"><strong>no-store</strong> means the response must not be stored at all — the strongest of the two.</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .cache-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      align-items: flex-end;
    }

    .etag-value {
      color: var(--accent-2);
      font-size: 0.875rem;
    }

    .cache-diagram {
      display: flex;
      align-items: center;
      gap: 0;
      margin-top: 28px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px 16px;
    }

    .node {
      flex-shrink: 0;
      width: 84px;
      height: 60px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    @media (min-width: 640px) {
      .node {
        width: 120px;
        height: 72px;
      }
    }

    .node.is-active {
      border-color: var(--accent);
      box-shadow: 0 0 20px var(--glow-accent);
    }

    .node-label {
      font-size: 0.625rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      color: var(--text);
    }

    .wire {
      position: relative;
      flex: 1;
      height: 60px;
      min-width: 40px;
    }

    .packet {
      position: absolute;
      top: 4px;
      left: 4px;
      opacity: 0;
      font-size: 0.625rem;
      color: var(--accent);
      white-space: nowrap;
      background: var(--surface);
      border: 1px solid var(--accent-dim);
      border-radius: 999px;
      padding: 3px 8px;
    }

    .packet-return {
      top: auto;
      bottom: 4px;
      color: var(--accent-2);
      border-color: var(--accent-2-dim);
    }

    .packet.is-flying {
      animation: cache-packet-out 0.5s ease forwards;
    }

    .packet-return.is-flying {
      animation: cache-packet-in 0.5s ease forwards;
    }

    @keyframes cache-packet-out {
      0% { left: 4px; opacity: 0; }
      15% { opacity: 1; }
      85% { opacity: 1; }
      100% { left: calc(100% - 60px); opacity: 0; }
    }

    @keyframes cache-packet-in {
      0% { left: calc(100% - 60px); opacity: 0; }
      15% { opacity: 1; }
      85% { opacity: 1; }
      100% { left: 4px; opacity: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .packet.is-flying,
      .packet-return.is-flying {
        animation: none;
        opacity: 1;
      }
    }

    .clock {
      margin-top: 14px;
      font-size: 0.75rem;
      color: var(--text-faint);
    }

    .history-panel {
      margin-top: 20px;
    }

    .history-heading {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--accent-2);
      margin-bottom: 14px;
    }

    .history-empty {
      color: var(--text-faint);
      font-size: 0.875rem;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .history-item {
      display: grid;
      grid-template-columns: 40px 140px 1fr;
      gap: 12px;
      align-items: center;
      padding: 10px 12px;
      background: var(--surface);
      border-radius: var(--radius-sm);
      border-left: 2px solid var(--border-strong);
      font-size: 0.8125rem;
    }

    .outcome-miss {
      border-left-color: var(--danger);
    }
    .outcome-hit {
      border-left-color: var(--accent-2);
    }
    .outcome-stale-revalidated {
      border-left-color: var(--accent);
    }

    .history-n {
      color: var(--text-faint);
    }

    .history-outcome {
      font-weight: 600;
    }
    .outcome-miss .history-outcome { color: var(--danger); }
    .outcome-hit .history-outcome { color: var(--accent-2); }
    .outcome-stale-revalidated .history-outcome { color: var(--accent); }

    .history-detail {
      color: var(--text-muted);
    }

    .cc-heading {
      margin-top: 48px;
      font-size: 1.25rem;
      color: var(--text);
    }

    .cc-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 20px;
    }

    .cc-explain p {
      color: var(--text-muted);
      font-size: 0.9375rem;
      line-height: 1.6;
      max-width: 600px;
    }

    .cc-explain p + p {
      margin-top: 12px;
    }
  `,
})
export class CacheLab {
  protected readonly maxAge = signal(10);
  protected readonly clock = signal(0);
  protected readonly cachedAt = signal<number | null>(null);
  protected readonly history = signal<CacheRequest[]>([]);
  protected readonly lastOutcome = computed(() => this.history().at(-1)?.outcome ?? null);
  protected readonly animPhase = signal<AnimPhase>('idle');
  private readonly pendingOutcome = signal<ReqOutcome | null>(null);
  protected readonly lastAnimOutcome = computed(() => this.pendingOutcome() ?? this.lastOutcome());

  protected readonly directives = ['public', 'private', 'no-cache', 'no-store'] as const;
  protected readonly directive = signal<(typeof this.directives)[number]>('public');

  protected readonly directiveExplain = computed(() => {
    switch (this.directive()) {
      case 'public':
        return 'The response may be stored by any cache — browser cache or a shared/intermediary cache.';
      case 'private':
        return 'The response may be stored, but only in a cache specific to one user — such as the browser — not a shared cache.';
      case 'no-cache':
        return 'The response may be stored, but must be revalidated with the server (e.g. via ETag) before it is reused.';
      case 'no-store':
        return 'The response must not be stored anywhere at all — every request goes to the server.';
    }
  });

  async request(): Promise<void> {
    if (this.animPhase() !== 'idle') return;
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const n = this.history().length + 1;

    if (this.cachedAt() === null) {
      this.pendingOutcome.set('miss');
      this.animPhase.set('to-cache');
      await wait(500);
      this.animPhase.set('to-server');
      await wait(500);
      this.cachedAt.set(this.clock());
      this.animPhase.set('from-server');
      await wait(500);
      this.animPhase.set('from-cache');
      await wait(500);
      this.push(n, 'miss', 'Not in cache → server responds → stored in cache.');
      this.animPhase.set('idle');
      return;
    }

    const age = this.clock() - this.cachedAt()!;
    if (age <= this.maxAge()) {
      this.pendingOutcome.set('hit');
      this.animPhase.set('to-cache');
      await wait(500);
      this.animPhase.set('from-cache');
      await wait(500);
      this.push(n, 'hit', `Fresh (age ${age}s ≤ max-age ${this.maxAge()}s) → served from cache.`);
    } else {
      this.pendingOutcome.set('stale-revalidated');
      this.animPhase.set('to-cache');
      await wait(500);
      this.animPhase.set('to-server');
      await wait(500);
      this.animPhase.set('from-server');
      await wait(500);
      this.cachedAt.set(this.clock());
      this.animPhase.set('from-cache');
      await wait(500);
      this.push(n, 'stale-revalidated', `Stale (age ${age}s) → If-None-Match: "abc123" → server replies 304 Not Modified → cached body reused.`);
    }
    this.animPhase.set('idle');
  }

  advance(seconds: number): void {
    this.clock.update((c) => c + seconds);
  }

  clear(): void {
    this.cachedAt.set(null);
    this.history.set([]);
    this.clock.set(0);
    this.animPhase.set('idle');
    this.pendingOutcome.set(null);
  }

  private push(n: number, outcome: ReqOutcome, detail: string): void {
    this.history.update((h) => [...h, { n, outcome, detail }]);
  }
}
