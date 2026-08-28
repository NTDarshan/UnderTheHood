import { Component, OnDestroy, signal } from '@angular/core';

type PlayPhase = 'idle' | 'request' | 'inside' | 'response' | 'done';

@Component({
  selector: 'app-rest-hero',
  standalone: true,
  template: `
    <section class="hero" id="hero">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container hero-inner">
        <p class="eyebrow">CHAPTER 10 · API ARCHITECTURE</p>
        <h1 class="hero-title">Complete REST API Design</h1>
        <p class="hero-sub">Design APIs that are predictable, consistent, resource-oriented and easy to consume.</p>

        <div class="diagram mono">
          <div class="d-node d-client" [class.is-active]="phase() !== 'idle'">CLIENT</div>

          <div class="d-wire" [class.is-active]="phase() === 'request' || phase() === 'response'">
            <span class="d-wire-label">HTTP</span>
          </div>

          <div class="d-box" [class.is-active]="phase() === 'inside' || phase() === 'response'">
            <p class="d-box-title">REST API</p>
            <p class="d-box-line">/api/v1/books</p>
            <p class="d-box-line">/api/v1/books/42</p>
            <div class="d-branches">
              <span class="d-branch">REQUEST</span>
              <span class="d-branch">RESPONSE</span>
            </div>
          </div>

          <div class="packet packet-request" [class.is-flying]="phase() === 'request'">
            <span>GET /api/v1/books/42</span>
          </div>
          <div class="packet packet-response" [class.is-flying]="phase() === 'response'">
            <span>200 OK</span>
            <span class="packet-body">{{ '{ "id": 42, "title": "Clean Architecture" }' }}</span>
          </div>
        </div>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" [disabled]="isPlaying()" (click)="play()">
            {{ isPlaying() ? 'Playing…' : '▶ Play' }}
          </button>
        </div>
      </div>
    </section>
  `,
  styles: `
    .hero { position: relative; padding-block: 96px 72px; overflow: hidden; }
    .hero-inner { position: relative; z-index: 1; }
    .hero-title { margin-top: 18px; font-size: clamp(2rem, 1.5rem + 2.2vw, 3.5rem); max-width: 900px; }
    .hero-sub { margin-top: 18px; max-width: 620px; font-size: 1.0625rem; color: var(--text-muted); line-height: 1.6; }

    .diagram { position: relative; margin-top: 48px; display: flex; align-items: center; gap: 28px; padding: 36px 24px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-lg); flex-wrap: wrap; }

    .d-node { flex-shrink: 0; padding: 14px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface-elevated); color: var(--text-faint); font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; }
    .d-node.is-active { color: var(--accent-strong); border-color: var(--accent); box-shadow: 0 0 20px var(--glow-accent); }

    .d-wire { position: relative; flex: 1; min-width: 60px; height: 2px; background: var(--border-strong); }
    .d-wire.is-active { background: var(--accent); }
    .d-wire-label { position: absolute; top: -22px; left: 50%; transform: translateX(-50%); font-size: 0.6875rem; color: var(--text-faint); }

    .d-box { flex-shrink: 0; padding: 16px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface-elevated); transition: border-color 0.3s ease, box-shadow 0.3s ease; }
    .d-box.is-active { border-color: var(--accent-2); box-shadow: 0 0 20px var(--glow-accent-2); }
    .d-box-title { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.06em; color: var(--text); }
    .d-box-line { margin-top: 6px; font-size: 0.75rem; color: var(--text-muted); }
    .d-branches { margin-top: 12px; display: flex; gap: 10px; }
    .d-branch { font-size: 0.625rem; letter-spacing: 0.08em; color: var(--text-faint); padding: 3px 8px; border: 1px solid var(--border); border-radius: 999px; }

    .packet { position: absolute; top: 50%; left: 96px; transform: translateY(-50%); opacity: 0; white-space: nowrap; font-size: 0.6875rem; padding: 5px 10px; border-radius: 999px; background: var(--surface); border: 1px solid var(--accent-dim); color: var(--accent); z-index: 2; }
    .packet-response { color: var(--accent-2); border-color: var(--accent-2-dim); display: flex; flex-direction: column; gap: 2px; align-items: center; border-radius: var(--radius-sm); }
    .packet-body { font-size: 0.5625rem; color: var(--text-faint); }

    .packet.is-flying.packet-request { animation: fly-in 1.1s ease forwards; }
    .packet.is-flying.packet-response { animation: fly-out 1.1s ease forwards; }

    @keyframes fly-in {
      0% { left: 96px; opacity: 0; }
      15% { opacity: 1; }
      85% { opacity: 1; }
      100% { left: calc(100% - 260px); opacity: 0; }
    }
    @keyframes fly-out {
      0% { left: calc(100% - 260px); opacity: 0; }
      15% { opacity: 1; }
      85% { opacity: 1; }
      100% { left: 96px; opacity: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .packet.is-flying { animation: none; }
    }
  `,
})
export class RestHero implements OnDestroy {
  protected readonly phase = signal<PlayPhase>('idle');
  protected readonly isPlaying = signal(false);
  private readonly timers: ReturnType<typeof setTimeout>[] = [];

  play(): void {
    if (this.isPlaying()) return;
    this.isPlaying.set(true);
    this.phase.set('request');

    this.timers.push(setTimeout(() => this.phase.set('inside'), 1100));
    this.timers.push(setTimeout(() => this.phase.set('response'), 1900));
    this.timers.push(setTimeout(() => {
      this.phase.set('done');
      this.isPlaying.set(false);
    }, 3000));
  }

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }
}
