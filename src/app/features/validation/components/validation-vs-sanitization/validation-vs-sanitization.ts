import { Component } from '@angular/core';

@Component({
  selector: 'app-validation-vs-sanitization',
  standalone: true,
  template: `
    <section class="lab-section" id="validation-vs-sanitization">
      <div class="container">
        <p class="lab-index">VALIDATION / 15 — VALIDATION VS. SANITIZATION</p>
        <h2 class="lab-title">"Is this acceptable?" is not the same question as "can this be made safe?"</h2>

        <div class="compare-grid">
          <div class="compare-card">
            <p class="compare-title mono">VALIDATION</p>
            <p class="compare-text">"Is this input acceptable?"</p>
          </div>
          <div class="compare-card">
            <p class="compare-title mono">SANITIZATION / NORMALIZATION</p>
            <p class="compare-text">"Can or should this input be transformed into a safe or standard form?"</p>
          </div>
        </div>

        <div class="lab-panel example-panel">
          <p class="example-input mono">Input: &lt;script&gt;...&lt;/script&gt;</p>
          <p class="lab-note lab-note-warn">
            "Sanitize everything and you're safe" is not accurate advice. Sanitization alone is not a
            universal security solution — it's one layer among several.
          </p>
        </div>

        <div class="stack-list">
          <p class="stack-line">Validation</p>
          <p class="stack-plus">+</p>
          <p class="stack-line">Context-aware output encoding</p>
          <p class="stack-plus">+</p>
          <p class="stack-line">Safe APIs</p>
          <p class="stack-plus">+</p>
          <p class="stack-line">Parameterized database queries</p>
          <p class="stack-plus">+</p>
          <p class="stack-line">Other context-appropriate security controls</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .compare-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .compare-grid { grid-template-columns: 1fr 1fr; } }
    .compare-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; }
    .compare-title { font-size: 0.75rem; color: var(--accent-2); margin-bottom: 10px; }
    .compare-text { font-size: 0.9375rem; color: var(--text); }

    .example-panel { margin-top: 24px; }
    .example-input { color: var(--danger); font-size: 0.875rem; margin-bottom: 14px; }

    .stack-list { margin-top: 24px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
    .stack-line { padding: 8px 20px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-raised); font-size: 0.8125rem; color: var(--text); }
    .stack-plus { color: var(--text-faint); }
  `,
})
export class ValidationVsSanitization {}
