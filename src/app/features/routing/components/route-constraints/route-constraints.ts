import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type ConstraintKind = 'any' | 'int' | 'uuid' | 'minLength' | 'maxLength';

const CONSTRAINTS: { kind: ConstraintKind; label: string; syntax: string }[] = [
  { kind: 'any', label: 'Any', syntax: '{id}' },
  { kind: 'int', label: 'Integer', syntax: '{id:int}' },
  { kind: 'uuid', label: 'UUID', syntax: '{id:uuid}' },
  { kind: 'minLength', label: 'Minimum length (3)', syntax: '{id:minLength(3)}' },
  { kind: 'maxLength', label: 'Maximum length (6)', syntax: '{id:maxLength(6)}' },
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function satisfies(kind: ConstraintKind, value: string): boolean {
  switch (kind) {
    case 'any':
      return true;
    case 'int':
      return /^-?\d+$/.test(value);
    case 'uuid':
      return UUID_RE.test(value);
    case 'minLength':
      return value.length >= 3;
    case 'maxLength':
      return value.length <= 6;
  }
}

@Component({
  selector: 'app-route-constraints',
  standalone: true,
  imports: [FormsModule, ExplainSimply],
  template: `
    <section class="lab-section" id="constraints">
      <div class="container">
        <p class="lab-index">ROUTING / 09 — ROUTE CONSTRAINTS</p>
        <h2 class="lab-title">A dynamic segment doesn't mean "accept anything."</h2>
        <p class="lab-lede">
          <span class="mono">{{ '{id:int}' }}</span> narrows a placeholder to values that satisfy a rule.
          The exact syntax differs across frameworks, but the underlying idea — reject the match early if
          the value doesn't qualify — is universal.
        </p>

        <app-explain-simply>
          It's a bouncer checking ID at the door of one specific segment: "{{ '{id}' }}" lets anyone in;
          "{{ '{id:int}' }}" only lets in guests whose name is a number.
        </app-explain-simply>

        <div class="constraint-picker">
          @for (c of constraints; track c.kind) {
            <button type="button" class="lab-btn" [class.is-active]="kind() === c.kind" (click)="kind.set(c.kind)">
              {{ c.label }}
            </button>
          }
        </div>

        <div class="constraint-panel">
          <p class="constraint-route mono">Route: /users/{{ selectedSyntax() }}</p>
          <label class="lab-field">
            <span>Try a value</span>
            <input type="text" class="mono" spellcheck="false" [ngModel]="testValue()" (ngModelChange)="testValue.set($event)" />
          </label>
          <p class="constraint-result mono" [class.is-ok]="isValid()" [class.is-fail]="!isValid()">
            /users/{{ testValue() }} → {{ isValid() ? '✓ Constraint satisfied' : '✕ Constraint failed' }}
          </p>
        </div>
      </div>
    </section>

    <section class="lab-section" id="optional-params">
      <div class="container">
        <p class="lab-index">ROUTING / 10 — OPTIONAL PARAMETERS</p>
        <h2 class="lab-title">Sometimes a segment can be skipped entirely.</h2>
        <p class="lab-lede">
          <span class="mono">{{ '/products/{category?}' }}</span> can match with or without the trailing
          segment — the exact semantics vary by framework, but the segment is allowed to be absent.
        </p>

        <div class="optional-demo">
          <button type="button" class="lab-btn" [class.is-active]="optionalUrl() === '/products'" (click)="optionalUrl.set('/products')">
            /products
          </button>
          <button type="button" class="lab-btn" [class.is-active]="optionalUrl() === '/products/electronics'" (click)="optionalUrl.set('/products/electronics')">
            /products/electronics
          </button>
        </div>
        <p class="optional-result mono">
          {{ optionalUrl() }} → category = {{ optionalCategory() ?? '(not provided)' }}
        </p>
      </div>
    </section>
  `,
  styles: `
    .constraint-picker {
      margin-top: 28px;
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .constraint-panel {
      margin-top: 20px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
      max-width: 480px;
    }

    .constraint-route {
      color: var(--accent);
      font-size: 0.9375rem;
      margin-bottom: 16px;
    }

    .constraint-result {
      margin-top: 16px;
      font-size: 0.875rem;
    }

    .constraint-result.is-ok {
      color: var(--accent-2);
    }

    .constraint-result.is-fail {
      color: var(--danger);
    }

    .optional-demo {
      margin-top: 24px;
      display: flex;
      gap: 8px;
    }

    .optional-result {
      margin-top: 16px;
      color: var(--text-muted);
      font-size: 0.9375rem;
    }
  `,
})
export class RouteConstraints {
  protected readonly constraints = CONSTRAINTS;
  protected readonly kind = signal<ConstraintKind>('int');
  protected readonly testValue = signal('123');

  protected readonly selectedSyntax = computed(() => this.constraints.find((c) => c.kind === this.kind())!.syntax);
  protected readonly isValid = computed(() => satisfies(this.kind(), this.testValue()));

  protected readonly optionalUrl = signal('/products/electronics');
  protected readonly optionalCategory = computed(() => {
    const parts = this.optionalUrl().split('/').filter(Boolean);
    return parts[1] ?? null;
  });
}
