import { Component, signal } from '@angular/core';

type Phase = 'idle' | 'request' | 'authn' | 'authz' | 'allow' | 'deny';

@Component({
  selector: 'app-auth-hero',
  standalone: true,
  template: `
    <section class="lab-section" id="hero">
      <div class="container">
        <p class="eyebrow">CHAPTER 08 · BACKEND SECURITY</p>
        <h1 class="hero-title">Authentication &amp; Authorization</h1>
        <p class="hero-subtitle">"Who are you — and what are you allowed to do?"</p>

        <div class="hero-diagram" [class.is-live]="phase() !== 'idle'">
          <div class="hero-node request" [class.is-active]="phase() === 'request'">REQUEST</div>
          <div class="hero-arrow">↓</div>
          <div class="hero-node gate" [class.is-active]="phase() === 'authn'">
            <span class="node-label">Authentication</span>
            <span class="node-sub">WHO ARE YOU?</span>
          </div>
          <div class="hero-arrow">↓</div>
          <div class="hero-node gate" [class.is-active]="phase() === 'authz'">
            <span class="node-label">Authorization</span>
            <span class="node-sub">WHAT CAN YOU DO?</span>
          </div>
          <div class="hero-branches">
            <div class="hero-branch">
              <div class="hero-arrow">↙</div>
              <div class="hero-node outcome allow" [class.is-active]="phase() === 'allow'">ALLOW</div>
            </div>
            <div class="hero-branch">
              <div class="hero-arrow">↘</div>
              <div class="hero-node outcome deny" [class.is-active]="phase() === 'deny'">DENY</div>
            </div>
          </div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="run(true)" [disabled]="playing()">▶ Send an allowed request</button>
          <button type="button" class="lab-btn lab-btn-danger" (click)="run(false)" [disabled]="playing()">▶ Send a denied request</button>
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

    .hero-diagram {
      margin-top: 48px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      text-align: center;
    }

    .hero-node {
      padding: 14px 26px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      font-family: var(--font-mono);
      font-weight: 600;
      font-size: 0.8125rem;
      color: var(--text-muted);
      transition: border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease;
    }

    .hero-node.is-active {
      color: var(--text);
      border-color: var(--accent);
      box-shadow: 0 0 22px var(--glow-accent);
    }

    .node-label { display: block; }
    .node-sub { display: block; margin-top: 4px; font-size: 0.625rem; color: var(--text-faint); }
    .hero-node.is-active .node-sub { color: var(--accent-strong); }

    .hero-arrow { color: var(--border-strong); font-size: 0.875rem; }

    .hero-branches {
      display: flex;
      gap: 40px;
      margin-top: 4px;
    }

    .hero-branch { display: flex; flex-direction: column; align-items: center; gap: 4px; }

    .hero-node.outcome.allow.is-active { border-color: var(--accent-2); color: var(--accent-2); box-shadow: 0 0 22px var(--glow-accent-2); }
    .hero-node.outcome.deny.is-active { border-color: var(--danger); color: var(--danger); box-shadow: 0 0 22px rgba(255, 93, 93, 0.3); }

    .hero-caption {
      margin-top: 20px;
      font-size: 0.8125rem;
      color: var(--accent-strong);
      min-height: 1.2em;
    }
  `,
})
export class AuthHero {
  protected readonly phase = signal<Phase>('idle');
  protected readonly playing = signal(false);
  protected readonly caption = signal('');

  async run(allowed: boolean): Promise<void> {
    if (this.playing()) return;
    this.playing.set(true);

    const steps: [Phase, string][] = [
      ['request', 'A client sends an HTTP request.'],
      ['authn', 'Authentication gate: is there a valid, verifiable identity?'],
      ['authz', allowed ? 'Identity confirmed. Authorization gate: does this identity’s role permit the action?' : 'Identity confirmed. Authorization gate: does this identity’s role permit the action?'],
      [allowed ? 'allow' : 'deny', allowed ? 'Permitted — the request reaches business logic.' : 'Denied — authenticated, but not authorized for this action.'],
    ];

    for (const [phase, caption] of steps) {
      this.phase.set(phase);
      this.caption.set(caption);
      await wait(1000);
    }
    this.playing.set(false);
  }
}

function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
