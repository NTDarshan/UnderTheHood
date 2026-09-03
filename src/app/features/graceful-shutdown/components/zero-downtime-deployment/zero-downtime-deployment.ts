import { Component, OnDestroy, computed, signal } from '@angular/core';

type InstanceStatus = 'serving' | 'starting' | 'checking' | 'ready' | 'draining' | 'stopped';

interface Instance {
  id: string;
  version: 1 | 2;
  status: InstanceStatus;
}

const OLD_INSTANCES: Instance[] = [
  { id: 'Instance A', version: 1, status: 'serving' },
  { id: 'Instance B', version: 1, status: 'serving' },
  { id: 'Instance C', version: 1, status: 'serving' },
];

const NEW_INSTANCE_IDS = ['Instance D', 'Instance E'];

const STEP_MS = 1300;

@Component({
  selector: 'app-zero-downtime-deployment',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene zd-scene" id="gs-zero-downtime">
      <div class="container">
        <p class="lab-index">25 — ZERO-DOWNTIME DEPLOYMENT</p>
        <h2 class="lab-title">Replacing every instance without ever dropping traffic</h2>
        <p class="lab-lede">
          Zero-downtime deployment isn't about being fast — it's about never letting serving capacity hit zero.
          New instances prove themselves ready before old ones are touched, and old instances drain before they stop.
        </p>

        <div class="lab-panel">
          <p class="lab-node">VERSION 1 — currently serving</p>
          <div class="fleet-row">
            @for (inst of oldInstances(); track inst.id) {
              <div class="instance-box" [class.is-serving]="inst.status === 'serving'" [class.is-draining]="inst.status === 'draining'" [class.is-stopped]="inst.status === 'stopped'">
                <span class="mono inst-id">{{ inst.id }}</span>
                <span class="pill" [class.pill-yes]="inst.status === 'serving'" [class.pill-conditional]="inst.status === 'draining'" [class.pill-no]="inst.status === 'stopped'">
                  {{ statusLabel(inst.status) }}
                </span>
              </div>
            }
          </div>

          <p class="lab-node version-gap">VERSION 2 — rolling in</p>
          <div class="fleet-row">
            @for (inst of newInstances(); track inst.id) {
              <div class="instance-box" [class.is-starting]="inst.status === 'starting'" [class.is-checking]="inst.status === 'checking'" [class.is-serving]="inst.status === 'ready'">
                <span class="mono inst-id">{{ inst.id }}</span>
                <span class="pill" [class.pill-conditional]="inst.status === 'starting' || inst.status === 'checking'" [class.pill-yes]="inst.status === 'ready'">
                  {{ statusLabel(inst.status) }}
                </span>
                @if (inst.status === 'checking') {
                  <span class="mono check-line">running readiness check&hellip;</span>
                }
              </div>
            }
            @if (newInstances().length === 0) {
              <p class="empty-hint">no new instances yet — start the deployment below</p>
            }
          </div>

          <div class="traffic-meter">
            <p class="mono meter-label">LIVE SERVING CAPACITY</p>
            <div class="meter-track" role="img" [attr.aria-label]="'Serving capacity ' + totalCapacityPct() + ' percent, never zero'">
              <div class="meter-fill" [style.width.%]="totalCapacityPct()"></div>
            </div>
            <p class="mono meter-readout">{{ totalCapacityPct() }}% capacity &middot; {{ servingCount() }} instance(s) actively serving</p>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="startDeployment()" [disabled]="phase() !== 'idle'">
              Start deployment
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="phase() === 'idle'">Reset</button>
          </div>

          <div class="lab-code" aria-live="polite">{{ phaseLine() }}</div>
        </div>

        <p class="lab-note">
          Notice the meter never touches zero. Instance D and E must pass their readiness check before any traffic
          reaches them, and Instance A, B, and C are only drained and stopped one at a time — never all at once.
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

    .version-gap { margin-top: 26px; }
    .fleet-row { margin-top: 14px; display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
    .instance-box {
      position: relative;
      padding: 14px; border-radius: var(--radius-md); border: 1px solid var(--border-strong);
      background: var(--surface); display: flex; flex-direction: column; gap: 8px; align-items: flex-start;
      transition: border-color 0.25s ease, background 0.25s ease, opacity 0.25s ease;
    }
    .instance-box.is-serving { border-color: var(--running); }
    .instance-box.is-starting { border-color: var(--idle); opacity: 0.7; }
    .instance-box.is-checking { border-color: var(--queue); }
    .instance-box.is-draining { border-color: var(--draining); background: color-mix(in srgb, var(--draining) 8%, var(--surface)); }
    .instance-box.is-stopped { border-color: var(--stopped); opacity: 0.45; }
    .inst-id { font-size: 0.8125rem; color: var(--text); }
    .check-line { font-size: 0.6875rem; color: var(--queue); }
    .empty-hint { font-size: 0.8125rem; color: var(--text-faint); }

    .traffic-meter { margin-top: 26px; }
    .meter-label { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--text-faint); }
    .meter-track { margin-top: 8px; height: 16px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); overflow: hidden; }
    .meter-fill { height: 100%; background: linear-gradient(90deg, var(--running), color-mix(in srgb, var(--running) 60%, var(--resource))); transition: width 0.3s ease; }
    .meter-readout { margin-top: 8px; font-size: 0.75rem; color: var(--text-muted); }

    @media (prefers-reduced-motion: reduce) {
      .instance-box, .meter-fill { transition: none; }
    }
  `,
})
export class ZeroDowntimeDeployment implements OnDestroy {
  protected readonly oldInstances = signal<Instance[]>(OLD_INSTANCES.map((i) => ({ ...i })));
  protected readonly newInstances = signal<Instance[]>([]);
  protected readonly phase = signal<'idle' | 'spinning-up' | 'checking' | 'draining-old' | 'done'>('idle');

  private timers: ReturnType<typeof setTimeout>[] = [];

  protected readonly servingCount = computed(() => {
    const oldServing = this.oldInstances().filter((i) => i.status === 'serving').length;
    const newServing = this.newInstances().filter((i) => i.status === 'ready').length;
    return oldServing + newServing;
  });

  // capacity is modelled against the steady-state fleet size of 3, so it can briefly exceed 100%
  // while both old and new instances serve together, but it never drops toward zero.
  protected readonly totalCapacityPct = computed(() => Math.min(150, Math.round((this.servingCount() / 3) * 100)));

  protected readonly phaseLine = computed(() => {
    switch (this.phase()) {
      case 'idle':
        return 'idle — Version 1 (A, B, C) serving 100% of traffic';
      case 'spinning-up':
        return 'Version 2 instances starting — not receiving traffic yet';
      case 'checking':
        return 'readiness checks passing — traffic begins flowing to Version 2 alongside Version 1';
      case 'draining-old':
        return 'Version 1 instances draining one at a time — Version 2 already covers full capacity';
      case 'done':
        return 'deployment complete — Version 2 (D, E) now serving 100% of traffic, zero dropped requests';
    }
  });

  ngOnDestroy(): void {
    this.clearTimers();
  }

  protected statusLabel(status: InstanceStatus): string {
    switch (status) {
      case 'serving':
        return 'SERVING';
      case 'starting':
        return 'STARTING';
      case 'checking':
        return 'READINESS CHECK';
      case 'ready':
        return 'SERVING';
      case 'draining':
        return 'DRAINING';
      case 'stopped':
        return 'STOPPED';
    }
  }

  protected startDeployment(): void {
    if (this.phase() !== 'idle') return;
    this.clearTimers();
    this.phase.set('spinning-up');
    this.newInstances.set(NEW_INSTANCE_IDS.map((id) => ({ id, version: 2, status: 'starting' })));

    this.after(STEP_MS, () => {
      this.phase.set('checking');
      this.newInstances.update((list) => list.map((i) => ({ ...i, status: 'checking' })));
    });

    this.after(STEP_MS * 2.2, () => {
      this.newInstances.update((list) => list.map((i) => ({ ...i, status: 'ready' })));
      this.phase.set('draining-old');
      this.drainOldOneByOne(0);
    });
  }

  private drainOldOneByOne(index: number): void {
    const old = this.oldInstances();
    if (index >= old.length) {
      this.after(200, () => this.phase.set('done'));
      return;
    }

    this.after(STEP_MS, () => {
      this.oldInstances.update((list) => list.map((i, idx) => (idx === index ? { ...i, status: 'draining' } : i)));
    });

    this.after(STEP_MS * 2, () => {
      this.oldInstances.update((list) => list.map((i, idx) => (idx === index ? { ...i, status: 'stopped' } : i)));
      this.drainOldOneByOne(index + 1);
    });
  }

  protected reset(): void {
    this.clearTimers();
    this.phase.set('idle');
    this.oldInstances.set(OLD_INSTANCES.map((i) => ({ ...i })));
    this.newInstances.set([]);
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }

  private clearTimers(): void {
    this.timers.forEach((t) => clearTimeout(t));
    this.timers = [];
  }
}
