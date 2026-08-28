import { Component } from '@angular/core';

@Component({
  selector: 'app-memory-vs-wire',
  standalone: true,
  template: `
    <section class="lab-section" id="memory-vs-wire">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 03 — MEMORY VS. WIRE REPRESENTATION</p>
        <h2 class="lab-title">Two very different shapes for the same data.</h2>
        <p class="lab-lede">
          This is one of the most important distinctions in this whole chapter. What lives in memory while
          your program runs is not what travels across the network.
        </p>

        <div class="compare-grid">
          <div class="compare-card">
            <p class="compare-title mono">IN-MEMORY REPRESENTATION</p>
            <div class="compare-body mono">
              <p class="compare-sub">Application Memory</p>
              <p class="compare-line">User Object</p>
              <p class="compare-line indent">name&nbsp;&nbsp;&nbsp;→ string (pointer + length)</p>
              <p class="compare-line indent">age&nbsp;&nbsp;&nbsp;&nbsp;→ integer (4 bytes, native)</p>
              <p class="compare-line indent">active&nbsp;→ boolean (1 byte, native)</p>
            </div>
            <p class="compare-note">Implementation-specific. Depends on the language, runtime, and even CPU architecture.</p>
          </div>

          <div class="compare-arrow" aria-hidden="true">→</div>

          <div class="compare-card is-wire">
            <p class="compare-title mono">WIRE REPRESENTATION</p>
            <div class="compare-body mono">
              <p class="compare-sub">Transferable Data</p>
              <pre class="compare-json">{{ '{' }}
  "name": "Alice",
  "age": 30,
  "active": true
{{ '}' }}</pre>
            </div>
            <p class="compare-note">Understandable by both sides — text, bytes, or any agreed-upon shared format.</p>
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          Memory representation is local to a program. Wire representation needs to be understandable by
          both sides — that's the entire reason serialization exists.
        </p>
      </div>
    </section>
  `,
  styles: `
    .compare-grid {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 20px;
      align-items: stretch;
    }

    @media (max-width: 800px) {
      .compare-grid {
        grid-template-columns: 1fr;
      }
      .compare-arrow {
        transform: rotate(90deg);
        justify-self: center;
      }
    }

    .compare-card {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 22px;
      display: flex;
      flex-direction: column;
    }

    .compare-card.is-wire {
      border-color: var(--accent-2-dim);
    }

    .compare-title {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--accent-2);
      margin-bottom: 14px;
    }

    .compare-body {
      flex: 1;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .compare-sub {
      color: var(--text-faint);
      margin-bottom: 8px;
    }

    .compare-line {
      color: var(--text);
      padding-block: 2px;
    }

    .compare-line.indent {
      padding-left: 16px;
      color: var(--text-muted);
    }

    .compare-json {
      color: var(--text-muted);
      line-height: 1.7;
      white-space: pre-wrap;
    }

    .compare-note {
      margin-top: 14px;
      font-size: 0.75rem;
      color: var(--text-faint);
      line-height: 1.5;
    }

    .compare-arrow {
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      color: var(--accent);
    }
  `,
})
export class MemoryVsWire {}
