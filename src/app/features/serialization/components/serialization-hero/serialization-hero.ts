import { Component, signal } from '@angular/core';

type HeroPhase = 'idle' | 'serialize' | 'wire' | 'network' | 'deserialize' | 'done';

@Component({
  selector: 'app-serialization-hero',
  standalone: true,
  template: `
    <section class="lab-section hero-section" id="hero">
      <div class="container">
        <p class="lab-index">CHAPTER 07 · BACKEND FUNDAMENTALS</p>
        <h1 class="hero-title">Serialization &amp; Deserialization</h1>
        <p class="hero-subtitle">
          How does an object become data that another application can understand?
        </p>

        <div class="hero-stage" [class.is-playing]="phase() !== 'idle'">
          <div class="hero-column">
            <p class="hero-label mono">APPLICATION A</p>
            <div class="hero-box" [class.is-active]="phase() === 'idle' || phase() === 'serialize'">
              <p class="box-caption mono">Native Object</p>
              <pre class="box-code mono">{{ '{' }}
  name: "Darshu",
  age: 25,
  skills: [...]
{{ '}' }}</pre>
            </div>
          </div>

          <div class="hero-flow">
            <div class="flow-step mono" [class.is-active]="phase() === 'serialize'">Serialize</div>
            <div class="flow-arrow" [class.is-active]="phase() === 'serialize' || phase() === 'wire'">→</div>
          </div>

          <div class="hero-column">
            <p class="hero-label mono">WIRE REPRESENTATION</p>
            <div class="hero-box" [class.is-active]="phase() === 'wire' || phase() === 'network'">
              <p class="box-caption mono">JSON</p>
              <pre class="box-code mono">{{ '{' }}
  "name": "Darshu",
  "age": 25,
  "skills": [...]
{{ '}' }}</pre>
            </div>
          </div>

          <div class="hero-flow">
            <div class="flow-step mono" [class.is-active]="phase() === 'network'">HTTP</div>
            <div class="flow-arrow" [class.is-active]="phase() === 'network' || phase() === 'deserialize'">→</div>
          </div>

          <div class="hero-column">
            <p class="hero-label mono">APPLICATION B</p>
            <div class="hero-box" [class.is-active]="phase() === 'deserialize' || phase() === 'done'">
              <p class="box-caption mono">{{ phase() === 'done' ? 'Native Object (reconstructed)' : 'Deserialize' }}</p>
              <pre class="box-code mono">{{ '{' }}
  name: "Darshu",
  age: 25,
  skills: [...]
{{ '}' }}</pre>
            </div>
          </div>
        </div>

        <div class="hero-actions">
          <button type="button" class="lab-btn lab-btn-primary" (click)="play()" [disabled]="playing()">
            {{ playing() ? 'Running…' : '▶ Watch it happen' }}
          </button>
          <p class="hero-caption mono">{{ caption() }}</p>
        </div>

        <p class="lab-lede hero-lede">
          Two applications never hand each other their in-memory objects directly. One side converts its
          object into a shared representation; the other side reconstructs its own object from that
          representation. This chapter is about everything that happens in between.
        </p>
      </div>
    </section>
  `,
  styles: `
    .hero-section {
      padding-top: 96px;
      border-top: none;
    }

    .hero-title {
      margin-top: 14px;
      font-size: clamp(2.25rem, 1.8rem + 2vw, 3.5rem);
      color: var(--text);
      max-width: 820px;
    }

    .hero-subtitle {
      margin-top: 16px;
      max-width: 640px;
      font-size: 1.125rem;
      color: var(--text-muted);
      line-height: 1.6;
    }

    .hero-stage {
      margin-top: 48px;
      display: flex;
      align-items: stretch;
      gap: 12px;
      overflow-x: auto;
      padding-bottom: 8px;
    }

    .hero-column {
      flex: 1 1 220px;
      min-width: 200px;
    }

    .hero-label {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
      margin-bottom: 8px;
    }

    .hero-box {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 16px;
      height: 100%;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .hero-box.is-active {
      border-color: var(--accent-dim);
      box-shadow: 0 0 24px var(--glow-accent);
    }

    .box-caption {
      font-size: 0.75rem;
      color: var(--accent-2);
      margin-bottom: 8px;
    }

    .box-code {
      font-size: 0.75rem;
      color: var(--text-muted);
      line-height: 1.6;
      white-space: pre-wrap;
    }

    .hero-flow {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      flex: 0 0 auto;
      min-width: 64px;
    }

    .flow-step {
      font-size: 0.625rem;
      letter-spacing: 0.06em;
      color: var(--text-faint);
      padding: 4px 8px;
      border-radius: 999px;
      border: 1px solid transparent;
      white-space: nowrap;
    }

    .flow-step.is-active {
      color: var(--accent);
      border-color: var(--accent-dim);
    }

    .flow-arrow {
      font-size: 1.25rem;
      color: var(--border-strong);
      transition: color 0.3s ease;
    }

    .flow-arrow.is-active {
      color: var(--accent);
    }

    .hero-actions {
      margin-top: 32px;
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }

    .hero-caption {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .hero-lede {
      margin-top: 32px;
    }
  `,
})
export class SerializationHero {
  protected readonly phase = signal<HeroPhase>('idle');
  protected readonly playing = signal(false);

  protected readonly caption = signal("Click play to watch an object cross the boundary.");

  private readonly captions: Record<HeroPhase, string> = {
    idle: 'Click play to watch an object cross the boundary.',
    serialize: 'Application A converts its in-memory object into a transferable representation…',
    wire: 'The object is now JSON text — readable by any language, not just the one that created it.',
    network: 'The JSON travels over HTTP, as the body of a request or response.',
    deserialize: 'Application B parses the JSON back into its own native object…',
    done: "Application B never received Application A's memory — it reconstructed its own object from a shared representation.",
  };

  async play(): Promise<void> {
    if (this.playing()) return;
    this.playing.set(true);
    const steps: HeroPhase[] = ['serialize', 'wire', 'network', 'deserialize', 'done'];
    for (const step of steps) {
      this.phase.set(step);
      this.caption.set(this.captions[step]);
      await wait(1100);
    }
    this.playing.set(false);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
