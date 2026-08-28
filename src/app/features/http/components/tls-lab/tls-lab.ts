import { Component, signal } from '@angular/core';
import { TermTip } from '../../../../shared/components/term-tip/term-tip';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

interface TlsStep {
  title: string;
  detail: string;
}

const STEPS: TlsStep[] = [
  { title: 'Client Hello', detail: 'The client asks for a secure connection and lists what it supports.' },
  { title: 'TLS Handshake', detail: 'Client and server negotiate how the connection will be secured.' },
  { title: 'Server Certificate', detail: 'The server presents a certificate identifying itself.' },
  { title: 'Certificate Validation', detail: 'The client checks the certificate against a trusted authority chain.' },
  { title: 'Key Establishment', detail: 'Both sides derive the keys used to encrypt the rest of the session.' },
  { title: 'Encrypted Application Data', detail: 'HTTP messages now travel inside the encrypted, authenticated channel.' },
];

@Component({
  selector: 'app-tls-lab',
  standalone: true,
  imports: [TermTip, ExplainSimply],
  template: `
    <section class="lab-section" id="tls">
      <div class="container">
        <p class="lab-index">HTTP / 16 — TLS &amp; HTTPS</p>
        <h2 class="lab-title">
          HTTPS is HTTP, carried through a
          <app-term def="Transport Layer Security — a protocol that encrypts a connection and verifies who you're actually talking to, so data in transit can't be read or silently altered.">TLS</app-term>-protected
          connection.
        </h2>
        <p class="lab-lede">Step through a simplified handshake, then compare what an observer on the network can see.</p>

        <app-explain-simply>
          Sending data over plain HTTP is like mailing a postcard — anyone handling it along the way can read
          what's written on it. HTTPS is like sealing the same message in a locked box that only the intended
          recipient has the key to.
        </app-explain-simply>

        <div class="lab-panel steps-panel">
          <div class="steps-row mono">
            @for (s of steps; track s.title; let i = $index) {
              <button type="button" class="step-dot" [class.is-active]="step() === i" [class.is-past]="step() > i" (click)="step.set(i)" [attr.aria-label]="s.title">
                {{ i + 1 }}
              </button>
            }
          </div>
          <p class="step-title">{{ steps[step()].title }}</p>
          <p class="step-detail">{{ steps[step()].detail }}</p>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="prev()" [disabled]="step() === 0">← Back</button>
            <button type="button" class="lab-btn lab-btn-primary" (click)="next()" [disabled]="step() === steps.length - 1">Next Step →</button>
          </div>
        </div>

        <div class="compare-grid">
          <div class="compare-col">
            <p class="compare-heading mono">HTTP</p>
            <div class="lab-code plain-traffic">GET /account HTTP/1.1
Authorization: Bearer &lt;token&gt;
<span class="visible-tag">← visible to network observers</span></div>
          </div>
          <div class="compare-col">
            <p class="compare-heading mono">HTTPS</p>
            <div class="lab-code encrypted-traffic">████████████████████████
Encrypted application data
████████████████████████</div>
          </div>
        </div>

        <div class="properties-row mono">
          <span class="property">CONFIDENTIALITY</span>
          <span class="property">INTEGRITY</span>
          <span class="property">SERVER AUTHENTICATION</span>
        </div>
        <p class="lab-note">
          Standard HTTPS authenticates the server via its certificate. TLS alone does not automatically authenticate
          every party in every configuration — client authentication, when used, is a separate, additional step.
        </p>
      </div>
    </section>
  `,
  styles: `
    .steps-panel {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .steps-row {
      display: flex;
      gap: 6px;
      margin-bottom: 20px;
    }

    .step-dot {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--text-faint);
      font-size: 0.75rem;
      flex-shrink: 0;
    }

    .step-dot.is-past {
      border-color: var(--accent-dim);
      color: var(--accent);
      background: var(--surface-elevated);
    }

    .step-dot.is-active {
      border-color: var(--accent);
      color: var(--accent-strong);
      box-shadow: 0 0 12px var(--glow-accent);
    }

    .step-title {
      font-size: 1.0625rem;
      font-weight: 600;
      color: var(--text);
    }

    .step-detail {
      margin-top: 8px;
      color: var(--text-muted);
      max-width: 560px;
      line-height: 1.6;
    }

    .compare-grid {
      margin-top: 40px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 720px) {
      .compare-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .compare-heading {
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      color: var(--accent-2);
      margin-bottom: 10px;
    }

    .plain-traffic {
      color: var(--danger);
    }

    .visible-tag {
      display: block;
      margin-top: 8px;
      color: var(--text-faint);
    }

    .encrypted-traffic {
      color: var(--accent-2);
      letter-spacing: 0.05em;
    }

    .properties-row {
      margin-top: 32px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .property {
      padding: 8px 14px;
      border-radius: 999px;
      border: 1px solid var(--accent-2-dim);
      color: var(--accent-2);
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
    }
  `,
})
export class TlsLab {
  protected readonly steps = STEPS;
  protected readonly step = signal(0);

  next(): void {
    this.step.update((s) => Math.min(s + 1, STEPS.length - 1));
  }

  prev(): void {
    this.step.update((s) => Math.max(s - 1, 0));
  }
}
