import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-backend-layers-summary',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="lab-section" id="summary">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 30 — FINAL MENTAL MODEL</p>
        <h2 class="lab-title">A backend is not one giant function. It is a pipeline of responsibilities.</h2>

        <div class="model-diagram mono">
          <div class="model-node root">REQUEST</div>
          <div class="model-arrow">↓</div>
          <div class="model-node">MIDDLEWARE<br /><span class="model-sub">cross-cutting concerns</span></div>
          <div class="model-arrow">↓</div>
          <div class="model-node">ROUTING</div>
          <div class="model-arrow">↓</div>
          <div class="model-node accent">CONTROLLER<br /><span class="model-sub">HTTP boundary</span></div>
          <div class="model-arrow">↓</div>
          <div class="model-node accent2">SERVICE<br /><span class="model-sub">business logic</span></div>
          <div class="model-arrow">↓</div>
          <div class="model-node">REPOSITORY<br /><span class="model-sub">data access</span></div>
          <div class="model-arrow">↓</div>
          <div class="model-node root">DATABASE</div>
        </div>

        <p class="final-line">
          Middleware handles cross-cutting concerns. Controllers handle HTTP. Services handle application/business
          behavior. Repositories handle persistence. Request context carries request-scoped metadata. Together,
          these boundaries make complex systems easier to reason about, test, and evolve.
        </p>

        <div class="takeaways">
          <ol>
            <li>Splitting a backend into layers trades a little indirection for testability, changeability, and reuse.</li>
            <li>Middleware is cross-cutting; controllers own HTTP; services own business logic; repositories own persistence.</li>
            <li>Middleware doesn't have to call next() — it can short-circuit a request entirely.</li>
            <li>Middleware order is not universal, but it always defines real behavior.</li>
            <li>Request context is request-scoped metadata — never global state, never shared between requests.</li>
            <li>Authenticated identity comes from a verified token, never from a client-supplied field.</li>
            <li>A correlation/trace ID lets one request be reconstructed across distributed services.</li>
            <li>Layering itself is rarely the performance problem — find the actually expensive work instead.</li>
          </ol>
        </div>
      </div>
    </section>

    <section class="lab-section" id="connection-map">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 31 — CHAPTER CONNECTION MAP</p>
        <h2 class="lab-title">Six chapters. One backend.</h2>

        <div class="pipeline-map mono">
          <span class="map-node">CLIENT</span><span class="map-arrow">↓</span>
          <span class="map-node">HTTP</span><span class="map-arrow">↓</span>
          <span class="map-node">ROUTING</span><span class="map-arrow">↓</span>
          <span class="map-node">SERIALIZATION</span><span class="map-arrow">↓</span>
          <span class="map-node">AUTHENTICATION</span><span class="map-arrow">↓</span>
          <span class="map-node">AUTHORIZATION</span><span class="map-arrow">↓</span>
          <span class="map-node">VALIDATION</span><span class="map-arrow">↓</span>
          <span class="map-node">TRANSFORMATION</span><span class="map-arrow">↓</span>
          <span class="map-node is-current">MIDDLEWARE</span><span class="map-arrow">↓</span>
          <span class="map-node is-current">CONTROLLER</span><span class="map-arrow">↓</span>
          <span class="map-node is-current">SERVICE</span><span class="map-arrow">↓</span>
          <span class="map-node is-current">REPOSITORY</span><span class="map-arrow">↓</span>
          <span class="map-node">DATABASE</span><span class="map-arrow">↓</span>
          <span class="map-node">RESPONSE</span>
        </div>

        <div class="map-legend">
          <p>Every previous chapter is now part of one complete request lifecycle. Request context runs alongside the whole thing, carrying request-scoped metadata from the first middleware to the final response.</p>
        </div>

        <div class="chapter-footer">
          <div class="chapter-progress">
            <p class="chapter-label mono">Controllers, Services, Repositories, Middlewares &amp; Request Context · Chapter 6</p>
          </div>
          <div class="chapter-nav">
            <a class="lab-btn" routerLink="/explore/validation">← Previous: Validation</a>
            <a class="lab-btn" routerLink="/" fragment="roadmap">Roadmap</a>
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section next-concept">
      <div class="container next-concept-inner">
        <a class="prev-link mono" routerLink="/explore/validation">← Previous concept</a>
        <a class="btn btn-ghost" routerLink="/" fragment="roadmap">Roadmap</a>
        <span class="next-link mono is-disabled" aria-disabled="true">Next concept →</span>
      </div>
    </section>
  `,
  styles: `
    .model-diagram { margin-top: 32px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; }
    .model-node { padding: 12px 22px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface-raised); color: var(--text); font-size: 0.8125rem; font-weight: 600; }
    .model-node.root { border-color: var(--border-strong); color: var(--text-muted); }
    .model-node.accent { border-color: var(--accent-dim); color: var(--accent); box-shadow: 0 0 18px var(--glow-accent); }
    .model-node.accent2 { border-color: var(--accent-2-dim); color: var(--accent-2); box-shadow: 0 0 18px var(--glow-accent-2); }
    .model-sub { font-size: 0.625rem; color: var(--text-faint); font-weight: 400; }
    .model-arrow { color: var(--border-strong); }

    .final-line { margin-top: 40px; text-align: center; font-size: 1.25rem; color: var(--text); max-width: 640px; margin-inline: auto; line-height: 1.6; }

    .takeaways { margin-top: 40px; max-width: 720px; margin-inline: auto; }
    .takeaways ol { display: flex; flex-direction: column; gap: 12px; counter-reset: item; }
    .takeaways li { position: relative; padding-left: 32px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.55; counter-increment: item; }
    .takeaways li::before { content: counter(item); position: absolute; left: 0; top: 0; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid var(--accent-2-dim); color: var(--accent-2); font-size: 0.6875rem; font-family: var(--font-mono); }

    .pipeline-map { margin-top: 32px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .map-node { padding: 8px 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-raised); color: var(--text-faint); font-size: 0.75rem; }
    .map-node.is-current { border-color: var(--accent); color: var(--accent-strong); box-shadow: 0 0 14px var(--glow-accent); }
    .map-arrow { color: var(--border-strong); font-size: 0.75rem; }

    .map-legend { margin-top: 24px; max-width: 720px; margin-inline: auto; text-align: center; }
    .map-legend p { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.65; }

    .chapter-footer { margin-top: 48px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 20px; }
    .chapter-label { font-size: 0.75rem; color: var(--text-faint); }
    .chapter-nav { display: flex; gap: 10px; flex-wrap: wrap; }

    .next-concept-inner { display: flex; justify-content: space-between; align-items: center; }
    .prev-link, .next-link { color: var(--text-faint); font-size: 0.8125rem; }
    .next-link.is-disabled { opacity: 0.4; }
  `,
})
export class BackendLayersSummary {}
