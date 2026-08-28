import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { illustrativeHash, randomSalt } from '../../engine/auth-simulator';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

@Component({
  selector: 'app-password-security',
  standalone: true,
  imports: [FormsModule, ExplainSimply],
  template: `
    <section class="lab-section" id="password-problem">
      <div class="container">
        <p class="lab-index">AUTH / 05 — THE PASSWORD PROBLEM</p>
        <h2 class="lab-title">Where should the password live?</h2>

        <div class="flow-compare">
          <div class="flow-card is-bad">
            <p class="flow-label mono">BAD</p>
            <div class="flow-chain mono">
              <span>User</span><span class="arrow">↓</span>
              <span class="tok-danger">Plaintext Password</span><span class="arrow">↓</span>
              <span>Database</span>
            </div>
            <p class="flow-note">If the database is ever read — by a breach, a backup leak, or an insider — every password is exposed as-is.</p>
          </div>
          <div class="flow-card is-good">
            <p class="flow-label mono">GOOD</p>
            <div class="flow-chain mono">
              <span>Password</span><span class="arrow">↓</span>
              <span>Password Hashing</span><span class="arrow">↓</span>
              <span>Salt + Hash</span><span class="arrow">↓</span>
              <span>Database</span>
            </div>
            <p class="flow-note">The server stores a <em>verifier</em> derived from the password — never the original plaintext value.</p>
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          Password hashing should use a deliberately expensive, password-specific algorithm —
          examples include Argon2, bcrypt, scrypt, and PBKDF2 — not a general-purpose hash meant for speed.
        </p>

        <app-explain-simply>
          A general-purpose hash is designed to be fast, which makes it fast to guess too. Password
          hashing algorithms are deliberately slow and tunable, so guessing millions of passwords per
          second becomes impractical even if the stored hashes leak.
        </app-explain-simply>
      </div>
    </section>

    <section class="lab-section" id="hashing-vs-encryption">
      <div class="container">
        <p class="lab-index">AUTH / 06 — HASHING VS. ENCRYPTION</p>
        <h2 class="lab-title">Two directions: one-way and reversible.</h2>

        <div class="compare-grid">
          <div class="compare-card">
            <p class="compare-title mono">HASHING</p>
            <div class="flow-chain mono small"><span>Input</span><span class="arrow">↓</span><span>Hash Function</span><span class="arrow">↓</span><span>Digest</span></div>
            <p class="compare-note">Conceptually one-way — there is no key that turns the digest back into the input.</p>
            <p class="compare-usage mono">USE: password storage</p>
          </div>
          <div class="compare-card">
            <p class="compare-title mono">ENCRYPTION</p>
            <div class="flow-chain mono small"><span>Plaintext</span><span class="arrow">↓</span><span>Encrypt + Key</span><span class="arrow">↓</span><span>Ciphertext</span><span class="arrow">↓</span><span>Decrypt + Key</span><span class="arrow">↓</span><span>Plaintext</span></div>
            <p class="compare-note">Deliberately reversible — anyone holding the right key can recover the original value.</p>
            <p class="compare-usage mono">USE: data that must later be recovered</p>
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section" id="salting">
      <div class="container">
        <p class="lab-index">AUTH / 07 — SALTING</p>
        <h2 class="lab-title">Same password, different stored value.</h2>

        <div class="lab-panel salt-panel">
          <div class="lab-field">
            <label for="pwd-input">Password</label>
            <input id="pwd-input" type="text" [ngModel]="password()" (ngModelChange)="password.set($event)" />
          </div>

          <div class="salt-users">
            <div class="salt-user">
              <p class="salt-label mono">USER A</p>
              <p class="salt-row mono">password = {{ password() }}</p>
              <p class="salt-row mono">salt = {{ saltA() }}</p>
              <p class="salt-row hash mono">hash = {{ hashA() }}</p>
            </div>
            <div class="salt-user">
              <p class="salt-label mono">USER B</p>
              <p class="salt-row mono">password = {{ password() }}</p>
              <p class="salt-row mono">salt = {{ saltB() }}</p>
              <p class="salt-row hash mono">hash = {{ hashB() }}</p>
            </div>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="reroll()">↻ Re-roll both salts</button>
          </div>

          <p class="lab-note">
            Both users typed the exact same password, yet the stored verifiers differ because each
            account has its own unique salt. Unique salts mean the same password does not need to
            produce the same stored hash — and a precomputed lookup table becomes far less useful to an attacker.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .flow-compare { margin-top: 32px; display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 850px) { .flow-compare { grid-template-columns: 1fr 1fr; } }

    .flow-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 22px; }
    .flow-card.is-bad { border-color: color-mix(in srgb, var(--danger) 30%, var(--border)); }
    .flow-card.is-good { border-color: color-mix(in srgb, var(--accent-2) 30%, var(--border)); }

    .flow-label { font-size: 0.6875rem; letter-spacing: 0.1em; }
    .is-bad .flow-label { color: var(--danger); }
    .is-good .flow-label { color: var(--accent-2); }

    .flow-chain { margin-top: 14px; display: flex; flex-direction: column; align-items: flex-start; gap: 4px; font-size: 0.8125rem; }
    .flow-chain.small { font-size: 0.75rem; }
    .flow-chain .arrow { color: var(--text-faint); padding-left: 4px; }
    .tok-danger { color: var(--danger); }

    .flow-note { margin-top: 14px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }

    .compare-grid { margin-top: 32px; display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 800px) { .compare-grid { grid-template-columns: 1fr 1fr; } }

    .compare-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 22px; }
    .compare-title { font-size: 0.75rem; letter-spacing: 0.08em; color: var(--accent-2); }
    .compare-note { margin-top: 14px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }
    .compare-usage { margin-top: 12px; font-size: 0.6875rem; color: var(--text-faint); }

    .salt-panel { margin-top: 32px; }
    .salt-users { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .salt-users { grid-template-columns: 1fr 1fr; } }

    .salt-user { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
    .salt-label { font-size: 0.6875rem; color: var(--accent-2); margin-bottom: 8px; }
    .salt-row { font-size: 0.8125rem; color: var(--text-muted); word-break: break-all; }
    .salt-row.hash { color: var(--accent-strong); margin-top: 6px; }
  `,
})
export class PasswordSecurity {
  protected readonly password = signal('hunter2');
  protected readonly saltA = signal(randomSalt());
  protected readonly saltB = signal(randomSalt());

  protected readonly hashA = computed(() => illustrativeHash(this.password() + this.saltA()));
  protected readonly hashB = computed(() => illustrativeHash(this.password() + this.saltB()));

  reroll(): void {
    this.saltA.set(randomSalt());
    this.saltB.set(randomSalt());
  }
}
