import { Component, signal } from '@angular/core';

/**
 * A collapsed-by-default plain-language analogy for whatever concept the
 * section above just introduced technically. Keeps the default reading
 * experience dense and visual, while staying one click away from a
 * beginner-friendly explanation for anyone who needs it.
 */
@Component({
  selector: 'app-explain-simply',
  standalone: true,
  template: `
    <div class="explain" [class.is-open]="open()">
      <button type="button" class="explain-toggle mono" (click)="open.set(!open())" [attr.aria-expanded]="open()">
        <span class="explain-icon" aria-hidden="true">{{ open() ? '−' : '+' }}</span>
        Explain it simply
      </button>
      @if (open()) {
        <p class="explain-text"><ng-content /></p>
      }
    </div>
  `,
  styles: `
    .explain {
      margin-top: 18px;
    }

    .explain-toggle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: transparent;
      border: 1px dashed var(--border-strong);
      border-radius: 999px;
      padding: 7px 14px;
      font-size: 0.75rem;
      letter-spacing: 0.03em;
      color: var(--text-muted);
      transition: border-color 0.15s ease, color 0.15s ease;
    }

    .explain-toggle:hover {
      border-color: var(--accent-2);
      color: var(--accent-2);
    }

    .explain.is-open .explain-toggle {
      border-style: solid;
      border-color: var(--accent-2-dim);
      color: var(--accent-2);
    }

    .explain-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      border: 1px solid currentColor;
      font-size: 0.6875rem;
      line-height: 1;
    }

    .explain-text {
      margin-top: 10px;
      max-width: 600px;
      padding: 12px 16px;
      background: var(--surface);
      border-left: 2px solid var(--accent-2-dim);
      border-radius: var(--radius-sm);
      font-size: 0.9375rem;
      color: var(--text);
      line-height: 1.65;
    }
  `,
})
export class ExplainSimply {
  protected readonly open = signal(false);
}
