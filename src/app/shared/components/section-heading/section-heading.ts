import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-heading',
  standalone: true,
  template: `
    <div class="section-heading" [class.align-center]="center()">
      @if (eyebrow()) {
        <p class="eyebrow">{{ eyebrow() }}</p>
      }
      <h2 class="heading-title">{{ title() }}</h2>
      @if (subtitle()) {
        <p class="heading-subtitle">{{ subtitle() }}</p>
      }
    </div>
  `,
  styles: `
    .section-heading {
      display: flex;
      flex-direction: column;
      gap: 14px;
      max-width: 640px;
    }

    .align-center {
      max-width: 720px;
      margin-inline: auto;
      text-align: center;
    }

    .heading-title {
      font-size: clamp(1.75rem, 1.4rem + 1.5vw, 2.75rem);
      color: var(--text);
    }

    .heading-subtitle {
      font-size: 1.0625rem;
      color: var(--text-muted);
      line-height: 1.6;
    }
  `,
})
export class SectionHeading {
  readonly eyebrow = input<string>('');
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  readonly center = input(false);
}
