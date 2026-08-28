import { Component, signal } from '@angular/core';

type Phase = 'idle' | 'raw' | 'transform' | 'validate' | 'trusted' | 'business';

@Component({
  selector: 'app-validation-hero',
  standalone: true,
  template: `
    <section class="lab-section" id="hero">
      <div class="container">
        <p class="eyebrow">CHAPTER 09 · BACKEND ENGINEERING</p>
        <h1 class="hero-title">Validation &amp; Transformation</h1>
        <p class="hero-subtitle">"Don't trust the input. Understand it, transform it, validate it."</p>

        <div class="hero-diagram" [class.is-live]="phase() !== 'idle'">
          <pre class="hero-json mono" [class.is-transformed]="phase() === 'trusted' || phase() === 'business'">{{ displayedJson() }}</pre>

          <div class="hero-stages mono">
            <span class="hs" [class.is-active]="phase() === 'raw'">RAW INPUT</span>
            <span class="hs-arrow">→</span>
            <span class="hs" [class.is-active]="phase() === 'transform'">TRANSFORM</span>
            <span class="hs-arrow">→</span>
            <span class="hs" [class.is-active]="phase() === 'validate'">VALIDATE</span>
            <span class="hs-arrow">→</span>
            <span class="hs" [class.is-active]="phase() === 'trusted'">TRUSTED DATA</span>
            <span class="hs-arrow">→</span>
            <span class="hs" [class.is-active]="phase() === 'business'">BUSINESS LOGIC</span>
          </div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="playing()">▶ Watch a request get trusted</button>
        </div>

        @if (caption()) {
          <p class="hero-caption mono">{{ caption() }}</p>
        }
      </div>
    </section>
  `,
  styles: `
    .hero-title { margin-top: 20px; font-size: clamp(2rem, 1.4rem + 2.5vw, 3.25rem); }
    .hero-subtitle { margin-top: 14px; font-size: 1.125rem; color: var(--text-muted); max-width: 560px; }

    .hero-diagram { margin-top: 48px; }
    .hero-json {
      font-size: 0.8125rem;
      line-height: 1.7;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 18px 20px;
      color: var(--text-muted);
      max-width: 420px;
      transition: color 0.4s ease, border-color 0.4s ease;
    }
    .hero-json.is-transformed { color: var(--accent-2); border-color: var(--accent-2-dim); }

    .hero-stages { margin-top: 20px; display: flex; flex-wrap: wrap; gap: 6px; align-items: center; }
    .hs { padding: 6px 12px; border-radius: 999px; border: 1px solid var(--border-strong); color: var(--text-faint); font-size: 0.6875rem; transition: color 0.3s ease, border-color 0.3s ease; }
    .hs.is-active { color: var(--accent-strong); border-color: var(--accent); box-shadow: 0 0 12px var(--glow-accent); }
    .hs-arrow { color: var(--border-strong); }

    .hero-caption { margin-top: 20px; font-size: 0.8125rem; color: var(--accent-strong); min-height: 1.2em; }
  `,
})
export class ValidationHero {
  private readonly rawJson = `{
  "email": "  JOHN@EXAMPLE.COM ",
  "age": "27",
  "phone": "9876543210"
}`;

  private readonly trustedJson = `{
  "email": "john@example.com",
  "age": 27,
  "phone": "9876543210"
}`;

  protected readonly phase = signal<Phase>('idle');
  protected readonly playing = signal(false);
  protected readonly caption = signal('');
  protected readonly displayedJson = signal(this.rawJson);

  async run(): Promise<void> {
    if (this.playing()) return;
    this.playing.set(true);
    this.displayedJson.set(this.rawJson);

    const steps: [Phase, string][] = [
      ['raw', 'This is exactly what the client sent — untyped, untrimmed, unverified.'],
      ['transform', 'Transformation normalizes representation: trims whitespace, lowercases the email, parses "27" into a number.'],
      ['validate', 'Validation asks: is this now-normalized data acceptable?'],
      ['trusted', 'Only now does the backend treat this as trusted data.'],
      ['business', 'Business logic runs against data it can finally rely on.'],
    ];

    for (const [phase, caption] of steps) {
      this.phase.set(phase);
      this.caption.set(caption);
      if (phase === 'trusted') this.displayedJson.set(this.trustedJson);
      await wait(1100);
    }
    this.playing.set(false);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
