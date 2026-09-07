import { Component, signal } from '@angular/core';

type Ack = '2xx' | '4xx' | '5xx' | 'timeout';

@Component({
  selector: 'app-acknowledgement-simulator',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-ack-sim">
      <div class="container">
        <p class="lab-index mono">06 — WHAT YOUR RESPONSE TELLS THE PROVIDER</p>
        <h2 class="lab-title">The status code you return is a signal, not a formality</h2>
        <p class="lab-lede">
          Pick a response and see how a typical provider is likely to interpret it. Exact retry behavior differs
          provider to provider — this shows the common pattern, not a universal rule.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="picked() === '2xx'" (click)="pick('2xx')">RESPOND 2xx</button>
            <button type="button" class="lab-btn" [class.is-active]="picked() === '4xx'" (click)="pick('4xx')">RESPOND 4xx</button>
            <button type="button" class="lab-btn" [class.is-active]="picked() === '5xx'" (click)="pick('5xx')">RESPOND 5xx</button>
            <button type="button" class="lab-btn" [class.is-active]="picked() === 'timeout'" (click)="pick('timeout')">DON'T RESPOND (timeout)</button>
          </div>

          @if (picked(); as p) {
            <div class="result-panel" [attr.data-kind]="resultKind(p)">
              <p class="result-title mono">{{ resultTitle(p) }}</p>
              <p class="body-text">{{ resultBody(p) }}</p>
            </div>
          }
          <p class="lab-note">Retry behavior is provider-specific — some retry only 5xx and timeouts, some also retry certain 4xx codes, and retry counts/windows vary. Never assume one universal policy.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .lab-btn.is-active { border-color: var(--pending); color: var(--accent-strong); background: color-mix(in srgb, var(--pending) 14%, var(--surface-elevated)); }
    .result-panel { margin-top: 20px; padding: 16px 18px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); }
    .result-panel[data-kind='ok'] { border-color: color-mix(in srgb, var(--success) 45%, var(--border)); }
    .result-panel[data-kind='reject'] { border-color: color-mix(in srgb, var(--failure) 45%, var(--border)); }
    .result-panel[data-kind='retry'] { border-color: color-mix(in srgb, var(--retry) 45%, var(--border)); }
    .result-title { font-size: 0.8125rem; font-weight: 700; margin: 0 0 8px; color: var(--text); }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
  `,
})
export class AcknowledgementSimulator {
  protected readonly picked = signal<Ack | null>(null);

  protected pick(a: Ack): void {
    this.picked.set(a);
  }

  protected resultKind(a: Ack): 'ok' | 'reject' | 'retry' {
    if (a === '2xx') return 'ok';
    if (a === '4xx') return 'reject';
    return 'retry';
  }

  protected resultTitle(a: Ack): string {
    switch (a) {
      case '2xx': return 'ACCEPTED — delivery marked successful';
      case '4xx': return 'REJECTED — commonly treated as a client-side problem';
      case '5xx': return 'SERVER ERROR — retry is common, but provider-specific';
      case 'timeout': return 'NO RESPONSE — retry is common, but provider-specific';
    }
  }

  protected resultBody(a: Ack): string {
    switch (a) {
      case '2xx':
        return 'The provider marks this delivery attempt as successful and moves on. It will not resend this event unless you explicitly ask for a replay.';
      case '4xx':
        return 'Many providers treat 4xx as "you rejected this on purpose" (bad signature, malformed payload) and do not retry automatically — some do retry a subset of 4xx codes, so check your provider\'s docs.';
      case '5xx':
        return 'A 5xx usually signals a transient server-side problem. Many providers will retry on a backoff schedule — but retry is not guaranteed by the HTTP spec itself, it\'s a provider policy decision.';
      case 'timeout':
        return 'If your endpoint never responds within the provider\'s timeout window, the provider cannot tell whether you processed the event or not. A timeout does not prove nothing happened — your server may have finished the work after the provider gave up waiting.';
    }
  }
}
