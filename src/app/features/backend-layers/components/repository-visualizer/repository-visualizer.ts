import { Component } from '@angular/core';

@Component({
  selector: 'app-repository-visualizer',
  standalone: true,
  template: `
    <section class="lab-section" id="repository">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 10 — REPOSITORY: THE DATABASE TRANSLATOR</p>
        <h2 class="lab-title">The repository encapsulates persistence — nothing else.</h2>

        <div class="lab-panel">
          <div class="chain mono">
            <div class="chain-node">SERVICE</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node is-accent">REPOSITORY</div>
            <div class="lab-flow-arrow">↓</div>
            <div class="chain-node">DATABASE</div>
          </div>

          <div class="should-grid">
            <div class="should-col">
              <p class="should-title mono">SHOULD</p>
              <p class="should-item">✓ Build/execute data queries</p>
              <p class="should-item">✓ Read/write persistence</p>
              <p class="should-item">✓ Map persistence results</p>
              <p class="should-item">✓ Handle persistence-specific concerns</p>
            </div>
            <div class="should-col">
              <p class="should-title mono is-danger">SHOULD NOT</p>
              <p class="should-item is-danger">✕ Decide business policy</p>
              <p class="should-item is-danger">✕ Return HTTP responses</p>
              <p class="should-item is-danger">✕ Know about controllers</p>
              <p class="should-item is-danger">✕ Decide user permissions</p>
            </div>
          </div>

          <div class="compare-grid">
            <div class="compare-col is-bad">
              <p class="compare-title mono">BAD — MIXED CONCERNS</p>
              <pre class="lab-code mono">repository.<span class="tok-key">getUser</span>()
  if (user.role != <span class="tok-dim">'admin'</span>)
    return <span class="tok-status-err">403</span></pre>
            </div>
            <div class="compare-col is-good">
              <p class="compare-title mono">GOOD — FOCUSED METHODS</p>
              <pre class="lab-code mono"><span class="tok-key">getUserById</span>(id)
<span class="tok-key">getUsers</span>(filter)
<span class="tok-key">saveUser</span>(user)
<span class="tok-key">deleteUser</span>(id)</pre>
            </div>
          </div>
          <p class="lab-note">A method like <code class="mono">getEverythingAndMaybeFilterLater()</code> is a warning sign — repository methods should have one clear persistence responsibility, and permission decisions belong to the service layer.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .chain { display: flex; flex-direction: column; align-items: center; gap: 2px; }
    .chain-node { font-size: 0.8125rem; font-weight: 700; padding: 10px 20px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); text-align: center; min-width: 220px; }
    .chain-node.is-accent { color: var(--accent-strong); border-color: var(--accent); box-shadow: 0 0 14px var(--glow-accent); }

    .should-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 20px; }
    @media (min-width: 700px) { .should-grid { grid-template-columns: 1fr 1fr; } }
    .should-title { font-size: 0.6875rem; color: var(--accent-2); letter-spacing: 0.06em; margin-bottom: 10px; }
    .should-title.is-danger { color: var(--danger); }
    .should-item { font-size: 0.8125rem; color: var(--text-muted); margin-top: 6px; }
    .should-item.is-danger { color: var(--danger); opacity: 0.85; }

    .compare-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 700px) { .compare-grid { grid-template-columns: 1fr 1fr; } }
    .compare-title { font-size: 0.6875rem; letter-spacing: 0.06em; margin-bottom: 8px; }
    .compare-col.is-bad .compare-title { color: var(--danger); }
    .compare-col.is-good .compare-title { color: var(--accent-2); }
  `,
})
export class RepositoryVisualizer {}
