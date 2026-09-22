import { Component } from '@angular/core';

@Component({
  selector: 'app-system-design-hero',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section hero-section sd-scene" id="system-design-hero">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container hero-inner">
        <p class="eyebrow mono">SYSTEM DESIGN</p>
        <h1 class="hero-title">How real systems are actually put together.</h1>
        <p class="hero-lede">
          Trade-offs, scale, and the decisions behind them — built one concept at a time.
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
      padding-block: 96px 56px;
      border-top: none;
    }

    .hero-inner {
      position: relative;
      z-index: 1;
    }

    .hero-title {
      margin-top: 14px;
      font-size: clamp(2.25rem, 1.6rem + 2.8vw, 3.75rem);
      max-width: 760px;
    }

    .hero-lede {
      margin-top: 16px;
      max-width: 600px;
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
export class SystemDesignHero {
  protected scrollToIntro(): void {
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.getElementById('sd-why-it-matters')?.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
  }
}
