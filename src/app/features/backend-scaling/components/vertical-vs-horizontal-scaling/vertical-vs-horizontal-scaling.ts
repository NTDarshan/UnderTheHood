import { Component, computed, signal } from '@angular/core';

interface VerticalTier {
  cores: number;
  ramGb: number;
  capacity: number;
  size: number;
}

const VERTICAL_TIERS: VerticalTier[] = [
  { cores: 4, ramGb: 16, capacity: 100, size: 64 },
  { cores: 8, ramGb: 32, capacity: 210, size: 84 },
  { cores: 16, ramGb: 64, capacity: 380, size: 108 },
];

const HORIZONTAL_SERVER_COUNT = 4;
const HORIZONTAL_CAPACITY_EACH = 100;
const REQUEST_ROUND_COUNT = 12;

@Component({
  selector: 'app-vertical-vs-horizontal-scaling',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="vertical-vs-horizontal">
      <div class="container">
        <p class="lab-index">17 — VERTICAL VS HORIZONTAL SCALING</p>
        <h2 class="lab-title">When traffic grows, you can make one machine bigger, or you can add more machines.</h2>
        <p class="lab-lede">
          Two scaling strategies, two very different failure profiles. Try both and watch where each one breaks.
        </p>

        <div class="lab-panel">
          <p class="part-heading mono">PART A — VERTICAL SCALING (SCALE UP)</p>
          <p class="part-sub">One server. Same box, more power crammed into it.</p>

          <div class="vertical-stage">
            <div
              class="server-box vertical-box"
              [style.width.px]="currentTier().size"
              [style.height.px]="currentTier().size"
              [class.is-maxed]="isMaxTier()"
            >
              <span class="server-icon mono">SRV</span>
            </div>
            <div class="vertical-readout mono">
              <p class="spec-line">{{ currentTier().cores }} cores &middot; {{ currentTier().ramGb }}GB RAM</p>
              <p class="capacity-line">capacity index: <strong>{{ currentTier().capacity }}</strong></p>
            </div>
          </div>

          <div class="lab-btn-row">
            <button
              type="button"
              class="lab-btn lab-btn-primary"
              [disabled]="isMaxTier()"
              (click)="scaleUp()"
            >
              Scale Up
            </button>
            <button type="button" class="lab-btn" (click)="resetVertical()">Reset</button>
          </div>

          @if (verticalStep() >= 2) {
            <p class="lab-note lab-note-warn">
              <strong>Hardware ceiling reached.</strong> Cost is rising faster than capacity, bigger chips get harder
              to source, and — critically — this is still <strong>one machine</strong>. If it crashes, reboots, or
              loses power, capacity doesn't drop by a percentage — it goes to zero. One box is one blast radius,
              no matter how large you build it.
            </p>
          }
        </div>

        <div class="lab-panel">
          <p class="part-heading mono">PART B — HORIZONTAL SCALING (SCALE OUT)</p>
          <p class="part-sub">Same total capacity, spread across independent machines.</p>

          <div class="horizontal-compare">
            <div class="compare-col">
              <p class="col-label mono">ONE LARGE SERVER</p>
              <div class="single-server-stage">
                <div class="server-box single-big-box">
                  <span class="server-icon mono">SRV</span>
                </div>
              </div>
              <p class="col-stat mono">capacity: 400 &middot; if it fails: <span class="crit-text">0%</span> available</p>
            </div>

            <div class="compare-col">
              <p class="col-label mono">FOUR SMALLER SERVERS</p>
              <div class="fleet-stage">
                @for (s of horizontalServers(); track s.id) {
                  <div class="server-box fleet-box" [class.is-down]="s.down">
                    <span class="server-icon mono">S{{ s.id }}</span>
                    @if (dotOnServer() === s.id) {
                      <span class="request-dot" aria-hidden="true"></span>
                    }
                  </div>
                }
              </div>
              <p class="col-stat mono">
                capacity: {{ horizontalTotalCapacity() }} &middot; if one fails:
                <span class="ok-text">{{ horizontalFaultCapacityPct() }}%</span> still available
              </p>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="distributing()" (click)="toggleDistribute()">
              {{ distributing() ? 'Stop distributing requests' : 'Distribute requests' }}
            </button>
            <button
              type="button"
              class="lab-btn lab-btn-danger"
              [class.is-active]="oneServerDown()"
              (click)="toggleFailure()"
            >
              {{ oneServerDown() ? 'Bring server back up' : 'Fail one server' }}
            </button>
          </div>

          <p class="lab-note">
            Four servers at 100 capacity each fail independently. Lose one, and you're at
            <strong>{{ horizontalFaultCapacityPct() }}% capacity</strong> instead of 0% — the fleet degrades
            gracefully instead of vanishing.
          </p>

          <p class="cliffhanger mono">
            <span class="pill pill-conditional">NEW PROBLEM</span>
            But this raises a new problem: <strong>STATE</strong>. If a request can land on any of these four
            servers, what happens when it needs to remember something about the user from a moment ago?
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

    .vertical-stage {
      margin-top: 24px;
      display: flex;
      align-items: center;
      gap: 28px;
      flex-wrap: wrap;
      min-height: 132px;
    }

    .server-box {
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      flex-shrink: 0;
      transition: width 0.4s ease, height 0.4s ease, box-shadow 0.4s ease, border-color 0.4s ease;
    }

    .vertical-box {
      border-color: var(--c-compute);
      box-shadow: 0 0 18px color-mix(in srgb, var(--c-compute) 30%, transparent);
    }
    .vertical-box.is-maxed {
      border-color: var(--warn);
      box-shadow: 0 0 28px color-mix(in srgb, var(--warn) 45%, transparent);
    }

    .server-icon { font-size: 0.6875rem; font-weight: 700; color: var(--text-muted); letter-spacing: 0.06em; }

    .vertical-readout { display: flex; flex-direction: column; gap: 6px; }
    .spec-line { font-size: 0.9375rem; color: var(--text); }
    .capacity-line { font-size: 0.8125rem; color: var(--text-muted); }
    .capacity-line strong { color: var(--accent-strong); }

    .horizontal-compare {
      margin-top: 24px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }
    @media (min-width: 700px) {
      .horizontal-compare { grid-template-columns: 1fr 1fr; }
    }

    .compare-col {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px;
    }
    .col-label { color: var(--text-faint); font-size: 0.6875rem; letter-spacing: 0.08em; margin-bottom: 14px; }

    .single-server-stage { display: flex; justify-content: center; padding: 12px 0; }
    .single-big-box { width: 108px; height: 108px; border-color: var(--c-compute); box-shadow: 0 0 22px color-mix(in srgb, var(--c-compute) 30%, transparent); }

    .fleet-stage { display: flex; gap: 12px; justify-content: center; flex-wrap: wrap; padding: 12px 0; }
    .fleet-box {
      width: 56px;
      height: 56px;
      border-color: var(--c-compute);
      box-shadow: 0 0 12px color-mix(in srgb, var(--c-compute) 25%, transparent);
    }
    .fleet-box.is-down {
      border-color: var(--crit);
      box-shadow: none;
      opacity: 0.35;
    }
    .fleet-box.is-down .server-icon { color: var(--crit); }

    .request-dot {
      position: absolute;
      top: -8px;
      right: -8px;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--warn);
      box-shadow: 0 0 8px var(--glow-accent);
      animation: dot-pop 0.6s ease;
    }
    @keyframes dot-pop {
      0% { transform: scale(0.4); opacity: 0.4; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(1); opacity: 1; }
    }

    .col-stat { margin-top: 10px; font-size: 0.8125rem; color: var(--text-muted); text-align: center; }
    .ok-text { color: var(--ok); font-weight: 600; }
    .crit-text { color: var(--crit); font-weight: 600; }

    .cliffhanger {
      margin-top: 22px;
      padding: 14px 16px;
      background: var(--surface);
      border: 1px solid var(--accent-dim);
      border-radius: var(--radius-md);
      color: var(--text-muted);
      font-size: 0.875rem;
      line-height: 1.6;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .cliffhanger strong { color: var(--accent-strong); }
  `,
})
export class VerticalVsHorizontalScaling {
  private readonly tiers = VERTICAL_TIERS;

  protected readonly verticalStep = signal(0);
  protected readonly currentTier = computed(() => this.tiers[this.verticalStep()]);
  protected readonly isMaxTier = computed(() => this.verticalStep() >= this.tiers.length - 1);

  protected readonly horizontalServers = signal(
    Array.from({ length: HORIZONTAL_SERVER_COUNT }, (_, i) => ({ id: i + 1, down: false })),
  );
  protected readonly oneServerDown = signal(false);
  protected readonly distributing = signal(false);
  protected readonly dotOnServer = signal<number | null>(null);

  private distributeTimer: ReturnType<typeof setInterval> | null = null;
  private round = 0;

  protected readonly horizontalTotalCapacity = computed(() => {
    const upCount = this.horizontalServers().filter((s) => !s.down).length;
    return upCount * HORIZONTAL_CAPACITY_EACH;
  });

  protected readonly horizontalFaultCapacityPct = computed(() => {
    const total = HORIZONTAL_SERVER_COUNT * HORIZONTAL_CAPACITY_EACH;
    const remaining = (HORIZONTAL_SERVER_COUNT - 1) * HORIZONTAL_CAPACITY_EACH;
    return Math.round((remaining / total) * 100);
  });

  scaleUp(): void {
    if (this.isMaxTier()) return;
    this.verticalStep.update((s) => Math.min(s + 1, this.tiers.length - 1));
  }

  resetVertical(): void {
    this.verticalStep.set(0);
  }

  toggleDistribute(): void {
    if (this.distributing()) {
      this.stopDistributing();
      return;
    }
    this.distributing.set(true);
    this.round = 0;
    this.distributeTimer = setInterval(() => {
      const up = this.horizontalServers().filter((s) => !s.down);
      if (up.length === 0) {
        this.dotOnServer.set(null);
        return;
      }
      const target = up[this.round % up.length];
      this.dotOnServer.set(target.id);
      this.round++;
      if (this.round >= REQUEST_ROUND_COUNT) {
        this.stopDistributing();
      }
    }, 500);
  }

  private stopDistributing(): void {
    this.distributing.set(false);
    this.dotOnServer.set(null);
    if (this.distributeTimer) {
      clearInterval(this.distributeTimer);
      this.distributeTimer = null;
    }
  }

  toggleFailure(): void {
    const nextDown = !this.oneServerDown();
    this.oneServerDown.set(nextDown);
    this.horizontalServers.update((list) =>
      list.map((s) => (s.id === 2 ? { ...s, down: nextDown } : s)),
    );
  }
}
