import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-rest-summary',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="lab-section" id="summary">
      <div class="container">
        <p class="lab-index">REST API / 47 — FINAL MENTAL MODEL</p>
        <h2 class="lab-title">A good API doesn't make the client guess.</h2>

        <div class="model-diagram mono">
          <div class="model-node root">CLIENT</div>
          <div class="model-arrow">↓</div>
          <div class="model-node">HTTP REQUEST</div>
          <div class="model-arrow">↓</div>
          <div class="model-node accent">RESOURCE URL<br /><span class="model-sub">what exists, where</span></div>
          <div class="model-arrow">↓</div>
          <div class="model-node accent2">HTTP METHOD<br /><span class="model-sub">what operation</span></div>
          <div class="model-arrow">↓</div>
          <div class="model-node">MIDDLEWARE</div>
          <div class="model-arrow">↓</div>
          <div class="model-node">ROUTING</div>
          <div class="model-arrow">↓</div>
          <div class="model-node">CONTROLLER</div>
          <div class="model-arrow">↓</div>
          <div class="model-node">SERVICE</div>
          <div class="model-arrow">↓</div>
          <div class="model-node">REPOSITORY</div>
          <div class="model-arrow">↓</div>
          <div class="model-node">DATABASE</div>
          <div class="model-arrow">↓</div>
          <div class="model-node root">RESPONSE</div>
        </div>

        <p class="final-line">A good API doesn't make the client guess.</p>

        <div class="takeaways">
          <ol>
            <li>URLs tell the client what exists and where.</li>
            <li>HTTP methods tell it what operation is intended.</li>
            <li>Status codes tell it what happened.</li>
            <li>Representations tell it what the resource looks like.</li>
            <li>Query parameters tell it how to shape collections.</li>
            <li>Consistency tells it what to expect.</li>
            <li>Versioning tells it how the contract evolves.</li>
            <li>Idempotency tells it what happens when a request repeats.</li>
          </ol>
        </div>
      </div>
    </section>

    <section class="lab-section" id="connection-map">
      <div class="container">
        <p class="lab-index">REST API / 48 — CHAPTER CONNECTION MAP</p>
        <h2 class="lab-title">REST API design is the contract, not just one more layer.</h2>

        <div class="pipeline-map mono">
          <span class="map-node">CLIENT</span><span class="map-arrow">↓</span>
          <span class="map-node">HTTP</span><span class="map-arrow">↓</span>
          <span class="map-node">ROUTING</span><span class="map-arrow">↓</span>
          <span class="map-node">SERIALIZATION</span><span class="map-arrow">↓</span>
          <span class="map-node">AUTHENTICATION</span><span class="map-arrow">↓</span>
          <span class="map-node">AUTHORIZATION</span><span class="map-arrow">↓</span>
          <span class="map-node">VALIDATION</span><span class="map-arrow">↓</span>
          <span class="map-node">TRANSFORMATION</span><span class="map-arrow">↓</span>
          <span class="map-node">MIDDLEWARE</span><span class="map-arrow">↓</span>
          <span class="map-node">CONTROLLER</span><span class="map-arrow">↓</span>
          <span class="map-node">SERVICE</span><span class="map-arrow">↓</span>
          <span class="map-node">REPOSITORY</span><span class="map-arrow">↓</span>
          <span class="map-node">DATABASE</span><span class="map-arrow">↓</span>
          <span class="map-node is-current">REST API DESIGN</span><span class="map-arrow">↓</span>
          <span class="map-node">RESPONSE</span>
        </div>

        <div class="map-legend">
          <p>REST API design is the contract sitting at the boundary between clients and the backend system.</p>
        </div>

        <div class="chapter-footer">
          <div class="chapter-progress">
            <p class="chapter-label mono">REST API Design Studio · Chapter 10</p>
          </div>
          <div class="chapter-nav">
            <a class="lab-btn" routerLink="/explore/backend-layers">← Previous: Controllers, Services &amp; Repositories</a>
            <a class="lab-btn" routerLink="/" fragment="roadmap">Roadmap</a>
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section next-concept">
      <div class="container next-concept-inner">
        <a class="prev-link mono" routerLink="/explore/backend-layers">← Previous concept</a>
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
export class RestSummary {}
