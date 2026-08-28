import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-auth-summary',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="lab-section" id="summary">
      <div class="container">
        <p class="lab-index">AUTH / 52 — FINAL MENTAL MODEL</p>
        <h2 class="lab-title">Two gates. One request.</h2>

        <div class="model-diagram mono">
          <div class="model-node root">HTTP REQUEST</div>
          <div class="model-arrow">↓</div>
          <div class="model-node accent">AUTHENTICATION<br /><span class="model-sub">WHO ARE YOU?</span></div>
          <div class="model-arrow">↓</div>
          <div class="model-node">Identity / Claims</div>
          <div class="model-arrow">↓</div>
          <div class="model-node accent2">AUTHORIZATION<br /><span class="model-sub">WHAT CAN YOU DO?</span></div>
          <div class="model-branches">
            <div class="model-node small">ALLOW → Business Logic → Database</div>
            <div class="model-node small">DENY → 403</div>
          </div>
        </div>

        <p class="final-line">
          Authentication establishes identity. Authorization enforces access.
        </p>

        <div class="takeaways">
          <ol>
            <li>Authentication answers "who are you?" — authorization answers "what can you do?"</li>
            <li>An authenticated user can still be unauthorized for a specific action.</li>
            <li>Passwords should be hashed with a purpose-built, salted algorithm — never stored as plaintext or ordinary encryption.</li>
            <li>Sessions keep state on the server; tokens carry it with the request. Neither is universally more secure.</li>
            <li>A JWT's signature detects tampering — its payload is not confidential by default.</li>
            <li>OAuth delegates access between systems; OpenID Connect adds identity on top of it.</li>
            <li>Authorization needs resource-level checks, not just a role lookup — that gap is how IDOR happens.</li>
            <li>401 means "I don't know who you are." 403 means "I know exactly who you are, and the answer is no."</li>
          </ol>
        </div>
      </div>
    </section>

    <section class="lab-section" id="connection-map">
      <div class="container">
        <p class="lab-index">AUTH / 53 — CHAPTER CONNECTION MAP</p>
        <h2 class="lab-title">This is one pipeline, not five separate tutorials.</h2>

        <div class="pipeline-map mono">
          <span class="map-node">CLIENT</span><span class="map-arrow">↓</span>
          <span class="map-node">HTTP</span><span class="map-arrow">↓</span>
          <span class="map-node">ROUTING</span><span class="map-arrow">↓</span>
          <span class="map-node is-current">AUTHENTICATION</span><span class="map-arrow">↓</span>
          <span class="map-node is-current">AUTHORIZATION</span><span class="map-arrow">↓</span>
          <span class="map-node">VALIDATION</span><span class="map-arrow">↓</span>
          <span class="map-node">BUSINESS LOGIC</span><span class="map-arrow">↓</span>
          <span class="map-node">DATABASE</span><span class="map-arrow">↓</span>
          <span class="map-node">RESPONSE</span>
        </div>

        <div class="map-legend">
          <p><strong>HTTP</strong> carries the request. <strong>Routing</strong> determines where it goes. <strong>Serialization</strong> represents its data. <strong>Authentication</strong> establishes who is asking. <strong>Authorization</strong> decides whether that identity may act. Only then does business logic run.</p>
        </div>

        <div class="chapter-footer">
          <div class="chapter-progress">
            <p class="chapter-label mono">Authentication &amp; Authorization · Chapter 8</p>
          </div>
          <div class="chapter-nav">
            <a class="lab-btn" routerLink="/explore/serialization">← Previous: Serialization</a>
            <a class="lab-btn" routerLink="/explore/validation">Next: Validation →</a>
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section next-concept">
      <div class="container next-concept-inner">
        <a class="prev-link mono" routerLink="/explore/serialization">← Previous concept</a>
        <a class="btn btn-ghost" routerLink="/" fragment="roadmap">Roadmap</a>
        <a class="next-link mono" routerLink="/explore/validation">Next concept →</a>
      </div>
    </section>
  `,
  styles: `
    .model-diagram { margin-top: 32px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; }
    .model-node { padding: 12px 22px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface-raised); color: var(--text); font-size: 0.8125rem; font-weight: 600; }
    .model-node.root { border-color: var(--border-strong); color: var(--text-muted); }
    .model-node.accent { border-color: var(--accent-dim); color: var(--accent); box-shadow: 0 0 18px var(--glow-accent); }
    .model-node.accent2 { border-color: var(--accent-2-dim); color: var(--accent-2); box-shadow: 0 0 18px var(--glow-accent-2); }
    .model-node.small { font-size: 0.6875rem; padding: 8px 14px; }
    .model-sub { font-size: 0.625rem; color: var(--text-faint); font-weight: 400; }
    .model-arrow { color: var(--border-strong); }
    .model-branches { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }

    .final-line { margin-top: 40px; text-align: center; font-size: 1.25rem; color: var(--text); max-width: 560px; margin-inline: auto; line-height: 1.6; }

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
    .map-legend strong { color: var(--text); }

    .chapter-footer { margin-top: 48px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 20px; }
    .chapter-label { font-size: 0.75rem; color: var(--text-faint); }
    .chapter-nav { display: flex; gap: 10px; flex-wrap: wrap; }

    .next-concept-inner { display: flex; justify-content: space-between; align-items: center; }
    .prev-link, .next-link { color: var(--text-faint); font-size: 0.8125rem; }
    .next-link.is-disabled { opacity: 0.4; }
  `,
})
export class AuthSummary {}
