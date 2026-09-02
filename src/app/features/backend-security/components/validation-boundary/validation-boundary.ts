import { Component, computed, signal } from '@angular/core';

type CheckId = 'syntactic' | 'semantic' | 'type' | 'allowlist' | 'length' | 'range';

interface ValidationCheck {
  id: CheckId;
  name: string;
  question: string;
  example: string;
}

const CHECKS: ValidationCheck[] = [
  { id: 'syntactic', name: 'Syntactic validation', question: 'Is this a well-formed email address?', example: `"a@b.com" passes · "not-an-email" fails` },
  { id: 'semantic', name: 'Semantic validation', question: 'Does this date make sense in context?', example: `delivery date "2024-01-01" (past) fails · "2026-12-01" passes` },
  { id: 'type', name: 'Type validation', question: 'Is this actually a number, not a string?', example: `quantity = 4 passes · quantity = "four" fails` },
  { id: 'allowlist', name: 'Allowlists', question: 'Is this value one of a known-safe set?', example: `country = "US" passes · country = "XX" fails` },
  { id: 'length', name: 'Length limits', question: 'Is this within a sane size?', example: `username length 3-32 · a 4,000-char username fails` },
  { id: 'range', name: 'Range limits', question: 'Is this numeric value within bounds?', example: `age 0-130 passes · age = -5 fails` },
];

