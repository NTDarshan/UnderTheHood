import { Component, computed, signal } from '@angular/core';
import { Permission, Role, checkAccess } from '../../engine/auth-simulator';

interface Scenario {
  id: string;
  user: string;
  role: Role;
  department: string;
  action: Permission;
  route: string;
  resourceOwner?: string;
  resourceDepartment?: string;
}

const SCENARIOS: Scenario[] = [
  { id: 's1', user: 'Alice', role: 'viewer', department: 'finance', action: 'read', route: 'GET /documents/1' },
  { id: 's2', user: 'Alice', role: 'viewer', department: 'finance', action: 'delete', route: 'DELETE /documents/1' },
  { id: 's3', user: 'Bob', role: 'editor', department: 'engineering', action: 'update', route: 'PUT /documents/1', resourceOwner: 'Bob' },
  { id: 's4', user: 'Carol', role: 'admin', department: 'ops', action: 'delete', route: 'DELETE /documents/9' },
  { id: 's5', user: 'Dana', role: 'editor', department: 'finance', action: 'read', route: 'GET /reports/finance-q1', resourceOwner: 'Dana' },
  { id: 's6', user: 'Dana', role: 'editor', department: 'finance', action: 'update', route: 'PUT /reports/hr-q1', resourceOwner: 'Eli' },
];

@Component({
  selector: 'app-be-the-server-game',
  standalone: true,
  template: `
    <section class="lab-section" id="be-the-server">
      <div class="container">
        <p class="lab-index">AUTH / 38 — "BE THE SERVER"</p>
        <h2 class="lab-title">You are the authorization engine. Decide: allow or deny.</h2>

        <div class="lab-panel game-panel">
          <p class="game-progress mono">Scenario {{ index() + 1 }} / {{ scenarios.length }} · Score {{ score() }}</p>

          <div class="scenario-facts mono">
            <p>Identity: {{ current().user }}</p>
            <p>Role: {{ current().role }}</p>
            <p>Claims: department = {{ current().department }}</p>
            <p>Request: {{ current().route }}</p>
            @if (current().resourceOwner) {
              <p>Resource owner: {{ current().resourceOwner }}</p>
            }
          </div>

          @if (choice() === null) {
            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" (click)="choose(true)">ALLOW</button>
              <button type="button" class="lab-btn lab-btn-danger" (click)="choose(false)">DENY</button>
            </div>
          } @else {
            <div class="verdict" [class.is-right]="wasCorrect()">
              <p class="verdict-title mono">{{ wasCorrect() ? 'CORRECT' : 'INCORRECT' }}</p>
              <p class="verdict-body">Actual result: {{ actual().statusLabel }} — {{ actual().reason }}</p>
            </div>
            <div class="lab-btn-row">
              @if (index() < scenarios.length - 1) {
                <button type="button" class="lab-btn" (click)="next()">Next scenario →</button>
              } @else {
                <button type="button" class="lab-btn" (click)="restart()">↻ Play again</button>
              }
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .game-panel { margin-top: 24px; }
    .game-progress { font-size: 0.75rem; color: var(--text-faint); margin-bottom: 16px; }
    .scenario-facts { display: flex; flex-direction: column; gap: 4px; font-size: 0.8125rem; color: var(--text-muted); margin-bottom: 20px; }
    .scenario-facts p { color: var(--text); }

    .verdict { margin-top: 4px; margin-bottom: 16px; padding: 14px 16px; border-radius: var(--radius-sm); border-left: 3px solid var(--danger); background: var(--surface); }
    .verdict.is-right { border-left-color: var(--accent-2); }
    .verdict-title { font-size: 0.75rem; font-weight: 700; color: var(--danger); }
    .verdict.is-right .verdict-title { color: var(--accent-2); }
    .verdict-body { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; }
  `,
})
export class BeTheServerGame {
  protected readonly scenarios = SCENARIOS;
  protected readonly index = signal(0);
  protected readonly choice = signal<boolean | null>(null);
  protected readonly score = signal(0);

  protected readonly current = computed(() => this.scenarios[this.index()]);
  protected readonly actual = computed(() => {
    const s = this.current();
    return checkAccess(
      { name: s.user, role: s.role, department: s.department },
      s.action,
      s.resourceOwner ? { owner: s.resourceOwner, department: s.resourceDepartment ?? s.department } : undefined,
    );
  });

  protected readonly wasCorrect = computed(() => this.choice() === this.actual().authorized);

  choose(allow: boolean): void {
    this.choice.set(allow);
    if (allow === this.actual().authorized) this.score.update((s) => s + 1);
  }

  next(): void {
    this.index.update((i) => i + 1);
    this.choice.set(null);
  }

  restart(): void {
    this.index.set(0);
    this.choice.set(null);
    this.score.set(0);
  }
}
