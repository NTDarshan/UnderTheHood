import { Component, OnDestroy, computed, signal } from '@angular/core';

type SlotStatus = 'running' | 'draining' | 'stopped' | 'starting';

interface Slot {
  version: 1 | 2;
  status: SlotStatus;
}

const SLOT_COUNT = 4;
const PHASE_MS = 850;

function initialSlots(): Slot[] {
  return Array.from({ length: SLOT_COUNT }, () => ({ version: 1, status: 'running' as SlotStatus }));
}

@Component({
  selector: 'app-do-rolling-deployment',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-rolling-deployment">
      <div class="container">
        <p class="lab-index mono">07 — ROLLING DEPLOYMENT, SLOWED DOWN</p>
        <h2 class="lab-title">Only one pod is ever down for replacement at a time</h2>
        <p class="lab-lede">
          Four pods, one slot replaced at a time: drain traffic away from it, terminate the old version, start the
          new one, wait for it to report healthy — then move to the next slot. Availability holds throughout
          because the fleet never drops below three healthy pods out of four.
        </p>

        <div class="lab-panel">
          <div class="slot-row" role="img" [attr.aria-label]="ariaSummary()">
            @for (slot of slots(); track $index; let i = $index) {
              <div
                class="slot-box"
                [class.is-running]="slot.status === 'running'"
                [class.is-draining]="slot.status === 'draining'"
                [class.is-stopped]="slot.status === 'stopped'"
                [class.is-starting]="slot.status === 'starting'"
                [class.is-target]="i === activeSlotIndex()"
              >
                <span class="mono slot-version">V{{ slot.version }}</span>
                <span class="mono slot-slotnum">slot {{ i + 1 }}</span>
                <span
                  class="pill slot-pill"
                  [class.pill-yes]="slot.status === 'running'"
                  [class.pill-conditional]="slot.status === 'draining' || slot.status === 'starting'"
                  [class.pill-no]="slot.status === 'stopped'"
                >{{ statusLabel(slot.status) }}</span>
              </div>
            }
          </div>

          <div class="lab-code" aria-live="polite">{{ statusLine() }}</div>

          <div class="stat-grid" role="group" aria-label="Fleet health">
            <div class="stat-tile">
              <span class="stat-value mono">{{ healthyCount() }}/{{ SLOT_COUNT }}</span>
              <span class="stat-label mono">HEALTHY NOW</span>
            </div>
            <div class="stat-tile">
              <span class="stat-value mono">1</span>
              <span class="stat-label mono">MAX UNAVAILABLE</span>
            </div>
            <div class="stat-tile">
              <span class="stat-value mono">{{ v2Count() }}/{{ SLOT_COUNT }}</span>
              <span class="stat-label mono">ON V2</span>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="step()" [disabled]="isComplete() || playing()">
              Step &rarr;
            </button>
            <button type="button" class="lab-btn" [class.is-active]="playing()" (click)="togglePlay()" [disabled]="isComplete()">
              {{ playing() ? 'Pause' : 'Play' }}
            </button>
            <button type="button" class="lab-btn" (click)="replay()">{{ isComplete() ? 'Replay' : 'Reset' }}</button>
          </div>
        </div>

        <p class="lab-note">
          <strong>maxUnavailable</strong> controls how many slots may be down for replacement at once — here it's
          set to 1, the safest option. Raising it would replace more pods in parallel and finish faster, at the
          cost of a larger capacity dip if something goes wrong mid-rollout.
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

    .slot-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 480px) {
      .slot-row { grid-template-columns: repeat(2, 1fr); }
    }
    .slot-box {
      padding: 16px 10px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease;
    }
    .slot-box.is-target { transform: translateY(-2px); }
    .slot-box.is-running { border-color: var(--do-success); }
    .slot-box.is-draining { border-color: var(--do-warning); background: color-mix(in srgb, var(--do-warning) 10%, var(--surface)); }
    .slot-box.is-stopped { border-color: var(--do-danger); background: color-mix(in srgb, var(--do-danger) 10%, var(--surface)); opacity: 0.55; }
    .slot-box.is-starting { border-color: var(--do-violet); background: color-mix(in srgb, var(--do-violet) 10%, var(--surface)); }
    .slot-version { font-size: 1.15rem; font-weight: 700; color: var(--text); }
    .slot-slotnum { font-size: 0.625rem; color: var(--text-faint); }

    @media (prefers-reduced-motion: reduce) {
      .slot-box { transition: none; }
    }
  `,
})
export class RollingDeployment implements OnDestroy {
  protected readonly SLOT_COUNT = SLOT_COUNT;

  protected readonly slots = signal<Slot[]>(initialSlots());
  protected readonly activeSlotIndex = signal(-1);
  protected readonly subPhase = signal<'idle' | 'draining' | 'stopped' | 'starting'>('idle');
  protected readonly playing = signal(false);

  private timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly isComplete = computed(() => this.slots().every((s) => s.version === 2 && s.status === 'running'));
  protected readonly healthyCount = computed(() => this.slots().filter((s) => s.status === 'running').length);
  protected readonly v2Count = computed(() => this.slots().filter((s) => s.version === 2).length);

  protected readonly ariaSummary = computed(() =>
    this.slots().map((s, i) => `slot ${i + 1}: version ${s.version}, ${s.status}`).join('; '),
  );

  protected readonly statusLine = computed(() => {
    if (this.isComplete()) return 'Rollout complete — all four slots now on V2. The fleet was never below 3/4 healthy.';
    const idx = this.activeSlotIndex();
    if (idx < 0) return 'Ready — press Step or Play to begin replacing slot 1.';
    switch (this.subPhase()) {
      case 'draining':
        return `Slot ${idx + 1}: draining V1 — in-flight requests finishing, no new traffic routed here.`;
      case 'stopped':
        return `Slot ${idx + 1}: V1 stopped — slot empty for a moment before V2 starts.`;
      case 'starting':
        return `Slot ${idx + 1}: V2 starting — will go live once it reports ready.`;
      default:
        return `Slot ${idx + 1}: V2 live and serving.`;
    }
  });

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected statusLabel(status: SlotStatus): string {
    switch (status) {
      case 'running':
        return 'RUNNING';
      case 'draining':
        return 'DRAINING';
      case 'stopped':
        return 'STOPPED';
      case 'starting':
        return 'STARTING';
    }
  }

  /** Each call advances exactly one micro-phase: drain -> stop -> start -> run, then moves to the next slot. */
  protected step(): void {
    if (this.isComplete()) return;

    let idx = this.activeSlotIndex();
    if (idx < 0) {
      idx = 0;
      this.activeSlotIndex.set(0);
      this.subPhase.set('draining');
      this.setSlot(idx, { version: 1, status: 'draining' });
      return;
    }

    const current = this.slots()[idx];
    if (current.version === 1 && current.status === 'draining') {
      this.subPhase.set('stopped');
      this.setSlot(idx, { version: 1, status: 'stopped' });
      return;
    }
    if (current.version === 1 && current.status === 'stopped') {
      this.subPhase.set('starting');
      this.setSlot(idx, { version: 2, status: 'starting' });
      return;
    }
    if (current.version === 2 && current.status === 'starting') {
      this.setSlot(idx, { version: 2, status: 'running' });
      const next = idx + 1;
      if (next < SLOT_COUNT) {
        this.activeSlotIndex.set(next);
        this.subPhase.set('draining');
        this.setSlot(next, { version: 1, status: 'draining' });
      } else {
        this.activeSlotIndex.set(-1);
        this.subPhase.set('idle');
      }
    }
  }

  private setSlot(index: number, value: Slot): void {
    this.slots.update((list) => list.map((s, i) => (i === index ? value : s)));
  }

  protected togglePlay(): void {
    this.playing() ? this.pause() : this.play();
  }

  private play(): void {
    this.playing.set(true);
    this.clearTimer();
    const tick = () => {
      if (this.isComplete()) {
        this.pause();
        return;
      }
      this.step();
      this.timer = setTimeout(tick, PHASE_MS);
    };
    this.timer = setTimeout(tick, PHASE_MS);
  }

  private pause(): void {
    this.playing.set(false);
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }

  protected replay(): void {
    this.pause();
    this.slots.set(initialSlots());
    this.activeSlotIndex.set(-1);
    this.subPhase.set('idle');
  }
}
