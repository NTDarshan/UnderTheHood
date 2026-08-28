import { Component, signal } from '@angular/core';
import { HttpMethod, METHOD_INFO } from '../../engine/rest-simulator';

const PRIMARY: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
const SECONDARY: HttpMethod[] = ['HEAD', 'OPTIONS'];

@Component({
  selector: 'app-http-method-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="http-methods">
      <div class="container">
        <p class="lab-index">REST API / 10 — HTTP METHODS LABORATORY</p>
        <h2 class="lab-title">Seven methods. Each one makes a different promise.</h2>
        <p class="lab-lede">Click a row to see its full profile — purpose, whether it carries a body, and how it behaves under safety and idempotency.</p>

        <div class="lab-panel">
          <div class="method-table mono">
            <div class="method-row method-head">
              <span>Method</span>
              <span>Purpose</span>
              <span>Body?</span>
              <span>Safe?</span>
              <span>Idempotent?</span>
              <span>Status</span>
            </div>
            @for (m of primary; track m) {
              <button type="button" class="method-row method-row-btn" [class.is-active]="selected() === m" (click)="selected.set(m)">
                <span class="tok-method">{{ m }}</span>
                <span class="method-purpose">{{ info(m).purpose }}</span>
                <span class="pill" [class.pill-yes]="info(m).hasRequestBody" [class.pill-no]="!info(m).hasRequestBody">{{ info(m).hasRequestBody ? 'yes' : 'no' }}</span>
                <span class="pill" [class.pill-yes]="info(m).safe" [class.pill-no]="!info(m).safe">{{ info(m).safe ? 'yes' : 'no' }}</span>
                <span class="pill" [class.pill-yes]="info(m).idempotent === 'yes'" [class.pill-no]="info(m).idempotent === 'no'" [class.pill-conditional]="info(m).idempotent === 'depends'">{{ info(m).idempotent === 'depends' ? 'depends' : info(m).idempotent }}</span>
                <span>{{ info(m).typicalStatus }}</span>
              </button>
            }
          </div>

          <p class="lab-node secondary-label">SECONDARY METHODS</p>
          <div class="method-table method-table-secondary mono">
            @for (m of secondary; track m) {
              <button type="button" class="method-row method-row-btn method-row-small" [class.is-active]="selected() === m" (click)="selected.set(m)">
                <span class="tok-method">{{ m }}</span>
                <span class="method-purpose">{{ info(m).purpose }}</span>
                <span class="pill" [class.pill-yes]="info(m).hasRequestBody" [class.pill-no]="!info(m).hasRequestBody">{{ info(m).hasRequestBody ? 'yes' : 'no' }}</span>
                <span class="pill" [class.pill-yes]="info(m).safe" [class.pill-no]="!info(m).safe">{{ info(m).safe ? 'yes' : 'no' }}</span>
                <span class="pill" [class.pill-yes]="info(m).idempotent === 'yes'" [class.pill-no]="info(m).idempotent === 'no'" [class.pill-conditional]="info(m).idempotent === 'depends'">{{ info(m).idempotent }}</span>
                <span>{{ info(m).typicalStatus }}</span>
              </button>
            }
          </div>

          <div class="detail-card">
            <p class="lab-node">{{ selected() }} — DETAIL</p>
            <p class="lab-code"><span class="tok-method">{{ info(selected()).typicalUse.split(' ')[0] }}</span> <span class="tok-key">{{ info(selected()).typicalUse.split(' ')[1] }}</span></p>
            <p class="detail-purpose">{{ info(selected()).purpose }}</p>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .method-table { display: flex; flex-direction: column; gap: 4px; margin-top: 20px; }
    .method-row { display: grid; grid-template-columns: 0.7fr 2fr 0.8fr 0.8fr 1fr 0.7fr; gap: 10px; align-items: center; padding: 10px 12px; font-size: 0.75rem; }
    .method-head { color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.6875rem; }
    .method-row-btn { width: 100%; text-align: left; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text-muted); transition: border-color 0.15s ease; }
    .method-row-btn:hover { border-color: var(--accent-dim); }
    .method-row-btn.is-active { border-color: var(--accent); background: color-mix(in srgb, var(--accent) 8%, var(--surface)); }
    .method-row-small { opacity: 0.75; font-size: 0.7rem; }
    .method-purpose { color: var(--text-muted); font-family: var(--font-sans); }
    .secondary-label { margin-top: 24px; margin-bottom: 4px; color: var(--text-faint); }

    .detail-card { margin-top: 24px; padding: 18px 20px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); }
    .detail-purpose { margin-top: 10px; font-size: 0.9375rem; color: var(--text); }

    @media (max-width: 720px) {
      .method-row { grid-template-columns: repeat(3, 1fr); row-gap: 6px; }
      .method-purpose { grid-column: 1 / -1; }
    }
  `,
})
export class HttpMethodLab {
  protected readonly primary = PRIMARY;
  protected readonly secondary = SECONDARY;
  protected readonly selected = signal<HttpMethod>('GET');

  protected info(m: HttpMethod) {
    return METHOD_INFO[m];
  }
}
