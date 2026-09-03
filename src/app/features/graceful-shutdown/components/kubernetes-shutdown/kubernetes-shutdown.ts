import { Component, OnDestroy, computed, signal } from '@angular/core';

interface ShutdownStep {
  label: string;
  detail: string;
  /** which nested box lights up during this step */
  focus: 'kubernetes' | 'pod' | 'application' | 'none';
}

const STEPS: ShutdownStep[] = [
  { label: 'Termination requested', detail: 'A deploy, a scale-down, or a node drain asks the control plane to remove this Pod.', focus: 'kubernetes' },
  { label: 'Instance becomes unready', detail: 'The Pod is marked as not ready so it can be pulled out of rotation before anything else happens.', focus: 'pod' },
  { label: 'Traffic stops', detail: 'Load balancers and service endpoints stop routing new requests to this instance.', focus: 'pod' },
  { label: 'Termination signal (SIGTERM)', detail: 'The container runtime delivers SIGTERM to the application process, asking it to wind down.', focus: 'application' },
  { label: 'Application drains', detail: 'In-flight requests are allowed to finish, background jobs checkpoint, connections close cleanly.', focus: 'application' },
  { label: 'Grace period', detail: 'A countdown window during which the process is expected to finish draining and exit on its own.', focus: 'application' },
  { label: 'Process exits', detail: 'The application exits voluntarily once draining is complete — the Pod is removed cleanly.', focus: 'none' },
];

const FORCED_STEP: ShutdownStep = {
  label: 'Forced termination (SIGKILL)',
  detail: 'The grace period expired before the process exited, so the runtime kills it outright. Any work still in flight is lost.',
  focus: 'none',
};

const AUTOPLAY_MS = 1600;

