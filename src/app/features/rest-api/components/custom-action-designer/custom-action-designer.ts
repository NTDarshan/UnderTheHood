import { Component, computed, signal } from '@angular/core';

interface DesignOption {
  id: string;
  code: string;
  verdict: 'clean' | 'reasonable' | 'weak';
  reasoning: string;
}

const OPTIONS: DesignOption[] = [
  {
    id: 'verb-path',
    code: 'POST /archiveProject',
    verdict: 'weak',
    reasoning: 'This is the one clearly weak option: the verb lives in the path with no resource identifier at all. It reads more like an RPC function call than a REST resource operation, and it does not say which project is being archived.',
  },
  {
    id: 'sub-resource-action',
    code: 'POST /projects/123/archive',
    verdict: 'reasonable',
    reasoning: 'A reasonable choice if you treat "archive" as a command/action that doesn\'t map cleanly onto a plain resource-state edit. The URL still identifies the resource (project 123) and the action reads as a sub-resource, which is a common, accepted REST convention for actions.',
  },
  {
    id: 'patch',
    code: 'PATCH /projects/123',
    verdict: 'clean',
    reasoning: 'The most resource-oriented option, if archiving is modeled as a state transition — e.g. { "status": "archived" }. This treats "archived" as just another value of the project\'s status field, which keeps the API uniform: one PATCH endpoint per resource instead of a new endpoint per action.',
  },
  {
    id: 'delete',
    code: 'DELETE /projects/123',
    verdict: 'weak',
    reasoning: 'Archiving is not deleting — the project still exists and is expected to be retrievable/restorable. DELETE communicates removal, which is a different (and stronger) claim than "hidden but recoverable."',
  },
];

interface Scenario {
  id: string;
  label: string;
  canBeStateChange: boolean;
  patchGuidance: string;
  postGuidance: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: 'activate-user',
    label: 'Activate user',
    canBeStateChange: true,
    patchGuidance: 'PATCH /users/9 { "status": "active" } — activation is a value on the user\'s status field.',
    postGuidance: 'Only reach for POST /users/9/activate if activation triggers complex side effects (e.g. sending emails, provisioning) beyond a simple field change.',
  },
  {
    id: 'cancel-subscription',
    label: 'Cancel subscription',
    canBeStateChange: true,
    patchGuidance: 'PATCH /subscriptions/9 { "status": "cancelled" } — cancellation is a state the subscription resource can be in.',
    postGuidance: 'POST /subscriptions/9/cancel is reasonable if cancellation triggers billing/refund processing that goes beyond flipping a field.',
  },
  {
    id: 'clone-project',
    label: 'Clone project',
    canBeStateChange: false,
    patchGuidance: 'Cloning doesn\'t change project 123 at all — it creates a brand-new resource, so PATCH on the original doesn\'t fit.',
    postGuidance: 'POST /projects/123/clone (or POST /projects with a sourceId) — a new resource is being created, which is exactly what POST is for.',
  },
  {
    id: 'send-invitation',
    label: 'Send invitation',
    canBeStateChange: false,
    patchGuidance: 'Sending an invitation is not a state change on an existing resource — no field on any resource simply flips to "invited" as the whole story.',
    postGuidance: 'POST /projects/123/invitations creates a new invitation resource, or POST /projects/123/invite triggers the send — either way this is process-triggering, POST\'s job.',
  },
  {
    id: 'generate-report',
    label: 'Generate report',
    canBeStateChange: false,
    patchGuidance: 'A report is a new artifact being produced, not an edit to project 123\'s existing fields.',
    postGuidance: 'POST /projects/123/reports (creates a report resource, possibly 202 Accepted for async processing) — this is triggering processing, not editing state.',
  },
];

@Component({
  selector: 'app-custom-action-designer',
  standalone: true,
  template: `
    <section class="lab-section" id="custom-actions">
      <div class="container">
        <p class="lab-index">REST API / 14 — CUSTOM ACTIONS</p>
        <h2 class="lab-title">Requirement: "Archive a project." Which design fits?</h2>
        <p class="lab-lede">There isn't one universally "correct" answer here — some of these are genuinely defensible, judged by different reasoning. One is just clearly weak. Pick one to see the reasoning behind it.</p>

        <div class="lab-panel">
          <div class="option-grid">
            @for (o of options; track o.id) {
              <button type="button" class="option-card" [class.is-active]="selected() === o.id" (click)="selected.set(o.id)">
                <span class="tok-method">{{ o.code.split(' ')[0] }}</span>
                <span class="tok-key option-path">{{ o.code.split(' ')[1] }}</span>
              </button>
            }
          </div>

          @if (selectedOption(); as opt) {
            <div class="reasoning-box" [class.is-clean]="opt.verdict === 'clean'" [class.is-reasonable]="opt.verdict === 'reasonable'" [class.is-weak]="opt.verdict === 'weak'">
              <span class="pill" [class.pill-yes]="opt.verdict !== 'weak'" [class.pill-no]="opt.verdict === 'weak'">{{ opt.verdict }}</span>
              <p class="reasoning-text">{{ opt.reasoning }}</p>
            </div>
          }
        </div>

        <div class="lab-panel">
          <p class="lab-node">MINI-GAME — REASON THROUGH FIVE MORE SCENARIOS</p>
          <p class="lab-note">For each scenario, ask: is this fundamentally a state transition on an existing resource? Toggle to check your reasoning.</p>

          <div class="scenario-list">
            @for (s of scenarios; track s.id) {
              <div class="scenario-row">
                <p class="scenario-label">{{ s.label }}</p>
                <button type="button" class="lab-btn" (click)="toggleScenario(s.id)">
                  Can this be a resource state change? {{ isRevealed(s.id) ? (s.canBeStateChange ? 'Yes' : 'No') : '?' }}
                </button>
                @if (isRevealed(s.id)) {
                  <p class="lab-note scenario-guidance">
                    <strong>{{ s.canBeStateChange ? 'PATCH-friendly:' : 'POST-action:' }}</strong>
                    {{ s.canBeStateChange ? s.patchGuidance : s.postGuidance }}
                  </p>
                }
              </div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .option-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-top: 8px; }
    .option-card { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); font-family: var(--font-mono); font-size: 0.8125rem; }
    .option-card:hover { border-color: var(--accent-dim); }
    .option-card.is-active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--surface)); }
    .option-path { word-break: break-all; }

    .reasoning-box { margin-top: 20px; padding: 16px 18px; border-radius: var(--radius-md); background: var(--surface); border: 1px solid var(--border-strong); display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
    .reasoning-box.is-weak { border-color: var(--accent-dim); }
    .reasoning-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }

    .scenario-list { margin-top: 20px; display: flex; flex-direction: column; gap: 14px; }
    .scenario-row { padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .scenario-label { font-weight: 600; color: var(--text); margin-bottom: 10px; }
    .scenario-guidance { margin-top: 12px; }

    @media (max-width: 640px) {
      .option-grid { grid-template-columns: 1fr; }
    }
  `,
})
export class CustomActionDesigner {
  protected readonly options = OPTIONS;
  protected readonly scenarios = SCENARIOS;

  protected readonly selected = signal<string | null>(null);
  protected readonly revealed = signal<Set<string>>(new Set());

  protected readonly selectedOption = computed(() => this.options.find((o) => o.id === this.selected()) ?? null);

  toggleScenario(id: string): void {
    const set = new Set(this.revealed());
    if (set.has(id)) set.delete(id);
    else set.add(id);
    this.revealed.set(set);
  }

  protected isRevealed(id: string): boolean {
    return this.revealed().has(id);
  }
}
