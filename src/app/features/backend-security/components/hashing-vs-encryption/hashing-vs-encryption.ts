import { Component, computed, signal } from '@angular/core';

type PanelId = 'hashing' | 'encryption';
const HASH_CHARS = '0123456789abcdef';

/** Illustrative-only mixing function — NOT a real cryptographic hash. */
function illustrativeHash(input: string): string {
  let h1 = 0x9e3779b9 ^ input.length;
  let h2 = 0x85ebca6b ^ input.length;
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

/** Illustrative-only reversible transform (Caesar-style shift keyed by a number) — NOT real cryptography. */
function shiftEncrypt(input: string, key: number): string {
  return input
    .split('')
    .map((ch) => String.fromCharCode(ch.charCodeAt(0) + key))
    .join('');
}

function shiftDecrypt(input: string, key: number): string {
  return shiftEncrypt(input, -key);
}

function scramblePreview(input: string, key: number): string {
  // Render non-printable-safe visual for the "ciphertext" — map to a printable band for display only.
  return input
    .split('')
    .map((ch) => {
      const code = ((ch.charCodeAt(0) + key - 33) % 94 + 94) % 94 + 33;
      return String.fromCharCode(code);
    })
    .join('');
}

@Component({
  selector: 'app-hashing-vs-encryption',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="hashing-vs-encryption">
      <div class="container">
        <p class="lab-index">10 — HASHING VS ENCRYPTION</p>
        <h2 class="lab-title">One-way versus two-way: they solve different problems.</h2>
        <p class="lab-lede">
          Hashing and encryption both transform data, but only one of them is meant to be undone. Mixing them up
          is one of the most common backend security mistakes.
        </p>

        <div class="lab-btn-row" role="tablist" aria-label="Choose a transform">
          <button type="button" class="lab-btn" role="tab" [class.is-active]="panel() === 'hashing'" [attr.aria-selected]="panel() === 'hashing'" (click)="panel.set('hashing')">Hashing (one-way)</button>
          <button type="button" class="lab-btn" role="tab" [class.is-active]="panel() === 'encryption'" [attr.aria-selected]="panel() === 'encryption'" (click)="panel.set('encryption')">Encryption (two-way)</button>
        </div>

        @if (panel() === 'hashing') {
          <div class="lab-panel">
            <p class="lab-node">HASHING — ONE DIRECTION ONLY</p>
            <div class="oneway-flow">
              <div class="flow-node input-node">
                <span class="mono node-label">INPUT</span>
                <span class="node-sub mono">{{ hashInput() || '(empty)' }}</span>
              </div>
              <span class="lab-flow-arrow one-way-arrow">&rarr;</span>
              <div class="flow-node fn-node">
                <span class="mono node-label">HASH FUNCTION</span>
              </div>
              <span class="lab-flow-arrow one-way-arrow">&rarr;</span>
              <div class="flow-node hash-node">
                <span class="mono node-label">FIXED-LENGTH HASH</span>
                <span class="node-sub mono">{{ storedHash() }}</span>
              </div>
            </div>
            <p class="no-return mono">&times; no arrow goes back — a hash cannot be reversed into its input &times;</p>

            <label class="lab-field hash-in-field">
              <label for="hash-input">Text to hash and store</label>
              <input id="hash-input" type="text" [value]="hashInput()" (input)="onHashInput($event)" />
            </label>

            <div class="verify-block">
              <p class="lab-node">VERIFY A GUESS</p>
              <label class="lab-field">
                <label for="guess-input">Type a guess to check against the stored hash</label>
                <input id="guess-input" type="text" [value]="guess()" (input)="onGuessInput($event)" />
              </label>
              <p class="verify-result mono" [class.is-ok]="guessMatches()" [class.is-crit]="!guessMatches() && guess().length > 0">
                @if (guess().length === 0) {
                  type a guess above
                } @else if (guessMatches()) {
                  MATCH
                } @else {
                  NO MATCH
                }
              </p>
              <p class="lab-note">
                Verification works by hashing the guess again and comparing the two hashes — never by "unhashing"
                the stored value back into the original input. That reversal is not possible by design.
              </p>
            </div>
          </div>
        } @else {
          <div class="lab-panel">
            <p class="lab-node">ENCRYPTION — REVERSIBLE BY DESIGN (illustrative transform, not real cryptography)</p>
            <label class="lab-field msg-field">
              <label for="msg-input">Message to encrypt</label>
              <input id="msg-input" type="text" [value]="message()" (input)="onMessageInput($event)" />
            </label>

            <div class="roundtrip-flow">
              <div class="flow-node plain-node">
                <span class="mono node-label">PLAINTEXT</span>
                <span class="node-sub mono">{{ message() || '(empty)' }}</span>
              </div>
              <div class="arrow-pair">
                <span class="lab-flow-arrow">&rarr; key &rarr;</span>
                <span class="lab-flow-arrow">&larr; key &larr;</span>
              </div>
              <div class="flow-node cipher-node">
                <span class="mono node-label">CIPHERTEXT</span>
                <span class="node-sub mono">{{ ciphertextPreview() || '(empty)' }}</span>
              </div>
              <div class="arrow-pair">
                <span class="lab-flow-arrow">&rarr; key &rarr;</span>
                <span class="lab-flow-arrow">&larr; key &larr;</span>
              </div>
              <div class="flow-node plain-node">
                <span class="mono node-label">PLAINTEXT (recovered)</span>
                <span class="node-sub mono">{{ decrypted() || '(empty)' }}</span>
              </div>
            </div>

            <label class="lab-field key-field">
              <label for="key-slider">Key: {{ key() }}</label>
              <input id="key-slider" type="range" min="1" max="25" step="1" [value]="key()" (input)="onKeyInput($event)" />
            </label>

            <p class="lab-note">
              With the same (or a paired) key, encryption round-trips: plaintext becomes ciphertext, and applying
              the key again recovers the exact original message. That reversibility is the entire point of
              encryption — unlike hashing, it's meant to be undone by whoever holds the key.
            </p>
          </div>
        }

        <div class="lab-panel contrast-panel">
          <p class="lab-node">WHICH ONE FOR WHAT</p>
          <p class="lab-lede contrast-lede">
            Passwords should generally be stored using dedicated password hashing, not reversible encryption —
            there's no legitimate reason for anyone, including the application itself, to recover a user's
            original password. Sensitive data that must later be read back in its original form (for example, a
            stored payment detail needed for a future charge) may require encryption instead, precisely because
            it needs to be reversible.
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

    .oneway-flow { margin-top: 16px; display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .flow-node {
      display: flex; flex-direction: column; gap: 4px; align-items: center; justify-content: center;
      min-width: 140px; padding: 14px 16px; border-radius: var(--radius-md);
      border: 1px solid var(--border-strong); background: var(--surface); text-align: center;
    }
    .node-label { font-size: 0.75rem; font-weight: 700; color: var(--text); }
    .node-sub { font-size: 0.6875rem; color: var(--text-faint); word-break: break-all; }
    .input-node { border-color: var(--c-client); }
    .fn-node { border-color: var(--c-server); }
    .hash-node { border-color: var(--c-db); }
    .one-way-arrow { font-size: 1.1rem; color: var(--suspicious); }
    .no-return { margin-top: 10px; font-size: 0.75rem; color: var(--attack); }

    .hash-in-field { margin-top: 20px; max-width: 420px; }
    .verify-block { margin-top: 26px; padding-top: 20px; border-top: 1px dashed var(--border-strong); }
    .verify-result { margin-top: 10px; font-size: 1rem; font-weight: 700; color: var(--text-faint); }
    .verify-result.is-ok { color: var(--trust); }
    .verify-result.is-crit { color: var(--attack); }

    .msg-field { max-width: 420px; }
    .roundtrip-flow { margin-top: 20px; display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .arrow-pair { display: flex; flex-direction: column; gap: 2px; font-size: 0.6875rem; color: var(--blocked); font-family: var(--font-mono); }
    .plain-node { border-color: var(--c-client); }
    .cipher-node { border-color: var(--c-attacker); min-width: 160px; }
    .key-field { margin-top: 20px; max-width: 320px; }
    .key-field input { accent-color: var(--accent); }

    .contrast-lede { margin-top: 10px; color: var(--text-muted); max-width: none; }
  `,
})
export class HashingVsEncryption {
  protected readonly panel = signal<PanelId>('hashing');

  protected readonly hashInput = signal('backend security');
  protected readonly guess = signal('');

  protected readonly storedHash = computed(() => illustrativeHash(this.hashInput()));
  protected readonly guessHash = computed(() => illustrativeHash(this.guess()));
  protected readonly guessMatches = computed(() => this.guess().length > 0 && this.guessHash() === this.storedHash());

  protected readonly message = signal('meet at 9am');
  protected readonly key = signal(5);

  protected readonly ciphertextPreview = computed(() => scramblePreview(this.message(), this.key()));
  protected readonly decrypted = computed(() => {
    const encrypted = shiftEncrypt(this.message(), this.key());
    return shiftDecrypt(encrypted, this.key());
  });

  protected onHashInput(ev: Event): void {
    this.hashInput.set((ev.target as HTMLInputElement).value);
  }

  protected onGuessInput(ev: Event): void {
    this.guess.set((ev.target as HTMLInputElement).value);
  }

  protected onMessageInput(ev: Event): void {
    this.message.set((ev.target as HTMLInputElement).value);
  }

  protected onKeyInput(ev: Event): void {
    this.key.set(Number((ev.target as HTMLInputElement).value));
  }
}
