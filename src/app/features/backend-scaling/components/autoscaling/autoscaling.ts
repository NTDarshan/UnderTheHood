import { Component, OnDestroy, computed, signal } from '@angular/core';

type Signal = 'cpu' | 'requests' | 'queue' | 'latency' | 'custom';

interface SignalOption {
  id: Signal;
  label: string;
  note: string;
}

interface Frame {
  t: number; // seconds into the timeline
  traffic: number; // 0-100 relative traffic
  cpu: number; // 0-100
  instances: number;
}

const SIGNAL_OPTIONS: SignalOption[] = [
  { id: 'cpu', label: 'CPU', note: 'Simple and widely supported — but useless for services that are I/O-bound rather than compute-bound.' },
  { id: 'requests', label: 'Request rate', note: 'Tracks incoming load directly, though not how expensive each request actually is.' },
  { id: 'queue', label: 'Queue depth', note: 'Often the best signal for queue/worker systems — it reflects backlog directly, not a CPU proxy for it.' },
  { id: 'latency', label: 'Latency', note: 'Scales on user-facing pain directly, but can react late since latency often rises only after saturation.' },
  { id: 'custom', label: 'Custom metric', note: 'Any business metric (e.g. jobs/sec per pod) — valid when none of the built-ins reflect real load.' },
];

// Hand-authored timeline: traffic rises, CPU follows, instances react late.
const TIMELINE: Frame[] = [
  { t: 0, traffic: 15, cpu: 22, instances: 2 },
  { t: 10, traffic: 20, cpu: 28, instances: 2 },
  { t: 20, traffic: 45, cpu: 42, instances: 2 },
  { t: 30, traffic: 70, cpu: 61, instances: 2 },
  { t: 40, traffic: 85, cpu: 79, instances: 2 },
  { t: 50, traffic: 88, cpu: 82, instances: 3 }, // scale-out reaction to the 40s crossing, ~90s decision+boot lag rounds here
  { t: 60, traffic: 90, cpu: 84, instances: 3 },
  { t: 70, traffic: 92, cpu: 88, instances: 5 }, // reacting to sustained 80%+ crossing
  { t: 80, traffic: 95, cpu: 91, instances: 5 },
  { t: 90, traffic: 96, cpu: 92, instances: 8 }, // reacting to 90% crossing
  { t: 100, traffic: 90, cpu: 88, instances: 8 },
  { t: 110, traffic: 60, cpu: 55, instances: 8 },
  { t: 120, traffic: 35, cpu: 34, instances: 8 },
  { t: 130, traffic: 20, cpu: 24, instances: 8 }, // load has dropped but scale-in is conservative — still 8
  { t: 140, traffic: 18, cpu: 22, instances: 5 }, // scale-in begins, longer delay than scale-out
  { t: 150, traffic: 16, cpu: 20, instances: 3 },
  { t: 160, traffic: 15, cpu: 19, instances: 2 },
];

const T_MAX = TIMELINE[TIMELINE.length - 1].t;
const PLAY_MS_PER_S = 60; // 1 simulated second = 60ms of real playback

