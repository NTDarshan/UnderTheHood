import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-validation-summary',
  standalone: true,
  imports: [RouterLink],
  template: `
    <section class="lab-section" id="final-architecture">
      <div class="container">
        <p class="lab-index">VALIDATION / 48 — FINAL ARCHITECTURE</p>
        <h2 class="lab-title">The request lifecycle, complete.</h2>

        <div class="arch-diagram mono">
          <div class="arch-node">CLIENT</div>
          <div class="arch-arrow">↓ HTTP</div>
          <div class="arch-box">
            <p class="box-title">CONTROLLER</p>
            <p>Route</p><p>Bind / Parse</p><p>Transform</p><p>Validate</p>
          </div>
          <div class="arch-arrow">↓</div>
          <div class="arch-box">
            <p class="box-title">SERVICE</p>
            <p>Business Rules</p><p>Domain Decisions</p>
          </div>
          <div class="arch-arrow">↓</div>
          <div class="arch-box">
            <p class="box-title">REPOSITORY</p>
            <p>Data Access</p>
          </div>
          <div class="arch-arrow">↓</div>
          <div class="arch-node">DATABASE</div>
        </div>
      </div>
    </section>

    <section class="lab-section" id="summary">
      <div class="container">
        <p class="lab-index">VALIDATION / 49 — FINAL MENTAL MODEL</p>
        <h2 class="lab-title">One journey, not a pile of rules.</h2>

        <div class="model-diagram mono">
          <div class="model-node root">RAW REQUEST</div>
          <div class="model-arrow">↓</div>
          <div class="model-node">PARSE</div>
          <div class="model-arrow">↓</div>
          <div class="model-node accent">TRANSFORM<br /><span class="model-sub">normalize · convert · map</span></div>
          <div class="model-arrow">↓</div>
          <div class="model-node accent2">VALIDATE<br /><span class="model-sub">is it acceptable?</span></div>
          <div class="model-branches">
            <div class="model-node small">REJECT → 400</div>
            <div class="model-node small">PASS → SERVICE → BUSINESS RULES → REPOSITORY → DATABASE</div>
          </div>
        </div>

        <p class="final-line">
          The client sends data. The backend decides what it means, whether it is acceptable, and whether it can be trusted.
        </p>

        <div class="takeaways">
          <ol>
            <li>Client input is untrusted by default — parsing, transforming, and validating are what earn it trust.</li>
            <li>Transformation changes representation. Validation judges acceptability. They are not the same gate.</li>
            <li>Syntactic validity ("is this a number?") is not semantic validity ("does 400 years old make sense?").</li>
            <li>Authentication, authorization, and validation are three separate gates — passing one says nothing about the others.</li>
            <li>Business rules live in the domain/service layer, not bundled into boundary validation.</li>
            <li>Reject invalid input early — before it reaches expensive business logic or the database.</li>
            <li>Never let a client control a field just because it exists on an internal model.</li>
            <li>Database constraints protect data integrity — they don't replace API-level validation.</li>
          </ol>
        </div>
      </div>
    </section>

    <section class="lab-section" id="connection-map">
      <div class="container">
        <p class="lab-index">VALIDATION / 50 — CHAPTER CONNECTION MAP</p>
        <h2 class="lab-title">The full backend pipeline, five chapters deep.</h2>

        <div class="pipeline-map mono">
          <span class="map-node">CLIENT</span><span class="map-arrow">↓</span>
          <span class="map-node">HTTP</span><span class="map-arrow">↓</span>
          <span class="map-node">ROUTING</span><span class="map-arrow">↓</span>
          <span class="map-node">SERIALIZATION / BINDING</span><span class="map-arrow">↓</span>
          <span class="map-node">AUTHENTICATION</span><span class="map-arrow">↓</span>
          <span class="map-node">AUTHORIZATION</span><span class="map-arrow">↓</span>
          <span class="map-node is-current">TRANSFORMATION</span><span class="map-arrow">↓</span>
          <span class="map-node is-current">VALIDATION</span><span class="map-arrow">↓</span>
          <span class="map-node">SERVICE</span><span class="map-arrow">↓</span>
          <span class="map-node">REPOSITORY</span><span class="map-arrow">↓</span>
          <span class="map-node">MIDDLEWARE</span><span class="map-arrow">↓</span>
          <span class="map-node">CONTROLLER / SERVICE / REPOSITORY</span><span class="map-arrow">↓</span>
          <span class="map-node">DATABASE</span><span class="map-arrow">↓</span>
          <span class="map-node">RESPONSE</span>
        </div>

        <div class="chapter-footer">
          <div class="chapter-progress">
            <p class="chapter-label mono">Validation &amp; Transformation · Chapter 9</p>
          </div>
          <div class="chapter-nav">
            <a class="lab-btn" routerLink="/explore/auth">← Previous: Authentication</a>
            <a class="lab-btn" routerLink="/explore/backend-layers">Next: Controllers, Services & Repositories →</a>
          </div>
        </div>
      </div>
    </section>

    <section class="lab-section next-concept">
      <div class="container next-concept-inner">
        <a class="prev-link mono" routerLink="/explore/auth">← Previous concept</a>
        <a class="btn btn-ghost" routerLink="/" fragment="roadmap">Roadmap</a>
        <a class="next-link mono" routerLink="/explore/backend-layers">Next concept →</a>
      </div>
    </section>
  `,
  styles: `
    .arch-diagram { margin-top: 32px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
    .arch-node { padding: 10px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface-raised); color: var(--text-muted); font-size: 0.8125rem; }
    .arch-arrow { color: var(--border-strong); font-size: 0.75rem; }
    .arch-box { padding: 12px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface-raised); }
    .arch-box p { font-size: 0.75rem; color: var(--text-muted); margin-top: 2px; }
    .box-title { font-size: 0.8125rem; color: var(--accent-2); font-weight: 700; margin-bottom: 6px; }

    .model-diagram { margin-top: 32px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 4px; }
    .model-node { padding: 12px 22px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface-raised); color: var(--text); font-size: 0.8125rem; font-weight: 600; }
    .model-node.root { color: var(--text-muted); }
    .model-node.accent { border-color: var(--accent-dim); color: var(--accent); box-shadow: 0 0 18px var(--glow-accent); }
    .model-node.accent2 { border-color: var(--accent-2-dim); color: var(--accent-2); box-shadow: 0 0 18px var(--glow-accent-2); }
    .model-node.small { font-size: 0.6875rem; padding: 8px 14px; }
    .model-sub { font-size: 0.625rem; color: var(--text-faint); font-weight: 400; }
    .model-arrow { color: var(--border-strong); }
    .model-branches { display: flex; gap: 10px; flex-wrap: wrap; justify-content: center; margin-top: 4px; }

    .final-line { margin-top: 40px; text-align: center; font-size: 1.25rem; color: var(--text); max-width: 600px; margin-inline: auto; line-height: 1.6; }

    .takeaways { margin-top: 40px; max-width: 720px; margin-inline: auto; }
    .takeaways ol { display: flex; flex-direction: column; gap: 12px; counter-reset: item; }
    .takeaways li { position: relative; padding-left: 32px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.55; counter-increment: item; }
    .takeaways li::before { content: counter(item); position: absolute; left: 0; top: 0; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; border-radius: 50%; border: 1px solid var(--accent-2-dim); color: var(--accent-2); font-size: 0.6875rem; font-family: var(--font-mono); }

    .pipeline-map { margin-top: 32px; display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .map-node { padding: 8px 18px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface-raised); color: var(--text-faint); font-size: 0.75rem; }
    .map-node.is-current { border-color: var(--accent); color: var(--accent-strong); box-shadow: 0 0 14px var(--glow-accent); }
    .map-arrow { color: var(--border-strong); font-size: 0.75rem; }

    .chapter-footer { margin-top: 48px; display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 20px; }
    .chapter-label { font-size: 0.75rem; color: var(--text-faint); }
    .chapter-nav { display: flex; gap: 10px; flex-wrap: wrap; }

    .next-concept-inner { display: flex; justify-content: space-between; align-items: center; }
    .prev-link, .next-link { color: var(--text-faint); font-size: 0.8125rem; }
    .next-link.is-disabled { opacity: 0.4; }
  `,
})
export class ValidationSummary {}
