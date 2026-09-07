import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-webhook-ssrf',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-ssrf">
      <div class="container">
        <p class="lab-index mono">18 — WEBHOOK SSRF</p>
        <h2 class="lab-title">The direction reverses when you're the one sending webhooks</h2>
        <p class="lab-lede">
          If your system lets customers register a webhook URL, your dispatcher is now an HTTP client you don't
          fully control the target of. An attacker-controlled URL — or a redirect — can point it at internal
          infrastructure.
        </p>

        <div class="lab-panel">
          <label class="lab-field"><span>Registered webhook URL</span>
            <input class="mono" type="text" [value]="url()" (input)="url.set($any($event.target).value)" />
          </label>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="dispatch()">DISPATCH TO THIS URL</button>
          </div>

          @if (result(); as r) {
            <div class="result-panel" [attr.data-kind]="r.kind">
              <p class="result-title mono">{{ r.title }}</p>
              <p class="body-text">{{ r.body }}</p>
            </div>
          }

          <p class="body-label mono">COMMON TARGETS TO TREAT AS UNSAFE</p>
          <div class="chip-row mono">
            <button type="button" class="chip" (click)="url.set('http://169.254.169.254/latest/meta-data/')">169.254.169.254 (cloud metadata)</button>
            <button type="button" class="chip" (click)="url.set('http://localhost:6379/')">localhost / 127.0.0.1</button>
            <button type="button" class="chip" (click)="url.set('http://10.0.0.5:8080/admin')">private RFC1918 ranges</button>
          </div>
          <p class="lab-note">Validating the URL isn't enough by itself — a redirect from an allowed public URL to one of these internal targets bypasses a check that only looks at the URL you were given. A dispatcher should re-validate the destination on every redirect hop, not only the original URL.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .lab-field input { width: 100%; }
    .result-panel { margin-top: 20px; padding: 16px 18px; border-radius: var(--radius-md); border: 1px solid var(--border); background: var(--surface); }
    .result-panel[data-kind='blocked'] { border-color: color-mix(in srgb, var(--success) 45%, var(--border)); }
    .result-panel[data-kind='danger'] { border-color: color-mix(in srgb, var(--failure) 45%, var(--border)); }
    .result-title { font-size: 0.8125rem; font-weight: 700; margin: 0 0 8px; color: var(--text); }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 24px 0 10px; }
    .chip-row { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { all: unset; cursor: pointer; font-size: 0.6875rem; padding: 7px 11px; border-radius: 999px; border: 1px solid var(--border-strong); color: var(--text-muted); background: var(--surface); }
    .chip:hover { border-color: var(--security); color: var(--security); }
  `,
})
export class WebhookSsrf {
  protected readonly url = signal('https://api.customer-app.com/webhooks/incoming');
  protected readonly result = signal<{ kind: 'blocked' | 'danger'; title: string; body: string } | null>(null);

  private readonly UNSAFE_PATTERNS = ['169.254.169.254', 'localhost', '127.0.0.1', '10.0.0', '192.168.', '::1'];

  protected dispatch(): void {
    const target = this.url();
    const isUnsafe = this.UNSAFE_PATTERNS.some((p) => target.includes(p));
    if (isUnsafe) {
      this.result.set({
        kind: 'danger',
        title: 'REQUEST WOULD REACH INTERNAL INFRASTRUCTURE',
        body: 'This URL resolves to a private, loopback, or cloud-metadata address. A dispatcher without URL/IP validation and redirect re-checks would happily send an authenticated-looking request straight into your own network.',
      });
    } else {
      this.result.set({
        kind: 'blocked',
        title: 'PUBLIC DESTINATION — dispatch proceeds normally',
        body: 'This resolves to a public address outside your infrastructure, so the dispatcher sends the request as expected.',
      });
    }
  }
}
