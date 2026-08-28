import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-performance-security',
  standalone: true,
  template: `
    <section class="lab-section" id="performance">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 17 — PERFORMANCE, CONCEPTUALLY</p>
        <h2 class="lab-title">Bigger payloads mean more of everything downstream.</h2>
        <p class="lab-lede">
          No fake benchmark numbers here — just the conceptual chain that connects payload choices to cost.
        </p>

        <div class="size-toggle lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="payload() === 'small'" (click)="payload.set('small')">Small JSON</button>
          <button type="button" class="lab-btn" [class.is-active]="payload() === 'large'" (click)="payload.set('large')">Large JSON</button>
          <button type="button" class="lab-btn" [class.is-active]="payload() === 'binary'" (click)="payload.set('binary')">Compact binary</button>
        </div>

        <div class="perf-bars">
          @for (b of bars(); track b.label) {
            <div class="perf-row">
              <span class="perf-label mono">{{ b.label }}</span>
              <div class="perf-track"><div class="perf-fill" [style.width.%]="b.value"></div></div>
            </div>
          }
        </div>

        <p class="lab-note">
          Larger payloads mean more bytes over the network and more parsing work on both ends. Format choice
          is one lever among several — it can matter, but it is rarely the whole story.
        </p>
      </div>
    </section>

    <section class="lab-section" id="security">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 18 — SERIALIZATION SECURITY</p>
        <h2 class="lab-title">Deserializing input is not the same as trusting it.</h2>

        <div class="security-flow mono">
          <div class="sec-node">Untrusted Input</div>
          <div class="sec-arrow">↓</div>
          <div class="sec-node">Deserialize</div>
          <div class="sec-arrow">↓</div>
          <div class="sec-node">Validate</div>
          <div class="sec-arrow">↓</div>
          <div class="sec-node">Sanitize / Authorize</div>
          <div class="sec-arrow">↓</div>
          <div class="sec-node accent">Business Logic</div>
        </div>

        <ul class="security-list">
          <li>Never blindly trust deserialized input, no matter how well-formed it looks.</li>
          <li>Successful deserialization does not mean the data is safe or valid — that's a separate step.</li>
          <li>Validate everything that crosses a trust boundary before acting on it.</li>
          <li>Be especially careful with formats or libraries that support unsafe deserialization mechanisms.</li>
          <li>Valid syntax is not the same as safe data.</li>
        </ul>
      </div>
    </section>
  `,
  styles: `
    .perf-bars {
      margin-top: 28px;
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-width: 520px;
    }

    .perf-row {
      display: grid;
      grid-template-columns: 140px 1fr;
      align-items: center;
      gap: 12px;
    }

    .perf-label {
      font-size: 0.75rem;
      color: var(--text-faint);
    }

    .perf-track {
      height: 10px;
      border-radius: 999px;
      background: var(--surface-elevated);
      overflow: hidden;
    }

    .perf-fill {
      height: 100%;
      border-radius: 999px;
      background: linear-gradient(90deg, var(--accent-2), var(--accent));
      transition: width 0.4s ease;
    }

    .security-flow {
      margin-top: 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      max-width: 260px;
      margin-inline: auto;
    }

    .sec-node {
      padding: 10px 20px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text);
      font-size: 0.8125rem;
      font-weight: 600;
      text-align: center;
    }

    .sec-node.accent {
      border-color: var(--accent-dim);
      color: var(--accent);
      box-shadow: 0 0 16px var(--glow-accent);
    }

    .sec-arrow {
      color: var(--border-strong);
    }

    .security-list {
      margin-top: 28px;
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
      max-width: 620px;
    }

    .security-list li {
      font-size: 0.9375rem;
      color: var(--text-muted);
      padding-left: 18px;
      position: relative;
      line-height: 1.6;
    }

    .security-list li::before {
      content: '›';
      position: absolute;
      left: 0;
      color: var(--danger);
    }
  `,
})
export class PerformanceSecurity {
  protected readonly payload = signal<'small' | 'large' | 'binary'>('small');

  protected readonly bars = computed(() => {
    const p = this.payload();
    const values: Record<string, { size: number; parse: number; transfer: number }> = {
      small: { size: 20, parse: 15, transfer: 20 },
      large: { size: 90, parse: 70, transfer: 90 },
      binary: { size: 35, parse: 30, transfer: 35 },
    };
    const v = values[p];
    return [
      { label: 'Payload size', value: v.size },
      { label: 'Parsing work', value: v.parse },
      { label: 'Network transfer', value: v.transfer },
    ];
  });
}
