import { Component } from '@angular/core';
import { HttpMethod, METHOD_INFO } from '../../engine/rest-simulator';

const ROWS: HttpMethod[] = ['GET', 'PUT', 'DELETE', 'POST', 'PATCH'];

@Component({
  selector: 'app-safe-vs-idempotent',
  standalone: true,
  template: `
    <section class="lab-section" id="safe-vs-idempotent">
      <div class="container">
        <p class="lab-index">REST API / 13 — SAFE VS IDEMPOTENT</p>
        <h2 class="lab-title">Two different questions. Don't collapse them into one.</h2>

        <div class="definition-row">
          <div class="definition-card">
            <p class="lab-node">SAFE</p>
            <p class="definition-text">The method is <strong>intended</strong> not to modify server state. A safe request should be freely repeatable, cacheable, and prefetchable without consequence.</p>
          </div>
          <div class="definition-card">
            <p class="lab-node">IDEMPOTENT</p>
            <p class="definition-text">Repeating the same request has the same intended effect on server state as making it once. The end state after N calls equals the end state after 1 call.</p>
          </div>
        </div>

        <div class="lab-panel">
          <p class="lab-node">THE SUMMARY CARD — MEMORIZE THIS TABLE</p>
          <div class="summary-table mono">
            <div class="summary-row summary-head">
              <span>Method</span>
              <span>Safe?</span>
              <span>Idempotent?</span>
            </div>
            @for (m of methods; track m) {
              <div class="summary-row">
                <span class="tok-method">{{ m }}</span>
                <span class="pill" [class.pill-yes]="info(m).safe" [class.pill-no]="!info(m).safe">{{ info(m).safe ? '✓ yes' : '✕ no' }}</span>
                <span class="pill" [class.pill-yes]="info(m).idempotent === 'yes'" [class.pill-no]="info(m).idempotent === 'no'" [class.pill-conditional]="info(m).idempotent === 'depends'">
                  {{ info(m).idempotent === 'yes' ? '✓ yes' : info(m).idempotent === 'no' ? '✕ no' : '? depends' }}
                </span>
              </div>
            }
          </div>
          <p class="lab-note">Safe implies idempotent (if nothing is meant to change, repeating it changes nothing further) — but idempotent does <strong>not</strong> imply safe. PUT and DELETE both modify state, yet repeating either one lands on the same end state every time.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .definition-row { margin-top: 32px; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .definition-card { padding: 20px 22px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); }
    .definition-text { margin-top: 10px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }

    .summary-table { display: flex; flex-direction: column; gap: 6px; margin-top: 18px; }
    .summary-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; align-items: center; padding: 12px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.8125rem; }
    .summary-head { color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.06em; font-size: 0.6875rem; background: transparent; border: none; padding-bottom: 0; }

    @media (max-width: 640px) {
      .definition-row { grid-template-columns: 1fr; }
    }
  `,
})
export class SafeVsIdempotent {
  protected readonly methods = ROWS;

  protected info(m: HttpMethod) {
    return METHOD_INFO[m];
  }
}
