import { Component, computed, signal } from '@angular/core';

type Phase = 'idle' | 'expiring' | 'spiking' | 'settled';
type Strategy = 'none' | 'coalescing' | 'locking' | 'staggered' | 'jitter' | 'prewarm';

interface StrategyInfo {
  id: Strategy;
  label: string;
  mechanism: string;
  peakLoad: number; // 0-100, DB CPU at the moment of expiry
  timelineMode: 'spike' | 'spread' | 'flat';
  resultCaption: string;
}

const SWARM_SIZE = 48;

const STRATEGIES: StrategyInfo[] = [
  {
    id: 'none',
    label: 'No mitigation (baseline)',
    mechanism: 'The key simply expires. Every in-flight request checks the cache, all miss at once, and all fall through to the database.',
    peakLoad: 100,
    timelineMode: 'spike',
    resultCaption: 'DB CPU 100% — every one of ~1,000 requests missed the cache and hit the database in the same instant.',
  },
  {
    id: 'coalescing',
    label: 'Request coalescing',
    mechanism: 'Only the first request that misses actually queries the database. Every other concurrent request waits and shares that one result.',
    peakLoad: 14,
    timelineMode: 'spike',
    resultCaption: '~1,000 requests collapsed into 1 database call — everyone else waited a few ms and got the shared result.',
  },
  {
    id: 'locking',
    label: 'Locking',
    mechanism: 'The first request to miss acquires a lock for that key. Other requests see the lock and wait instead of also querying the database.',
    peakLoad: 12,
    timelineMode: 'spike',
    resultCaption: 'One request held the lock and queried the database. Everyone else queued behind it, then read the fresh cache entry.',
  },
  {
    id: 'staggered',
    label: 'Staggered expiration',
    mechanism: "TTLs are spread out ahead of time so related keys don't all expire at the same instant — the expiry moment itself is smeared across a window.",
    peakLoad: 22,
    timelineMode: 'spread',
    resultCaption: 'Expiry was spread across a window instead of one instant — the database saw a trickle of misses, not a burst.',
  },
  {
    id: 'jitter',
    label: 'Jitter',
    mechanism: 'Same idea as staggering, framed as randomizing each TTL by a small percentage (e.g. ±10%) so synchronized keys drift apart over time.',
    peakLoad: 25,
    timelineMode: 'spread',
    resultCaption: 'Each TTL was randomized by a few percent — repeated cache fills drift apart, so this key stopped expiring in lockstep with others.',
  },
  {
    id: 'prewarm',
    label: 'Prewarming',
    mechanism: 'The cache is proactively refreshed on a schedule before the old entry ever expires — clients never actually see a miss for this key.',
    peakLoad: 3,
    timelineMode: 'flat',
    resultCaption: 'The cache was refreshed early, in the background. The old entry never actually went missing, so the spike never happened.',
  },
];

