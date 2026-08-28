import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

@Component({
  selector: 'app-content-negotiation',
  standalone: true,
  imports: [FormsModule, ExplainSimply],
  template: `
    <section class="lab-section" id="content-negotiation">
      <div class="container">
        <p class="lab-index">HTTP / 11 — CONTENT NEGOTIATION</p>
        <h2 class="lab-title">The client advertises preferences. The server picks a representation.</h2>
        <p class="lab-lede">Change what the client prefers and watch the server select a matching representation.</p>

        <app-explain-simply>
          It's like ordering food and telling the waiter your preferences — "no spice, and in English please."
          The kitchen does its best to match what you asked for, out of what it's actually able to make.
        </app-explain-simply>

        <div class="lab-panel negotiate-grid">
          <div class="negotiate-col">
            <p class="col-heading mono">CLIENT PREFERENCES</p>
            <div class="lab-field">
              <label for="accept">Accept</label>
              <select id="accept" [ngModel]="accept()" (ngModelChange)="accept.set($event)">
                <option value="application/json">application/json</option>
                <option value="application/xml">application/xml</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="lang">Accept-Language</label>
              <select id="lang" [ngModel]="lang()" (ngModelChange)="lang.set($event)">
                <option value="en-US">en-US</option>
                <option value="hi-IN">hi-IN</option>
              </select>
            </div>
            <div class="lab-field">
              <label for="enc">Accept-Encoding</label>
              <select id="enc" [ngModel]="encoding()" (ngModelChange)="encoding.set($event)">
                <option value="br, gzip">br, gzip</option>
                <option value="gzip">gzip</option>
                <option value="identity">identity</option>
              </select>
            </div>
          </div>

          <div class="negotiate-arrow mono" aria-hidden="true">→</div>

          <div class="negotiate-col">
            <p class="col-heading mono">SELECTED REPRESENTATION</p>
            <div class="selected-item"><span class="mono">Content-Type</span><span>{{ accept() }}</span></div>
            <div class="selected-item"><span class="mono">Content-Language</span><span>{{ lang() }}</span></div>
            <div class="selected-item"><span class="mono">Content-Encoding</span><span>{{ selectedEncoding() }}</span></div>
          </div>
        </div>

        <p class="lab-note">
          Response headers describe what was actually selected — the server chooses the best available match from
          what it can produce, based on the client's stated preferences.
        </p>
      </div>
    </section>
  `,
  styles: `
    .negotiate-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
      align-items: center;
    }

    @media (min-width: 780px) {
      .negotiate-grid {
        grid-template-columns: 1fr auto 1fr;
      }
    }

    .negotiate-col {
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .col-heading {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--accent-2);
    }

    .negotiate-arrow {
      color: var(--accent);
      font-size: 1.25rem;
      text-align: center;
    }

    .selected-item {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 10px 12px;
      background: var(--surface);
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
    }

    .selected-item span:first-child {
      color: var(--text-faint);
    }

    .selected-item span:last-child {
      color: var(--accent-strong);
      font-family: var(--font-mono);
    }
  `,
})
export class ContentNegotiation {
  protected readonly accept = signal('application/json');
  protected readonly lang = signal('en-US');
  protected readonly encoding = signal('br, gzip');

  protected readonly selectedEncoding = computed(() => {
    const e = this.encoding();
    if (e.includes('br')) return 'br';
    if (e.includes('gzip')) return 'gzip';
    return 'identity (no compression)';
  });
}
