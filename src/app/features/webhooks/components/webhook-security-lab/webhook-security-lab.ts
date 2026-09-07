import { Component, signal } from '@angular/core';

type Attack = 'forged' | 'replay' | 'modified' | 'ssrf' | 'timing';
type Defense = 'hmac' | 'timestamp' | 'replayProtection' | 'constantTime' | 'urlValidation';

@Component({
  selector: 'app-webhook-security-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-security-lab">
      <div class="container">
        <p class="lab-index mono">30 — SECURITY LAB</p>
        <h2 class="lab-title">Attack it, then defend it, and confirm the defense actually holds</h2>
        <p class="lab-lede">Pick an attack, then toggle defenses on and re-run the same attack to see it get blocked.</p>

        <div class="lab-panel">
          <p class="body-label mono">ATTACKS</p>
          <div class="toggle-grid">
            <button type="button" class="lab-btn lab-btn-danger" (click)="attack('forged')">FORGED REQUEST</button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="attack('replay')">REPLAY CAPTURED REQUEST</button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="attack('modified')">MODIFY BODY IN TRANSIT</button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="attack('ssrf')">SSRF TARGET URL</button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="attack('timing')">GUESS SIGNATURE VIA TIMING</button>
          </div>

          <p class="body-label mono defenses-heading">DEFENSES</p>
          <div class="toggle-grid">
            <button type="button" class="lab-btn" [attr.aria-pressed]="defenses().has('hmac')" (click)="toggleDefense('hmac')">HMAC verification</button>
            <button type="button" class="lab-btn" [attr.aria-pressed]="defenses().has('timestamp')" (click)="toggleDefense('timestamp')">Timestamp validation</button>
            <button type="button" class="lab-btn" [attr.aria-pressed]="defenses().has('replayProtection')" (click)="toggleDefense('replayProtection')">Replay protection</button>
            <button type="button" class="lab-btn" [attr.aria-pressed]="defenses().has('constantTime')" (click)="toggleDefense('constantTime')">Constant-time comparison</button>
            <button type="button" class="lab-btn" [attr.aria-pressed]="defenses().has('urlValidation')" (click)="toggleDefense('urlValidation')">URL / redirect validation</button>
          </div>

          @if (result(); as r) {
            <div class="result-panel" [attr.data-kind]="r.blocked ? 'blocked' : 'through'">
              <p class="result-title mono">{{ r.blocked ? 'BLOCKED' : 'ATTACK GOT THROUGH' }}</p>
              <p class="body-text">{{ r.text }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 0 0 12px; }
    .defenses-heading { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
    .toggle-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .result-panel { margin-top: 20px; padding: 16px 18px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); }
    .result-panel[data-kind='blocked'] { border-color: color-mix(in srgb, var(--success) 45%, var(--border)); }
    .result-panel[data-kind='through'] { border-color: color-mix(in srgb, var(--failure) 45%, var(--border)); }
    .result-title { font-size: 0.8125rem; font-weight: 700; margin: 0 0 8px; color: var(--text); }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
  `,
})
export class WebhookSecurityLab {
  protected readonly defenses = signal(new Set<Defense>());
  protected readonly result = signal<{ blocked: boolean; text: string } | null>(null);

  protected toggleDefense(d: Defense): void {
    const s = new Set(this.defenses());
    s.has(d) ? s.delete(d) : s.add(d);
    this.defenses.set(s);
  }

  protected attack(a: Attack): void {
    const d = this.defenses();
    switch (a) {
      case 'forged':
        this.result.set(d.has('hmac')
          ? { blocked: true, text: 'A forged request has no way to produce a valid HMAC without the shared secret — rejected.' }
          : { blocked: false, text: 'With no signature check, a forged request is indistinguishable from a real one.' });
        break;
      case 'replay':
        this.result.set(d.has('timestamp') || d.has('replayProtection')
          ? { blocked: true, text: 'The signature on the captured request is genuinely valid, but freshness/dedupe checks reject it as stale.' }
          : { blocked: false, text: 'A captured, validly-signed request is resent successfully — nothing checks whether it is fresh or already seen.' });
        break;
      case 'modified':
        this.result.set(d.has('hmac')
          ? { blocked: true, text: 'Any change to the body changes the expected signature — the modified request fails verification.' }
          : { blocked: false, text: 'The modified body is processed as-is — nothing checks whether it matches what was actually signed.' });
        break;
      case 'ssrf':
        this.result.set(d.has('urlValidation')
          ? { blocked: true, text: 'The destination — including any redirect target — is validated against internal/private ranges before the dispatcher connects.' }
          : { blocked: false, text: 'The dispatcher follows the registered URL (and any redirect) without checking whether it points at internal infrastructure.' });
        break;
      case 'timing':
        this.result.set(d.has('constantTime')
          ? { blocked: true, text: 'Comparison time is identical regardless of where a guess diverges — no signal leaks to the attacker.' }
          : { blocked: false, text: 'An early-exit comparison leaks how many leading bytes were correct, letting an attacker guess the signature byte by byte.' });
        break;
    }
  }
}
