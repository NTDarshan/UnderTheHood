import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { buildJwt, verifyJwt } from '../../engine/auth-simulator';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

const SECRET = 'demo-signing-secret';

interface ClaimInfo {
  key: string;
  meaning: string;
}

const CLAIMS: ClaimInfo[] = [
  { key: 'iss', meaning: 'Issuer — who created and signed this token.' },
  { key: 'sub', meaning: 'Subject — the identity the token is about.' },
  { key: 'aud', meaning: 'Audience — who this token is intended for.' },
  { key: 'exp', meaning: 'Expiration — the time after which the token is no longer valid.' },
  { key: 'nbf', meaning: 'Not-before — the time before which the token must not be accepted.' },
  { key: 'iat', meaning: 'Issued-at — when the token was created.' },
  { key: 'jti', meaning: 'JWT ID — a unique identifier for this specific token.' },
];

@Component({
  selector: 'app-jwt-lab',
  standalone: true,
  imports: [FormsModule, ExplainSimply],
  template: `
    <section class="lab-section" id="jwt-structure">
      <div class="container">
        <p class="lab-index">AUTH / 18 — JWT LABORATORY</p>
        <h2 class="lab-title">Three parts, joined by dots.</h2>

        <div class="jwt-string mono">
          <span class="seg-header" [class.is-active]="segment() === 'header'" (click)="segment.set('header')" tabindex="0" role="button">{{ token().headerB64 }}</span>.<span
            class="seg-payload"
            [class.is-active]="segment() === 'payload'"
            (click)="segment.set('payload')"
            tabindex="0"
            role="button"
            >{{ token().payloadB64 }}</span
          >.<span class="seg-signature" [class.is-active]="segment() === 'signature'" (click)="segment.set('signature')" tabindex="0" role="button">{{
            token().signatureB64
          }}</span>
        </div>

        <div class="lab-panel segment-detail">
          @switch (segment()) {
            @case ('header') {
              <p class="segment-title mono">HEADER</p>
              <pre class="lab-code mono">{{ headerPretty }}</pre>
              <p class="segment-note">Declares the algorithm and token type — metadata about how the rest of the token should be processed.</p>
            }
            @case ('payload') {
              <p class="segment-title mono">PAYLOAD</p>
              <pre class="lab-code mono">{{ payloadPretty() }}</pre>
              <p class="segment-note">The claims — statements about the subject. Base64url is encoding, not encryption: anyone can decode this segment.</p>
            }
            @case ('signature') {
              <p class="segment-title mono">SIGNATURE</p>
              <pre class="lab-code mono">{{ token().signatureB64 }}</pre>
              <p class="segment-note">Produced from the header, payload, and a server-held secret. It lets the receiver detect tampering — it does not hide the payload.</p>
            }
          }
        </div>

        <p class="lab-note lab-note-warn">
          A typical JWT payload is <strong>encoded, not encrypted</strong>. A signed JWT lets the
          receiver detect tampering, but its contents should not be assumed confidential.
        </p>

        <app-explain-simply>
          Think of a JWT like a sealed but transparent envelope. Anyone can read what's inside just by
          looking — the seal only proves nobody swapped the contents after it was sealed.
        </app-explain-simply>
      </div>
    </section>

    <section class="lab-section" id="jwt-claims">
      <div class="container">
        <p class="lab-index">AUTH / 19 — JWT CLAIMS</p>
        <h2 class="lab-title">The registered claims you'll see almost everywhere.</h2>

        <div class="claims-grid">
          @for (c of claims; track c.key) {
            <button type="button" class="claim-chip mono" [class.is-active]="activeClaim() === c.key" (click)="activeClaim.set(c.key)">{{ c.key }}</button>
          }
        </div>
        <p class="claim-meaning">{{ activeClaimMeaning() }}</p>
      </div>
    </section>

    <section class="lab-section" id="jwt-tamper">
      <div class="container">
        <p class="lab-index">AUTH / 20 — SIGNATURE VERIFICATION</p>
        <h2 class="lab-title">Tamper with the token. Watch verification fail.</h2>

        <div class="lab-panel tamper-panel">
          <div class="lab-field">
            <label for="role-edit">payload.role</label>
            <select id="role-edit" [ngModel]="role()" (ngModelChange)="role.set($event)">
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" (click)="tamperSignatureOnly()">Tamper signature bytes directly</button>
            <button type="button" class="lab-btn" (click)="resetTamper()">Reset</button>
          </div>

          <pre class="lab-code mono tamper-token">{{ tamperedToken() }}</pre>

          <div class="verify-result" [class.is-ok]="verification().signatureValid" [class.is-fail]="!verification().signatureValid">
            {{ verification().signatureValid ? '✓ Signature valid — payload matches what was signed.' : '✕ Signature verification failed — the payload or signature was modified after signing.' }}
          </div>

          <p class="lab-note">Changing the role above re-signs a fresh token (this is what a legitimate re-issue looks like). Tampering the signature bytes directly, without re-signing, is what an attacker's forgery attempt looks like — and it is caught.</p>
        </div>
      </div>
    </section>

    <section class="lab-section" id="jwt-not-magic">
      <div class="container">
        <p class="lab-index">AUTH / 21 — A JWT IS NOT MAGIC</p>
        <h2 class="lab-title">A token format is not a security architecture.</h2>

        <p class="lab-lede">A JWT does <strong>not</strong> automatically provide:</p>
        <div class="not-magic-grid">
          @for (item of notProvided; track item) {
            <span class="not-magic-chip mono">✕ {{ item }}</span>
          }
        </div>
        <p class="lab-note">Its actual security depends on issuance, signing, validation, key management, expiration, storage, transport, and the authorization logic built around it.</p>
      </div>
    </section>
  `,
  styles: `
    .jwt-string {
      margin-top: 28px;
      font-size: 0.75rem;
      line-height: 1.9;
      word-break: break-all;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px;
    }

    .jwt-string span[role='button'] { cursor: pointer; padding: 2px 0; border-bottom: 2px solid transparent; }
    .seg-header { color: var(--accent-2); }
    .seg-payload { color: var(--accent-strong); }
    .seg-signature { color: var(--danger); }
    .jwt-string span.is-active { border-bottom-color: currentColor; }

    .segment-detail { margin-top: 20px; }
    .segment-title { font-size: 0.75rem; color: var(--accent-2); margin-bottom: 10px; }
    .segment-note { margin-top: 10px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }

    .claims-grid { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 8px; }
    .claim-chip { padding: 8px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-raised); color: var(--text-muted); }
    .claim-chip.is-active { border-color: var(--accent); color: var(--accent-strong); }
    .claim-meaning { margin-top: 18px; font-size: 0.9375rem; color: var(--text-muted); max-width: 560px; line-height: 1.6; }

    .tamper-panel { margin-top: 24px; }
    .tamper-token { margin-top: 16px; font-size: 0.6875rem; }
    .verify-result { margin-top: 14px; font-size: 0.9375rem; font-weight: 600; padding: 12px 16px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); }
    .verify-result.is-ok { color: var(--accent-2); border-color: var(--accent-2-dim); }
    .verify-result.is-fail { color: var(--danger); border-color: var(--danger); }

    .not-magic-grid { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 10px; }
    .not-magic-chip { padding: 8px 14px; border-radius: var(--radius-sm); border: 1px solid var(--danger); color: var(--danger); font-size: 0.8125rem; }
  `,
})
export class JwtLab {
  protected readonly headerPretty = JSON.stringify({ alg: 'HS256-demo', typ: 'JWT' }, null, 2);
  protected readonly role = signal<'user' | 'admin'>('user');
  protected readonly segment = signal<'header' | 'payload' | 'signature'>('payload');
  protected readonly activeClaim = signal('sub');
  protected readonly claims = CLAIMS;
  protected readonly notProvided = ['Authentication', 'Authorization', 'Encryption', 'Revocation', 'Secure storage'];

  private readonly signedToken = computed(() => buildJwt({ sub: 'alice', role: this.role(), iat: 1000 }, SECRET));
  protected readonly token = this.signedToken;
  protected readonly payloadPretty = computed(() => verifyJwt(this.signedToken().token, SECRET).payloadJson);

  private readonly manualTamper = signal(false);
  protected readonly tamperedToken = computed(() => {
    const t = this.signedToken();
    if (!this.manualTamper()) return t.token;
    return `${t.headerB64}.${t.payloadB64}.${t.signatureB64.slice(0, -2)}ZZ`;
  });

  protected readonly verification = computed(() => verifyJwt(this.tamperedToken(), SECRET));

  protected readonly activeClaimMeaning = computed(() => this.claims.find((c) => c.key === this.activeClaim())?.meaning ?? '');

  tamperSignatureOnly(): void {
    this.manualTamper.set(true);
  }

  resetTamper(): void {
    this.manualTamper.set(false);
  }
}