@Component({
  selector: 'app-autoscaling',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="autoscaling">
      <div class="container">
        <p class="lab-index">23 — AUTOSCALING</p>
        <h2 class="lab-title">Autoscaling reacts to signals — it doesn't react instantly.</h2>
        <p class="lab-lede">
          Scrub through a traffic spike and watch the gap between CPU crossing a threshold and new instances
          actually coming online. That gap is the point.
        </p>

        <div class="lab-panel">
          <p class="lab-node">DRIVING SIGNAL</p>
          <div class="lab-btn-row" role="group" aria-label="Autoscaling signal">
            @for (opt of signalOptions; track opt.id) {
              <button type="button" class="lab-btn" [class.is-active]="signal_() === opt.id" (click)="signal_.set(opt.id)">
                {{ opt.label }}
              </button>
            }
          </div>
          <p class="signal-note">{{ activeSignalNote() }}</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="playing()" (click)="play()">
              {{ playing() ? 'Playing…' : 'Play' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="lab-field timeline-field">
            <label for="timeline-slider">Timeline (seconds)</label>
            <input
              id="timeline-slider"
              type="range"
              min="0"
              [max]="tMax"
              step="1"
              [value]="t()"
              (input)="scrub($event)"
            />
            <span class="mono field-readout">t = {{ t() }}s</span>
          </div>

          <!-- CHARTS -->
          <div class="chart-block">
            <div class="chart-row">
              <span class="chart-label mono">TRAFFIC</span>
              <svg class="chart" viewBox="0 0 400 60" preserveAspectRatio="none">
                <path [attr.d]="trafficPath()" class="chart-line traffic-line" />
                <circle [attr.cx]="cursorX()" [attr.cy]="trafficY()" r="3.5" class="chart-cursor traffic-cursor" />
              </svg>
              <span class="mono chart-value">{{ frame().traffic }}</span>
            </div>
            <div class="chart-row">
              <span class="chart-label mono">CPU</span>
              <svg class="chart" viewBox="0 0 400 60" preserveAspectRatio="none">
                <line x1="0" y1="18" x2="400" y2="18" class="threshold-line" />
                <path [attr.d]="cpuPath()" class="chart-line cpu-line" />
                <circle [attr.cx]="cursorX()" [attr.cy]="cpuY()" r="3.5" class="chart-cursor cpu-cursor" />
              </svg>
              <span class="mono chart-value" [class.is-hot]="frame().cpu >= 80">{{ frame().cpu }}%</span>
            </div>
            <div class="chart-row">
              <span class="chart-label mono">INSTANCES</span>
              <svg class="chart" viewBox="0 0 400 60" preserveAspectRatio="none">
                <path [attr.d]="instancePath()" class="chart-line instance-line" />
                <circle [attr.cx]="cursorX()" [attr.cy]="instanceY()" r="3.5" class="chart-cursor instance-cursor" />
              </svg>
              <span class="mono chart-value instance-value">{{ frame().instances }}</span>
            </div>
          </div>

          <div class="fleet-row" aria-label="Running instances">
            @for (i of instanceArray(); track i) {
              <div class="instance-box" [style.animation-delay.ms]="i * 40"><span class="mono">i{{ i + 1 }}</span></div>
            }
          </div>

          <p class="mono reaction-line">
            reaction: scaling decision + new instance boot &asymp; <strong>90s</strong> after a threshold is
            crossed. Scale-<em>in</em> after load drops usually waits even longer than scale-out, to avoid
            flapping instances up and down on a brief dip.
          </p>

          <p class="lab-note">
            <strong>CPU is not always the best signal.</strong> An I/O-bound service, or one that's mostly waiting
            on downstream calls or a queue, can sit at low CPU while badly overloaded — queue depth or latency
            often reacts sooner and more accurately for those systems. Every option above ({{ signalLabelsJoined }})
            is a legitimate choice depending on what actually predicts trouble for a given system.
          </p>

          <p class="lab-note-warn lab-note">
            Autoscaling responds to defined signals and policies, and has real reaction time — new capacity does
            not appear the instant a threshold is crossed. Treating it as instantaneous is a common and costly
            capacity-planning mistake.
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

    .signal-note { margin-top: 10px; font-size: 0.8125rem; color: var(--text-muted); max-width: 560px; line-height: 1.5; }

    .timeline-field { margin-top: 22px; max-width: 480px; }
    .field-readout { color: var(--text-muted); font-size: 0.75rem; }

    .chart-block { margin-top: 24px; display: flex; flex-direction: column; gap: 10px; }
    .chart-row { display: grid; grid-template-columns: 74px 1fr 44px; align-items: center; gap: 10px; }
    .chart-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .chart { width: 100%; height: 40px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); }
    .chart-line { fill: none; stroke-width: 2; vector-effect: non-scaling-stroke; }
    .traffic-line { stroke: var(--c-client); }
    .cpu-line { stroke: var(--warn); }
    .instance-line { stroke: var(--c-compute); }
    .threshold-line { stroke: var(--crit); stroke-dasharray: 4 3; stroke-width: 1; opacity: 0.55; }
    .chart-cursor { stroke: var(--bg); stroke-width: 1; }
    .traffic-cursor { fill: var(--c-client); }
    .cpu-cursor { fill: var(--warn); }
    .instance-cursor { fill: var(--c-compute); }
    .chart-value { font-size: 0.75rem; color: var(--text-muted); text-align: right; }
    .chart-value.is-hot { color: var(--crit); }
    .instance-value { color: var(--c-compute); }

    .fleet-row { margin-top: 20px; display: flex; gap: 6px; flex-wrap: wrap; }
    .instance-box {
      padding: 8px 10px;
      background: var(--surface-elevated);
      border: 1px solid var(--c-compute);
      border-radius: var(--radius-sm);
      color: var(--c-compute);
      font-size: 0.6875rem;
      animation: pop-in 0.25s ease both;
    }
    @keyframes pop-in { from { opacity: 0; transform: scale(0.7); } to { opacity: 1; transform: scale(1); } }
    @media (prefers-reduced-motion: reduce) { .instance-box { animation: none; } }

    .reaction-line { margin-top: 18px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6; max-width: 620px; }
    .reaction-line strong { color: var(--warn); }
  `,
})
export class Autoscaling implements OnDestroy {
  protected readonly signalOptions = SIGNAL_OPTIONS;
  protected readonly tMax = T_MAX;
  protected readonly signalLabelsJoined = SIGNAL_OPTIONS.map((s) => s.label).join(', ');

  protected readonly signal_ = signal<Signal>('cpu');
  protected readonly t = signal(0);
  protected readonly playing = signal(false);

  private timerId: ReturnType<typeof setInterval> | null = null;

  protected readonly activeSignalNote = computed(
    () => this.signalOptions.find((s) => s.id === this.signal_())?.note ?? '',
  );

  protected readonly frame = computed<Frame>(() => this.interpolate(this.t()));

  protected readonly instanceArray = computed(() => Array.from({ length: this.frame().instances }, (_, i) => i));

  protected readonly cursorX = computed(() => (this.t() / T_MAX) * 400);
  protected readonly trafficY = computed(() => 60 - (this.frame().traffic / 100) * 60);
  protected readonly cpuY = computed(() => 60 - (this.frame().cpu / 100) * 60);
  protected readonly instanceY = computed(() => 60 - (this.frame().instances / 10) * 60);

  protected readonly trafficPath = computed(() => this.buildPath((f) => f.traffic, 100));
  protected readonly cpuPath = computed(() => this.buildPath((f) => f.cpu, 100));
  protected readonly instancePath = computed(() => this.buildPath((f) => f.instances, 10));

  ngOnDestroy(): void {
    this.stopTimer();
  }

  play(): void {
    if (this.playing()) return;
    if (this.t() >= T_MAX) this.t.set(0);
    this.playing.set(true);
    const stepS = 1;
    this.timerId = setInterval(() => {
      this.t.update((v) => Math.min(T_MAX, v + stepS));
      if (this.t() >= T_MAX) {
        this.stopTimer();
      }
    }, PLAY_MS_PER_S);
  }

  reset(): void {
    this.stopTimer();
    this.t.set(0);
  }

  scrub(ev: Event): void {
    this.stopTimer();
    this.t.set(+(ev.target as HTMLInputElement).value);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
    this.playing.set(false);
  }

  private interpolate(t: number): Frame {
    let lo = TIMELINE[0];
    let hi = TIMELINE[TIMELINE.length - 1];
    for (let i = 0; i < TIMELINE.length - 1; i++) {
      if (t >= TIMELINE[i].t && t <= TIMELINE[i + 1].t) {
        lo = TIMELINE[i];
        hi = TIMELINE[i + 1];
        break;
      }
    }
    const span = hi.t - lo.t || 1;
    const ratio = (t - lo.t) / span;
    return {
      t,
      traffic: Math.round(lo.traffic + (hi.traffic - lo.traffic) * ratio),
      cpu: Math.round(lo.cpu + (hi.cpu - lo.cpu) * ratio),
      // instances step (not interpolate) — scaling changes in discrete jumps, not smoothly
      instances: lo.instances,
    };
  }

  private buildPath(pick: (f: Frame) => number, max: number): string {
    const pts = TIMELINE.map((f) => {
      const x = (f.t / T_MAX) * 400;
      const y = 60 - (pick(f) / max) * 60;
      return `${x},${y}`;
    });
    return `M ${pts.join(' L ')}`;
  }
}
