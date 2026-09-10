import { Component, OnDestroy, signal } from '@angular/core';

interface FlowNode {
  key: string;
  label: string;
  sub: string;
}

const FLOW: FlowNode[] = [
  { key: 'dev', label: 'DEVELOPER', sub: 'writes code, pushes to git' },
  { key: 'build', label: 'BUILD', sub: 'CI runs docker build' },
  { key: 'image', label: 'IMAGE', sub: 'tagged, layered artifact' },
  { key: 'registry', label: 'REGISTRY', sub: 'CI pushes the image here' },
  { key: 'deploy', label: 'DEPLOYMENT', sub: 'runtime pulls the image' },
];

interface TrustItem {
  title: string;
  body: string;
}

const TRUST_ITEMS: TrustItem[] = [
  { title: 'IMAGE SCANNING', body: 'Registries and CI pipelines scan images for known vulnerable packages before they are trusted for deployment.' },
  { title: 'VULNERABILITIES', body: 'A scan surfaces CVEs in OS packages and dependencies baked into the image, ranked by severity.' },
  { title: 'SBOM', body: 'A Software Bill of Materials lists every package and version inside the image — an inventory for security and compliance.' },
  { title: 'PROVENANCE & SIGNING', body: 'Cryptographic signing proves an image was built by your pipeline and hasn’t been tampered with since.' },
];

@Component({
  selector: 'app-registry-supply-chain',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-registry-supply-chain">
      <div class="container">
        <p class="lab-index mono">4 — REGISTRIES &amp; THE SUPPLY CHAIN</p>
        <h2 class="lab-title">Images need a home between "built" and "running"</h2>
        <p class="lab-lede">
          A registry stores built images so any machine that needs to run one can pull it. Your CI pipeline pushes
          — production pulls. Watch the flow, then check what should happen before an image is trusted.
        </p>

        <div class="lab-panel">
          <div class="flow-row">
            @for (node of flow; track node.key; let i = $index) {
              <div class="flow-node" [class.is-active]="activeIndex() === i" [attr.data-key]="node.key">
                <span class="mono flow-label">{{ node.label }}</span>
                <span class="mono flow-sub">{{ node.sub }}</span>
              </div>
              @if (i < flow.length - 1) {
                <span class="lab-flow-arrow" [class.is-live]="activeIndex() === i">&rarr;</span>
              }
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="runFlow()" [disabled]="running()">
              RUN THE PIPELINE
            </button>
          </div>
          <p class="log-line mono" aria-live="polite">{{ logLine() }}</p>
        </div>

        <div class="lab-panel">
          <p class="panel-heading mono">SUPPLY CHAIN TRUST — BEFORE AN IMAGE IS TRUSTED</p>
          <p class="lab-lede-sm">Pulling an image doesn't mean it's safe to run. A production-grade pipeline checks
            each of these before deployment is allowed to use it.</p>
          <div class="trust-list">
            @for (item of trustItems; track item.title; let i = $index) {
              <div class="trust-item" [class.is-checked]="checkedCount() > i">
                <span class="trust-check mono">{{ checkedCount() > i ? '✓' : '—' }}</span>
                <div>
                  <p class="trust-title mono">{{ item.title }}</p>
                  <p class="trust-body">{{ item.body }}</p>
                </div>
              </div>
            }
          </div>
        </div>
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
      --do-pending: #64748b;
    }
    .lab-panel + .lab-panel { margin-top: 20px; }
    .panel-heading { font-size: 0.75rem; letter-spacing: 0.08em; color: var(--do-cyan); margin: 0 0 12px; }
    .lab-lede-sm { font-size: 0.875rem; color: var(--text-muted); margin: 0 0 18px; line-height: 1.6; }

    .flow-row { display: flex; align-items: stretch; gap: 8px; flex-wrap: wrap; }
    .flow-node {
      flex: 1;
      min-width: 130px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 16px 10px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      text-align: center;
      transition: border-color 0.3s ease, box-shadow 0.3s ease;
    }
    .flow-node.is-active { border-color: var(--do-accent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--do-accent) 30%, transparent); }
    .flow-node[data-key='registry'] { border-color: var(--do-violet); }
    .flow-node[data-key='registry'].is-active { border-color: var(--do-accent); }
    .flow-label { font-size: 0.75rem; font-weight: 700; letter-spacing: 0.05em; color: var(--text); }
    .flow-sub { font-size: 0.625rem; color: var(--text-faint); }
    .lab-flow-arrow.is-live { color: var(--do-accent); animation: arrow-flash 0.6s ease-in-out infinite; }
    @keyframes arrow-flash { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

    .log-line { margin-top: 14px; font-size: 0.75rem; color: var(--text-faint); min-height: 1.2em; }

    .trust-list { display: flex; flex-direction: column; gap: 10px; }
    .trust-item { display: flex; gap: 12px; padding: 12px 14px; border: 1px solid var(--border); border-radius: var(--radius-sm); background: var(--surface); opacity: 0.55; transition: opacity 0.3s ease, border-color 0.3s ease; }
    .trust-item.is-checked { opacity: 1; border-color: var(--do-success); }
    .trust-check { flex: none; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; border-radius: 999px; border: 1px solid var(--border-strong); font-size: 0.75rem; color: var(--text-faint); }
    .trust-item.is-checked .trust-check { border-color: var(--do-success); color: var(--do-success); }
    .trust-title { font-size: 0.75rem; letter-spacing: 0.05em; color: var(--text); margin: 0 0 4px; }
    .trust-body { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.5; margin: 0; }

    @media (prefers-reduced-motion: reduce) {
      .lab-flow-arrow.is-live { animation: none; }
      .flow-node, .trust-item { transition: none; }
    }
  `,
})
export class RegistrySupplyChain implements OnDestroy {
  protected readonly flow = FLOW;
  protected readonly trustItems = TRUST_ITEMS;

  protected readonly activeIndex = signal(-1);
  protected readonly running = signal(false);
  protected readonly checkedCount = signal(0);
  protected readonly logLine = signal('Click RUN THE PIPELINE to trace an image from code to a running deployment.');

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected runFlow(): void {
    if (this.running()) return;
    this.running.set(true);
    this.checkedCount.set(0);
    this.activeIndex.set(-1);

    const messages = [
      'Developer pushes code…',
      'CI checks it out and runs docker build…',
      'A tagged image is produced…',
      'CI pushes the image to the registry…',
      'Production pulls the image and starts a container from it.',
    ];

    messages.forEach((msg, i) => {
      this.timers.push(
        setTimeout(() => {
          this.activeIndex.set(i);
          this.logLine.set(msg);
          if (i === this.flow.length - 1) {
            this.timers.push(
              setTimeout(() => {
                this.running.set(false);
                this.checkTrustItems();
              }, 500),
            );
          }
        }, i * 700),
      );
    });
  }

  private checkTrustItems(): void {
    let i = 0;
    const step = () => {
      if (i >= this.trustItems.length) return;
      i++;
      this.checkedCount.set(i);
      this.timers.push(setTimeout(step, 350));
    };
    step();
  }
}
