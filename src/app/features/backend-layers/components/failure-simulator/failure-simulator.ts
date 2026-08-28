import { Component, computed, signal } from '@angular/core';
import { FailurePoint, responseForFailure, runRequestPipeline } from '../../engine/backend-simulator';

const OPTIONS: { id: FailurePoint; label: string }[] = [
  { id: 'none', label: 'No Failure (Success)' },
  { id: 'authentication', label: 'Authentication Failed' },
  { id: 'authorization', label: 'Authorization Failed' },
  { id: 'validation', label: 'Validation Failed' },
  { id: 'controller', label: 'Controller Error' },
  { id: 'service', label: 'Service Error' },
  { id: 'repository', label: 'Repository Error' },
  { id: 'database', label: 'Database Error' },
];

@Component({
  selector: 'app-failure-simulator',
  standalone: true,
  template: `
    <section class="lab-section" id="failure-simulator">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 20 — REQUEST FAILURE SIMULATOR</p>
        <h2 class="lab-title">Fail any stage on purpose. See exactly what runs, and what never does.</h2>

        <div class="lab-panel">
          <div class="lab-btn-row">
            @for (o of options; track o.id) {
              <button type="button" class="lab-btn" [class.is-active]="failAt() === o.id" [class.lab-btn-danger]="o.id !== 'none'" (click)="failAt.set(o.id)">{{ o.label }}</button>
            }
          </div>

          <div class="stage-list mono">
            @for (s of stages(); track s.id) {
              <p class="stage-row" [class.is-pass]="s.status === 'pass'" [class.is-fail]="s.status === 'fail'" [class.is-skip]="s.status === 'not-reached'">
                {{ s.label }} — {{ s.status === 'pass' ? '✓' : s.status === 'fail' ? '✕ ' + s.detail : 'NOT REACHED' }}
              </p>
            }
          </div>

          <div class="response-box mono">
            <p class="response-status" [class.is-error]="response().status >= 400">{{ response().status }}</p>
            <p class="response-body">{{ response().body }}</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .stage-list { margin-top: 24px; display: flex; flex-direction: column; gap: 6px; }
    .stage-row { font-size: 0.8125rem; }
    .stage-row.is-pass { color: var(--accent-2); }
    .stage-row.is-fail { color: var(--danger); }
    .stage-row.is-skip { color: var(--text-faint); opacity: 0.6; }

    .response-box { margin-top: 20px; padding: 14px 18px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); }
    .response-status { font-size: 1rem; font-weight: 700; color: var(--accent-2); }
    .response-status.is-error { color: var(--danger); }
    .response-body { font-size: 0.8125rem; color: var(--text-muted); margin-top: 6px; }
  `,
})
export class FailureSimulator {
  protected readonly options = OPTIONS;
  protected readonly failAt = signal<FailurePoint>('none');
  protected readonly stages = computed(() => runRequestPipeline(this.failAt()));
  protected readonly response = computed(() => responseForFailure(this.failAt()));
}
