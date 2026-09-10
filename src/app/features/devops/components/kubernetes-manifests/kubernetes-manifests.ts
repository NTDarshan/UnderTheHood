import { Component, computed, signal } from '@angular/core';

const MIN_REPLICAS = 0;
const MAX_REPLICAS = 8;

@Component({
  selector: 'app-do-kubernetes-manifests',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-manifests">
      <div class="container">
        <p class="lab-index mono">05 — DECLARATIVE INFRASTRUCTURE</p>
        <h2 class="lab-title">You describe what you want. The system works toward making reality match it.</h2>
        <p class="lab-lede">
          A Kubernetes manifest isn't a script of steps to run — it's a declaration of an end state. Edit
          <code class="mono inline-code">replicas</code> below and watch the fleet on the right move toward the new
          number, without you saying how.
        </p>

        <div class="lab-panel split-panel">
          <div class="yaml-side">
            <p class="side-label mono">DEPLOYMENT MANIFEST</p>
            <pre class="lab-code manifest-code"><span class="tok-key">apiVersion:</span> apps/v1
<span class="tok-key">kind:</span> <span class="tok-method">Deployment</span>
<span class="tok-key">metadata:</span>
<span class="tok-dim">  name:</span> checkout-api
<span class="tok-key">spec:</span>
<span class="replicas-line">  replicas: <input
              class="replicas-input mono"
              type="number"
              [min]="minReplicas"
              [max]="maxReplicas"
              [value]="replicas()"
              (input)="onInput($event)"
              aria-label="Desired replica count"
            /></span>
<span class="tok-dim">  selector:</span>
<span class="tok-dim">    matchLabels:</span>
<span class="tok-dim">      app: checkout-api</span>
<span class="tok-key">  template:</span>
<span class="tok-dim">    metadata:</span>
<span class="tok-dim">      labels:</span>
<span class="tok-dim">        app: checkout-api</span>
<span class="tok-dim">    spec:</span>
<span class="tok-dim">      containers:</span>
<span class="tok-dim">        - name: checkout-api</span>
<span class="tok-dim">          image: checkout-api:v1</span></pre>

            <div class="lab-btn-row">
              <button type="button" class="lab-btn" (click)="step(-1)" [disabled]="replicas() <= minReplicas">&minus; Replica</button>
              <button type="button" class="lab-btn" (click)="step(1)" [disabled]="replicas() >= maxReplicas">+ Replica</button>
            </div>
          </div>

          <div class="pods-side">
            <p class="side-label mono">LIVE CLUSTER STATE &mdash; {{ replicas() }} POD{{ replicas() === 1 ? '' : 'S' }}</p>
            <div class="pod-grid" role="img" [attr.aria-label]="'cluster running ' + replicas() + ' pods'">
              @for (id of podIds(); track id) {
                <div class="pod-box">
                  <span class="pulse-dot" aria-hidden="true"></span>
                  <span class="pod-label mono">pod-{{ id }}</span>
                </div>
              }
              @if (replicas() === 0) {
                <div class="pod-empty mono">no pods running</div>
              }
            </div>
          </div>
        </div>

        <p class="lab-note">
          <strong>Nobody wrote a loop that says "start two more containers."</strong> You changed one number in a
          spec. A controller in the cluster noticed the gap between what you asked for and what's running, and it
          closed that gap on its own — the same reconciliation loop from the last section, driven by this exact
          field.
        </p>
      </div>
    </section>
  `,
  styles: `
    .do-scene {
      --do-accent: var(--accent);
      --do-cyan: var(--accent-2);
      --do-violet: #a78bfa;
      --do-success: #4ade80;
      --do-warning: #fbbf24;
      --do-danger: var(--danger);
      --do-pending: #60a5fa;
    }

    .inline-code {
      font-size: 0.875em;
      color: var(--do-accent);
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      padding: 1px 6px;
    }

    .split-panel {
      display: grid;
      grid-template-columns: 1fr;
      gap: 24px;
    }
    @media (min-width: 860px) {
      .split-panel { grid-template-columns: 1fr 1fr; align-items: start; }
    }

    .side-label {
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
      color: var(--do-cyan);
      margin-bottom: 10px;
    }

    .manifest-code { margin: 0; }
    .replicas-line { color: var(--text); }
    .replicas-input {
      width: 4ch;
      background: color-mix(in srgb, var(--do-violet) 16%, var(--surface));
      border: 1px solid var(--do-violet);
      border-radius: var(--radius-sm);
      color: var(--text);
      font-family: var(--font-mono);
      font-size: 0.8125rem;
      padding: 1px 4px;
      appearance: textfield;
    }
    .replicas-input:focus-visible {
      outline: 2px solid var(--do-violet);
      outline-offset: 1px;
    }

    .pod-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
      gap: 10px;
      min-height: 96px;
    }
    .pod-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 14px 8px;
      background: var(--surface);
      border: 1px solid var(--do-cyan);
      border-radius: var(--radius-md);
      animation: pod-in 0.35s ease;
    }
    .pod-label { font-size: 0.625rem; color: var(--text-faint); }
    .pod-empty {
      grid-column: 1 / -1;
      padding: 24px 0;
      text-align: center;
      color: var(--text-faint);
      font-size: 0.75rem;
      border: 1px dashed var(--border-strong);
      border-radius: var(--radius-md);
    }

    .pulse-dot {
      width: 8px; height: 8px; border-radius: 50%;
      background: var(--do-success);
      box-shadow: 0 0 8px color-mix(in srgb, var(--do-success) 60%, transparent);
      animation: pulse 1.6s ease-in-out infinite;
    }

    @keyframes pod-in {
      from { opacity: 0; transform: scale(0.85); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(1.3); }
    }
    @media (prefers-reduced-motion: reduce) {
      .pod-box { animation: none; }
      .pulse-dot { animation: none; }
    }
  `,
})
export class KubernetesManifests {
  protected readonly minReplicas = MIN_REPLICAS;
  protected readonly maxReplicas = MAX_REPLICAS;

  protected readonly replicas = signal(2);
  protected readonly podIds = computed(() => Array.from({ length: this.replicas() }, (_, i) => i + 1));

  protected onInput(event: Event): void {
    const raw = Number((event.target as HTMLInputElement).value);
    if (Number.isNaN(raw)) return;
    this.setReplicas(raw);
  }

  protected step(delta: number): void {
    this.setReplicas(this.replicas() + delta);
  }

  private setReplicas(value: number): void {
    this.replicas.set(Math.min(this.maxReplicas, Math.max(this.minReplicas, Math.round(value))));
  }
}
