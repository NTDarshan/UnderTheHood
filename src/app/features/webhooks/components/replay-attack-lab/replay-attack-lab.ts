import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-replay-attack-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-replay-lab">
      <div class="container">
        <p class="lab-index mono">17 — REPLAY ATTACKS</p>
        <h2 class="lab-title">A valid signature can still be an attack — if it's old</h2>
        <p class="lab-lede">
          An attacker who captures one genuine, correctly-signed request can resend it later. The signature is
          still perfectly valid — because it is the real signature. Defenses live outside the signature check.
        </p>

        <div class="lab-panel">
          <div class="lab-toggle-row">
            <button type="button" class="lab-btn" [attr.aria-pressed]="timestampCheck()" (click)="timestampCheck.set(!timestampCheck())">TIMESTAMP FRESHNESS: {{ timestampCheck() ? 'ON' : 'OFF' }}</button>
            <button type="button" class="lab-btn" [attr.aria-pressed]="dedupeCheck()" (click)="dedupeCheck.set(!dedupeCheck())">EVENT ID DEDUPE: {{ dedupeCheck() ? 'ON' : 'OFF' }}</button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="replay()">CAPTURE & REPLAY REQUEST</button>
          </div>

          @if (result(); as r) {
            <div class="result-panel" [attr.data-kind]="r.kind">
              <p class="result-title mono">{{ r.title }}</p>
              <p class="body-text">{{ r.body }}</p>
            </div>
          }
          <p class="lab-note">A bounded replay window (e.g. reject anything older than five minutes) plus tracking already-seen event ids/nonces is what stops this — the signature check alone cannot, since the resent bytes are identical to the original.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .lab-toggle-row { display: flex; flex-wrap: wrap; gap: 10px; }
    .result-panel { margin-top: 20px; padding: 16px 18px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); }
    .result-panel[data-kind='blocked'] { border-color: color-mix(in srgb, var(--success) 45%, var(--border)); }
    .result-panel[data-kind='accepted'] { border-color: color-mix(in srgb, var(--failure) 45%, var(--border)); }
    .result-title { font-size: 0.8125rem; font-weight: 700; margin: 0 0 8px; color: var(--text); }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
  `,
})
export class ReplayAttackLab {
  protected readonly timestampCheck = signal(true);
  protected readonly dedupeCheck = signal(true);
  protected readonly result = signal<{ kind: 'blocked' | 'accepted'; title: string; body: string } | null>(null);

  protected replay(): void {
    if (this.timestampCheck() || this.dedupeCheck()) {
      const reason = this.timestampCheck() ? 'the timestamp inside the signed payload is far outside the freshness window' : 'the event id has already been recorded as seen';
      this.result.set({
        kind: 'blocked',
        title: 'REPLAY BLOCKED',
        body: `The signature is valid, but the request is rejected anyway — ${reason}.`,
      });
    } else {
      this.result.set({
        kind: 'accepted',
        title: 'REPLAY ACCEPTED — attack succeeded',
        body: 'With no freshness check and no dedupe, the resent request looks identical to a real one and is processed again.',
      });
    }
  }
}
