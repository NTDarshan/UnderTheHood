import { Component, OnDestroy, computed, signal } from '@angular/core';

type Strategy = 'rolling' | 'blue-green' | 'canary';
type PodVersion = 1 | 2;

const POD_COUNT = 6;

interface StrategyInfo {
  id: Strategy;
  label: string;
  downtimeRisk: string;
  rollbackSpeed: string;
  infraCost: string;
  blastRadius: string;
}

const STRATEGIES: StrategyInfo[] = [
  {
    id: 'rolling',
    label: 'Rolling',
    downtimeRisk: 'Near zero',
    rollbackSpeed: 'Slow — roll back the same way it rolled forward',
    infraCost: 'No extra capacity needed',
    blastRadius: 'Grows gradually as pods flip',
  },
  {
    id: 'blue-green',
    label: 'Blue-Green',
    downtimeRisk: 'None — cutover is atomic',
    rollbackSpeed: 'Instant — flip traffic back',
    infraCost: 'Double — both fleets run at once',
    blastRadius: 'All-or-nothing at the switch',
  },
  {
    id: 'canary',
    label: 'Canary',
    downtimeRisk: 'Near zero',
    rollbackSpeed: 'Fast — pull the small slice back',
    infraCost: 'Slightly higher during rollout',
    blastRadius: 'Small — contained to the canary slice first',
  },
];

function freshFleet(): PodVersion[] {
  return Array.from({ length: POD_COUNT }, () => 1);
}

