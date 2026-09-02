import { Component, computed, signal } from '@angular/core';

const BYPASS_USERNAME = `' OR '1'='1' --`;

@Component({
  selector: 'app-sql-injection-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="sql-injection">
      <div class="container">
        <p class="lab-index">04 — SQL INJECTION</p>
        <h2 class="lab-title">When user input becomes part of the query's grammar, not just its value.</h2>
        <p class="lab-lede">
          A login form asks for a username and password, then builds a SQL query by gluing those strings directly
          into the query text. Type into the fields below and watch the query update live — then try the classic
          bypass and see what happens when the "data" you typed rewrites the query's actual structure.
        </p>

        <div class="lab-panel">
          <div class="form-row">
            <div class="lab-field">
              <label for="sqli-username">Username</label>
              <input
                id="sqli-username"
                type="text"
                [value]="username()"
                (input)="setUsername($event)"
                autocomplete="off"
                spellcheck="false"
              />
            </div>
            <div class="lab-field">
              <label for="sqli-password">Password</label>
              <input
                id="sqli-password"
                type="text"
                [value]="password()"
                (input)="setPassword($event)"
                autocomplete="off"
                spellcheck="false"
              />
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" (click)="applyBypass()">Try a classic bypass</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <p class="lab-node block-label">CONSTRUCTED QUERY</p>
          <div class="lab-code query-code" aria-live="polite">
            <span class="tok-key">SELECT * FROM users WHERE username = '</span
            ><span class="attacker-span" [class.is-injected]="isBypass()">{{ username() }}</span
            ><span class="tok-key" [class.is-commented]="isBypass()">' AND password = '{{ password() }}'</span
            >@if (isBypass()) {<span class="comment-tail"> -- (rest of query, ignored)</span>}
          </div>

          @if (isBypass()) {
            <p class="lab-note query-explainer">
              The trailing <code class="mono">--</code> starts a SQL comment: everything after it — including the
              password check — is discarded by the database before it ever runs. The single quote you typed closed
              the query's own string literal early, so the rest of your input (<code class="mono">OR '1'='1'</code>)
              is parsed as new query <strong>logic</strong>, not as a value being searched for. The input crossed the
              boundary between "data" and "code."
            </p>
          }

          <div class="boundary-row">
            <div class="boundary-side">
              <p class="lab-node">TRUSTED QUERY STRUCTURE</p>
              <p class="boundary-desc">written by the developer, assumed fixed</p>
            </div>
            <div class="boundary-gap" [class.is-breached]="isBypass()">
              <span class="mono boundary-gap-label">{{ isBypass() ? 'BOUNDARY CROSSED' : 'boundary held' }}</span>
            </div>
            <div class="boundary-side">
              <p class="lab-node">ATTACKER-CONTROLLED DATA</p>
              <p class="boundary-desc">typed into a form field, assumed to just be a value</p>
            </div>
          </div>

          <p class="lab-node block-label">DATABASE — EXECUTION RESULT</p>
          <div class="exec-panel" [class.is-attack]="isBypass()">
            @if (isBypass()) {
              <p class="exec-status mono status-attack">1 ROW RETURNED — AUTHENTICATED AS: admin</p>
              <p class="exec-sub">
                The rewritten <code class="mono">WHERE '1'='1'</code> clause is always true, so the query matches
                the first row in the table regardless of any real credentials.
              </p>
            } @else if (username() || password()) {
              <p class="exec-status mono status-neutral">0 rows returned — no matching username/password</p>
              <p class="exec-sub">The input is being treated as literal data to match against, as intended.</p>
            } @else {
              <p class="exec-status mono status-neutral">awaiting input</p>
            }
          </div>

          <div class="impact-grid">
            <div class="impact-card">
              <p class="impact-title mono status-attack">Authentication bypass</p>
              <p class="impact-body">
                <code class="mono">' OR '1'='1' --</code> turns the WHERE clause into something always true,
                logging the attacker in as whichever row the database returns first.
              </p>
            </div>
            <div class="impact-card">
              <p class="impact-title mono status-attack">Data exposure</p>
              <p class="impact-body">
                <code class="mono">' UNION SELECT username, password_hash FROM users --</code> appends a second
                result set, pulling data the query was never meant to return.
              </p>
            </div>
            <div class="impact-card">
              <p class="impact-title mono status-attack">Data modification</p>
              <p class="impact-body">
                Where the input reaches a query that writes data, the same technique can alter or delete rows
                instead of just reading them.
              </p>
            </div>
          </div>
        </div>

        <p class="lab-note">
          <strong>The fix isn't smarter escaping — it's never mixing structure and data.</strong> Next up:
          parameterized queries, where the query's grammar is fixed ahead of time and user input can never become
          part of it.
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

    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; max-width: 560px; }
    @media (max-width: 560px) { .form-row { grid-template-columns: 1fr; } }

    .block-label { margin-top: 26px; margin-bottom: 8px; }

    .query-code { font-size: 0.875rem; }
    .attacker-span {
      color: var(--text);
      background: color-mix(in srgb, var(--c-attacker) 18%, transparent);
      border-bottom: 2px solid var(--c-attacker);
      padding: 0 2px;
      border-radius: 2px;
    }
    .attacker-span.is-injected {
      background: color-mix(in srgb, var(--attack) 22%, transparent);
      border-bottom-color: var(--attack);
      color: var(--attack);
      font-weight: 600;
    }
    .tok-key.is-commented { text-decoration: line-through; color: var(--text-faint); opacity: 0.6; }
    .comment-tail { color: var(--text-faint); font-style: italic; }

    .query-explainer { max-width: 100%; }

    .boundary-row {
      margin-top: 22px;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 14px;
    }
    @media (max-width: 640px) { .boundary-row { grid-template-columns: 1fr; text-align: center; } }
    .boundary-side { padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .boundary-desc { margin-top: 6px; font-size: 0.75rem; color: var(--text-muted); }
    .boundary-gap {
      font-family: var(--font-mono); font-size: 0.6875rem; font-weight: 700; letter-spacing: 0.08em;
      text-align: center; padding: 8px 10px; border: 1px dashed var(--border-strong); border-radius: var(--radius-sm);
      color: var(--trust); white-space: nowrap;
    }
    .boundary-gap.is-breached { color: var(--attack); border-color: var(--attack); background: color-mix(in srgb, var(--attack) 10%, transparent); }

    .exec-panel { margin-top: 8px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .exec-panel.is-attack { border-color: var(--attack); }
    .exec-status { font-size: 0.9375rem; font-weight: 700; }
    .exec-sub { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); }
    .status-attack { color: var(--attack); }
    .status-neutral { color: var(--text-muted); }

    .impact-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; }
    .impact-card { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .impact-title { font-size: 0.8125rem; letter-spacing: 0.02em; }
    .impact-body { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }
  `,
})
export class SqlInjectionLab {
  protected readonly username = signal('');
  protected readonly password = signal('');

  protected readonly isBypass = computed(() => this.username().includes(`' OR '1'='1' --`));

  protected setUsername(ev: Event): void {
    this.username.set((ev.target as HTMLInputElement).value);
  }

  protected setPassword(ev: Event): void {
    this.password.set((ev.target as HTMLInputElement).value);
  }

  protected applyBypass(): void {
    this.username.set(BYPASS_USERNAME);
    this.password.set('anything');
  }

  protected reset(): void {
    this.username.set('');
    this.password.set('');
  }
}
