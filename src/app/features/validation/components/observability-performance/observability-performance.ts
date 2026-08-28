import { Component } from '@angular/core';

@Component({
  selector: 'app-observability-performance',
  standalone: true,
  template: `
    <section class="lab-section" id="observability">
      <div class="container">
        <p class="lab-index">VALIDATION / 42 — OBSERVABILITY</p>
        <h2 class="lab-title">A validation failure should leave a useful trace — never a leaky one.</h2>

        <div class="obs-grid">
          <div class="obs-card is-good">
            <p class="obs-title mono">SAFE TO LOG</p>
            <pre class="lab-code mono">requestId: req_12345
endpoint: POST /orders
result: Validation failed
field: quantity
rule: must be &gt;= 1</pre>
          </div>
          <div class="obs-card is-bad">
            <p class="obs-title mono">NEVER LOG</p>
            <ul>
              <li>Passwords</li>
              <li>Access tokens</li>
              <li>Session identifiers</li>
              <li>Sensitive personal data, unnecessarily</li>
            </ul>
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section" id="performance-early-rejection">
      <div class="container">
        <p class="lab-index">VALIDATION / 43 — PERFORMANCE CONSIDERATIONS</p>
        <h2 class="lab-title">Fail cheap before you fail expensive.</h2>

        <div class="perf-grid">
          <div class="perf-card is-bad">
            <p class="perf-title mono">INVALID INPUT</p>
            <div class="flow-chain mono"><span>Reject early</span><span class="arrow">↓</span><span>No DB call</span></div>
          </div>
          <div class="perf-card is-good">
            <p class="perf-title mono">GOOD INPUT</p>
            <div class="flow-chain mono"><span>Proceed</span><span class="arrow">↓</span><span>Business logic</span><span class="arrow">↓</span><span>DB</span></div>
          </div>
        </div>

        <p class="lab-note">Cheap, deterministic checks — type, format, range, required — should generally run before expensive operations like database lookups or external service calls that basic validation would have already ruled out.</p>
      </div>
    </section>
  `,
  styles: `
    .obs-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .obs-grid { grid-template-columns: 1fr 1fr; } }
    .obs-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; }
    .obs-card.is-good { border-color: color-mix(in srgb, var(--accent-2) 30%, var(--border)); }
    .obs-card.is-bad { border-color: color-mix(in srgb, var(--danger) 30%, var(--border)); }
    .obs-title { font-size: 0.75rem; margin-bottom: 12px; }
    .obs-card.is-good .obs-title { color: var(--accent-2); }
    .obs-card.is-bad .obs-title { color: var(--danger); }
    .obs-card ul { display: flex; flex-direction: column; gap: 6px; }
    .obs-card li { font-size: 0.8125rem; color: var(--danger); }

    .perf-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .perf-grid { grid-template-columns: 1fr 1fr; } }
    .perf-card { background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 18px; text-align: center; }
    .perf-title { font-size: 0.75rem; margin-bottom: 12px; }
    .perf-card.is-good .perf-title { color: var(--accent-2); }
    .perf-card.is-bad .perf-title { color: var(--danger); }
    .flow-chain { display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 0.8125rem; color: var(--text-muted); }
    .flow-chain .arrow { color: var(--text-faint); }
  `,
})
export class ObservabilityPerformance {}
