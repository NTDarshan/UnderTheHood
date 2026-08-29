import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';
import { TermTip } from '../../../../shared/components/term-tip/term-tip';

@Component({
  selector: 'app-cors-lab',
  standalone: true,
  imports: [FormsModule, ExplainSimply, TermTip],
  template: `
    <section class="lab-section" id="cors">
      <div class="container">
        <p class="lab-index">HTTP / 09 — OPTIONS &amp; CORS</p>
        <h2 class="lab-title">Why did the browser send an OPTIONS request?</h2>
        <p class="lab-lede">
          Not every cross-<app-term def="A site's protocol + domain + port together — https://frontend.example and https://api.example are different origins, even if they're run by the same company.">origin</app-term>
          request needs a preflight. A "simple" request can go straight through; a "non-simple" one (custom
          headers, DELETE, etc.) makes the browser check first with an
          <span class="mono">OPTIONS</span> preflight before sending the real request.
        </p>

        <app-explain-simply>
          Imagine a website is a house and your browser is a guest inside it. If a script from a different
          website tries to reach into this house through your browser, the browser acts like a strict butler:
          it asks the house first, "are you okay with a guest from that other house taking this?" If the house
          doesn't clearly say yes, the butler refuses to hand anything over — even if it was already sitting
          right there ready to go.
        </app-explain-simply>

        <div class="lab-panel cors-controls">
          <div class="control-group">
            <p class="group-label mono">BROWSER WANTS TO SEND</p>
            <div class="lab-field">
              <label for="origin">Origin</label>
              <input id="origin" type="text" [ngModel]="origin()" (ngModelChange)="origin.set($event)" />
            </div>
            <div class="lab-field">
              <label for="req-method">Method</label>
              <select id="req-method" [ngModel]="requestMethod()" (ngModelChange)="requestMethod.set($event)">
                <option>GET</option>
                <option>DELETE</option>
                <option>PUT</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="req-headers">Requested header</label>
              <input id="req-headers" type="text" [ngModel]="requestHeader()" (ngModelChange)="requestHeader.set($event)" />
            </div>
          </div>

          <div class="control-group">
            <p class="group-label mono">SERVER ALLOWS</p>
            <div class="lab-field">
              <label for="allow-origin">Access-Control-Allow-Origin</label>
              <input id="allow-origin" type="text" [ngModel]="allowOrigin()" (ngModelChange)="allowOrigin.set($event)" />
            </div>
            <div class="lab-field">
              <label for="allow-method">Access-Control-Allow-Methods</label>
              <input id="allow-method" type="text" [ngModel]="allowMethods()" (ngModelChange)="allowMethods.set($event)" />
            </div>
            <div class="lab-field">
              <label for="allow-headers">Access-Control-Allow-Headers</label>
              <input id="allow-headers" type="text" [ngModel]="allowHeaders()" (ngModelChange)="allowHeaders.set($event)" />
            </div>
          </div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="sendPreflight()">Send Preflight</button>
          <button type="button" class="lab-btn lab-btn-danger" (click)="breakCors()">Break CORS</button>
          <button type="button" class="lab-btn" (click)="reset()">Reset</button>
        </div>

        @if (needsPreflight()) {
          <p class="lab-note">This request has a non-simple method/header, so the browser sends a preflight first.</p>
        } @else {
          <p class="lab-note">This request qualifies as "simple" — a browser may send it directly, without a preflight.</p>
        }

        @if (stage() !== 'idle') {
          <div class="lab-panel flow-panel">
            <div class="flow-step" [class.is-active]="stage() === 'preflight-sent' || stage() === 'result'">
              <p class="flow-label mono">1 · PREFLIGHT REQUEST</p>
              <pre class="lab-code">OPTIONS /api/orders HTTP/1.1
Origin: {{ origin() }}
Access-Control-Request-Method: {{ requestMethod() }}
Access-Control-Request-Headers: {{ requestHeader() }}</pre>
            </div>

            @if (stage() === 'result') {
              <div class="flow-step is-active">
                <p class="flow-label mono">2 · SERVER RESPONSE</p>
                <pre class="lab-code">HTTP/1.1 204 No Content
Access-Control-Allow-Origin: {{ allowOrigin() }}
Access-Control-Allow-Methods: {{ allowMethods() }}
Access-Control-Allow-Headers: {{ allowHeaders() }}</pre>
              </div>

              <div class="flow-step is-active">
                <p class="flow-label mono">3 · BROWSER DECISION</p>
                @if (allowed()) {
                  <p class="verdict verdict-ok">✓ CORS allowed — the browser sends the actual {{ requestMethod() }} request and exposes the response to JavaScript.</p>
                } @else {
                  <p class="verdict verdict-bad">CORS BLOCKED BY BROWSER</p>
                  <p class="verdict-detail">
                    The server may still process the actual request if it were sent — but the browser will not expose
                    the response to frontend JavaScript, because the allow headers don't match what was requested.
                  </p>
                }
              </div>
            }
          </div>
        }

        <p class="lab-note lab-note-warn">
          CORS is enforced by the <strong>browser</strong>, not the network. A server can still receive and process a
          blocked request — the browser is the one refusing to hand the response back to the page's script.
        </p>
      </div>
    </section>
  `,
  styles: `
    .cors-controls {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    @media (min-width: 720px) {
      .cors-controls {
        grid-template-columns: 1fr 1fr;
      }
    }

    .control-group {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .group-label {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--accent-2);
    }

    .flow-panel {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .flow-step {
      opacity: 0;
      transform: translateY(8px);
      transition: opacity 0.35s ease, transform 0.35s ease;
    }

    .flow-step.is-active {
      opacity: 1;
      transform: translateY(0);
    }

    .flow-label {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
      margin-bottom: 8px;
    }

    .verdict {
      font-size: 0.9375rem;
      font-weight: 600;
    }

    .verdict-ok {
      color: var(--accent-2);
    }

    .verdict-bad {
      color: var(--danger);
      font-family: var(--font-mono);
      letter-spacing: 0.04em;
    }

    .verdict-detail {
      margin-top: 8px;
      font-size: 0.875rem;
      color: var(--text-muted);
      font-weight: 400;
      line-height: 1.6;
    }
  `,
})
export class CorsLab {
  protected readonly origin = signal('https://frontend.example');
  protected readonly requestMethod = signal('DELETE');
  protected readonly requestHeader = signal('Authorization');

  protected readonly allowOrigin = signal('https://frontend.example');
  protected readonly allowMethods = signal('DELETE');
  protected readonly allowHeaders = signal('Authorization');

  protected readonly stage = signal<'idle' | 'preflight-sent' | 'result'>('idle');

  protected readonly needsPreflight = computed(() => this.requestMethod() !== 'GET' || !!this.requestHeader());

  protected readonly allowed = computed(
    () =>
      this.origin().trim() === this.allowOrigin().trim() &&
      this.allowMethods().split(',').map((s) => s.trim()).includes(this.requestMethod()) &&
      this.allowHeaders()
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .includes(this.requestHeader().trim().toLowerCase()),
  );

  sendPreflight(): void {
    this.stage.set('preflight-sent');
    setTimeout(() => this.stage.set('result'), 500);
  }

  breakCors(): void {
    this.allowOrigin.set('https://other-app.example');
    this.sendPreflight();
  }

  reset(): void {
    this.stage.set('idle');
    this.allowOrigin.set(this.origin());
  }
}
