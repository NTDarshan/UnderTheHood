import { Component } from '@angular/core';

@Component({
  selector: 'app-system-design-section',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section sd-scene" id="system-design">
      <div class="bg-grid"></div>
      <div class="container sd-inner">
        <p class="eyebrow">NEW SECTION</p>
        <h2 class="lab-title sd-title">System Design</h2>
        <p class="lab-lede sd-lede">
          How real systems are actually put together — trade-offs, scale, and the decisions behind them. Being
          built one concept at a time.
        </p>

        <button type="button" class="sd-cta mono" (click)="scrollToIntro()">Start with the introduction ↓</button>
      </div>
    </section>
  `,
  styles: `
    .sd-scene {
      --sd-accent: var(--accent-2);
      position: relative;
      overflow: hidden;
    }

    .sd-inner {
      position: relative;
      z-index: 1;
    }

    .sd-title {
      margin-top: 14px;
      font-size: clamp(2rem, 1.5rem + 2vw, 3rem);
    }

    .sd-lede {
      margin-top: 14px;
      max-width: 560px;
      font-size: 1.0625rem;
      color: var(--text-muted);
      line-height: 1.65;
    }

    .sd-cta {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 32px;
      padding: 12px 20px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface);
      color: var(--sd-accent);
      font-size: 0.8125rem;
      letter-spacing: 0.04em;
      transition: border-color 0.15s ease, background 0.15s ease;
    }

    .sd-cta:hover {
      border-color: var(--sd-accent);
      background: var(--surface-elevated);
    }
  `,
})
export class SystemDesignSection {
  protected scrollToIntro(): void {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('sd-why-it-matters')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}
