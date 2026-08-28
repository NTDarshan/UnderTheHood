import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

interface AnatomyPart {
  id: string;
  label: string;
  type: string;
  value: string;
}

const PARTS: AnatomyPart[] = [
  { id: 'name', label: '"name"', type: 'String', value: 'Alice' },
  { id: 'age', label: '"age"', type: 'Number', value: '30' },
  { id: 'active', label: '"active"', type: 'Boolean', value: 'true' },
  { id: 'skills', label: '"skills"', type: 'Array', value: '["backend", "cloud"]' },
  { id: 'address', label: '"address"', type: 'Object', value: '{ "city": "Bangalore" }' },
];

@Component({
  selector: 'app-json-anatomy',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="json-anatomy">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 08 — JSON DEEP DIVE</p>
        <h2 class="lab-title">Why JSON became the default for HTTP APIs.</h2>
        <p class="lab-lede">
          Human-readable, language-independent, easy to inspect on the wire, and supported natively or via a
          library in nearly every modern language — that combination is why it won.
        </p>

        <p class="lab-index anatomy-heading">JSON ANATOMY — click a field</p>
        <div class="anatomy-layout">
          <pre class="anatomy-json mono">{{ '{' }}
  @for (p of parts; track p.id; let last = $last) {
    <span
      class="anatomy-token"
      [class.is-active]="selected() === p.id"
      (click)="selected.set(p.id)"
      role="button"
      tabindex="0"
      (keydown.enter)="selected.set(p.id)"
    >{{ p.label }}</span>: {{ p.value }}{{ last ? '' : ',' }}
  }
{{ '}' }}</pre>

          <div class="anatomy-detail lab-panel">
            <p class="anatomy-detail-title mono">{{ activePart().label }}</p>
            <p class="anatomy-detail-type">Type: <strong>{{ activePart().type }}</strong></p>
            <p class="anatomy-detail-value">Value: <span class="mono">{{ activePart().value }}</span></p>
          </div>
        </div>

        <div class="rules-box lab-panel">
          <p class="rules-title mono">SYNTAX RULES</p>
          <ul class="rules-list">
            <li>Object keys are strings, written with double quotes</li>
            <li>Objects use <span class="mono">{{ '{' }} {{ '}' }}</span>, arrays use <span class="mono">[ ]</span></li>
            <li>Key/value pairs use <span class="mono">:</span>, multiple pairs are separated by commas</li>
            <li>Standard JSON has no comments</li>
            <li>JSON has no native Date type — dates travel as strings or numbers by convention</li>
            <li>JSON does not preserve language-specific types automatically (e.g. a Map, a Set, a class instance)</li>
          </ul>
        </div>

        <div class="playground">
          <p class="lab-index anatomy-heading">TRY TO BREAK IT</p>
          <div class="playground-grid">
            <label class="lab-field">
              <span>Edit this JSON</span>
              <textarea class="mono" rows="6" [ngModel]="draft()" (ngModelChange)="draft.set($event)"></textarea>
            </label>
            <div class="playground-result lab-panel" [class.is-ok]="parsed().ok" [class.is-fail]="!parsed().ok">
              <p class="result-status mono">{{ parsed().ok ? '✓ Valid JSON' : '✕ Invalid JSON' }}</p>
              @if (!parsed().ok) {
                <p class="result-explain">{{ parsed().hint }}</p>
              }
            </div>
          </div>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="loadBroken()">Load a broken example</button>
            <button type="button" class="lab-btn lab-btn-primary" (click)="loadFixed()">Fix it</button>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .anatomy-heading {
      margin-top: 40px;
    }

    .anatomy-layout {
      margin-top: 20px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 800px) {
      .anatomy-layout {
        grid-template-columns: 1.4fr 1fr;
      }
    }

    .anatomy-json {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 22px;
      font-size: 0.8125rem;
      line-height: 2;
      color: var(--text-muted);
      white-space: pre-wrap;
    }

    .anatomy-token {
      color: var(--accent-2);
      cursor: pointer;
      border-radius: 4px;
      padding: 1px 4px;
      transition: background 0.15s ease, color 0.15s ease;
    }

    .anatomy-token:hover {
      background: var(--surface-elevated);
    }

    .anatomy-token.is-active {
      background: var(--accent);
      color: #1a0d04;
      font-weight: 700;
    }

    .anatomy-detail-title {
      font-size: 1.125rem;
      color: var(--accent);
      margin-bottom: 12px;
    }

    .anatomy-detail-type,
    .anatomy-detail-value {
      font-size: 0.875rem;
      color: var(--text-muted);
      margin-top: 6px;
    }

    .rules-box {
      margin-top: 24px;
    }

    .rules-title {
      font-size: 0.75rem;
      color: var(--accent-2);
      margin-bottom: 14px;
    }

    .rules-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .rules-list li {
      font-size: 0.875rem;
      color: var(--text-muted);
      padding-left: 16px;
      position: relative;
      line-height: 1.55;
    }

    .rules-list li::before {
      content: '›';
      position: absolute;
      left: 0;
      color: var(--accent-2);
    }

    .playground {
      margin-top: 40px;
    }

    .playground-grid {
      margin-top: 20px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    @media (min-width: 800px) {
      .playground-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .playground-grid textarea {
      width: 100%;
      resize: vertical;
    }

    .playground-result {
      margin-top: 0;
    }

    .playground-result.is-ok .result-status {
      color: var(--accent-2);
    }

    .playground-result.is-fail .result-status {
      color: var(--danger);
    }

    .result-status {
      font-size: 0.9375rem;
    }

    .result-explain {
      margin-top: 10px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.55;
    }
  `,
})
export class JsonAnatomy {
  protected readonly parts = PARTS;
  protected readonly selected = signal('name');
  protected readonly activePart = computed(() => this.parts.find((p) => p.id === this.selected())!);

  private readonly broken = '{\n  name: "Alice"\n}';
  private readonly fixed = '{\n  "name": "Alice"\n}';

  protected readonly draft = signal(this.fixed);

  protected readonly parsed = computed(() => {
    const text = this.draft();
    try {
      JSON.parse(text);
      return { ok: true, hint: '' };
    } catch {
      return { ok: false, hint: this.explain(text) };
    }
  });

  private explain(text: string): string {
    if (/[{,]\s*[A-Za-z_$][\w$]*\s*:/.test(text)) {
      return 'JSON requires object keys to use double quotes — "name" is valid, name is not.';
    }
    if (/,\s*[}\]]/.test(text)) {
      return 'A trailing comma appears before a closing brace or bracket — remove it.';
    }
    return 'This text is not syntactically valid JSON.';
  }

  loadBroken(): void {
    this.draft.set(this.broken);
  }

  loadFixed(): void {
    this.draft.set(this.fixed);
  }
}
