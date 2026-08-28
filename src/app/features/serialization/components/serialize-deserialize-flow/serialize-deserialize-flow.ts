import { Component, signal } from '@angular/core';

@Component({
  selector: 'app-serialize-deserialize-flow',
  standalone: true,
  template: `
    <section class="lab-section" id="serialize-deserialize">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 04 — SERIALIZATION &amp; DESERIALIZATION</p>
        <h2 class="lab-title">One transformation, run in both directions.</h2>
        <p class="lab-lede">
          <strong>Serialization</strong> converts an in-memory object into a representation suitable for
          transmission or storage. <strong>Deserialization</strong> reconstructs usable application data from
          that representation. Same pipeline, opposite direction.
        </p>

        <div class="direction-toggle lab-btn-row">
          <button type="button" class="lab-btn" [class.is-active]="direction() === 'serialize'" (click)="direction.set('serialize')">
            Serialize →
          </button>
          <button type="button" class="lab-btn" [class.is-active]="direction() === 'deserialize'" (click)="direction.set('deserialize')">
            ← Deserialize
          </button>
        </div>

        <div class="flow-panel lab-panel">
          @if (direction() === 'serialize') {
            <div class="flow-row">
              <div class="flow-block">
                <p class="flow-tag mono">OBJECT</p>
                <pre class="flow-code mono">User {{ '{' }}
  name: "Alice"
  age: 30
{{ '}' }}</pre>
              </div>
              <div class="flow-op">
                <span class="flow-op-label mono">SERIALIZE</span>
                <span class="flow-op-arrow">→</span>
              </div>
              <div class="flow-block">
                <p class="flow-tag mono">JSON / XML / BINARY</p>
                <pre class="flow-code mono">{{ '{' }}
  "name": "Alice",
  "age": 30
{{ '}' }}</pre>
              </div>
              <div class="flow-op">
                <span class="flow-op-arrow">→</span>
              </div>
              <div class="flow-block is-dim">
                <p class="flow-tag mono">NETWORK / STORAGE</p>
              </div>
            </div>
            <p class="lab-note">Serialize → an object becomes a transferable representation.</p>
          } @else {
            <div class="flow-row">
              <div class="flow-block is-dim">
                <p class="flow-tag mono">NETWORK / STORAGE</p>
              </div>
              <div class="flow-op">
                <span class="flow-op-arrow">→</span>
              </div>
              <div class="flow-block">
                <p class="flow-tag mono">JSON / XML / BINARY</p>
                <pre class="flow-code mono">{{ '{' }}
  "name": "Alice",
  "age": 30
{{ '}' }}</pre>
              </div>
              <div class="flow-op">
                <span class="flow-op-label mono">DESERIALIZE</span>
                <span class="flow-op-arrow">→</span>
              </div>
              <div class="flow-block">
                <p class="flow-tag mono">OBJECT</p>
                <pre class="flow-code mono">User {{ '{' }}
  name: "Alice"
  age: 30
{{ '}' }}</pre>
              </div>
            </div>
            <p class="lab-note">Deserialize → a representation becomes usable application data again.</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .flow-panel {
      overflow-x: auto;
    }

    .flow-row {
      display: flex;
      align-items: stretch;
      gap: 14px;
      min-width: 560px;
    }

    .flow-block {
      flex: 1 1 160px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      padding: 14px 16px;
    }

    .flow-block.is-dim {
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--text-faint);
      background: transparent;
      border-style: dashed;
    }

    .flow-tag {
      font-size: 0.625rem;
      letter-spacing: 0.08em;
      color: var(--accent-2);
      margin-bottom: 8px;
    }

    .flow-code {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .flow-op {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 4px;
      flex: 0 0 auto;
    }

    .flow-op-label {
      font-size: 0.625rem;
      color: var(--accent);
      white-space: nowrap;
    }

    .flow-op-arrow {
      font-size: 1.25rem;
      color: var(--border-strong);
    }
  `,
})
export class SerializeDeserializeFlow {
  protected readonly direction = signal<'serialize' | 'deserialize'>('serialize');
}
