import { Component, computed, signal } from '@angular/core';

const HASH_CHARS = '0123456789abcdef';

/** Illustrative-only mixing function — NOT a real cryptographic hash. */
function illustrativeHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = (h1 ^ (h1 >>> 16)) >>> 0;
  h2 = (h2 ^ (h2 >>> 16)) >>> 0;
  const combined = (BigInt(h1) << 32n) | BigInt(h2);
  let hex = combined.toString(16).padStart(16, '0');
  let out = '';
  for (let i = 0; i < hex.length; i++) {
    out += HASH_CHARS[(parseInt(hex[i], 16) + i) % 16];
  }
  return out;
}

function randomSalt(): string {
  let s = '';
  for (let i = 0; i < 8; i++) {
    s += HASH_CHARS[Math.floor(Math.random() * 16)];
  }
  return s;
}

interface StolenRow {
  id: number;
  hash: string;
}

@Component({
  selector: 'app-password-security',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="password-security">
      <div class="container">
        <p class="lab-index">09 — PASSWORD SECURITY</p>
        <h2 class="lab-title">Passwords should never reach a database as plaintext.</h2>
        <p class="lab-lede">
          A well-built system never stores what a user typed. It stores the output of a one-way password-hashing
          function — combined with a random salt — and never the password itself.
        </p>

        <div class="lab-panel">
          <p class="lab-node">THE REAL FLOW</p>
          <div class="hash-flow" aria-label="Password hashing flow">
            <label class="lab-field pw-field">
              <label for="pw-input">Password (fictional example)</label>
              <input id="pw-input" type="text" [value]="password()" (input)="onPasswordInput($event)" placeholder="type anything…" />
            </label>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node salt-node">
              <span class="mono node-label">SALT</span>
              <span class="node-sub mono">{{ salt() }}</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node fn-node">
              <span class="mono node-label">bcrypt / scrypt / Argon2</span>
              <span class="node-sub">password hashing function (conceptual)</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node hash-node">
              <span class="mono node-label">SALTED HASH</span>
              <span class="node-sub mono">{{ currentHash() }}</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="flow-node db-node">
              <span class="mono node-label">DATABASE</span>
              <span class="node-sub">stores hash only</span>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="hashAgain()">Hash again (new salt)</button>
          </div>

          @if (history().length > 0) {
            <div class="history-block">
              <p class="lab-node">SAME PASSWORD, DIFFERENT SALT → DIFFERENT STORED HASH</p>
              <div class="history-list">
                @for (h of history(); track h.attempt) {
                  <div class="history-row">
                    <span class="mono history-idx">attempt {{ h.attempt }}</span>
                    <span class="mono history-salt">salt: {{ h.salt }}</span>
                    <span class="mono history-hash">{{ h.hash }}</span>
                  </div>
                }
              </div>
              <p class="lab-note">
                Hashing the same password twice produces different stored values because each hash uses a
                different random salt. This defeats precomputed lookup-table attacks (like rainbow tables) — an
                attacker can't precompute one table that matches every possible stored hash.
              </p>
            </div>
          }
        </div>

        <div class="lab-panel breach-panel">
          <p class="lab-node">ATTACKER STEALS THE DATABASE</p>
          <div class="breach-flow">
            <div class="flow-node attacker-node">
              <span class="mono node-label">ATTACKER</span>
              <span class="node-sub">exfiltrates the users table</span>
            </div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="stolen-table" aria-label="Stolen database rows">
              <div class="stolen-header mono">id — hash (no plaintext column)</div>
              @for (row of stolenRows(); track row.id) {
                <div class="stolen-row mono">
                  <span class="stolen-id">{{ row.id }}</span>
                  <span class="stolen-hash">{{ row.hash }}</span>
                </div>
              }
            </div>
          </div>
          <p class="lab-note lab-note-warn">
            Even with full database access, the attacker only ever sees hashes — never the original passwords.
            The plaintext was never stored in the first place.
          </p>
        </div>

        <div class="lab-panel speed-panel">
          <p class="lab-node">WHY SLOW HASHING MATTERS</p>
          <p class="lab-lede speed-lede">
            If an attacker has to guess passwords offline against stolen hashes, the speed of the hash function
            determines how many guesses they can try per second. General-purpose hashes are built to be fast;
            password-hashing functions are deliberately built to be slow.
          </p>
          <div class="lab-btn-row" role="group" aria-label="Run guessing simulation">
            <button type="button" class="lab-btn lab-btn-primary" (click)="runGuessSim()" [disabled]="simRunning()">
              {{ simRunning() ? 'Running…' : 'Run guessing simulation (2s)' }}
            </button>
          </div>
          <div class="speed-grid">
            <div class="speed-col">
              <p class="speed-label mono">FAST GENERAL-PURPOSE HASH</p>
              <p class="speed-count mono is-crit">{{ fastGuesses().toLocaleString() }}</p>
              <p class="speed-sub">guesses attempted in the window</p>
            </div>
            <div class="speed-col">
              <p class="speed-label mono">SLOW PASSWORD HASH (e.g. bcrypt)</p>
              <p class="speed-count mono is-ok">{{ slowGuesses().toLocaleString() }}</p>
              <p class="speed-sub">guesses attempted in the same window</p>
            </div>
          </div>
          <p class="lab-note">
            The passwords aren't different — the cost per guess is. Purpose-built, deliberately slow hashing
            (bcrypt, scrypt, Argon2 are common examples) makes large-scale offline guessing far more expensive,
            without changing anything the legitimate user experiences.
          </p>
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

    .hash-flow { margin-top: 16px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .pw-field { min-width: 180px; }
    .flow-node {
      display: flex; flex-direction: column; gap: 4px; align-items: center; justify-content: center;
      min-width: 130px; padding: 12px 14px; border-radius: var(--radius-md);
      border: 1px solid var(--border-strong); background: var(--surface); text-align: center;
    }
    .node-label { font-size: 0.75rem; font-weight: 700; color: var(--text); }
    .node-sub { font-size: 0.6875rem; color: var(--text-faint); word-break: break-all; }
    .salt-node { border-color: var(--suspicious); }
    .fn-node { border-color: var(--c-server); min-width: 170px; }
    .hash-node { border-color: var(--c-db); min-width: 150px; }
    .db-node { border-color: var(--trust); }

    .history-block { margin-top: 24px; }
    .history-list { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
    .history-row { display: flex; gap: 14px; flex-wrap: wrap; padding: 8px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.75rem; }
    .history-idx { color: var(--text-faint); width: 90px; }
    .history-salt { color: var(--suspicious); }
    .history-hash { color: var(--c-db); }

    .breach-flow { margin-top: 16px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .attacker-node { border-color: var(--c-attacker); }
    .attacker-node .node-label { color: var(--c-attacker); }
    .stolen-table { flex: 1; min-width: 260px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 14px; }
    .stolen-header { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.04em; margin-bottom: 8px; }
    .stolen-row { display: flex; gap: 16px; font-size: 0.75rem; padding: 4px 0; color: var(--text-muted); }
    .stolen-id { width: 24px; color: var(--text-faint); }
    .stolen-hash { color: var(--c-db); }

    .speed-lede { margin-top: 8px; }
    .speed-grid { margin-top: 20px; display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
    .speed-col { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .speed-label { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--text-faint); }
    .speed-count { margin-top: 8px; font-size: 1.5rem; font-weight: 700; }
    .speed-count.is-crit { color: var(--attack); }
    .speed-count.is-ok { color: var(--trust); }
    .speed-sub { margin-top: 4px; font-size: 0.75rem; color: var(--text-muted); }
  `,
})
export class PasswordSecurity {
  protected readonly password = signal('correcthorse');
  protected readonly salt = signal(randomSalt());
  protected readonly history = signal<{ attempt: number; salt: string; hash: string }[]>([]);

  protected readonly currentHash = computed(() => illustrativeHash(this.password() + this.salt()));

  protected readonly stolenRows = signal<StolenRow[]>(
    Array.from({ length: 5 }, (_, i) => ({ id: i + 1, hash: illustrativeHash(`user${i}` + randomSalt()) })),
  );

  protected readonly simRunning = signal(false);
  protected readonly fastGuesses = signal(0);
  protected readonly slowGuesses = signal(0);

  private attemptCounter = 0;
  private simTimer: ReturnType<typeof setInterval> | null = null;

  protected onPasswordInput(ev: Event): void {
    this.password.set((ev.target as HTMLInputElement).value);
  }

  protected hashAgain(): void {
    const newSalt = randomSalt();
    this.salt.set(newSalt);
    this.attemptCounter += 1;
    const hash = illustrativeHash(this.password() + newSalt);
    this.history.update((h) => [...h, { attempt: this.attemptCounter, salt: newSalt, hash }].slice(-4));
  }

  protected runGuessSim(): void {
    if (this.simRunning()) return;
    this.simRunning.set(true);
    this.fastGuesses.set(0);
    this.slowGuesses.set(0);
    let ticks = 0;
    this.simTimer = setInterval(() => {
      ticks += 1;
      this.fastGuesses.update((v) => v + 450_000 + Math.floor(Math.random() * 50_000));
      this.slowGuesses.update((v) => v + 12 + Math.floor(Math.random() * 6));
      if (ticks >= 20) {
        if (this.simTimer) clearInterval(this.simTimer);
        this.simRunning.set(false);
      }
    }, 100);
  }
}
