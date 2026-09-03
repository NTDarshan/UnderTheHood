import { Component, OnDestroy, computed, signal } from '@angular/core';

type SlotStatus = 'running' | 'draining' | 'stopped' | 'starting';

interface Slot {
  version: 1 | 2;
  status: SlotStatus;
}

const SLOT_COUNT = 4;
const PHASE_MS = 900;

function initialSlots(): Slot[] {
  return Array.from({ length: SLOT_COUNT }, () => ({ version: 1, status: 'running' as SlotStatus }));
}

@Component({
  selector: 'app-rolling-deployment',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene rd-scene" id="gs-rolling-deployment">
      <div class="container">
        <p class="lab-index">26 — ROLLING DEPLOYMENT</p>
        <h2 class="lab-title">One slot at a time, never the whole fleet at once</h2>
        <p class="lab-lede">
          A rolling deployment replaces instances one slot at a time. Each old instance drains and stops before its
          replacement goes live in the same slot — so the fleet is never running fewer instances than it needs.
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
                <span class="pill slot-pill"
                  [class.pill-yes]="slot.status === 'running'"
                  [class.pill-conditional]="slot.status === 'draining' || slot.status === 'starting'"
                  [class.pill-no]="slot.status === 'stopped'"
                >{{ statusLabel(slot.status) }}</span>
              </div>
            }
          </div>

          <div class="lab-code" aria-live="polite">{{ statusLine() }}</div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="step()" [disabled]="isComplete() || playing()">
              Step &rarr;
            </button>
            <button type="button" class="lab-btn" [class.is-active]="playing()" (click)="togglePlay()" [disabled]="isComplete()">
              {{ playing() ? 'Pause' : 'Play' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="playing()">Reset</button>
          </div>
        </div>

        <p class="lab-note">
          Rolling deployment trades speed for safety: it takes longer than replacing everything at once, but at any
          given moment only one slot is unavailable, so overall capacity dips only slightly rather than dropping
          to zero.
        </p>
      </div>
    </section>
  `,
  styles: `
    .gs-scene {
      --running: #4ade80;
      --draining: var(--accent);
      --stopped: var(--danger);
      --idle: #64748b;
      --signal: #a78bfa;
      --resource: #60a5fa;
      --queue: #fbbf24;
      --cancelled: #f472b6;
    }

    .slot-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    @media (max-width: 480px) {
      .slot-row { grid-template-columns: repeat(2, 1fr); }
    }
    .slot-box {
      padding: 16px 10px; border-radius: var(--radius-md); border: 1px solid var(--border-strong);
      background: var(--surface); display: flex; flex-direction: column; align-items: center; gap: 8px;
      transition: border-color 0.25s ease, background 0.25s ease, transform 0.25s ease;
    }
    .slot-box.is-target { transform: translateY(-2px); }
    .slot-box.is-running { border-color: var(--running); }
    .slot-box.is-draining { border-color: var(--draining); background: color-mix(in srgb, var(--draining) 10%, var(--surface)); }
    .slot-box.is-stopped { border-color: var(--stopped); background: color-mix(in srgb, var(--stopped) 10%, var(--surface)); opacity: 0.55; }
    .slot-box.is-starting { border-color: var(--resource); }
    .slot-version { font-size: 1.15rem; font-weight: 700; color: var(--text); }
    .slot-slotnum { font-size: 0.625rem; color: var(--text-faint); }

    @media (prefers-reduced-motion: reduce) {
      .slot-box { transition: none; }
    }
  `,
})
export class RollingDeployment implements OnDestroy {
  protected readonly slots = signal<Slot[]>(initialSlots());
  protected readonly activeSlotIndex = signal(-1);
  protected readonly subPhase = signal<'idle' | 'draining' | 'stopped' | 'starting'>('idle');
  protected readonly playing = signal(false);

  private timer: ReturnType<typeof setTimeout> | null = null;

  protected readonly isComplete = computed(() => this.slots().every((s) => s.version === 2 && s.status === 'running'));

  protected readonly ariaSummary = computed(() => this.slots().map((s, i) => `slot ${i + 1}: version ${s.version}, ${s.status}`).join('; '));

  protected readonly statusLine = computed(() => {
    if (this.isComplete()) return 'rolling deployment complete — all four slots now on V2';
    const idx = this.activeSlotIndex();
    if (idx < 0) return 'ready — press Step or Play to begin replacing slot 1';
    switch (this.subPhase()) {
      case 'draining':
        return `slot ${idx + 1}: draining V1 — in-flight requests finishing, no new traffic routed here`;
      case 'stopped':
        return `slot ${idx + 1}: V1 stopped — slot empty for a moment before V2 starts`;
      case 'starting':
        return `slot ${idx + 1}: V2 starting — will go live once it reports ready`;
      default:
        return `slot ${idx + 1}: V2 live and serving`;
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

  protected reset(): void {
    this.pause();
    this.slots.set(initialSlots());
    this.activeSlotIndex.set(-1);
    this.subPhase.set('idle');
  }
}
