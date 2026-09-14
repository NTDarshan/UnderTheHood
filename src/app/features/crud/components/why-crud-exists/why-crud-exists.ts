import { Component } from '@angular/core';

interface CrudStep {
  id: string;
  verb: string;
  label: string;
  desc: string;
}

const STEPS: CrudStep[] = [
  { id: 'create', verb: 'Create it', label: 'CREATE', desc: 'Make the thing exist for the first time.' },
  { id: 'read', verb: 'Find it', label: 'READ', desc: 'Look the thing up, list it, or search for it.' },
  { id: 'update', verb: 'Change it', label: 'UPDATE', desc: 'Modify the thing once it already exists.' },
  { id: 'delete', verb: 'Remove it', label: 'DELETE', desc: 'Make the thing stop existing.' },
];

const RESOURCES = ['Users', 'Orders', 'Products', 'Invoices', 'Books', 'Comments'];

@Component({
  selector: 'app-why-crud-exists',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section cr-scene" id="why-crud-exists">
      <div class="container">
        <p class="lab-index mono">02 — FIRST PRINCIPLES</p>
        <h2 class="lab-title">What does an application actually do with data?</h2>
        <p class="lab-lede">
          Forget databases and HTTP for a moment. Start from the simplest possible question: once something needs to
          exist inside a system, what can you ever do to it?
        </p>

        <div class="lab-panel">
          <div class="premise mono">"A user wants information to exist."</div>

          <div class="flow">
            @for (step of steps; track step.id; let last = $last) {
              <div class="flow-step">
                <span class="flow-verb">{{ step.verb }}</span>
                <div class="flow-node" [attr.data-op]="step.id">
                  <span class="flow-label mono">{{ step.label }}</span>
                  <span class="flow-desc">{{ step.desc }}</span>
                </div>
              </div>
              @if (!last) {
                <div class="flow-arrow mono" aria-hidden="true">&darr;</div>
              }
            }
          </div>

          <p class="lab-note">
            CRUD describes the four fundamental operations performed on any persistent resource &mdash; anything a
            system needs to remember beyond a single request. Whatever the resource is, it eventually needs some
            combination of these four:
          </p>

          <div class="resource-row" role="list" aria-label="Example resources">
            @for (r of resources; track r) {
              <span class="pill resource-pill" role="listitem">{{ r }}</span>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .cr-scene {
      --cr-accent: var(--accent);
      --cr-cyan: var(--accent-2);
      --cr-violet: #a78bfa;
      --cr-success: #4ade80;
      --cr-warning: #fbbf24;
      --cr-danger: var(--danger);
    }

    .premise {
      text-align: center;
      font-size: 1.0625rem;
      color: var(--text);
      padding: 18px 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      max-width: 480px;
      margin-inline: auto;
    }

    .flow { display: flex; flex-direction: column; align-items: center; gap: 4px; margin-top: 28px; }
    .flow-step { display: flex; flex-direction: column; align-items: center; gap: 10px; width: 100%; max-width: 360px; }
    .flow-verb { font-size: 0.8125rem; color: var(--text-faint); }
    .flow-arrow { color: var(--text-faint); font-size: 0.9375rem; line-height: 1; margin: 2px 0; }

    .flow-node {
      width: 100%;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
      padding: 14px 18px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;
    }
    .flow-node[data-op='create'] { border-color: color-mix(in srgb, var(--cr-accent) 55%, var(--border-strong)); }
    .flow-node[data-op='read'] { border-color: color-mix(in srgb, var(--cr-cyan) 55%, var(--border-strong)); }
    .flow-node[data-op='update'] { border-color: color-mix(in srgb, var(--cr-warning) 55%, var(--border-strong)); }
    .flow-node[data-op='delete'] { border-color: color-mix(in srgb, var(--cr-danger) 55%, var(--border-strong)); }

    .flow-label { font-size: 0.9375rem; font-weight: 700; letter-spacing: 0.06em; color: var(--text); flex-shrink: 0; }
    .flow-node[data-op='create'] .flow-label { color: var(--cr-accent); }
    .flow-node[data-op='read'] .flow-label { color: var(--cr-cyan); }
    .flow-node[data-op='update'] .flow-label { color: var(--cr-warning); }
    .flow-node[data-op='delete'] .flow-label { color: var(--cr-danger); }

    .flow-desc { font-size: 0.8125rem; color: var(--text-muted); text-align: right; }

    .resource-row {
      margin-top: 16px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .resource-pill { color: var(--text-muted); }
  `,
})
export class WhyCrudExists {
  protected readonly steps = STEPS;
  protected readonly resources = RESOURCES;
}
