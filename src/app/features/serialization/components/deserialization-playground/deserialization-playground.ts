import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { deserialize, kindOf } from '../../engine/serialization-simulator';

@Component({
  selector: 'app-deserialization-playground',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="deserialize-playground">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 13 — DESERIALIZATION PLAYGROUND</p>
        <h2 class="lab-title">Edit JSON. Reconstruct it into usable data.</h2>
        <p class="lab-lede">
          This runs a real parse, not a scripted result — break the syntax and you'll see a genuine failure.
        </p>

        <div class="deser-columns">
          <label class="lab-field deser-editor">
            <span>JSON input</span>
            <textarea class="mono" rows="8" [ngModel]="draft()" (ngModelChange)="draft.set($event)"></textarea>
          </label>

          <div class="deser-result lab-panel" [class.is-ok]="result().ok" [class.is-fail]="!result().ok">
            @if (result().ok) {
              <p class="deser-status mono">✓ Deserialized</p>
              <p class="deser-sub mono">NATIVE DATA</p>
              <div class="deser-fields mono">
                @for (f of nativeFields(); track f.key) {
                  <div class="deser-field"><span class="fk">{{ f.key }}</span> → <span class="fv">{{ f.value }}</span> <span class="ft">({{ f.type }})</span></div>
                }
              </div>
            } @else {
              <p class="deser-status mono">✕ Deserialization failed</p>
              <p class="deser-hint">{{ result().hint }}</p>
            }
          </div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn" (click)="loadTrailingComma()">Trailing comma example</button>
          <button type="button" class="lab-btn" (click)="loadValid()">Reset to valid JSON</button>
        </div>
      </div>
    </section>

    <section class="lab-section" id="validation">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 14 — VALID JSON ≠ VALID APPLICATION DATA</p>
        <h2 class="lab-title">Parsing succeeding isn't the same as the data being acceptable.</h2>
        <p class="lab-lede">
          Deserialization answers "can I reconstruct this?" Validation answers a separate question: "does
          this satisfy what my application expects?"
        </p>

        <div class="stage-diagram mono">
          <div class="stage-node">Parse</div>
          <div class="stage-arrow">↓</div>
          <div class="stage-node">Validate</div>
          <div class="stage-arrow">↓</div>
          <div class="stage-node">Use</div>
        </div>

        <p class="lab-note lab-note-warn">
          <span class="mono">{{ '{' }} "age": "hello" {{ '}' }}</span> can be perfectly valid JSON — a string value
          is syntactically fine. But if the application expects <span class="mono">age</span> to be a
          number, deserialization succeeds while validation still fails.
        </p>
      </div>
    </section>
  `,
  styles: `
    .deser-columns {
      margin-top: 28px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 800px) {
      .deser-columns {
        grid-template-columns: 1fr 1fr;
      }
    }

    .deser-editor textarea {
      width: 100%;
      resize: vertical;
    }

    .deser-result {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 22px;
    }

    .deser-result.is-fail {
      border-color: var(--danger);
    }

    .deser-status {
      font-size: 0.9375rem;
    }

    .deser-result.is-ok .deser-status {
      color: var(--accent-2);
    }

    .deser-result.is-fail .deser-status {
      color: var(--danger);
    }

    .deser-hint {
      margin-top: 10px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .deser-sub {
      margin-top: 14px;
      font-size: 0.6875rem;
      color: var(--text-faint);
      letter-spacing: 0.06em;
    }

    .deser-fields {
      margin-top: 8px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.8125rem;
    }

    .fk {
      color: var(--text);
    }

    .fv {
      color: var(--accent-2);
    }

    .ft {
      color: var(--text-faint);
    }

    .stage-diagram {
      margin-top: 28px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      max-width: 200px;
      margin-inline: auto;
    }

    .stage-node {
      padding: 10px 20px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text);
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .stage-arrow {
      color: var(--border-strong);
    }
  `,
})
export class DeserializationPlayground {
  private readonly validSample = '{\n  "name": "Alice",\n  "age": 30\n}';
  private readonly trailingCommaSample = '{\n  "name": "Alice",\n  "age": 30,\n}';

  protected readonly draft = signal(this.validSample);
  protected readonly result = computed(() => deserialize(this.draft()));

  protected readonly nativeFields = computed(() => {
    const r = this.result();
    if (!r.ok || typeof r.value !== 'object' || r.value === null || Array.isArray(r.value)) return [];
    const obj = r.value as Record<string, unknown>;
    return Object.entries(obj).map(([key, value]) => ({
      key,
      value: JSON.stringify(value),
      type: kindOf(value as never),
    }));
  });

  loadTrailingComma(): void {
    this.draft.set(this.trailingCommaSample);
  }

  loadValid(): void {
    this.draft.set(this.validSample);
  }
}
