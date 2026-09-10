import { Component, OnDestroy, signal } from '@angular/core';

type PulsePhase = 'idle' | 'repo' | 'desired' | 'controller' | 'cluster' | 'settled';

@Component({
  selector: 'app-gitops',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-gitops">
      <div class="container">
        <p class="lab-index mono">02 — GITOPS</p>
        <h2 class="lab-title">Git isn't just where the code lives — it's the source of truth for infrastructure</h2>
        <p class="lab-lede">
          In a GitOps model, nothing pushes changes into the cluster directly. Instead, a controller running inside
          (or beside) the cluster continuously watches a Git repository and reconciles the live system to match what
          it finds there.
        </p>

        <div class="lab-panel">
          <div class="pipeline" role="group" aria-label="GitOps reconciliation pipeline">
            <div class="pnode" [class.is-active]="phase() === 'repo'">
              <span class="pnode-icon mono" aria-hidden="true">&lt;/&gt;</span>
              <span class="pnode-label mono">GIT REPOSITORY</span>
              <span class="pnode-sub">Commits describing intended infra</span>
            </div>
            <div class="pconnector" [class.is-live]="isFlowing() && phase() !== 'repo'">
              <span class="pulse-dot" [class.is-on]="pulsePosition() === 0" aria-hidden="true"></span>
            </div>
            <div class="pnode" [class.is-active]="phase() === 'desired'">
              <span class="pnode-icon mono" aria-hidden="true">#</span>
              <span class="pnode-label mono">DESIRED STATE</span>
              <span class="pnode-sub">YAML manifests at HEAD</span>
            </div>
            <div class="pconnector" [class.is-live]="isFlowing() && (phase() === 'controller' || phase() === 'cluster' || phase() === 'settled')">
              <span class="pulse-dot" [class.is-on]="pulsePosition() === 1" aria-hidden="true"></span>
            </div>
            <div class="pnode" [class.is-active]="phase() === 'controller'">
              <span class="pnode-icon mono" aria-hidden="true">&#8635;</span>
              <span class="pnode-label mono">GITOPS CONTROLLER</span>
              <span class="pnode-sub">Watches the repo, diffs, reconciles</span>
            </div>
            <div class="pconnector" [class.is-live]="isFlowing() && (phase() === 'cluster' || phase() === 'settled')">
              <span class="pulse-dot" [class.is-on]="pulsePosition() === 2" aria-hidden="true"></span>
            </div>
            <div class="pnode" [class.is-active]="phase() === 'cluster' || phase() === 'settled'">
              <span class="pnode-icon mono" aria-hidden="true">&#9632;</span>
              <span class="pnode-label mono">CLUSTER</span>
              <span class="pnode-sub">{{ clusterLabel() }}</span>
            </div>
          </div>

          <p class="log-line mono" aria-live="polite">{{ logLine() }}</p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="runReconciliation()" [disabled]="isFlowing()">
              COMMIT A CHANGE
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="isFlowing()">RESET</button>
          </div>

          <p class="lab-note">
            Notice the direction of every arrow: it always points <strong>away</strong> from Git, toward the
            cluster. The controller pulls — it polls or watches the repo and pushes the live cluster toward what it
            reads, on a loop, forever. That is different from a CI pipeline that pushes changes directly into
            production: with GitOps, the repo is the only place a change can originate, and the controller keeps
            reconciling even if someone edits the cluster by hand. <strong>Argo CD</strong> is a widely used
            real-world implementation of exactly this pattern.
          </p>
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

    .pipeline {
      display: flex;
      align-items: stretch;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pnode {
      flex: 1;
      min-width: 150px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 18px 12px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      text-align: center;
      transition: border-color 0.3s ease, box-shadow 0.3s ease, background 0.3s ease;
    }
    .pnode.is-active {
      border-color: var(--do-cyan);
      box-shadow: 0 0 0 1px color-mix(in srgb, var(--do-cyan) 30%, transparent), 0 0 18px color-mix(in srgb, var(--do-cyan) 25%, transparent);
      background: color-mix(in srgb, var(--do-cyan) 8%, var(--surface));
    }
    .pnode-icon { font-size: 1.125rem; color: var(--do-cyan); }
    .pnode-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; color: var(--text); }
    .pnode-sub { font-size: 0.6875rem; color: var(--text-faint); line-height: 1.4; }

    .pconnector {
      display: flex;
      align-items: center;
      justify-content: center;
      min-width: 32px;
      position: relative;
    }
    .pconnector::before {
      content: '';
      width: 100%;
      height: 2px;
      background: var(--border);
    }
    .pconnector.is-live::before { background: color-mix(in srgb, var(--do-cyan) 55%, var(--border)); }
    .pulse-dot {
      position: absolute;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--do-cyan);
      opacity: 0;
      box-shadow: 0 0 10px color-mix(in srgb, var(--do-cyan) 70%, transparent);
      transition: opacity 0.2s ease;
    }
    .pulse-dot.is-on { opacity: 1; animation: pulse-travel 0.7s ease-in-out; }
    @keyframes pulse-travel {
      0% { transform: scale(0.6); opacity: 0.4; }
      50% { transform: scale(1.3); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }
    @media (prefers-reduced-motion: reduce) {
      .pulse-dot.is-on { animation: none; opacity: 1; }
    }

    .log-line { margin-top: 20px; font-size: 0.75rem; color: var(--text-faint); min-height: 1.2em; }
  `,
})
export class Gitops implements OnDestroy {
  protected readonly phase = signal<PulsePhase>('idle');
  protected readonly logLine = signal('Cluster reconciled. Waiting for the next commit…');
  protected readonly driftCount = signal(0);

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected isFlowing(): boolean {
    return this.phase() !== 'idle' && this.phase() !== 'settled';
  }

  protected pulsePosition(): number {
    switch (this.phase()) {
      case 'repo': return -1;
      case 'desired': return 0;
      case 'controller': return 1;
      case 'cluster':
      case 'settled': return 2;
      default: return -1;
    }
  }

  protected clusterLabel(): string {
    return this.phase() === 'settled' || this.phase() === 'idle'
      ? 'Live state matches Git'
      : 'Reconciling…';
  }

  protected runReconciliation(): void {
    if (this.isFlowing()) return;
    this.phase.set('repo');
    this.logLine.set('New commit pushed to main: replicas 3 -> 5.');

    this.after(700, () => {
      this.phase.set('desired');
      this.logLine.set('This commit is now the desired state at HEAD.');
    });
    this.after(1500, () => {
      this.phase.set('controller');
      this.logLine.set('Controller polls the repo, diffs desired vs. live, and finds a mismatch.');
    });
    this.after(2400, () => {
      this.phase.set('cluster');
      this.logLine.set('Controller applies the diff to the cluster — scaling to 5 replicas.');
    });
    this.after(3300, () => {
      this.phase.set('settled');
      this.logLine.set('Reconciled. The controller keeps watching — any future drift gets corrected the same way.');
    });
  }

  protected reset(): void {
    if (this.isFlowing()) return;
    this.phase.set('idle');
    this.logLine.set('Cluster reconciled. Waiting for the next commit…');
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
