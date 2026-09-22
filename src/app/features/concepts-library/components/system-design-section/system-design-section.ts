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

        <div class="sd-placeholder">
          <span class="sd-placeholder-dot"></span>
          <span class="mono sd-placeholder-text">CONTENT ARRIVING SOON</span>
        </div>
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

    .sd-placeholder {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      margin-top: 32px;
      padding: 14px 20px;
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface);
    }

    .sd-placeholder-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--sd-accent);
      box-shadow: 0 0 8px color-mix(in srgb, var(--sd-accent) 50%, transparent);
    }

    .sd-placeholder-text {
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      color: var(--text-faint);
    }
  `,
})
export class SystemDesignSection {}