@Component({
  selector: 'app-kubernetes-shutdown',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section gs-scene ks-scene" id="gs-kubernetes">
      <div class="container">
        <p class="lab-index">24 — KUBERNETES SHUTDOWN</p>
        <h2 class="lab-title">What actually happens when a Pod is told to stop</h2>
        <p class="lab-lede">
          A Kubernetes shutdown is not one event — it is a sequence that travels from the cluster, down into the
          Pod, down into the application process itself. Step through it to see who does what, and when.
        </p>

        <div class="lab-panel">
          <div class="nest-diagram">
            <div class="nest-box nest-k8s" [class.is-active]="currentStep().focus === 'kubernetes'">
              <span class="mono nest-label">KUBERNETES</span>
              <div class="nest-box nest-pod" [class.is-active]="currentStep().focus === 'pod'">
                <span class="mono nest-label">POD</span>
                <div class="nest-box nest-app" [class.is-active]="currentStep().focus === 'application'" [class.is-forced]="isForced()">
                  <span class="mono nest-label">APPLICATION</span>
                  <span class="pill" [class.pill-yes]="appState() === 'running'" [class.pill-conditional]="appState() === 'draining'" [class.pill-no]="appState() === 'stopped'">
                    {{ appStateLabel() }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <ol class="step-list" aria-label="Shutdown sequence">
            @for (s of displaySteps(); track s.label; let i = $index) {
              <li
                class="step-item"
                [class.is-current]="i === activeIndex()"
                [class.is-done]="i < activeIndex()"
                [class.is-forced]="s === forcedStep"
              >
                <span class="step-marker mono">{{ i + 1 }}</span>
                <div class="step-body">
                  <p class="step-label mono">{{ s.label }}</p>
                  @if (i === activeIndex()) {
                    <p class="step-detail">{{ s.detail }}</p>
                  }
                </div>
              </li>
            }
          </ol>

          <div class="branch-note" [class.is-visible]="showBranch()">
            <span class="lab-flow-arrow">&darr;</span>
            <p class="mono branch-label">IF IT DOES NOT EXIT IN TIME</p>
            <p class="branch-desc">&rarr; forced termination may occur — the process is killed, not asked.</p>
          </div>

          <div class="lab-btn-row" role="group" aria-label="Shutdown sequence controls">
            <button type="button" class="lab-btn" (click)="stepBack()" [disabled]="activeIndex() === 0 || playing()">&larr; Back</button>
            <button type="button" class="lab-btn lab-btn-primary" (click)="stepForward()" [disabled]="isAtEnd() || playing()">Step forward &rarr;</button>
            <button type="button" class="lab-btn" [class.is-active]="playing()" (click)="togglePlay()">{{ playing() ? 'Pause' : 'Auto-play' }}</button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="playing()">Reset</button>
          </div>

          <div class="lab-btn-row" role="group" aria-label="Outcome at end of grace period">
            <button type="button" class="lab-btn" [class.is-active]="!exitsInTime()" (click)="exitsInTime.set(false)">Simulate: app hangs past grace period</button>
            <button type="button" class="lab-btn" [class.is-active]="exitsInTime()" (click)="exitsInTime.set(true)">Simulate: app exits in time</button>
          </div>
        </div>

        <p class="lab-note">
          This is the conceptual model, not a guarantee of identical behavior everywhere. Exact ordering, timing,
          the default grace period, and whether "unready" and "traffic stops" fully overlap all depend on your
          specific platform's lifecycle hooks, readiness probe configuration, and load balancer propagation delay.
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

    .nest-diagram { display: flex; justify-content: center; padding: 12px 0 8px; }
    .nest-box {
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-lg);
      padding: 22px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      background: var(--surface);
      transition: border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease;
    }
    .nest-k8s { width: 100%; max-width: 480px; }
    .nest-pod { width: 100%; }
    .nest-app { width: 100%; padding: 18px; flex-direction: row; justify-content: space-between; align-items: center; }
    .nest-box.is-active { border-color: var(--signal); box-shadow: 0 0 0 1px var(--signal), 0 0 20px color-mix(in srgb, var(--signal) 35%, transparent); }
    .nest-app.is-forced { border-color: var(--stopped); box-shadow: 0 0 0 1px var(--stopped), 0 0 20px color-mix(in srgb, var(--stopped) 35%, transparent); }
    .nest-label { font-size: 0.6875rem; letter-spacing: 0.1em; color: var(--text-faint); position: absolute; }
    .nest-k8s .nest-label, .nest-pod .nest-label { position: static; align-self: flex-start; }

    .step-list { list-style: none; margin: 24px 0 0; padding: 0; display: flex; flex-direction: column; gap: 2px; counter-reset: none; }
    .step-item { display: flex; gap: 12px; padding: 10px 12px; border-radius: var(--radius-sm); opacity: 0.45; transition: opacity 0.2s ease, background 0.2s ease; }
    .step-item.is-done { opacity: 0.7; }
    .step-item.is-current { opacity: 1; background: var(--surface); border: 1px solid var(--border); }
    .step-item.is-forced.is-current { background: color-mix(in srgb, var(--stopped) 10%, var(--surface)); border-color: var(--stopped); }
    .step-marker {
      flex: none; width: 22px; height: 22px; border-radius: 999px; border: 1px solid var(--border-strong);
      display: flex; align-items: center; justify-content: center; font-size: 0.6875rem; color: var(--text-muted);
    }
    .step-item.is-current .step-marker { border-color: var(--signal); color: var(--signal); }
    .step-item.is-forced.is-current .step-marker { border-color: var(--stopped); color: var(--stopped); }
    .step-label { font-size: 0.875rem; color: var(--text); }
    .step-detail { margin-top: 4px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }

    .branch-note {
      margin-top: 14px; padding: 12px 16px; border-radius: var(--radius-md);
      border: 1px dashed var(--stopped); background: color-mix(in srgb, var(--stopped) 8%, var(--surface));
      opacity: 0; max-height: 0; overflow: hidden; transition: opacity 0.25s ease, max-height 0.25s ease;
    }
    .branch-note.is-visible { opacity: 1; max-height: 120px; }
    .branch-label { color: var(--stopped); font-size: 0.75rem; letter-spacing: 0.06em; }
    .branch-desc { margin-top: 4px; font-size: 0.8125rem; color: var(--text-muted); }

    @media (prefers-reduced-motion: reduce) {
      .nest-box, .step-item, .branch-note { transition: none; }
    }
  `,
})
export class KubernetesShutdown implements OnDestroy {
  protected readonly baseSteps = STEPS;
  protected readonly forcedStep = FORCED_STEP;

  protected readonly exitsInTime = signal(true);
  protected readonly activeIndex = signal(0);
  protected readonly playing = signal(false);

  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly displaySteps = computed<ShutdownStep[]>(() => {
    return this.exitsInTime() ? this.baseSteps : [...this.baseSteps.slice(0, -1), FORCED_STEP];
  });

  protected readonly currentStep = computed<ShutdownStep>(() => this.displaySteps()[this.activeIndex()]);

  protected readonly isAtEnd = computed(() => this.activeIndex() >= this.displaySteps().length - 1);

  protected readonly showBranch = computed(() => !this.exitsInTime() && this.activeIndex() >= this.baseSteps.length - 2);

  protected readonly isForced = computed(() => this.currentStep() === FORCED_STEP);

  protected readonly appState = computed<'running' | 'draining' | 'stopped'>(() => {
    const step = this.currentStep();
    if (step === FORCED_STEP) return 'stopped';
    if (step.label === 'Process exits') return 'stopped';
    if (step.focus === 'application') return 'draining';
    return 'running';
  });

  protected readonly appStateLabel = computed(() => {
    const state = this.appState();
    if (state === 'running') return 'RUNNING';
    if (state === 'draining') return 'DRAINING';
    return this.currentStep() === FORCED_STEP ? 'KILLED' : 'STOPPED';
  });

  ngOnDestroy(): void {
    this.clearTimer();
  }

  protected stepForward(): void {
    if (this.isAtEnd()) return;
    this.activeIndex.update((v) => Math.min(this.displaySteps().length - 1, v + 1));
  }

  protected stepBack(): void {
    this.activeIndex.update((v) => Math.max(0, v - 1));
  }

  protected reset(): void {
    this.pause();
    this.activeIndex.set(0);
  }

  protected togglePlay(): void {
    this.playing() ? this.pause() : this.play();
  }

  private play(): void {
    if (this.isAtEnd()) this.activeIndex.set(0);
    this.playing.set(true);
    this.clearTimer();
    this.timer = setInterval(() => {
      if (this.isAtEnd()) {
        this.pause();
        return;
      }
      this.stepForward();
    }, AUTOPLAY_MS);
  }

  private pause(): void {
    this.playing.set(false);
    this.clearTimer();
  }

  private clearTimer(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}
