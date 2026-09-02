import { Component, computed, signal } from '@angular/core';

type GrantKey = 'read' | 'write' | 'delete' | 'admin';

interface Grant {
  key: GrantKey;
  label: string;
  desc: string;
  /** Blast-radius contribution if this grant were abused by a compromised credential. */
  damage: string;
}

const GRANTS: Grant[] = [
  { key: 'read', label: 'READ database', desc: 'Query any row in any table.', damage: 'read every row in every table' },
  { key: 'write', label: 'WRITE database', desc: 'Insert or update rows.', damage: 'insert or corrupt rows' },
  { key: 'delete', label: 'DELETE database', desc: 'Remove rows or drop tables.', damage: 'delete rows or drop tables' },
  { key: 'admin', label: 'ADMIN database', desc: 'Change schema, create users, alter permissions.', damage: 'change schema and create new admin users' },
];

@Component({
  selector: 'app-least-privilege',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="least-privilege">
      <div class="container">
        <p class="lab-index">28 &mdash; LEAST PRIVILEGE</p>
        <h2 class="lab-title">Every credential should be able to do its job &mdash; and nothing else.</h2>
        <p class="lab-lede">
          Below is the database credential used by one backend service. It currently holds every permission the
          database supports. Toggle grants off and watch how much damage a leaked copy of this credential could
          actually do.
        </p>

        <div class="lab-panel">
          <p class="part-label mono">SERVICE IDENTITY &mdash; orders-api-credential</p>

          <div class="lab-btn-row" role="group" aria-label="Toggle permission grants">
            @for (g of grants; track g.key) {
              <button
                type="button"
                class="lab-btn grant-btn"
                [class.is-active]="isGranted(g.key)"
                [class.grant-danger]="isGranted(g.key) && (g.key === 'delete' || g.key === 'admin')"
                [attr.aria-pressed]="isGranted(g.key)"
                (click)="toggle(g.key)"
              >
                <span class="grant-state mono" aria-hidden="true">{{ isGranted(g.key) ? '[x]' : '[ ]' }}</span>
                <span class="grant-label">{{ g.label }}</span>
              </button>
            }
          </div>

          <div class="stage">
            <div class="stage-side">
              <p class="side-label mono">CREDENTIAL STATE</p>
              <div class="identity-card" [class.identity-overprivileged]="riskLevel() === 'high'" [class.identity-safe]="riskLevel() === 'low'">
                <p class="identity-name mono">orders-api-credential</p>
                <p class="identity-risk mono" [class]="'risk-' + riskLevel()">
                  {{ riskLabel() }}
                </p>
                <ul class="identity-grants">
                  @for (g of grants; track g.key) {
                    <li [class.grant-off]="!isGranted(g.key)">
                      <span class="dot" [class.dot-on]="isGranted(g.key)" aria-hidden="true"></span>
                      {{ g.label }}
                    </li>
                  }
                </ul>
              </div>
            </div>

            <div class="stage-side">
              <p class="side-label mono">BLAST RADIUS IF LEAKED</p>
              <svg class="blast-svg" viewBox="0 0 220 220" role="img" [attr.aria-label]="blastAriaLabel()">
                <rect x="70" y="70" width="80" height="80" rx="8" class="db-rect" />
                <text x="110" y="115" text-anchor="middle" class="db-text mono">DB</text>
                <circle cx="110" cy="110" [attr.r]="blastRadiusPx()" class="blast-circle" [class]="'blast-' + riskLevel()" />
              </svg>
              <p class="blast-readout">
                A leaked copy of this credential could: <strong>{{ blastSummary() }}</strong>
              </p>
            </div>
          </div>

          <p class="lab-note" [class.lab-note-warn]="riskLevel() === 'high'">
            <strong>Give every identity only the permissions required to perform its actual job</strong> &mdash;
            if this credential is ever compromised, the damage is limited to what it could legitimately do anyway.
          </p>
          <p class="lab-note">
            This isn't specific to database credentials. The same principle applies to API keys, service accounts,
            and even human users' admin access &mdash; scope every grant to the narrowest set of actions the job
            actually requires.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      --trust: #4ade80;
      --suspicious: var(--accent);
      --attack: var(--danger);
      --compromised: #dc2626;
      --blocked: #4fd3e8;
      --c-client: var(--accent-2);
      --c-server: #60a5fa;
      --c-db: #a78bfa;
      --c-attacker: #f472b6;
    }

    .part-label { color: var(--text-faint); letter-spacing: 0.12em; font-size: 0.75rem; }

    .grant-btn { flex-direction: row; align-items: center; gap: 10px; }
    .grant-state { font-size: 0.8125rem; color: var(--text-faint); }
    .grant-btn.is-active .grant-state { color: var(--trust); }
    .grant-btn.grant-danger.is-active { border-color: var(--attack); background: color-mix(in srgb, var(--attack) 16%, var(--surface-elevated)); }
    .grant-btn.grant-danger.is-active .grant-state { color: var(--attack); }
    .grant-label { font-family: var(--font-sans); font-size: 0.8125rem; letter-spacing: normal; text-transform: none; font-weight: 600; }

    .stage {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
      margin-top: 28px;
    }
    @media (min-width: 720px) {
      .stage { grid-template-columns: 1fr 1fr; }
    }

    .side-label { color: var(--text-faint); letter-spacing: 0.1em; font-size: 0.6875rem; margin-bottom: 10px; }

    .identity-card {
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      padding: 16px 18px;
      transition: border-color 0.2s ease, background 0.2s ease;
    }
    .identity-overprivileged { border-color: var(--attack); box-shadow: 0 0 0 1px color-mix(in srgb, var(--attack) 30%, transparent); }
    .identity-safe { border-color: var(--trust); }
    .identity-name { font-size: 0.8125rem; color: var(--text); }
    .identity-risk { margin-top: 6px; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; }
    .risk-high { color: var(--attack); }
    .risk-medium { color: var(--suspicious); }
    .risk-low { color: var(--trust); }

    .identity-grants { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; }
    .identity-grants li { display: flex; align-items: center; gap: 8px; font-size: 0.8125rem; color: var(--text-muted); font-family: var(--font-mono); }
    .identity-grants li.grant-off { color: var(--text-faint); text-decoration: line-through; opacity: 0.6; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--border-strong); flex-shrink: 0; }
    .dot-on { background: var(--attack); box-shadow: 0 0 6px color-mix(in srgb, var(--attack) 60%, transparent); }

    .blast-svg { width: 100%; max-width: 260px; height: auto; display: block; }
    .db-rect { fill: var(--surface-elevated); stroke: var(--c-db); stroke-width: 2; }
    .db-text { fill: var(--c-db); font-size: 13px; font-weight: 700; letter-spacing: 0.06em; }

    .blast-circle {
      fill: color-mix(in srgb, var(--attack) 16%, transparent);
      stroke-width: 1.5;
      transition: r 0.4s ease, fill 0.4s ease, stroke 0.4s ease;
    }
    .blast-high { stroke: var(--attack); fill: color-mix(in srgb, var(--attack) 22%, transparent); }
    .blast-medium { stroke: var(--suspicious); fill: color-mix(in srgb, var(--suspicious) 16%, transparent); }
    .blast-low { stroke: var(--trust); fill: color-mix(in srgb, var(--trust) 12%, transparent); }

    .blast-readout { margin-top: 12px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6; max-width: 320px; }
    .blast-readout strong { color: var(--text); }
  `,
})
export class LeastPrivilege {
  protected readonly grants = GRANTS;

  private readonly granted = signal<Set<GrantKey>>(new Set(['read', 'write', 'delete', 'admin']));

  isGranted(key: GrantKey): boolean {
    return this.granted().has(key);
  }

  toggle(key: GrantKey): void {
    const next = new Set(this.granted());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.granted.set(next);
  }

  protected readonly grantedCount = computed(() => this.granted().size);

  protected readonly riskLevel = computed<'high' | 'medium' | 'low'>(() => {
    const g = this.granted();
    if (g.has('admin') || g.has('delete')) return 'high';
    if (g.has('write')) return 'medium';
    return 'low';
  });

  protected readonly riskLabel = computed(() => {
    const level = this.riskLevel();
    if (level === 'high') return 'OVERPRIVILEGED';
    if (level === 'medium') return 'SCOPED — READ + WRITE';
    return 'MINIMAL — READ ONLY';
  });

  /** Blast radius area scales with number of grants; the DB square spans roughly r=57 to fully cover it. */
  protected readonly blastRadiusPx = computed(() => {
    const count = this.grantedCount();
    const min = 14;
    const max = 96;
    if (count === 0) return min;
    return min + ((max - min) * count) / 4;
  });

  protected readonly blastSummary = computed(() => {
    const g = this.granted();
    const active = this.grants.filter((grant) => g.has(grant.key));
    if (active.length === 0) return 'nothing — all grants are revoked.';
    return active.map((grant) => grant.damage).join('; ');
  });

  protected readonly blastAriaLabel = computed(
    () => `Blast radius: ${this.riskLabel()}. A leak could ${this.blastSummary()}.`
  );
}
