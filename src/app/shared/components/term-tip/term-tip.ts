import { Component, HostListener, ElementRef, inject, input, signal } from '@angular/core';

let nextId = 0;

/**
 * Inline "what does this mean?" term — click/focus to reveal a short
 * definition, without leaving the page or relying on hover alone.
 */
@Component({
  selector: 'app-term',
  standalone: true,
  template: `
    <span class="term">
      <button
        type="button"
        class="term-trigger mono"
        (click)="open.set(!open())"
        [attr.aria-expanded]="open()"
        [attr.aria-describedby]="open() ? popoverId : null"
      >
        <ng-content />
        <span class="term-mark" aria-hidden="true">?</span>
      </button>
      @if (open()) {
        <span class="term-popover" role="note" [id]="popoverId">{{ def() }}</span>
      }
    </span>
  `,
  styles: `
    .term {
      position: relative;
      display: inline-block;
    }

    .term-trigger {
      display: inline-flex;
      align-items: baseline;
      gap: 3px;
      background: none;
      border: none;
      padding: 0;
      color: inherit;
      font: inherit;
      text-decoration: underline dotted;
      text-underline-offset: 3px;
      text-decoration-color: var(--accent-2-dim);
    }

    .term-trigger:hover,
    .term-trigger[aria-expanded='true'] {
      text-decoration-color: var(--accent-2);
      color: var(--accent-2);
    }

    .term-mark {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 13px;
      height: 13px;
      border-radius: 50%;
      border: 1px solid var(--accent-2-dim);
      font-family: var(--font-mono);
      font-size: 0.5625rem;
      color: var(--accent-2);
      transform: translateY(-3px);
      flex-shrink: 0;
    }

    .term-popover {
      position: absolute;
      z-index: 20;
      left: 0;
      top: calc(100% + 8px);
      width: max-content;
      max-width: 260px;
      background: var(--surface-elevated);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.6);
      padding: 10px 12px;
      font-family: var(--font-sans);
      font-size: 0.8125rem;
      font-weight: 400;
      line-height: 1.5;
      color: var(--text-muted);
      text-decoration: none;
    }
  `,
})
export class TermTip {
  readonly def = input.required<string>();
  protected readonly open = signal(false);
  protected readonly popoverId = `term-def-${nextId++}`;

  private readonly host = inject(ElementRef<HTMLElement>);

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (this.open() && !this.host.nativeElement.contains(event.target as Node)) {
      this.open.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.open.set(false);
  }
}
