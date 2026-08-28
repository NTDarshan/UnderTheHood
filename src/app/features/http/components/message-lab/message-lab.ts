import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type Region = 'method' | 'target' | 'version' | 'headers' | 'body' | null;

const REGION_EXPLANATIONS: Record<Exclude<Region, null>, { title: string; text: string }> = {
  method: { title: 'Method', text: 'Communicates the intended semantics of the request — what the client wants to do.' },
  target: { title: 'Target', text: 'The resource path the request applies to, e.g. /users/42.' },
  version: { title: 'Version', text: 'The HTTP version the message is formatted for, e.g. HTTP/1.1.' },
  headers: { title: 'Headers', text: 'Metadata about the message — content type, negotiation preferences, auth, caching.' },
  body: { title: 'Body', text: 'The actual payload — present on requests like POST/PUT/PATCH and most successful responses.' },
};

const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'] as const;

@Component({
  selector: 'app-message-lab',
  standalone: true,
  imports: [FormsModule, ExplainSimply],
  template: `
    <section class="lab-section" id="messages">
      <div class="container">
        <p class="lab-index">HTTP / 04 — MESSAGES</p>
        <h2 class="lab-title">A request and a response are both structured text messages.</h2>
        <p class="lab-lede">Click a region on either side to see what it means.</p>

        <app-explain-simply>
          A request is like a filled-out form you hand to a clerk: what you want (method + target), your
          details (headers), and sometimes an attachment (body). A response is the clerk's reply — a result
          code, some notes about what they're giving you, and often the thing itself.
        </app-explain-simply>

        <div class="tabs mono" role="tablist">
          <button type="button" role="tab" class="lab-btn" [class.is-active]="mode() === 'inspect'" (click)="mode.set('inspect')">Inspect</button>
          <button type="button" role="tab" class="lab-btn" [class.is-active]="mode() === 'build'" (click)="mode.set('build')">Build &amp; Send</button>
        </div>

        @if (mode() === 'inspect') {
          <div class="lab-panel inspector">
            <div class="inspector-col">
              <p class="col-heading mono">REQUEST</p>
              <div class="msg-line">
                <span class="seg" [class.is-hot]="region() === 'method'" (click)="region.set('method')">GET</span>
                <span class="seg" [class.is-hot]="region() === 'target'" (click)="region.set('target')">/users/42</span>
                <span class="seg" [class.is-hot]="region() === 'version'" (click)="region.set('version')">HTTP/1.1</span>
              </div>
              <div class="msg-block" [class.is-hot]="region() === 'headers'" (click)="region.set('headers')">
                <p>Host: api.example.com</p>
                <p>Accept: application/json</p>
                <p>Authorization: Bearer &lt;token&gt;</p>
                <p>User-Agent: UnderTheHood/1.0</p>
              </div>
            </div>
            <div class="inspector-col">
              <p class="col-heading mono">RESPONSE</p>
              <div class="msg-line">
                <span class="seg" [class.is-hot]="region() === 'version'" (click)="region.set('version')">HTTP/1.1</span>
                <span class="seg" [class.is-hot]="region() === 'method'" (click)="region.set('method')">200 OK</span>
              </div>
              <div class="msg-block" [class.is-hot]="region() === 'headers'" (click)="region.set('headers')">
                <p>Content-Type: application/json</p>
                <p>Cache-Control: max-age=30</p>
                <p>ETag: "abc123"</p>
              </div>
              <div class="msg-block" [class.is-hot]="region() === 'body'" (click)="region.set('body')">
                <p>{{ '{' }}</p>
                <p>&nbsp;&nbsp;"id": 42,</p>
                <p>&nbsp;&nbsp;"name": "Alex"</p>
                <p>{{ '}' }}</p>
              </div>
            </div>
          </div>

          <div class="region-explain">
            @if (explanation(); as e) {
              <p class="region-title mono">{{ e.title }}</p>
              <p>{{ e.text }}</p>
            } @else {
              <p class="region-hint">Click METHOD, TARGET, VERSION, HEADERS or BODY above.</p>
            }
          </div>
        } @else {
          <div class="lab-panel builder">
            <div class="builder-controls">
              <div class="lab-field">
                <label for="method-select">Method</label>
                <select id="method-select" [ngModel]="builderMethod()" (ngModelChange)="builderMethod.set($event); sent.set(false)">
                  @for (m of methods; track m) {
                    <option [value]="m">{{ m }}</option>
                  }
                </select>
              </div>
              <div class="lab-field">
                <label for="path-input">Path</label>
                <input id="path-input" type="text" [ngModel]="builderPath()" (ngModelChange)="builderPath.set($event); sent.set(false)" />
              </div>
              <div class="lab-field">
                <label for="body-input">Body (JSON, optional)</label>
                <input id="body-input" type="text" [ngModel]="builderBody()" (ngModelChange)="builderBody.set($event); sent.set(false)" placeholder='{"name":"Alex"}' [disabled]="!hasBody()" />
              </div>
              <button type="button" class="lab-btn lab-btn-primary" (click)="sendBuilt()">Send</button>
            </div>

            <div class="builder-output lab-code">
              <p><span class="tok-method">{{ builderMethod() }}</span> <span class="tok-key">{{ builderPath() || '/' }}</span> HTTP/1.1</p>
              <p class="tok-dim">Host: example.com</p>
              <p class="tok-dim">Accept: application/json</p>
              @if (hasBody() && builderBody()) {
                <p class="tok-dim">Content-Type: application/json</p>
                <p class="tok-dim">Content-Length: {{ builderBody().length }}</p>
                <p></p>
                <p>{{ builderBody() }}</p>
              }
              @if (sent()) {
                <p></p>
                <p>HTTP/1.1 <span class="tok-status-ok">{{ simulatedStatus() }}</span></p>
                <p class="tok-dim">Content-Type: application/json</p>
              }
            </div>
          </div>
          <p class="lab-note">This is a simulated response, entirely in the browser — no real backend is called.</p>
        }
      </div>
    </section>
  `,
  styles: `
    .tabs {
      display: flex;
      gap: 8px;
      margin-top: 24px;
    }

    .inspector {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }

    @media (min-width: 720px) {
      .inspector {
        grid-template-columns: 1fr 1fr;
      }
    }

    .col-heading {
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      color: var(--accent-2);
      margin-bottom: 12px;
    }

    .msg-line {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      font-family: var(--font-mono);
      font-size: 0.875rem;
      margin-bottom: 10px;
    }

    .seg,
    .msg-block {
      cursor: pointer;
      border-radius: var(--radius-sm);
      border: 1px solid transparent;
      transition: background 0.15s ease, border-color 0.15s ease;
    }

    .seg {
      padding: 4px 8px;
      background: var(--surface);
    }

    .msg-block {
      padding: 10px 12px;
      background: var(--surface);
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      color: var(--text-muted);
      margin-bottom: 8px;
    }

    .seg:hover,
    .msg-block:hover {
      border-color: var(--border-strong);
    }

    .seg.is-hot,
    .msg-block.is-hot {
      border-color: var(--accent);
      background: color-mix(in srgb, var(--accent) 10%, var(--surface));
      color: var(--text);
    }

    .region-explain {
      margin-top: 20px;
      min-height: 3.5em;
      font-size: 0.9375rem;
      color: var(--text-muted);
      max-width: 560px;
    }

    .region-title {
      color: var(--accent);
      margin-bottom: 4px;
      font-size: 0.75rem;
      letter-spacing: 0.08em;
    }

    .region-hint {
      color: var(--text-faint);
    }

    .builder-controls {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }

    @media (min-width: 640px) {
      .builder-controls {
        grid-template-columns: repeat(3, 1fr) auto;
        align-items: end;
      }
    }

    .builder-output {
      margin-top: 20px;
    }
  `,
})
export class MessageLab {
  protected readonly mode = signal<'inspect' | 'build'>('inspect');
  protected readonly region = signal<Region>(null);
  protected readonly explanation = computed(() => {
    const r = this.region();
    return r ? REGION_EXPLANATIONS[r] : null;
  });

  protected readonly methods = METHODS;
  protected readonly builderMethod = signal<string>('GET');
  protected readonly builderPath = signal('/api/users/42');
  protected readonly builderBody = signal('');
  protected readonly sent = signal(false);

  protected readonly hasBody = computed(() => ['POST', 'PUT', 'PATCH'].includes(this.builderMethod()));
  protected readonly simulatedStatus = computed(() => {
    switch (this.builderMethod()) {
      case 'POST':
        return '201 Created';
      case 'DELETE':
        return '204 No Content';
      default:
        return '200 OK';
    }
  });

  sendBuilt(): void {
    this.sent.set(true);
  }
}
