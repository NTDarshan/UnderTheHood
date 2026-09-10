import { Component, OnDestroy, signal } from '@angular/core';

type PodState = 'running' | 'dying' | 'gone' | 'recreating';

interface Pod {
  id: number;
  node: number;
  state: PodState;
}

const NODE_COUNT = 3;
const PODS_PER_NODE = 4;
const CHAOS_BOX_COUNT = 60;

let podCounter = 0;

function makeInitialPods(): Pod[] {
  const pods: Pod[] = [];
  for (let node = 0; node < NODE_COUNT; node++) {
    for (let i = 0; i < PODS_PER_NODE; i++) {
      pods.push({ id: podCounter++, node, state: 'running' });
    }
  }
  return pods;
}

@Component({
  selector: 'app-kubernetes-intro',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-kubernetes-intro">
      <div class="container">
        <p class="lab-index mono">6 — WHY KUBERNETES</p>
        <h2 class="lab-title">One container is easy. A fleet isn't.</h2>
        <p class="lab-lede">
          <code class="mono">docker run</code> gets one container going in seconds. Production is rarely one
          container — it's many, spread across many machines, some of which will fail.
        </p>

        <div class="lab-panel">
          @if (stage() === 'simple') {
            <div class="simple-stage">
              <div class="single-container">
                <span class="pulse-dot" aria-hidden="true"></span>
                <span class="mono">1 CONTAINER · 1 MACHINE</span>
              </div>
              <p class="lab-note">Easy to run. Easy to restart by hand if it dies. Now scale it up.</p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-primary" (click)="escalate()">SCALE TO PRODUCTION</button>
              </div>
            </div>
          }

          @if (stage() === 'chaos') {
            <div class="chaos-stage">
              <p class="chaos-caption mono">100 CONTAINERS · 10 MACHINES · MULTIPLE FAILURES · MULTIPLE DEPLOYMENTS</p>
              <div class="chaos-grid" aria-hidden="true">
                @for (b of chaosBoxes; track b) {
                  <div class="chaos-box" [class.is-dead]="deadChaos().has(b)"></div>
                }
              </div>
              <p class="lab-note lab-note-warn">
                Which ones are healthy right now? Which machine is overloaded? Who restarts a crashed one? Doing
                this by hand doesn't scale — you need a system that constantly reconciles reality against intent.
              </p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn lab-btn-primary" (click)="resolve()">BRING ORDER: INTRODUCE KUBERNETES</button>
              </div>
            </div>
          }

          @if (stage() === 'cluster') {
            <div class="cluster-stage">
              <div class="control-plane">
                <span class="mono cp-label">CONTROL PLANE</span>
                <p class="cp-desc">Watches desired state vs actual state and reconciles the difference — continuously.</p>
              </div>

              <div class="nodes-row">
                @for (nodeIdx of nodeIndexes; track nodeIdx) {
                  <div class="node-box">
                    <span class="mono node-title">NODE {{ nodeIdx + 1 }}</span>
                    <div class="pod-grid">
                      @for (pod of podsForNode(nodeIdx); track pod.id) {
                        <button
                          type="button"
                          class="pod-box"
                          [attr.data-state]="pod.state"
                          [disabled]="pod.state !== 'running'"
                          (click)="killPod(pod.id)"
                          [attr.aria-label]="'Pod ' + pod.id + ', click to kill'"
                        >
                          <span class="mono">pod</span>
                        </button>
                      }
                    </div>
                  </div>
                }
              </div>

              <p class="log-line mono" aria-live="polite">{{ logLine() }}</p>
              <p class="model-caption mono">DESIRED STATE &rarr; ACTUAL STATE &rarr; RECONCILIATION</p>
              <p class="lab-note">Click any healthy pod to kill it. The control plane notices the gap between
                desired replica count and actual count, and schedules a replacement.</p>
            </div>
          }
        </div>
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
      --do-pending: #64748b;
    }

    .simple-stage { display: flex; flex-direction: column; align-items: center; gap: 16px; padding: 20px 0; }
    .single-container { display: inline-flex; align-items: center; gap: 8px; padding: 18px 28px; border: 1px solid var(--do-success); border-radius: var(--radius-lg); background: color-mix(in srgb, var(--do-success) 8%, var(--surface)); }
    .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--do-success); box-shadow: 0 0 8px color-mix(in srgb, var(--do-success) 60%, transparent); animation: pulse 1.6s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }

    .chaos-caption { text-align: center; font-size: 0.75rem; letter-spacing: 0.05em; color: var(--do-danger); margin-bottom: 16px; }
    .chaos-grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 4px; }
    .chaos-box { aspect-ratio: 1; border-radius: 3px; background: var(--do-success); opacity: 0.7; animation: flicker 2.4s ease-in-out infinite; }
    .chaos-box:nth-child(3n) { animation-delay: 0.3s; }
    .chaos-box:nth-child(5n) { animation-delay: 0.7s; }
    .chaos-box:nth-child(7n) { animation-delay: 1.1s; }
    .chaos-box.is-dead { background: var(--do-danger); animation: none; opacity: 0.9; }
    @keyframes flicker { 0%, 100% { opacity: 0.7; } 50% { opacity: 0.35; } }

    .cluster-stage { display: flex; flex-direction: column; gap: 20px; }
    .control-plane { border: 1px solid var(--do-violet); border-radius: var(--radius-md); padding: 16px 20px; background: color-mix(in srgb, var(--do-violet) 8%, var(--surface)); text-align: center; }
    .cp-label { font-size: 0.75rem; letter-spacing: 0.08em; color: var(--do-violet); }
    .cp-desc { margin: 6px 0 0; font-size: 0.8125rem; color: var(--text-muted); }

    .nodes-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; }
    .node-box { border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px; background: var(--surface); }
    .node-title { display: block; font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--text-faint); margin-bottom: 10px; text-align: center; }
    .pod-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
    .pod-box {
      aspect-ratio: 1;
      border-radius: var(--radius-sm);
      border: 1px solid var(--do-cyan);
      background: color-mix(in srgb, var(--do-cyan) 10%, var(--surface-elevated));
      color: var(--text-faint);
      font-size: 0.625rem;
      cursor: pointer;
      transition: border-color 0.25s ease, background 0.25s ease, opacity 0.25s ease, transform 0.25s ease;
    }
    .pod-box:hover:not(:disabled) { border-color: var(--do-accent); }
    .pod-box[data-state='dying'] { border-color: var(--do-danger); background: color-mix(in srgb, var(--do-danger) 20%, var(--surface-elevated)); transform: scale(0.9) rotate(-4deg); }
    .pod-box[data-state='gone'] { opacity: 0; border-style: dashed; pointer-events: none; }
    .pod-box[data-state='recreating'] { border-color: var(--do-warning); border-style: dashed; opacity: 0.6; animation: recreate-pulse 0.8s ease-in-out infinite; }
    @keyframes recreate-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.85; } }

    .log-line { text-align: center; font-size: 0.75rem; color: var(--text-faint); min-height: 1.2em; }
    .model-caption { text-align: center; font-size: 0.75rem; letter-spacing: 0.08em; color: var(--do-accent); }

    @media (prefers-reduced-motion: reduce) {
      .pulse-dot, .chaos-box, .pod-box { animation: none; transition: none; }
    }
  `,
})
export class KubernetesIntro implements OnDestroy {
  protected readonly stage = signal<'simple' | 'chaos' | 'cluster'>('simple');
  protected readonly chaosBoxes = Array.from({ length: CHAOS_BOX_COUNT }, (_, i) => i);
  protected readonly deadChaos = signal<Set<number>>(new Set());
  protected readonly nodeIndexes = Array.from({ length: NODE_COUNT }, (_, i) => i);
  protected readonly pods = signal<Pod[]>(makeInitialPods());
  protected readonly logLine = signal('Desired replica count: 12. Actual: 12. In sync.');

  private timers: ReturnType<typeof setTimeout>[] = [];
  private chaosInterval: ReturnType<typeof setInterval> | null = null;

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
    if (this.chaosInterval) clearInterval(this.chaosInterval);
  }

  protected podsForNode(nodeIdx: number): Pod[] {
    return this.pods().filter((p) => p.node === nodeIdx);
  }

  protected escalate(): void {
    this.stage.set('chaos');
    this.chaosInterval = setInterval(() => {
      const next = new Set<number>();
      const failCount = 4 + Math.floor(Math.random() * 5);
      for (let i = 0; i < failCount; i++) {
        next.add(Math.floor(Math.random() * CHAOS_BOX_COUNT));
      }
      this.deadChaos.set(next);
    }, 700);
  }

  protected resolve(): void {
    if (this.chaosInterval) {
      clearInterval(this.chaosInterval);
      this.chaosInterval = null;
    }
    this.stage.set('cluster');
  }

  protected killPod(id: number): void {
    const pod = this.pods().find((p) => p.id === id);
    if (!pod || pod.state !== 'running') return;

    this.setPodState(id, 'dying');
    this.logLine.set('Pod ' + id + ' terminated. Desired: 12, Actual: 11 — control plane detects the gap.');

    this.timers.push(setTimeout(() => {
      this.setPodState(id, 'gone');
    }, 450));

    this.timers.push(setTimeout(() => {
      this.setPodState(id, 'recreating');
      this.logLine.set('Scheduling a replacement pod on node ' + (pod.node + 1) + '…');
    }, 1100));

    this.timers.push(setTimeout(() => {
      this.setPodState(id, 'running');
      this.logLine.set('Replacement pod is running. Desired: 12, Actual: 12 — back in sync.');
    }, 2200));
  }

  private setPodState(id: number, state: PodState): void {
    this.pods.update((list) => list.map((p) => (p.id === id ? { ...p, state } : p)));
  }
}
