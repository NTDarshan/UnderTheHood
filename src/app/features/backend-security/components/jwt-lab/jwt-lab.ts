import { Component, OnDestroy, computed, signal } from '@angular/core';

type SegmentId = 'header' | 'payload' | 'signature';

const RAW_HEADER = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
const RAW_PAYLOAD = 'eyJzdWIiOiJ1c2VyXzQ4MiIsInJvbGUiOiJtZW1iZXIiLCJleHAiOjE3MzU2ODk2MDB9';
const RAW_SIGNATURE = 'k7QwXz3n9Pmv2LdRt8sYc1JhBqUeFo0AzKxvC5Wn2Tg';

const DECODED_HEADER = `{
  "alg": "HS256",
  "typ": "JWT"
}`;

const DECODED_PAYLOAD = `{
  "sub": "user_482",
  "role": "member",
  "exp": 1735689600
}`;

const DECODE_FRAMES = [
  RAW_PAYLOAD,
  'eyJzdWIiOiJ1c2VyXzQ4MiIsInJvbGUiOiJtZW1iZXIiLCJleHAiOjE3MzU2ODk2MDB9',
  '{"sub"..."1735689600}',
  '{ "sub": "user_482", "role": "member", "exp": ... }',
  DECODED_PAYLOAD,
];

@Component({
  selector: 'app-jwt-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="jwt-lab">
      <div class="container">
        <p class="lab-index">12 — JWT &amp; STATELESS AUTHENTICATION</p>
        <h2 class="lab-title">A JWT is not a secret box. It's three readable parts and a stamp.</h2>
        <p class="lab-lede">
          A JSON Web Token looks like noise, but it's just three dot-separated segments. Click each one to see
          exactly what it holds and why the server trusts it.
        </p>

        <div class="lab-panel">
          <p class="lab-node">THE TOKEN</p>
          <div class="lab-code token-line" role="group" aria-label="JWT segments, click to inspect">
            <button
              type="button"
              class="seg seg-header"
              [class.is-active]="active() === 'header'"
              [attr.aria-pressed]="active() === 'header'"
              (click)="select('header')"
            >{{ rawHeader }}</button>{{ '' }}<span class="dot">.</span>{{ '' }}<button
              type="button"
              class="seg seg-payload"
              [class.is-active]="active() === 'payload'"
              [attr.aria-pressed]="active() === 'payload'"
              (click)="select('payload')"
            >{{ rawPayload }}</button>{{ '' }}<span class="dot">.</span>{{ '' }}<button
              type="button"
              class="seg seg-signature"
              [class.is-active]="active() === 'signature'"
              [attr.aria-pressed]="active() === 'signature'"
              (click)="select('signature')"
            >{{ rawSignature }}</button>
          </div>

          <div class="detail-block">
            @if (active() === 'header') {
              <p class="detail-label seg-header-text">HEADER</p>
              <pre class="lab-code detail-code">{{ decodedHeader }}</pre>
              <p class="detail-explain">Metadata about how the token should be processed — which algorithm was used to sign it.</p>
            }
            @if (active() === 'payload') {
              <p class="detail-label seg-payload-text">PAYLOAD</p>
              <pre class="lab-code detail-code">{{ decodeFrame() }}</pre>
              <p class="detail-explain">
                The actual claims/data the token carries — decodable by anyone, not secret. Watch it decode below.
              </p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn" (click)="playDecode()" [disabled]="isDecoding()">
                  {{ isDecoding() ? 'DECODING…' : 'REPLAY DECODE' }}
                </button>
              </div>
              <p class="lab-note lab-note-warn">
                Anyone who has the token can read the payload — JWT payloads are not automatically encrypted. Never
                put secrets in a JWT payload.
              </p>
            }
            @if (active() === 'signature') {
              <p class="detail-label seg-signature-text">SIGNATURE</p>
              <pre class="lab-code detail-code">HMACSHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secretKey
)</pre>
              <p class="detail-explain">
                A cryptographic value that lets the server verify the header and payload haven't been tampered with —
                without needing a database lookup.
              </p>
            }
          </div>

          <div class="flow-row">
            <span class="lab-node flow-node client-node">CLIENT</span>
            <span class="lab-flow-arrow">— Authorization: Bearer &lt;jwt&gt; →</span>
            <span class="lab-node flow-node server-node">API SERVER</span>
          </div>

          <p class="lab-note">
            <strong>Stateless authentication:</strong> the server recomputes the signature and checks it matches —
            if it does, it trusts the claims inside the payload directly. No session-store lookup, no shared
            database of "who's logged in." That's the core difference from the session model in the previous
            section, where the server had to look up a session record on every request.
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

    .token-line {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0;
      word-break: break-all;
      line-height: 1.9;
    }

    .dot {
      color: var(--text-faint);
      font-weight: 700;
      padding-inline: 1px;
    }

    .seg {
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      font: inherit;
      padding: 2px 4px;
      cursor: pointer;
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .seg-header { color: var(--c-attacker); }
    .seg-payload { color: var(--c-server); }
    .seg-signature { color: var(--trust); }

    .seg:hover { border-color: var(--border-strong); }

    .seg.is-active {
      border-color: currentColor;
      background: color-mix(in srgb, currentColor 14%, transparent);
    }

    .detail-block {
      margin-top: 22px;
      padding: 18px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      min-height: 96px;
    }

    .detail-label {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-bottom: 10px;
    }

    .seg-header-text { color: var(--c-attacker); }
    .seg-payload-text { color: var(--c-server); }
    .seg-signature-text { color: var(--trust); }

    .detail-code {
      margin: 0 0 12px;
    }

    .detail-explain {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
      max-width: 620px;
    }

    .flow-row {
      margin-top: 26px;
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 10px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .flow-node {
      padding: 6px 12px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
    }

    .client-node { color: var(--c-client); border-color: color-mix(in srgb, var(--c-client) 50%, var(--border-strong)); }
    .server-node { color: var(--c-server); border-color: color-mix(in srgb, var(--c-server) 50%, var(--border-strong)); }
  `,
})
export class JwtLab implements OnDestroy {
  protected readonly rawHeader = RAW_HEADER;
  protected readonly rawPayload = RAW_PAYLOAD;
  protected readonly rawSignature = RAW_SIGNATURE;
  protected readonly decodedHeader = DECODED_HEADER;

  protected readonly active = signal<SegmentId>('payload');
  private readonly frameIndex = signal(0);
  protected readonly isDecoding = signal(false);

  private timerId: ReturnType<typeof setInterval> | null = null;

  protected readonly decodeFrame = computed(() => DECODE_FRAMES[this.frameIndex()]);

  select(seg: SegmentId): void {
    this.active.set(seg);
    if (seg === 'payload' && this.frameIndex() === 0) {
      this.playDecode();
    }
  }

  playDecode(): void {
    this.clearTimer();
    this.frameIndex.set(0);
    this.isDecoding.set(true);
    this.timerId = setInterval(() => {
      const next = this.frameIndex() + 1;
      if (next >= DECODE_FRAMES.length) {
        this.frameIndex.set(DECODE_FRAMES.length - 1);
        this.isDecoding.set(false);
        this.clearTimer();
        return;
      }
      this.frameIndex.set(next);
    }, 450);
  }

  private clearTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  ngOnDestroy(): void {
    this.clearTimer();
  }
}
