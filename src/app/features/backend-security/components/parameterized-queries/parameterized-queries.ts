import { Component, computed, signal } from '@angular/core';

const BYPASS_USERNAME = `' OR '1'='1' --`;

type Mode = 'unsafe' | 'parameterized';

@Component({
  selector: 'app-parameterized-queries',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="parameterized-queries">
      <div class="container">
        <p class="lab-index">05 — PARAMETERIZED QUERIES</p>
        <h2 class="lab-title">Same malicious input. One path lets it rewrite the query. The other can't.</h2>
        <p class="lab-lede">
          Type the exact same attacker string into the same username field, then flip the mode. Nothing about the
          input changes — only whether the query lets that input become part of its structure.
        </p>

        <div class="lab-panel">
          <div class="lab-field username-field">
            <label for="pq-username">Username</label>
            <input
              id="pq-username"
              type="text"
              [value]="username()"
              (input)="setUsername($event)"
              autocomplete="off"
              spellcheck="false"
            />
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" (click)="applyBypass()">Fill with bypass string</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="lab-btn-row mode-row" role="group" aria-label="Query mode">
            <button
              type="button"
              class="lab-btn lab-btn-danger"
              [class.is-active]="mode() === 'unsafe'"
              [attr.aria-pressed]="mode() === 'unsafe'"
              (click)="mode.set('unsafe')"
            >
              UNSAFE — string concatenation
            </button>
            <button
              type="button"
              class="lab-btn lab-btn-primary"
              [class.is-active]="mode() === 'parameterized'"
              [attr.aria-pressed]="mode() === 'parameterized'"
              (click)="mode.set('parameterized')"
            >
              PARAMETERIZED — bound value
            </button>
          </div>

          @if (mode() === 'unsafe') {
            <p class="lab-node block-label">QUERY (built by concatenating input into the SQL string)</p>
            <div class="lab-code" aria-live="polite">
              <span class="tok-key">SELECT * FROM users WHERE username = '</span
              ><span class="attacker-span" [class.is-injected]="isBypass()">{{ username() }}</span
              ><span class="tok-key" [class.is-commented]="isBypass()">'</span
              >@if (isBypass()) {<span class="comment-tail"> -- (rest of query, ignored)</span>}
            </div>

            <div class="outcome-panel is-attack">
              @if (isBypass()) {
                <p class="outcome-status mono status-attack">BYPASS SUCCEEDED — 1 row returned, authenticated as: admin</p>
                <p class="outcome-sub">
                  The input's quotes and <code class="mono">--</code> were interpreted as query syntax. The
                  attacker string rewrote the WHERE clause itself.
                </p>
              } @else if (username()) {
                <p class="outcome-status mono status-neutral">0 rows returned — treated as a literal username, for now</p>
                <p class="outcome-sub">Nothing stops special characters here from being parsed as SQL structure.</p>
              } @else {
                <p class="outcome-status mono status-neutral">awaiting input</p>
              }
            </div>
          } @else {
            <p class="lab-node block-label">QUERY (fixed template, never modified by input)</p>
            <div class="lab-code" aria-live="polite">
              <span class="tok-key">SELECT * FROM users WHERE username = </span><span class="placeholder">?</span>
            </div>
            <p class="lab-code alt-syntax mono">-- equivalently: SELECT * FROM users WHERE username = @username</p>

            <div class="bind-flow">
              <div class="bind-box data-box">
                <p class="lab-node">DATA (bound parameter)</p>
                <p class="bind-value mono" [class.is-attacker]="isBypass()">{{ username() || '(empty)' }}</p>
                <p class="bind-caption">flows in as a value slot — never touches the query text</p>
              </div>
              <div class="bind-arrow" aria-hidden="true">&rarr;</div>
              <div class="bind-box query-box">
                <p class="lab-node">QUERY TEXT</p>
                <p class="bind-value mono unchanged">SELECT * FROM users WHERE username = ?</p>
                <p class="bind-caption">stays exactly this, no matter what the data slot contains</p>
              </div>
            </div>

            <div class="outcome-panel is-blocked">
              @if (username()) {
                <p class="outcome-status mono status-blocked">
                  BLOCKED — 0 rows found. No user has that literal username.
                </p>
                <p class="outcome-sub">
                  The database receives the entire string — quotes, <code class="mono">OR</code>,
                  <code class="mono">--</code>, all of it — as one opaque value to search for. It can never change
                  what the query means.
                </p>
              } @else {
                <p class="outcome-status mono status-neutral">awaiting input</p>
              }
            </div>
          }
        </div>

        <p class="lab-note">
          <strong>Parameterized queries separate SQL structure from values.</strong> The fix isn't "detect bad
          characters" — it's "never let input become code in the first place." The query's grammar is fixed before
          any user input exists; input can only ever fill a value slot, never rewrite the sentence around it.
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

    .username-field { max-width: 480px; }
    .mode-row { margin-top: 18px; }
    .block-label { margin-top: 26px; margin-bottom: 8px; }

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
    .placeholder { color: var(--blocked); font-weight: 700; }
    .alt-syntax { margin-top: 10px; color: var(--text-faint); font-size: 0.75rem; }

    .outcome-panel { margin-top: 18px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .outcome-panel.is-attack { border-color: var(--attack); }
    .outcome-panel.is-blocked { border-color: var(--blocked); }
    .outcome-status { font-size: 0.9375rem; font-weight: 700; }
    .outcome-sub { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); }
    .status-attack { color: var(--attack); }
    .status-blocked { color: var(--blocked); }
    .status-neutral { color: var(--text-muted); }

    .bind-flow {
      margin-top: 20px;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: stretch;
      gap: 14px;
    }
    @media (max-width: 640px) { .bind-flow { grid-template-columns: 1fr; } }
    .bind-box { padding: 14px 16px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); }
    .data-box { border-color: var(--trust); }
    .query-box { border-color: var(--border-strong); }
    .bind-value { margin-top: 8px; font-size: 0.8125rem; color: var(--text); word-break: break-word; }
    .bind-value.is-attacker { color: var(--trust); }
    .bind-value.unchanged { color: var(--text-muted); }
    .bind-caption { margin-top: 8px; font-size: 0.6875rem; color: var(--text-faint); }
    .bind-arrow { display: flex; align-items: center; justify-content: center; color: var(--trust); font-size: 1.25rem; }
    @media (max-width: 640px) { .bind-arrow { transform: rotate(90deg); } }
  `,
})
export class ParameterizedQueries {
  protected readonly username = signal('');
  protected readonly mode = signal<Mode>('unsafe');

  protected readonly isBypass = computed(() => this.username().includes(`' OR '1'='1' --`));

  protected setUsername(ev: Event): void {
    this.username.set((ev.target as HTMLInputElement).value);
  }

  protected applyBypass(): void {
    this.username.set(BYPASS_USERNAME);
  }

  protected reset(): void {
    this.username.set('');
  }
}
