import { Component, signal } from '@angular/core';

interface LifecycleStep {
  id: string;
  label: string;
  who: string;
  detail: string;
}

const STEPS: LifecycleStep[] = [
  {
    id: 'detect',
    label: 'Detect',
    who: 'monitoring',
    detail:
      'An automated check — an error-rate threshold, a latency SLO burn, a failed health check — notices the system is behaving abnormally before (ideally) a human does.',
  },
  {
    id: 'alert',
    label: 'Alert',
    who: 'on-call',
    detail:
      'The monitoring system pages whoever is on-call. Being "on-call" means carrying a pager (literally or via an app) for a rotation and being the first responder when production breaks, day or night.',
  },
  {
    id: 'investigate',
    label: 'Investigate',
    who: 'on-call',
    detail:
      'The on-call engineer works out what changed and why, using logs, metrics, and traces — this is incident response: the structured, time-pressured process of understanding and containing a live problem.',
  },
  {
    id: 'mitigate',
    label: 'Mitigate',
    who: 'on-call',
    detail:
      'A mitigation stops the bleeding fast — a rollback, a feature flag flip, a scale-up — without necessarily fixing the underlying root cause, the deepest condition that allowed the incident to happen.',
  },
  {
    id: 'recover',
    label: 'Recover',
    who: 'system',
    detail:
      'Metrics return to baseline and the incident is declared resolved. Recovery is not the end of the work — the mitigation bought time, but the root cause may still need a real, non-urgent fix.',
  },
  {
    id: 'learn',
    label: 'Learn',
    who: 'the team',
    detail:
      'The team writes a postmortem: a timeline of what happened, the root cause, what was done, and concrete follow-up actions to make this class of incident less likely or less painful next time.',
  },
];

@Component({
  selector: 'app-oncall-postmortem',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene postmortem-scene" id="oncall-postmortem">
      <div class="container">
        <p class="lab-index mono">24 — AFTER THE INCIDENT</p>
        <h2 class="lab-title">On-call, incident response, and the postmortem</h2>
        <p class="lab-lede">
          An incident isn't over when the graphs go green. Here's the full lifecycle a production incident moves
          through — click a step to see what it means.
        </p>

        <div class="lab-panel">
          <div class="stepper" role="group" aria-label="Incident lifecycle">
            @for (step of steps; track step.id; let i = $index) {
              <button
                type="button"
                class="step"
                [class.is-active]="activeId() === step.id"
                (click)="select(step.id)"
                [attr.aria-pressed]="activeId() === step.id"
              >
                <span class="step-index mono">{{ i + 1 }}</span>
                <span class="step-label mono">{{ step.label }}</span>
              </button>
              @if (i < steps.length - 1) {
                <span class="step-arrow" aria-hidden="true">&rarr;</span>
              }
            }
          </div>

          <div class="detail-panel">
            <p class="detail-who mono">{{ active().who.toUpperCase() }}</p>
            <p class="detail-text">{{ active().detail }}</p>
          </div>
        </div>

        <div class="callout-panel">
          <p class="callout-eyebrow mono">THE ONE THING TO REMEMBER</p>
          <p class="callout-text">
            The goal of a postmortem is learning and prevention, not blame.
          </p>
          <p class="callout-sub">
            Mature engineering organizations run <strong>blameless</strong> postmortems by design. The question is
            never "who broke it" — it's "what in our systems, processes, and defaults let this happen, and how do we
            change those so the next engineer in this situation succeeds instead of repeating it." Blame makes
            people hide mistakes; blamelessness is what makes people report them honestly, which is the only way an
            organization actually gets safer over time.
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
      --do-pending: #fbbf24;
    }

    .stepper { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
    .step {
      display: flex; align-items: center; gap: 8px; padding: 10px 14px; background: var(--surface);
      border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-muted);
      transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
    }
    .step:hover { border-color: var(--do-cyan); color: var(--text); }
    .step.is-active { border-color: var(--do-accent); color: var(--text); background: color-mix(in srgb, var(--do-accent) 10%, var(--surface)); }
    .step-index {
      display: inline-flex; align-items: center; justify-content: center; width: 20px; height: 20px;
      border-radius: 50%; background: var(--surface-elevated); border: 1px solid var(--border-strong);
      font-size: 0.6875rem; color: var(--text-faint);
    }
    .step.is-active .step-index { background: var(--do-accent); border-color: var(--do-accent); color: #1a0d04; }
    .step-label { font-size: 0.8125rem; font-weight: 600; }
    .step-arrow { color: var(--text-faint); font-size: 0.75rem; }

    .detail-panel { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
    .detail-who { font-size: 0.6875rem; letter-spacing: 0.1em; color: var(--do-cyan); margin: 0 0 8px; }
    .detail-text { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.65; max-width: 680px; }

    .callout-panel {
      margin-top: 24px; padding: 28px; border-radius: var(--radius-lg);
      background: linear-gradient(160deg, color-mix(in srgb, var(--do-accent) 14%, var(--surface-raised)), var(--surface-raised));
      border: 1px solid color-mix(in srgb, var(--do-accent) 45%, var(--border));
      box-shadow: 0 0 32px color-mix(in srgb, var(--do-accent) 12%, transparent);
    }
    .callout-eyebrow { font-size: 0.6875rem; letter-spacing: 0.14em; color: var(--do-accent); margin: 0 0 10px; }
    .callout-text { font-size: clamp(1.25rem, 1.05rem + 0.8vw, 1.625rem); font-weight: 700; color: var(--text); line-height: 1.35; max-width: 620px; }
    .callout-sub { margin-top: 16px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.65; max-width: 640px; }
    .callout-sub strong { color: var(--text); }
  `,
})
export class OncallPostmortem {
  protected readonly steps = STEPS;
  protected readonly activeId = signal('detect');

  protected readonly active = () => this.steps.find((s) => s.id === this.activeId()) ?? this.steps[0];

  protected select(id: string): void {
    this.activeId.set(id);
  }
}
