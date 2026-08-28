import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';
import { TermTip } from '../../../../shared/components/term-tip/term-tip';

type HeroPhase = 'idle' | 'client' | 'request' | 'router' | 'engine' | 'handler';

const FLOW: { phase: HeroPhase; label: string }[] = [
  { phase: 'client', label: 'Client' },
  { phase: 'request', label: 'HTTP Request' },
  { phase: 'router', label: 'Router' },
  { phase: 'engine', label: 'Matching Engine' },
  { phase: 'handler', label: 'Handler' },
];

@Component({
  selector: 'app-routing-hero',
  standalone: true,
  imports: [ExplainSimply, TermTip],
  template: `
    <section class="hero" id="what-is-routing">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container hero-inner">
        <p class="lab-index">CHAPTER 06 · BACKEND FUNDAMENTALS</p>
        <h1 class="hero-title">Routing in Backend</h1>
        <p class="hero-subtitle">How does a backend decide where your request should go?</p>

        <p class="hero-lede">
          Routing is the process of taking an incoming request and deciding
          <strong>which handler should receive it</strong>. An HTTP
          <app-term def="The verb of a request — GET, POST, PUT, PATCH, DELETE, OPTIONS. It says what the client wants to do.">method</app-term>
          says what the client wants to do; the route says where that thing lives.
        </p>

        <app-explain-simply>
          Think of a backend like a large office building with a receptionist at the front desk. You tell
          the receptionist what you need ("I'd like to speak to billing") and where ("about invoice #123").
          Routing is the receptionist deciding, from that, which department — and which specific desk —
          should handle you next.
        </app-explain-simply>

        <div class="split-demo">
          <div class="split-card">
            <p class="split-request mono">GET</p>
            <p class="split-arrow" aria-hidden="true">↓</p>
            <p class="split-answer">WHAT</p>
            <p class="split-note">the intended action</p>
          </div>
          <div class="split-card">
            <p class="split-request mono">/users/123</p>
            <p class="split-arrow" aria-hidden="true">↓</p>
            <p class="split-answer">WHERE</p>
            <p class="split-note">the resource being acted on</p>
          </div>
        </div>

        <div class="lab-btn-row hero-actions">
          <button type="button" class="btn btn-primary" (click)="play()" [disabled]="playing()">
            {{ playing() ? 'Routing…' : 'Send GET /users/123' }}
          </button>
        </div>

        <div class="hero-flow" role="img" aria-label="A request travelling from client through router and matching engine to a handler">
          @for (step of flow; track step.phase; let i = $index) {
            <div class="flow-node" [class.is-active]="isActive(step.phase)">
              <span class="flow-label mono">{{ step.label }}</span>
            </div>
            @if (i < flow.length - 1) {
              <span class="flow-arrow" [class.is-active]="isPastOrActive(i)" aria-hidden="true">→</span>
            }
          }
        </div>
        <p class="hero-timing-note mono">Illustrative — this page simulates routing entirely in your browser.</p>
      </div>
    </section>
  `,
  styles: `
    .hero {
      position: relative;
      padding-block: 96px 72px;
      overflow: hidden;
    }

    .hero-inner {
      position: relative;
      z-index: 1;
    }

    .hero-title {
      margin-top: 18px;
      font-size: clamp(2rem, 1.5rem + 2.2vw, 3.5rem);
    }

    .hero-subtitle {
      margin-top: 10px;
      font-size: 1.125rem;
      color: var(--accent-2);
    }

    .hero-lede {
      margin-top: 20px;
      max-width: 640px;
      font-size: 1.0625rem;
      color: var(--text-muted);
      line-height: 1.65;
    }

    .split-demo {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      max-width: 480px;
    }

    .split-card {
      padding: 18px;
      text-align: center;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
    }

    .split-request {
      font-size: 1rem;
      color: var(--text);
    }

    .split-arrow {
      margin: 6px 0;
      color: var(--border-strong);
    }

    .split-answer {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--accent);
      letter-spacing: 0.04em;
    }

    .split-note {
      margin-top: 4px;
      font-size: 0.75rem;
      color: var(--text-faint);
    }

    .hero-actions {
      margin-top: 32px;
    }

    .hero-flow {
      margin-top: 40px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px 20px;
    }

    .flow-node {
      padding: 10px 16px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-elevated);
      color: var(--text-faint);
      transition: border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
    }

    .flow-node.is-active {
      border-color: var(--accent);
      color: var(--accent);
      box-shadow: 0 0 18px var(--glow-accent);
    }

    .flow-label {
      font-size: 0.75rem;
      font-weight: 600;
    }

    .flow-arrow {
      color: var(--border-strong);
      transition: color 0.3s ease;
    }

    .flow-arrow.is-active {
      color: var(--accent);
    }

    .hero-timing-note {
      margin-top: 12px;
      font-size: 0.6875rem;
      color: var(--text-faint);
    }
  `,
})
export class RoutingHero {
  protected readonly flow = FLOW;
  protected readonly phase = signal<HeroPhase>('idle');
  protected readonly playing = signal(false);

  isActive(phase: HeroPhase): boolean {
    return this.phase() === phase;
  }

  isPastOrActive(index: number): boolean {
    const order: HeroPhase[] = ['client', 'request', 'router', 'engine', 'handler'];
    const currentIndex = order.indexOf(this.phase());
    return currentIndex > index;
  }

  async play(): Promise<void> {
    if (this.playing()) return;
    this.playing.set(true);
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    for (const step of this.flow) {
      this.phase.set(step.phase);
      await wait(500);
    }
    await wait(400);
    this.phase.set('idle');
    this.playing.set(false);
  }
}
