import { Component, OnDestroy, signal } from '@angular/core';

type StageState = 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
type FailurePoint = 'none' | 'build' | 'tests' | 'security';

interface PipelineStage {
  id: 'push' | 'checkout' | 'restore' | 'build' | 'unit' | 'integration' | 'security' | 'image';
  label: string;
  detail: string;
}

const STAGES: PipelineStage[] = [
  { id: 'push', label: 'Git Push', detail: 'commit received by CI trigger' },
  { id: 'checkout', label: 'Checkout', detail: 'clone repository at commit SHA' },
  { id: 'restore', label: 'Restore Dependencies', detail: 'install packages, warm cache' },
  { id: 'build', label: 'Build', detail: 'compile the application' },
  { id: 'unit', label: 'Unit Tests', detail: 'fast, isolated test suite' },
  { id: 'integration', label: 'Integration Tests', detail: 'tests against real dependencies' },
  { id: 'security', label: 'Security Scan', detail: 'dependency & static analysis scan' },
  { id: 'image', label: 'Artifact / Docker Image', detail: 'package a deployable image' },
];

const STEP_MS = 550;

@Component({
  selector: 'app-ci-pipeline',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="ci-pipeline">
      <div class="container">
        <p class="lab-index mono">04 — CONTINUOUS INTEGRATION</p>
        <h2 class="lab-title">CI is about continuously validating changes before they become deployment problems.</h2>
        <p class="lab-lede">
          Push code and watch it move through a realistic pipeline, stage by stage. Then force a failure and see the
          pipeline stop exactly where it should — the stages after it are never reached.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="run('none')" [disabled]="isRunning()">
              PUSH CODE
            </button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="run('build')" [disabled]="isRunning()">
              FORCE: BUILD FAILS
            </button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="run('tests')" [disabled]="isRunning()">
              FORCE: TESTS FAIL
            </button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="run('security')" [disabled]="isRunning()">
              FORCE: SECURITY SCAN FAILS
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="isRunning()">RESET</button>
          </div>

          <div class="stage-list">
            @for (stage of stages; track stage.id) {
              <div class="stage-row" [attr.data-state]="stateOf(stage.id)">
                <span class="stage-marker" aria-hidden="true">
                  @switch (stateOf(stage.id)) {
                    @case ('passed') { <span class="mark mark-pass">&check;</span> }
                    @case ('failed') { <span class="mark mark-fail">&cross;</span> }
                    @case ('running') { <span class="mark mark-run"></span> }
                    @default { <span class="mark mark-idle"></span> }
                  }
                </span>
                <span class="stage-name mono">{{ stage.label }}</span>
                <span class="stage-detail">{{ stage.detail }}</span>
                <span class="stage-state mono">{{ stateOf(stage.id).toUpperCase() }}</span>
              </div>
            }
          </div>

          <p class="log-line mono" aria-live="polite">{{ logLine() }}</p>
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
      --do-pending: #fbbf24;
    }

    .stage-list { margin-top: 24px; display: flex; flex-direction: column; gap: 4px; }
    .stage-row {
      display: grid;
      grid-template-columns: 24px minmax(140px, auto) 1fr auto;
      align-items: center;
      gap: 14px;
      padding: 12px 14px;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      transition: border-color 0.25s ease, background 0.25s ease, opacity 0.25s ease;
      opacity: 0.5;
    }
    .stage-row[data-state='running'],
    .stage-row[data-state='passed'],
    .stage-row[data-state='failed'] { opacity: 1; background: var(--surface); border-color: var(--border); }
    .stage-row[data-state='running'] { border-color: var(--do-pending); }
    .stage-row[data-state='passed'] { border-color: color-mix(in srgb, var(--do-success) 40%, var(--border)); }
    .stage-row[data-state='failed'] { border-color: var(--do-danger); background: color-mix(in srgb, var(--do-danger) 10%, var(--surface)); }

    .stage-name { font-size: 0.8125rem; font-weight: 700; color: var(--text); }
    .stage-detail { font-size: 0.75rem; color: var(--text-muted); }
    .stage-state { font-size: 0.625rem; letter-spacing: 0.06em; color: var(--text-faint); text-align: right; }
    .stage-row[data-state='passed'] .stage-state { color: var(--do-success); }
    .stage-row[data-state='failed'] .stage-state { color: var(--do-danger); }
    .stage-row[data-state='running'] .stage-state { color: var(--do-pending); }

    .mark { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; border-radius: 50%; font-size: 0.75rem; }
    .mark-idle { width: 8px; height: 8px; background: var(--border-strong); margin: 5px; }
    .mark-pass { background: color-mix(in srgb, var(--do-success) 25%, transparent); color: var(--do-success); }
    .mark-fail { background: color-mix(in srgb, var(--do-danger) 25%, transparent); color: var(--do-danger); }
    .mark-run {
      width: 10px; height: 10px; margin: 4px; border-radius: 50%;
      background: var(--do-pending);
      box-shadow: 0 0 8px color-mix(in srgb, var(--do-pending) 60%, transparent);
      animation: mark-pulse 0.8s ease-in-out infinite;
    }
    @media (prefers-reduced-motion: reduce) { .mark-run { animation: none; } }
    @keyframes mark-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.4); opacity: 0.6; } }

    .log-line {
      margin-top: 20px;
      padding-top: 18px;
      border-top: 1px solid var(--border);
      font-size: 0.8125rem;
      color: var(--text-faint);
      min-height: 1.2em;
    }

    @media (max-width: 640px) {
      .stage-row { grid-template-columns: 20px 1fr auto; }
      .stage-detail { display: none; }
    }
  `,
})
export class CiPipeline implements OnDestroy {
  protected readonly stages = STAGES;
  protected readonly stageStates = signal<Record<string, StageState>>(this.idleStates());
  protected readonly isRunning = signal(false);
  protected readonly logLine = signal('Ready. Push code to start a pipeline run.');

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected stateOf(id: string): StageState {
    return this.stageStates()[id] ?? 'pending';
  }

  protected run(failAt: FailurePoint): void {
    if (this.isRunning()) return;
    this.isRunning.set(true);
    this.stageStates.set(this.idleStates());
    this.logLine.set('Pipeline triggered by push…');

    const failStageId: PipelineStage['id'] | null =
      failAt === 'build' ? 'build' : failAt === 'tests' ? 'unit' : failAt === 'security' ? 'security' : null;

    this.stages.forEach((stage, i) => {
      this.after(i * STEP_MS, () => {
        const shouldFail = stage.id === failStageId;
        this.setState(stage.id, 'running');
        this.logLine.set(`${stage.label} — in progress…`);

        this.after(STEP_MS - 100, () => {
          if (shouldFail) {
            this.setState(stage.id, 'failed');
            this.logLine.set(`${stage.label} failed. Pipeline stopped — remaining stages were never reached.`);
            this.skipRemaining(stage.id);
            this.isRunning.set(false);
          } else {
            this.setState(stage.id, 'passed');
            if (i === this.stages.length - 1) {
              this.logLine.set('All stages passed. Artifact is ready to deploy.');
              this.isRunning.set(false);
            }
          }
        });
      });
    });
  }

  protected reset(): void {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.stageStates.set(this.idleStates());
    this.isRunning.set(false);
    this.logLine.set('Ready. Push code to start a pipeline run.');
  }

  private skipRemaining(failedId: string): void {
    const idx = this.stages.findIndex((s) => s.id === failedId);
    const rest = this.stages.slice(idx + 1);
    const current = { ...this.stageStates() };
    for (const s of rest) {
      current[s.id] = 'skipped';
    }
    this.stageStates.set(current);
  }

  private setState(id: string, state: StageState): void {
    this.stageStates.update((s) => ({ ...s, [id]: state }));
  }

  private idleStates(): Record<string, StageState> {
    const record: Record<string, StageState> = {};
    for (const s of STAGES) record[s.id] = 'pending';
    return record;
  }

  private after(ms: number, fn: () => void): void {
    this.timers.push(setTimeout(fn, ms));
  }
}
