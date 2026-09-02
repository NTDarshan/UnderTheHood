import { Component, computed, signal } from '@angular/core';

const CHAIN_FILENAME = 'photo.jpg; cat /etc/passwd';

interface Defense {
  name: string;
  mechanism: string;
}

const DEFENSES: Defense[] = [
  { name: 'Avoid shell invocation when possible', mechanism: 'call the underlying library/API directly instead of spawning a shell' },
  { name: 'Use safe APIs that take arguments as an array', mechanism: 'arguments are passed as discrete values, not a single interpreted string' },
  { name: 'Validate against an allowlist', mechanism: 'only permit values that match a known-safe set or pattern' },
  { name: 'Separate data from commands', mechanism: 'the same data-vs-code boundary as SQL injection — input stays a value, never becomes syntax' },
  { name: 'Use least privilege', mechanism: "the process running the command shouldn't have broad filesystem/network access" },
];

@Component({
  selector: 'app-command-injection',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="command-injection">
      <div class="container">
        <p class="lab-index">06 — COMMAND INJECTION</p>
        <h2 class="lab-title">When user input reaches a shell, your filename can become a second command.</h2>
        <p class="lab-lede">
          Imagine a feature that "converts" an uploaded file by shelling out to a command-line tool. The filename
          the user chose gets pasted directly into that command. Edit the filename below and watch the constructed
          shell command update live.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row" role="group" aria-label="Command construction mode">
            <button
              type="button"
              class="lab-btn lab-btn-danger"
              [class.is-active]="!fixed()"
              [attr.aria-pressed]="!fixed()"
              (click)="fixed.set(false)"
            >
              VULNERABLE — shell string
            </button>
            <button
              type="button"
              class="lab-btn lab-btn-primary"
              [class.is-active]="fixed()"
              [attr.aria-pressed]="fixed()"
              (click)="fixed.set(true)"
            >
              FIXED — array invocation
            </button>
          </div>

          <div class="flow-row">
            <div class="lab-field filename-field">
              <label for="ci-filename">Filename (user input)</label>
              <input
                id="ci-filename"
                type="text"
                [value]="filename()"
                (input)="setFilename($event)"
                autocomplete="off"
                spellcheck="false"
              />
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" (click)="applyChain()">Try command chaining</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <div class="pipeline mono">
            <span class="lab-node">USER INPUT</span>
            <span class="lab-flow-arrow">&rarr;</span>
            <span class="lab-node">APPLICATION</span>
            <span class="lab-flow-arrow">&rarr;</span>
            <span class="lab-node">OS COMMAND</span>
          </div>

          @if (!fixed()) {
            <p class="lab-node block-label">CONSTRUCTED SHELL COMMAND</p>
            <div class="lab-code" aria-live="polite">
              <span class="tok-key">convert </span
              ><span class="attacker-span" [class.is-injected]="isChain()">{{ safePart() }}</span
              >@if (isChain()) {<span class="chained-cmd">{{ chainedPart() }}</span>}
            </div>

            @if (isChain()) {
              <p class="lab-note query-explainer">
                The shell treats <code class="mono">;</code> as a command separator. What was meant to be a single
                filename argument is split into <em>two commands</em>: the intended
                <code class="mono">convert photo.jpg</code>, and an entirely separate injected
                <code class="mono">cat /etc/passwd</code> that runs right after it. The vulnerability isn't the
                specific command used to demonstrate it — it's that untrusted input reached a command interpreter in
                a way that let it break out of the intended single command.
              </p>
            }

            <div class="outcome-panel is-attack">
              @if (isChain()) {
                <p class="outcome-status mono status-attack">TWO COMMANDS EXECUTED — the shell ran both</p>
              } @else {
                <p class="outcome-status mono status-neutral">one command executed, as intended</p>
              }
            </div>
          } @else {
            <p class="lab-node block-label">FIXED — ARRAY-STYLE INVOCATION (no shell parsing)</p>
            <div class="lab-code" aria-live="polite">
              <span class="tok-key">execFile(</span><span class="tok-status-ok">'convert'</span
              ><span class="tok-key">, [</span><span class="placeholder">{{ quoted(filename()) }}</span
              ><span class="tok-key">])</span>
            </div>
            <p class="lab-note alt-syntax mono">
              -- the entire string, semicolons included, is passed as ONE argument value
            </p>

            <div class="outcome-panel is-blocked">
              <p class="outcome-status mono status-blocked">
                BLOCKED — no shell involved, so there is nothing to break out of.
              </p>
              <p class="outcome-sub">
                @if (isChain()) {
                  <code class="mono">{{ filename() }}</code> is treated as a single, literal filename argument. It's
                  an invalid filename (convert will fail to find it), but it can never spawn a second command —
                  there's no shell interpreting <code class="mono">;</code> as a separator.
                } @else {
                  The filename — whatever it contains — is handed to the program as one argument slot, never
                  concatenated into a string a shell has to parse.
                }
              </p>
            </div>
          }

          <div class="impact-grid">
            <div class="impact-card">
              <p class="impact-title mono status-attack">Read files</p>
              <p class="impact-body">Injected commands can read arbitrary files the process has access to.</p>
            </div>
            <div class="impact-card">
              <p class="impact-title mono status-attack">Modify files</p>
              <p class="impact-body">The same channel can write or overwrite data the application owns.</p>
            </div>
            <div class="impact-card">
              <p class="impact-title mono status-attack">Execute unintended commands</p>
              <p class="impact-body">Any binary reachable by the process can potentially be invoked.</p>
            </div>
            <div class="impact-card">
              <p class="impact-title mono status-attack">Compromise the environment</p>
              <p class="impact-body">Environment variables, network access, and credentials available to the process are exposed.</p>
            </div>
          </div>

          <p class="lab-node block-label">SAFER ALTERNATIVES</p>
          <ul class="defense-list">
            @for (d of defenses; track d.name) {
              <li class="defense-item">
                <span class="defense-name mono">{{ d.name }}</span>
                <span class="defense-mechanism">{{ d.mechanism }}</span>
              </li>
            }
          </ul>
        </div>
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

    .flow-row { margin-top: 20px; }
    .filename-field { max-width: 480px; }

    .pipeline { margin-top: 22px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }

    .block-label { margin-top: 26px; margin-bottom: 8px; }

    .attacker-span {
      color: var(--text);
      background: color-mix(in srgb, var(--c-attacker) 12%, transparent);
      border-bottom: 2px solid var(--c-attacker);
      padding: 0 2px;
      border-radius: 2px;
    }
    .attacker-span.is-injected {
      background: color-mix(in srgb, var(--attack) 18%, transparent);
      border-bottom-color: var(--attack);
    }
    .chained-cmd { color: var(--attack); font-weight: 700; background: color-mix(in srgb, var(--attack) 22%, transparent); padding: 0 2px; border-radius: 2px; }
    .placeholder { color: var(--blocked); font-weight: 700; }
    .alt-syntax { color: var(--text-faint); font-size: 0.75rem; }

    .outcome-panel { margin-top: 18px; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .outcome-panel.is-attack { border-color: var(--attack); }
    .outcome-panel.is-blocked { border-color: var(--blocked); }
    .outcome-status { font-size: 0.9375rem; font-weight: 700; }
    .outcome-sub { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); }
    .status-attack { color: var(--attack); }
    .status-blocked { color: var(--blocked); }
    .status-neutral { color: var(--text-muted); }

    .impact-grid { margin-top: 28px; display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 14px; }
    .impact-card { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .impact-title { font-size: 0.8125rem; }
    .impact-body { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }

    .defense-list { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
    .defense-item {
      display: flex; flex-direction: column; gap: 4px; padding: 12px 16px;
      background: var(--surface); border: 1px solid var(--border); border-left: 2px solid var(--blocked);
      border-radius: var(--radius-md);
    }
    .defense-name { font-size: 0.8125rem; color: var(--text); font-weight: 700; }
    .defense-mechanism { font-size: 0.8125rem; color: var(--text-muted); }
  `,
})
export class CommandInjection {
  protected readonly defenses = DEFENSES;

  protected readonly filename = signal('photo.jpg');
  protected readonly fixed = signal(false);

  protected readonly isChain = computed(() => this.filename().includes(';'));

  protected readonly safePart = computed(() => {
    const f = this.filename();
    const idx = f.indexOf(';');
    return idx === -1 ? f : f.slice(0, idx);
  });

  protected readonly chainedPart = computed(() => {
    const f = this.filename();
    const idx = f.indexOf(';');
    return idx === -1 ? '' : f.slice(idx);
  });

  protected setFilename(ev: Event): void {
    this.filename.set((ev.target as HTMLInputElement).value);
  }

  protected applyChain(): void {
    this.filename.set(CHAIN_FILENAME);
  }

  protected reset(): void {
    this.filename.set('photo.jpg');
  }

  protected quoted(value: string): string {
    return `'${value}'`;
  }
}