@Component({
  selector: 'app-cache-stampede',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="cache-stampede">
      <div class="container">
        <p class="lab-index">16 — CACHE STAMPEDE</p>
        <h2 class="lab-title">Caching normally reduces load. At the moment a hot key expires, it can spike it.</h2>
        <p class="lab-lede">
          A cache that's protecting your database from thousands of requests per second is doing its job — until
          the entry for a popular key expires. If every one of those requests misses at the same instant, they
          all fall through together, and the database takes the full weight all at once.
        </p>

        <div class="lab-panel">
          <div class="stage">
            <div class="swarm-wrap">
              <p class="stage-label mono" style="color: var(--c-client)">~1,000 CLIENTS REQUESTING A POPULAR KEY</p>
              <div class="swarm" [class.is-active]="phase() === 'spiking'" [class.is-mitigated]="isMitigated()">
                @for (dot of swarmDots; track dot.id) {
                  <span
                    class="swarm-dot"
                    [class.is-surviving]="isMitigated() && dot.id === 0"
                    [style.--dx.px]="dot.dx"
                    [style.--dy.px]="dot.dy"
                    [style.--delay.ms]="dot.delay"
                  ></span>
                }
              </div>
            </div>

            <div class="stage-mid">
              <div class="lab-node cache-node mono" [class.is-empty]="phase() !== 'idle'">
                CACHE — {{ phase() === 'idle' ? 'HEALTHY' : (strategyInfo().id === 'prewarm' ? 'REFRESHED EARLY' : 'KEY EXPIRED') }}
              </div>
              <span class="lab-flow-arrow mid-arrow" [class.is-lit]="phase() === 'spiking'">↓</span>
            </div>

            <div class="db-box" [class.is-crit]="phase() === 'spiking' && strategyInfo().peakLoad >= 60" [class.is-warn]="phase() === 'spiking' && strategyInfo().peakLoad < 60">
              <p class="stage-label mono" style="color: var(--c-db)">DATABASE</p>
              <p class="db-cpu mono">DB CPU {{ displayedLoad() }}%</p>
              <div class="db-meter"><div class="db-meter-fill" [style.width.%]="displayedLoad()"></div></div>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" (click)="triggerExpire()" [disabled]="phase() === 'expiring' || phase() === 'spiking'">
              Cache key expires
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          @if (phase() === 'settled') {
            <p class="result-caption mono" [class.is-crit]="strategyInfo().peakLoad >= 60" [class.is-ok]="strategyInfo().peakLoad < 30">
              {{ strategyInfo().resultCaption }}
            </p>
          }

          @if (strategyInfo().timelineMode !== 'flat') {
            <div class="timeline">
              <p class="timeline-label mono">EXPIRY TIMELINE</p>
              <div class="timeline-track">
                @if (strategyInfo().timelineMode === 'spike') {
                  <div class="timeline-marker marker-spike" [class.is-lit]="phase() === 'spiking'"></div>
                } @else {
                  @for (m of spreadMarkers; track m) {
                    <div class="timeline-marker marker-spread" [style.left.%]="m" [class.is-lit]="phase() === 'spiking'"></div>
                  }
                }
              </div>
              <p class="timeline-caption">
                {{ strategyInfo().timelineMode === 'spike' ? 'All copies of this key expire at exactly the same instant.' : 'Expiry moments are spread across a window instead of landing on one instant.' }}
              </p>
            </div>
          } @else {
            <div class="timeline">
              <p class="timeline-label mono">EXPIRY TIMELINE</p>
              <div class="timeline-track"><div class="timeline-flat"></div></div>
              <p class="timeline-caption">The entry is refreshed before it would have expired — there is no miss moment to spike on.</p>
            </div>
          }

          <p class="strategy-heading mono">MITIGATION STRATEGY</p>
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
          <p class="strategy-mechanism">{{ strategyInfo().mechanism }}</p>
        </div>

        <p class="lab-note lab-note-warn">
          This is the caveat worth keeping in mind: caching reduces backend load in the common case, but a hot
          key expiring under heavy concurrent load can momentarily create the exact spike caching was supposed to
          prevent. The fix isn't "don't cache" — it's controlling what happens at the instant of expiry.
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

    .stage { display: grid; gap: 18px; }

    .stage-label { font-size: 0.6875rem; letter-spacing: 0.08em; margin-bottom: 10px; }

    .swarm-wrap { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }

    .swarm {
      position: relative;
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      min-height: 64px;
    }

    .swarm-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--c-client);
      opacity: 0.55;
      transition: opacity 0.2s ease;
    }

    .swarm.is-active .swarm-dot {
      animation: swarm-jolt 0.6s ease-in-out var(--delay) 1;
      opacity: 1;
    }

    .swarm.is-mitigated .swarm-dot {
      opacity: 0.25;
    }

    .swarm.is-mitigated .swarm-dot.is-surviving {
      opacity: 1;
      background: var(--c-cache);
      box-shadow: 0 0 8px var(--glow-accent-2);
      animation: swarm-jolt 0.6s ease-in-out 1;
    }

    @keyframes swarm-jolt {
      0% { transform: translate(0, 0); }
      50% { transform: translate(calc(var(--dx, 0px) * 0.3), calc(var(--dy, 0px) * 0.3)); }
      100% { transform: translate(0, 0); }
    }

    .stage-mid { display: flex; align-items: center; gap: 12px; }
    .cache-node { padding: 10px 16px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); color: var(--c-cache); background: color-mix(in srgb, var(--c-cache) 10%, var(--surface-elevated)); transition: color 0.3s ease, border-color 0.3s ease; }
    .cache-node.is-empty { color: var(--warn); border-color: var(--warn); }
    .mid-arrow { font-size: 1.2rem; transition: color 0.3s ease, text-shadow 0.3s ease; }
    .mid-arrow.is-lit { color: var(--crit); text-shadow: 0 0 10px var(--crit); }

    .db-box {
      padding: 18px 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
    }

    .db-box.is-warn { border-color: var(--warn); box-shadow: 0 0 20px var(--glow-accent); }
    .db-box.is-crit { border-color: var(--crit); box-shadow: 0 0 26px rgba(255, 93, 93, 0.4); background: color-mix(in srgb, var(--crit) 8%, var(--surface)); }

    .db-cpu { font-size: 1.125rem; color: var(--text); margin-top: 4px; }
    .db-meter { margin-top: 10px; height: 10px; border-radius: 999px; background: var(--surface-raised); border: 1px solid var(--border); overflow: hidden; }
    .db-meter-fill { height: 100%; background: linear-gradient(90deg, var(--c-db), var(--crit)); transition: width 0.4s ease; }

    .result-caption { margin-top: 18px; font-size: 0.8125rem; line-height: 1.6; padding: 10px 14px; border-radius: var(--radius-sm); border-left: 2px solid var(--border-strong); }
    .result-caption.is-crit { color: var(--crit); border-left-color: var(--crit); }
    .result-caption.is-ok { color: var(--c-cache); border-left-color: var(--c-cache); }

    .timeline { margin-top: 28px; }
    .timeline-label { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--text-faint); margin-bottom: 10px; }
    .timeline-track { position: relative; height: 28px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .timeline-marker { position: absolute; top: 50%; width: 10px; height: 10px; border-radius: 50%; background: var(--text-faint); transform: translate(-50%, -50%); transition: background 0.3s ease, box-shadow 0.3s ease; }
    .marker-spike { left: 50%; }
    .marker-spike.is-lit { background: var(--crit); box-shadow: 0 0 10px var(--crit); }
    .marker-spread.is-lit { background: var(--warn); box-shadow: 0 0 8px var(--glow-accent); }
    .timeline-flat { position: absolute; inset: 8px 4px; border-bottom: 2px solid var(--c-cache); }
    .timeline-caption { margin-top: 10px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }

    .strategy-heading { margin-top: 28px; font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); margin-bottom: 10px; }
    .strategy-mechanism { margin-top: 14px; max-width: 640px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }
  `,
})
export class CacheStampede {
  protected readonly strategies = STRATEGIES;
  protected readonly spreadMarkers = [20, 35, 50, 65, 80];

  protected readonly swarmDots: Array<{ id: number; dx: number; dy: number; delay: number }> = Array.from(
    { length: SWARM_SIZE },
    (_, i) => ({
      id: i,
      dx: Math.round((Math.random() - 0.5) * 30),
      dy: Math.round((Math.random() - 0.5) * 30),
      delay: Math.round(Math.random() * 200),
    }),
  );

  protected readonly phase = signal<Phase>('idle');
  protected readonly strategy = signal<Strategy>('none');
  protected readonly displayedLoad = signal(4);

  private timers: ReturnType<typeof setTimeout>[] = [];

  protected readonly strategyInfo = computed<StrategyInfo>(
    () => this.strategies.find((s) => s.id === this.strategy())!,
  );

  protected readonly isMitigated = computed(() => this.phase() !== 'idle' && this.strategy() !== 'none');

  selectStrategy(id: Strategy): void {
    this.strategy.set(id);
    this.reset();
  }

  triggerExpire(): void {
    this.clearTimers();
    this.phase.set('expiring');
    this.displayedLoad.set(4);

    this.timers.push(
      setTimeout(() => {
        this.phase.set('spiking');
        const target = this.strategyInfo().peakLoad;
        this.animateLoad(target);
      }, 350),
    );

    this.timers.push(
      setTimeout(() => {
        this.phase.set('settled');
      }, 1600),
    );
  }

  reset(): void {
    this.clearTimers();
    this.phase.set('idle');
    this.displayedLoad.set(4);
  }

  private animateLoad(target: number): void {
    const steps = 8;
    for (let i = 1; i <= steps; i++) {
      this.timers.push(
        setTimeout(() => {
          const progress = i / steps;
          this.displayedLoad.set(Math.round(4 + (target - 4) * progress));
        }, i * 60),
      );
    }
  }

  private clearTimers(): void {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }
}
