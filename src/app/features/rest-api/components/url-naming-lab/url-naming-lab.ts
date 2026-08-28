import { Component, computed, signal } from '@angular/core';
import { lintUrl, suggestUrlFix } from '../../engine/rest-simulator';

@Component({
  selector: 'app-url-naming-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="url-naming">
      <div class="container">
        <p class="lab-index">REST API / 07 — NOUNS, PLURALS &amp; URL LINTING</p>
        <h2 class="lab-title">Nouns, plurals, and a live linter to check your own URL.</h2>

        <div class="lab-panel">
          <h3 class="sub-heading">Nouns, not verbs</h3>
          <div class="compare-grid">
            <div class="compare-col compare-bad">
              <p class="compare-label mono">BAD</p>
              <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/getBooks</span></p>
              <p class="lab-code"><span class="tok-method">POST</span> <span class="tok-key">/createBook</span></p>
              <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/getBookById/42</span></p>
            </div>
            <div class="compare-col compare-good">
              <p class="compare-label mono">GOOD</p>
              <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/books</span></p>
              <p class="lab-code"><span class="tok-method">POST</span> <span class="tok-key">/books</span></p>
              <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/books/42</span></p>
            </div>
          </div>
          <p class="lab-note">
            The HTTP method already communicates the operation — the URL just needs to name the resource.
            That said, custom action endpoints (e.g. <code class="mono">POST /orders/42/cancel</code>) can
            legitimately carry action semantics when the operation doesn't map to standard CRUD — not every
            verb in a URL is a mistake.
          </p>
        </div>

        <div class="lab-panel">
          <h3 class="sub-heading">Plural resource names</h3>
          <div class="compare-grid">
            <div class="compare-col compare-good">
              <p class="compare-label mono">PREFERRED</p>
              <p class="lab-code"><span class="tok-key">/books</span></p>
              <p class="lab-code"><span class="tok-key">/books/42</span></p>
            </div>
            <div class="compare-col compare-bad">
              <p class="compare-label mono">INCONSISTENT</p>
              <p class="lab-code"><span class="tok-key">/book</span></p>
              <p class="lab-code"><span class="tok-key">/books/42</span></p>
            </div>
          </div>
          <p class="lab-note">
            Plural is a strong convention, not a formal REST requirement. What actually matters is
            consistency — pick one and use it everywhere.
          </p>
        </div>

        <div class="lab-panel">
          <h3 class="sub-heading">Live URL linter</h3>
          <div class="lab-field">
            <label for="url-input">URL to check</label>
            <input id="url-input" type="text" [value]="url()" (input)="onInput($event)" />
          </div>

          @if (warnings().length === 0) {
            <p class="lint-clean">No warnings — this URL follows naming conventions.</p>
          } @else {
            <div class="warn-list">
              @for (w of warnings(); track w.id) {
                <p class="warn-row">⚠ {{ w.message }}</p>
              }
            </div>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [disabled]="warnings().length === 0" (click)="fixIt()">Fix it</button>
            <button type="button" class="lab-btn" (click)="reset()">↻ Reset</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .sub-heading { font-size: 1rem; color: var(--text); margin-bottom: 16px; }
    .compare-grid { display: grid; gap: 16px; grid-template-columns: 1fr; }
    @media (min-width: 640px) {
      .compare-grid { grid-template-columns: 1fr 1fr; }
    }
    .compare-col { display: flex; flex-direction: column; gap: 8px; }
    .compare-label { font-size: 0.6875rem; letter-spacing: 0.08em; margin-bottom: 2px; }
    .compare-bad .compare-label { color: var(--danger); }
    .compare-good .compare-label { color: var(--accent-2); }
    .compare-col .lab-code { padding: 10px 14px; margin: 0; }

    .lint-clean { margin-top: 18px; font-size: 0.875rem; color: var(--accent-2); }
    .warn-list { margin-top: 18px; display: flex; flex-direction: column; gap: 8px; }
    .warn-row { font-size: 0.8125rem; color: var(--accent); line-height: 1.55; }
  `,
})
export class UrlNamingLab {
  protected readonly url = signal('/Books/harry_potter');
  protected readonly warnings = computed(() => lintUrl(this.url()));

  onInput(event: Event): void {
    this.url.set((event.target as HTMLInputElement).value);
  }

  fixIt(): void {
    this.url.set(suggestUrlFix(this.url()));
  }

  reset(): void {
    this.url.set('/Books/harry_potter');
  }
}