@Component({
  selector: 'app-validation-boundary',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="validation-boundary">
      <div class="container">
        <p class="lab-index">07 — INPUT VALIDATION AS A SECURITY BOUNDARY</p>
        <h2 class="lab-title">Frontend validation is UX. Backend validation is the boundary.</h2>
        <p class="lab-lede">
          The browser's form validation exists to give users fast, friendly feedback. It runs on a machine the
          attacker fully controls — so it stops nobody who doesn't want to be stopped.
        </p>

        <div class="lab-panel">
          <p class="lab-node block-label">THE NORMAL PATH</p>
          <div class="flow-diagram">
            <div class="flow-node-box client">
              <p class="lab-node">CLIENT</p>
              <p class="node-caption">browser form</p>
            </div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-node-box">
              <p class="lab-node">VALIDATION</p>
              <p class="node-caption">frontend checks</p>
            </div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-node-box">
              <p class="lab-node">BUSINESS LOGIC</p>
              <p class="node-caption">application code</p>
            </div>
            <span class="flow-arrow" aria-hidden="true">&rarr;</span>
            <div class="flow-node-box db">
              <p class="lab-node">DATABASE</p>
              <p class="node-caption">persisted state</p>
            </div>
          </div>

          <p class="lab-btn-row toggle-row">
            <button type="button" class="lab-btn lab-btn-danger" [class.is-active]="showAttack()" [attr.aria-pressed]="showAttack()" (click)="showAttack.set(!showAttack())">
              {{ showAttack() ? 'Hide attacker path' : 'Show attacker bypassing the browser' }}
            </button>
          </p>

          @if (showAttack()) {
            <div class="attack-diagram">
              <div class="flow-node-box client crossed-out">
                <p class="lab-node">CLIENT</p>
                <p class="node-caption strike">&#10060; frontend validation</p>
              </div>

              <div class="attacker-branch">
                <div class="flow-node-box attacker-box">
                  <p class="lab-node attacker-label">ATTACKER</p>
                  <p class="node-caption">raw HTTP client — curl, script, proxy</p>
                </div>
                <span class="flow-arrow attack-arrow" aria-hidden="true">&rarr;</span>
                <div class="flow-node-box" [class.is-attack-target]="!backendValidationOn()">
                  <p class="lab-node">{{ backendValidationOn() ? 'VALIDATION' : 'BUSINESS LOGIC' }}</p>
                  <p class="node-caption" [class.status-attack]="!backendValidationOn()">
                    {{ backendValidationOn() ? 'backend checks intercept it' : 'no backend checks — request lands here raw' }}
                  </p>
                </div>
              </div>

              <p class="lab-note attack-note">
                The attacker skips the browser entirely and sends a request straight to the API. Every check that
                only ran in JavaScript never executes. Whatever the client would normally have sent — and
                <strong>anything else</strong> — can be sent instead. If validation doesn't exist on the server,
                the request lands directly in business logic, unvalidated.
              </p>
            </div>
          }

          <div class="lab-btn-row toggle-row">
            <button type="button" class="lab-btn" [class.is-active]="backendValidationOn()" (click)="backendValidationOn.set(true)">BACKEND VALIDATION: ON</button>
            <button type="button" class="lab-btn" [class.is-active]="!backendValidationOn()" (click)="backendValidationOn.set(false)">BACKEND VALIDATION: OFF</button>
          </div>

          <p class="lab-node block-label">KINDS OF BACKEND VALIDATION</p>
          <div class="checks-grid" role="list">
            @for (c of checks; track c.id) {
              <button
                type="button"
                role="listitem"
                class="check-card"
                [class.is-active]="activeCheck() === c.id"
                [attr.aria-pressed]="activeCheck() === c.id"
                (click)="toggleCheck(c.id)"
              >
                <span class="check-name mono">{{ c.name }}</span>
                <span class="check-question">{{ c.question }}</span>
                @if (activeCheck() === c.id) {
                  <span class="check-example mono">{{ c.example }}</span>
                }
              </button>
            }
          </div>
        </div>

        <p class="lab-note">
          <strong>Validation reduces the accepted input space.</strong> Every check above narrows what "valid"
          means before that data reaches business logic or storage.
        </p>
        <p class="lab-note lab-note-warn">
          Validation alone does not prevent every injection vulnerability. A string can be syntactically valid —
          the right length, the right type, even on an allowlist — and still be a SQL injection payload if it's
          later concatenated into a query. Validation is a complementary control, not a replacement for things
          like parameterized queries.
        </p>
      </div>
    </section>
  `,
  styles: `
    :host {
      --trust: #4ade80;
      --suspicious: var(--accent);
      --attack: var(--danger);
      --compromised: #dc2626;
      --blocked: #4fd3e8;
      --c-client: var(--accent-2);
      --c-server: #60a5fa;
      --c-db: #a78bfa;
      --c-attacker: #f472b6;
      display: block;
    }

    .block-label { margin-top: 26px; margin-bottom: 12px; }

    .flow-diagram, .attack-diagram .attacker-branch {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .flow-node-box {
      padding: 14px 16px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      min-width: 120px;
      text-align: center;
    }
    .flow-node-box.client { border-color: var(--c-client); }
    .flow-node-box.db { border-color: var(--c-db); }
    .node-caption { margin-top: 6px; font-size: 0.75rem; color: var(--text-muted); }
    .flow-arrow { color: var(--text-faint); font-size: 1.1rem; }

    .toggle-row { margin-top: 20px; }

    .attack-diagram { margin-top: 8px; padding: 18px; background: var(--surface); border: 1px dashed var(--c-attacker); border-radius: var(--radius-lg); }
    .crossed-out { opacity: 0.6; }
    .strike { color: var(--attack); text-decoration: line-through; }
    .attacker-branch { margin-top: 16px; }
    .attacker-box { border-color: var(--c-attacker); background: color-mix(in srgb, var(--c-attacker) 10%, var(--surface)); }
    .attacker-label { color: var(--c-attacker); }
    .attack-arrow { color: var(--attack); }
    .flow-node-box.is-attack-target { border-color: var(--attack); }
    .status-attack { color: var(--attack); font-weight: 600; }
    .attack-note { margin-top: 16px; max-width: 100%; }

    .checks-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; }
    .check-card {
      display: flex; flex-direction: column; gap: 6px; text-align: left;
      padding: 14px 16px; background: var(--surface); border: 1px solid var(--border);
      border-radius: var(--radius-md); color: var(--text); font-family: inherit;
      transition: border-color 0.15s ease, background 0.15s ease;
    }
    .check-card:hover { border-color: var(--accent); }
    .check-card.is-active { border-color: var(--blocked); background: color-mix(in srgb, var(--blocked) 10%, var(--surface)); }
    .check-name { font-size: 0.8125rem; font-weight: 700; }
    .check-question { font-size: 0.8125rem; color: var(--text-muted); }
    .check-example { margin-top: 4px; font-size: 0.75rem; color: var(--blocked); }
  `,
})
export class ValidationBoundary {
  protected readonly checks = CHECKS;

  protected readonly showAttack = signal(false);
  protected readonly backendValidationOn = signal(true);
  protected readonly activeCheck = signal<CheckId | null>('syntactic');

  protected toggleCheck(id: CheckId): void {
    this.activeCheck.set(this.activeCheck() === id ? null : id);
  }
}