@Component({
  selector: 'app-do-deployments-simulator',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-deployments-simulator">
      <div class="container">
        <p class="lab-index mono">06 — SHIPPING A NEW VERSION</p>
        <h2 class="lab-title">Same goal, three different ways to get there</h2>
        <p class="lab-lede">
          Every deployment strategy solves the same problem — replace V1 with V2 without breaking traffic — but
          they trade off differently on risk, rollback speed, and cost. Pick a strategy, deploy V2, and watch the
          shape of the rollout.
        </p>

        <div class="lab-panel">
          <div class="fleet-row" role="img" [attr.aria-label]="ariaSummary()">
            @for (v of fleet(); track $index; let i = $index) {
              <div class="pod-box" [class.is-v2]="v === 2" [class.is-canary]="canaryIndex() === i">
                <span class="mono pod-version">V{{ v }}</span>
              </div>
            }
          </div>

          <div class="lab-code" aria-live="polite">{{ statusLine() }}</div>

          <div class="strategy-picker" role="radiogroup" aria-label="Deployment strategy">
            @for (s of strategies; track s.id) {
              <button
                type="button"
                class="lab-btn"
                role="radio"
                [attr.aria-checked]="strategy() === s.id"
                [class.is-active]="strategy() === s.id"
                [disabled]="deploying()"
                (click)="strategy.set(s.id)"
              >{{ s.label }}</button>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="deploy()" [disabled]="deploying() || isAllV2()">
              Deploy Version 2 ({{ activeStrategyLabel() }})
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="deploying()">Reset to V1</button>
          </div>

          <div class="compare-wrap">
            <table class="compare-table mono">
              <thead>
                <tr>
                  <th scope="col">Strategy</th>
                  <th scope="col">Downtime risk</th>
                  <th scope="col">Rollback speed</th>
                  <th scope="col">Infra cost</th>
                  <th scope="col">Blast radius on failure</th>
                </tr>
              </thead>
              <tbody>
                @for (s of strategies; track s.id) {
                  <tr [class.is-active]="strategy() === s.id">
                    <th scope="row">{{ s.label }}</th>
                    <td>{{ s.downtimeRisk }}</td>
                    <td>{{ s.rollbackSpeed }}</td>
                    <td>{{ s.infraCost }}</td>
                    <td>{{ s.blastRadius }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <p class="lab-note">
          This is the orienting view — a quick preview of how traffic moves under each strategy. The next three
          sections each take one strategy and slow it all the way down, pod by pod.
        </p>
      </div>
    </section>
  `,
  styles: `
    .do-scene {
      --do-accent: var(--accent);
      --do-cyan: var(--accent-2);
      --do-violet: #a78bfa;
      --do-success: #4ade80;
      --do-warning: #fbbf24;
      --do-danger: var(--danger);
      --do-pending: #60a5fa;
    }

    .fleet-row {
      display: grid;
      grid-template-columns: repeat(6, 1fr);
      gap: 10px;
    }
    @media (max-width: 560px) {
      .fleet-row { grid-template-columns: repeat(3, 1fr); }
    }
    .pod-box {
      padding: 16px 8px;
      border-radius: var(--radius-md);
      border: 1px solid var(--do-cyan);
      background: var(--surface);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: border-color 0.3s ease, background 0.3s ease, transform 0.3s ease;
    }
    .pod-box.is-v2 {
      border-color: var(--do-violet);
      background: color-mix(in srgb, var(--do-violet) 12%, var(--surface));
    }
    .pod-box.is-canary {
      transform: translateY(-3px);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--do-accent) 40%, transparent);
    }
    .pod-version { font-size: 1.1rem; font-weight: 700; color: var(--text); }

    .strategy-picker { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 20px; }

    .compare-wrap { margin-top: 24px; overflow-x: auto; }
    .compare-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; min-width: 640px; }
    .compare-table th, .compare-table td {
      text-align: left;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border);
      color: var(--text-muted);
    }
    .compare-table thead th { color: var(--text-faint); font-weight: 600; letter-spacing: 0.04em; }
    .compare-table tbody th { color: var(--text); font-weight: 700; }
    .compare-table tr.is-active { background: color-mix(in srgb, var(--do-accent) 8%, transparent); }
    .compare-table tr.is-active th { color: var(--do-accent); }

    @media (prefers-reduced-motion: reduce) {
      .pod-box { transition: none; }
    }
  `,
})
export class DeploymentsSimulator implements OnDestroy {
  protected readonly strategies = STRATEGIES;
  protected readonly strategy = signal<Strategy>('rolling');
  protected readonly fleet = signal<PodVersion[]>(freshFleet());
  protected readonly deploying = signal(false);
  protected readonly canaryIndex = signal(-1);
  protected readonly statusLine = signal('Fleet running V1. Pick a strategy and deploy V2 to preview it.');

  protected readonly isAllV2 = computed(() => this.fleet().every((v) => v === 2));

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected ariaSummary(): string {
    return this.fleet().map((v, i) => `pod ${i + 1}: V${v}`).join('; ');
  }

  protected activeStrategyLabel(): string {
    return this.strategies.find((s) => s.id === this.strategy())?.label ?? '';
  }

  protected deploy(): void {
    if (this.deploying() || this.isAllV2()) return;
    this.deploying.set(true);

    switch (this.strategy()) {
      case 'rolling':
        this.previewRolling();
        break;
      case 'blue-green':
        this.previewBlueGreen();
        break;
      case 'canary':
        this.previewCanary();
        break;
    }
  }

  private previewRolling(): void {
    this.statusLine.set('Rolling: replacing pods one at a time, fleet stays up throughout.');
    for (let i = 0; i < POD_COUNT; i++) {
      this.after(i * 260, () => this.setPod(i, 2));
    }
    this.after(POD_COUNT * 260 + 200, () => {
      this.statusLine.set('Rolling complete — every pod is on V2, replaced gradually.');
      this.deploying.set(false);
    });
  }

  private previewBlueGreen(): void {
    this.statusLine.set('Blue-Green: standing up a full V2 environment alongside V1…');
    this.after(700, () => {
      this.statusLine.set('V2 environment healthy. Switching all traffic at once…');
    });
    this.after(1400, () => {
      this.fleet.update((list) => list.map(() => 2 as PodVersion));
      this.statusLine.set('Traffic switched atomically — every pod flipped in one instant.');
    });
    this.after(2400, () => {
      this.deploying.set(false);
    });
  }

  private previewCanary(): void {
    this.statusLine.set('Canary: routing a small slice of traffic to a single V2 pod…');
    this.canaryIndex.set(0);
    this.after(500, () => this.setPod(0, 2));
    this.after(1300, () => {
      this.statusLine.set('Canary pod healthy — no errors. Rolling V2 out to the rest of the fleet…');
    });
    this.after(1800, () => {
      for (let i = 1; i < POD_COUNT; i++) {
        this.after((i - 1) * 180, () => this.setPod(i, 2));
      }
    });
    this.after(1800 + (POD_COUNT - 1) * 180 + 300, () => {
      this.canaryIndex.set(-1);
      this.statusLine.set('Canary complete — the whole fleet is now on V2.');
      this.deploying.set(false);
    });
  }

  private setPod(index: number, version: PodVersion): void {
    this.fleet.update((list) => list.map((v, i) => (i === index ? version : v)));
  }

  protected reset(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.fleet.set(freshFleet());
    this.canaryIndex.set(-1);
    this.deploying.set(false);
    this.statusLine.set('Fleet running V1. Pick a strategy and deploy V2 to preview it.');
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
