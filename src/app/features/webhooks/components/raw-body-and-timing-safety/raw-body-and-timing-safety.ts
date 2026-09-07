import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-raw-body-and-timing-safety',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-raw-body-timing">
      <div class="container">
        <p class="lab-index mono">16 — TWO WAYS TO VERIFY WRONG ANYWAY</p>
        <h2 class="lab-title">The raw-body trap, and the timing-safe comparison</h2>
        <p class="lab-lede">
          A correct HMAC implementation can still fail if you verify against the wrong bytes, or compare the
          result in a way that leaks information.
        </p>

        <div class="lab-panel">
          <p class="body-label mono">THE RAW-BODY TRAP</p>
          <p class="lab-lede small">Same logical JSON, different byte representation — different signature.</p>
          <div class="raw-cols">
            <div class="raw-col">
              <p class="col-heading mono">EXACT BYTES SIGNED BY PROVIDER</p>
              <pre class="lab-code mono">{{ '{' }}"type":"order.created","id":1{{ '}' }}</pre>
            </div>
            <div class="raw-col">
              <p class="col-heading mono">RE-SERIALIZED AFTER JSON.parse()</p>
              <pre class="lab-code mono">{{ '{' }} "type": "order.created", "id": 1 {{ '}' }}</pre>
            </div>
          </div>
          <p class="lab-note lab-note-warn">Parsing and re-serializing before verifying is a common bug — whitespace, key order, or number formatting differences produce a different signature, so the check fails even though the payload is genuine. Verify against the exact raw body the provider actually signed, unless the provider's docs explicitly say otherwise.</p>
        </div>

        <div class="lab-panel">
          <p class="body-label mono">CONSTANT-TIME COMPARISON</p>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="runNaive()" [disabled]="running()">COMPARE NAIVELY (early-exit)</button>
            <button type="button" class="lab-btn lab-btn-primary" (click)="runConstant()" [disabled]="running()">COMPARE CONSTANT-TIME</button>
          </div>
          <div class="timing-bars">
            <div class="timing-row"><span class="mono timing-label">wrong at position 1</span><div class="timing-bar" [style.width.%]="bars()[0]"></div></div>
            <div class="timing-row"><span class="mono timing-label">wrong at position 20</span><div class="timing-bar" [style.width.%]="bars()[1]"></div></div>
            <div class="timing-row"><span class="mono timing-label">wrong at position 40</span><div class="timing-bar" [style.width.%]="bars()[2]"></div></div>
          </div>
          <p class="lab-note">With a naive <span class="mono">===</span>-style comparison that returns as soon as it finds a mismatch, a wrong guess that gets further into the string measurably takes longer to reject — an attacker who can measure that timing can guess the signature one byte at a time. A constant-time comparison always takes the same time regardless of where the mismatch is, so it leaks nothing.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .small { font-size: 0.875rem; margin-top: 8px; }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 0 0 4px; }
    .raw-cols { margin-top: 16px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 720px) { .raw-cols { grid-template-columns: 1fr 1fr; } }
    .col-heading { font-size: 0.6875rem; color: var(--text-faint); margin-bottom: 8px; }
    .lab-code { margin: 0; }
    .timing-bars { margin-top: 20px; display: flex; flex-direction: column; gap: 10px; }
    .timing-row { display: flex; align-items: center; gap: 12px; }
    .timing-label { width: 160px; flex-shrink: 0; font-size: 0.6875rem; color: var(--text-faint); }
    .timing-bar { height: 10px; background: var(--security); border-radius: 4px; transition: width 0.4s ease; }
  `,
})
export class RawBodyAndTimingSafety {
  protected readonly bars = signal([0, 0, 0]);
  protected readonly running = signal(false);

  protected runNaive(): void {
    if (this.running()) return;
    this.running.set(true);
    // Early-exit comparison: time correlates with how far the match got.
    this.bars.set([15, 55, 95]);
    setTimeout(() => (this.running.set(false)), 600);
  }

  protected runConstant(): void {
    if (this.running()) return;
    this.running.set(true);
    // Constant-time: identical bar regardless of mismatch position.
    this.bars.set([70, 70, 70]);
    setTimeout(() => (this.running.set(false)), 600);
  }
}
