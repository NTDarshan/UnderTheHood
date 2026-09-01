import { Component, computed, signal } from '@angular/core';

const API_SERVER_OPTIONS = [1, 2, 4, 8, 16] as const;

interface ShardDef {
  id: number;
  range: string;
  from: string;
  to: string;
}

const SHARDS: ShardDef[] = [
  { id: 1, range: 'A – H', from: 'A', to: 'H' },
  { id: 2, range: 'I – P', from: 'I', to: 'P' },
  { id: 3, range: 'Q – Z', from: 'Q', to: 'Z' },
];

interface ShardTradeoff {
  label: string;
  detail: string;
}

const SHARD_TRADEOFFS: ShardTradeoff[] = [
  { label: 'Complexity', detail: 'Every query path now needs to know which shard to hit.' },
  { label: 'Cross-shard queries', detail: 'A query spanning multiple shards is slower and harder to write.' },
  { label: 'Rebalancing', detail: 'Data has to be physically moved when shards grow uneven.' },
  { label: 'Hot shards', detail: 'Uneven key distribution can overload one shard while others sit idle.' },
  { label: 'Transactions', detail: 'Atomic transactions across shards are much harder to guarantee.' },
];

@Component({
  selector: 'app-database-scaling',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="database-scaling">
      <div class="container">
        <p class="lab-index">19 — SCALING THE DATABASE</p>
        <h2 class="lab-title">More app servers don't automatically mean more database.</h2>
        <p class="lab-lede">
          Every one of those healthy, horizontally-scaled API servers is often still funneling requests into the
          same single database. That's where the bottleneck usually reappears.
        </p>

        <div class="lab-panel">
          <p class="part-heading mono">PART A — THE TRAP</p>

          <div class="lab-btn-row">
            @for (n of apiOptions; track n) {
              <button type="button" class="lab-btn" [class.is-active]="apiServerCount() === n" (click)="apiServerCount.set(n)">
                {{ n }} API server{{ n > 1 ? 's' : '' }}
              </button>
            }
          </div>

          <div class="trap-stage">
            <div class="api-fleet">
              @for (i of apiIndexes(); track i) {
                <div class="api-box mono">API</div>
              }
            </div>
            <span class="lab-flow-arrow trap-arrow">all funnel into →</span>
            <div class="db-single" [class.is-crit]="dbLoadPct() >= 85" [class.is-warn]="dbLoadPct() >= 60 && dbLoadPct() < 85">
              <p class="lab-node">DATABASE</p>
              <div class="load-bar-track">
                <div class="load-bar-fill" [style.width.%]="dbLoadPct()"></div>
              </div>
              <p class="mono load-pct">{{ dbLoadPct() }}% load</p>
            </div>
          </div>

          <p class="lab-note" [class.lab-note-warn]="dbLoadPct() >= 85">
            Each API server's own CPU/memory looks fine in isolation — the load-per-server number barely moves.
            But every one of them talks to the <strong>same</strong> database. Scaling application servers just
            increases the rate of requests arriving at one place; it does not scale that place.
          </p>
        </div>

        <div class="lab-panel">
          <p class="part-heading mono">PART B — READ REPLICAS</p>

          <div class="replica-topology">
            <div class="primary-box">
              <p class="lab-node">PRIMARY (WRITE)</p>
              <p class="mono load-pct">{{ primaryLoadPct() }}% load</p>
            </div>
            <div class="replica-row">
              @for (r of replicaLoads(); track r.id) {
                <div class="replica-box">
                  <p class="lab-node">REPLICA {{ r.id }}</p>
                  <p class="mono load-pct">{{ r.load }}% load</p>
                </div>
              }
            </div>
          </div>

          <div class="lab-field slider-field">
            <label for="mix-slider">Traffic mix — reads vs writes</label>
            <input
              id="mix-slider"
              type="range"
              min="0"
              max="100"
              [value]="readPct()"
              (input)="onMixChange($event)"
            />
            <p class="mono mix-readout">{{ readPct() }}% reads / {{ 100 - readPct() }}% writes</p>
          </div>

          <p class="lab-note">
            Writes always go to the primary. As the mix shifts toward reads, more of that traffic gets absorbed
            by the three replicas instead — so per-node load drops even though total traffic hasn't changed.
          </p>

          <p class="lab-note lab-note-warn">
            <strong>Replication lag: ~50–200ms.</strong> Replicas can briefly serve slightly stale data relative to
            the primary. Example: a user updates their profile (write → primary), then immediately re-reads it
            (read → a replica) and briefly sees the old value until replication catches up.
          </p>
        </div>

        <div class="lab-panel">
          <p class="part-heading mono">PART C — SHARDING</p>
          <p class="part-sub">Split the data itself across separate databases by key.</p>

          <div class="shard-map">
            @for (s of shards; track s.id) {
              <div class="shard-box" [class.is-target]="routedShard()?.id === s.id">
                <p class="lab-node">SHARD {{ s.id }}</p>
                <p class="mono shard-range">{{ s.range }}</p>
              </div>
            }
          </div>

          <div class="lab-field route-field">
            <label for="letter-picker">Route a user (first letter of key)</label>
            <select id="letter-picker" [value]="pickedLetter()" (change)="onLetterChange($event)">
              @for (l of letters; track l) {
                <option [value]="l">{{ l }}</option>
              }
            </select>
          </div>

          @if (routedShard(); as rs) {
            <p class="mono route-result">
              "{{ pickedLetter() }}" → <strong>Shard {{ rs.id }}</strong> ({{ rs.range }})
            </p>
          }

          <div class="tradeoff-grid">
            @for (t of tradeoffs; track t.label) {
              <div class="tradeoff-card">
                <p class="pill pill-conditional">{{ t.label }}</p>
                <p class="tradeoff-detail">{{ t.detail }}</p>
              </div>
            }
          </div>

          <p class="lab-note">
            Sharding is <strong>not</strong> the default scaling solution — read replicas and other techniques
            usually come first. Reach for sharding only once a single database's write throughput or storage is
            the actual bottleneck, because it trades simplicity for scale.
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

    .part-heading { color: var(--accent-2); font-size: 0.75rem; letter-spacing: 0.1em; }
    .part-sub { margin-top: 6px; color: var(--text-muted); font-size: 0.9375rem; }

    .trap-stage { margin-top: 22px; display: flex; align-items: center; gap: 18px; flex-wrap: wrap; }
    .api-fleet { display: flex; gap: 8px; flex-wrap: wrap; max-width: 260px; }
    .api-box {
      width: 40px; height: 40px;
      display: flex; align-items: center; justify-content: center;
      font-size: 0.625rem; font-weight: 700;
      border: 1px solid var(--c-compute);
      border-radius: var(--radius-sm);
      color: var(--c-compute);
      background: var(--surface-elevated);
    }
    .trap-arrow { flex-shrink: 0; }

    .db-single, .primary-box, .replica-box, .shard-box {
      background: var(--surface);
      border: 1px solid var(--c-db);
      border-radius: var(--radius-md);
      padding: 14px 18px;
    }
    .db-single { min-width: 200px; transition: border-color 0.3s ease, box-shadow 0.3s ease; }
    .db-single.is-warn { border-color: var(--warn); box-shadow: 0 0 14px color-mix(in srgb, var(--warn) 25%, transparent); }
    .db-single.is-crit { border-color: var(--crit); box-shadow: 0 0 18px color-mix(in srgb, var(--crit) 35%, transparent); }

    .load-bar-track { margin-top: 8px; height: 8px; background: var(--surface-elevated); border-radius: 999px; overflow: hidden; }
    .load-bar-fill { height: 100%; background: var(--c-db); transition: width 0.4s ease, background 0.4s ease; }
    .db-single.is-warn .load-bar-fill { background: var(--warn); }
    .db-single.is-crit .load-bar-fill { background: var(--crit); }

    .load-pct { margin-top: 6px; font-size: 0.75rem; color: var(--text-muted); }

    .replica-topology { margin-top: 22px; display: flex; flex-direction: column; align-items: center; gap: 16px; }
    .primary-box { border-color: var(--warn); min-width: 220px; text-align: center; }
    .replica-row { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
    .replica-box { min-width: 140px; text-align: center; }

    .slider-field, .route-field { margin-top: 20px; max-width: 360px; }
    .slider-field input[type='range'] { accent-color: var(--accent); width: 100%; }
    .mix-readout { margin-top: 4px; color: var(--text-muted); font-size: 0.75rem; }

    .shard-map { margin-top: 22px; display: flex; gap: 14px; flex-wrap: wrap; }
    .shard-box { flex: 1 1 140px; text-align: center; transition: box-shadow 0.3s ease, border-color 0.3s ease; }
    .shard-box.is-target { border-color: var(--accent); box-shadow: 0 0 14px var(--glow-accent); }
    .shard-range { margin-top: 6px; color: var(--text-muted); font-size: 0.8125rem; }

    .route-result { margin-top: 12px; color: var(--text); font-size: 0.875rem; }
    .route-result strong { color: var(--accent-strong); }

    .tradeoff-grid { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 12px; }
    @media (min-width: 640px) { .tradeoff-grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 960px) { .tradeoff-grid { grid-template-columns: 1fr 1fr 1fr; } }
    .tradeoff-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px; }
    .tradeoff-detail { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class DatabaseScaling {
  protected readonly apiOptions = API_SERVER_OPTIONS;
  protected readonly shards = SHARDS;
  protected readonly tradeoffs = SHARD_TRADEOFFS;
  protected readonly letters = ['A', 'D', 'H', 'I', 'M', 'P', 'Q', 'T', 'Z'];

  protected readonly apiServerCount = signal<number>(1);
  protected readonly readPct = signal(70);
  protected readonly pickedLetter = signal('M');

  protected readonly apiIndexes = computed(() => Array.from({ length: this.apiServerCount() }, (_, i) => i));

  protected readonly dbLoadPct = computed(() => {
    // load rises steeply and non-linearly as more app servers funnel into one DB
    const n = this.apiServerCount();
    const pct = Math.round(18 * Math.sqrt(n) + (n - 1) * 4);
    return Math.min(100, pct);
  });

  protected readonly primaryLoadPct = computed(() => {
    const writeShare = 100 - this.readPct();
    return Math.round(30 + writeShare * 0.6);
  });

  protected readonly replicaLoads = computed(() => {
    const readShare = this.readPct();
    const perReplica = Math.round((readShare / 3) * 0.9);
    return [1, 2, 3].map((id) => ({ id, load: Math.min(95, Math.max(3, perReplica)) }));
  });

  protected readonly routedShard = computed(() => {
    const letter = this.pickedLetter().toUpperCase();
    return this.shards.find((s) => letter >= s.from && letter <= s.to) ?? this.shards[this.shards.length - 1];
  });

  onMixChange(ev: Event): void {
    const value = Number((ev.target as HTMLInputElement).value);
    this.readPct.set(value);
  }

  onLetterChange(ev: Event): void {
    const value = (ev.target as HTMLSelectElement).value;
    this.pickedLetter.set(value);
  }
}
