import { Component, signal } from '@angular/core';

function simpleHash(input: string): string {
  let h1 = 0xdeadbeef ^ input.length;
  let h2 = 0x41c6ce57 ^ input.length;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  const combined = (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
  return combined.padStart(14, '0');
}

@Component({
  selector: 'app-hmac-signature-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-hmac-lab">
      <div class="container">
        <p class="lab-index mono">15 — HMAC SIGNATURES</p>
        <h2 class="lab-title">Prove the request holds the shared secret</h2>
        <p class="lab-lede">
          The provider and your endpoint both know a shared secret, never sent over the wire. The provider hashes
          the raw body with that secret; your endpoint recomputes the same hash and compares.
        </p>

        <div class="lab-panel">
          <div class="hmac-cols">
            <div class="hmac-side">
              <p class="side-heading mono">PROVIDER</p>
              <label class="lab-field"><span>Secret</span><input class="mono" type="text" [value]="secret()" (input)="secret.set($any($event.target).value)" /></label>
              <label class="lab-field"><span>Raw body</span><input class="mono" type="text" [value]="body()" (input)="body.set($any($event.target).value)" /></label>
              <p class="body-label mono">COMPUTED SIGNATURE</p>
              <p class="sig-value mono">{{ providerSig() }}</p>
            </div>
            <div class="hmac-side">
              <p class="side-heading mono">RECEIVER</p>
              <label class="lab-field"><span>Shared secret (should match)</span><input class="mono" type="text" [value]="receiverSecret()" (input)="receiverSecret.set($any($event.target).value)" /></label>
              <label class="lab-field"><span>Raw body received</span><input class="mono" type="text" [value]="receivedBody()" (input)="receivedBody.set($any($event.target).value)" /></label>
              <p class="body-label mono">EXPECTED SIGNATURE</p>
              <p class="sig-value mono">{{ receiverSig() }}</p>
            </div>
          </div>

          <div class="match-row" [attr.data-match]="isMatch()">
            {{ isMatch() ? 'SIGNATURES MATCH — request accepted' : 'MISMATCH — request rejected' }}
          </div>

          <p class="lab-note">Try changing just the receiver's secret, or a single character in the received body — the signature changes completely and the comparison fails. HMAC proves possession of the shared secret and content integrity — it does not prove absolute identity of the caller beyond that.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .hmac-cols { display: grid; grid-template-columns: 1fr; gap: 24px; }
    @media (min-width: 720px) { .hmac-cols { grid-template-columns: 1fr 1fr; } }
    .hmac-side { display: flex; flex-direction: column; gap: 12px; }
    .side-heading { font-size: 0.75rem; color: var(--security); letter-spacing: 0.06em; }
    .lab-field input { width: 100%; }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 8px 0 4px; }
    .sig-value { font-size: 0.8125rem; color: var(--text); word-break: break-all; padding: 8px 10px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-sm); }
    .match-row { margin-top: 20px; padding: 12px 16px; text-align: center; font-family: var(--font-mono); font-size: 0.8125rem; font-weight: 700; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); color: var(--failure); }
    .match-row[data-match='true'] { color: var(--success); border-color: color-mix(in srgb, var(--success) 45%, var(--border-strong)); }
  `,
})
export class HmacSignatureLab {
  protected readonly secret = signal('whsec_a1b2c3');
  protected readonly body = signal('{"type":"order.created"}');
  protected readonly receiverSecret = signal('whsec_a1b2c3');
  protected readonly receivedBody = signal('{"type":"order.created"}');

  protected providerSig(): string {
    return simpleHash(this.secret() + '|' + this.body());
  }

  protected receiverSig(): string {
    return simpleHash(this.receiverSecret() + '|' + this.receivedBody());
  }

  protected isMatch(): boolean {
    return this.providerSig() === this.receiverSig();
  }
}
