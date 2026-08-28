import { Component, OnDestroy, signal } from '@angular/core';

const NODES = ['CLIENT', 'MIDDLEWARE', 'ROUTER', 'CONTROLLER', 'SERVICE', 'REPOSITORY', 'DATABASE', 'RESPONSE'];

@Component({
  selector: 'app-request-lifecycle-hero',
  standalone: true,
  template: `
    <section class="hero" id="hero">
      <div class="bg-grid"></div>
      <div class="container hero-inner">
        <p class="eyebrow">CHAPTER 06 — REQUEST LIFECYCLE</p>
        <h1 class="hero-title">Controllers, Services, Repositories,<br />Middlewares &amp; Request Context</h1>
        <p class="hero-sub">Follow one request from the network all the way to the database — and back.</p>

        <div class="lifecycle-rail mono">
          @for (n of nodes; track n; let i = $index) {
            <div class="rail-node" [class.is-active]="activeIndex() === i" [class.is-done]="activeIndex() > i">{{ n }}</div>
            @if (!$last) {
              <div class="rail-arrow" [class.is-active]="activeIndex() > i">↓</div>
            }
          }
        </div>

        <div class="packet-card mono" [class.is-visible]="activeIndex() >= 0">
          <p class="packet-line">GET /users/42</p>
          <p class="packet-dim">requestId: req_7821</p>
          <p class="packet-dim">Authorization: Bearer •••</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .hero { position: relative; padding-block: 96px 64px; overflow: hidden; }
    .hero-inner { position: relative; z-index: 1; }
    .hero-title { font-size: clamp(1.75rem, 1.3rem + 2vw, 3rem); max-width: 780px; margin-top: 20px; }
    .hero-sub { margin-top: 18px; max-width: 560px; font-size: 1.125rem; color: var(--text-muted); line-height: 1.6; }

    .lifecycle-rail { margin-top: 48px; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; max-width: 340px; }
    .rail-node { font-size: 0.75rem; font-weight: 600; letter-spacing: 0.06em; padding: 8px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); color: var(--text-faint); background: var(--surface-raised); transition: color 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease; width: 100%; }
    .rail-node.is-done { color: var(--text-muted); border-color: var(--border-strong); }
    .rail-node.is-active { color: var(--accent-strong); border-color: var(--accent); box-shadow: 0 0 16px var(--glow-accent); }
    .rail-arrow { color: var(--border-strong); font-size: 0.75rem; padding-left: 14px; transition: color 0.3s ease; }
    .rail-arrow.is-active { color: var(--accent-dim); }

    .packet-card { margin-top: 32px; max-width: 300px; background: var(--surface-elevated); border: 1px solid var(--border-strong); border-radius: var(--radius-md); padding: 14px 16px; opacity: 0; transform: translateY(8px); transition: opacity 0.4s ease, transform 0.4s ease; }
    .packet-card.is-visible { opacity: 1; transform: translateY(0); }
    .packet-line { font-size: 0.8125rem; color: var(--accent); font-weight: 600; }
    .packet-dim { font-size: 0.75rem; color: var(--text-faint); margin-top: 4px; }
  `,
})
export class RequestLifecycleHero implements OnDestroy {
  protected readonly nodes = NODES;
  protected readonly activeIndex = signal(0);
  private readonly timer = setInterval(() => {
    this.activeIndex.update((i) => (i + 1) % NODES.length);
  }, 1400);

  ngOnDestroy(): void {
    clearInterval(this.timer);
  }
}
