import { Component, signal } from '@angular/core';

interface ChainNode {
  id: string;
  label: string;
  risk?: string;
}

const CHAIN: ChainNode[] = [
  { id: 'code', label: 'Code', risk: 'A hardcoded secret or credential committed here is exposed the moment the repo is cloned, forked, or leaked — even after deletion, it lives on in git history.' },
  { id: 'deps', label: 'Dependencies', risk: 'Every third-party package you pull in is code you didn\'t write but now run in production — a single vulnerable or malicious dependency compromises everything built on top of it.' },
  { id: 'build', label: 'Build', risk: 'A build step that pulls in unpinned tools or runs with excess access can inject malicious code before your own has even been compiled.' },
  { id: 'image', label: 'Image' , risk: 'A container image inherits every vulnerability in its base OS and installed packages — shipping an unscanned image ships those vulnerabilities straight to production.'},
  { id: 'registry', label: 'Registry' },
  { id: 'deployment', label: 'Deployment', risk: 'Without artifact integrity checks between registry and cluster, nothing guarantees the image that gets deployed is the exact one that was built and scanned.' },
  { id: 'runtime', label: 'Runtime', risk: 'A workload running with more permissions than it needs turns a routine app bug into a much bigger breach — least privilege limits the blast radius when (not if) something goes wrong.' },
];

@Component({
  selector: 'app-security-supply-chain',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene supply-scene" id="security-supply-chain">
      <div class="container">
        <p class="lab-index mono">25 — THE FULL DELIVERY CHAIN</p>
        <h2 class="lab-title">Every link this code travels through</h2>
        <p class="lab-lede">
          Zoom out from any one step and the delivery pipeline is a supply chain: code becomes a build, becomes an
          image, becomes a running workload — and every handoff is a place trust can be misplaced. This is a recap,
          not a deep dive — click a node for a one-line reminder of the risk that lives there.
        </p>

        <div class="lab-panel">
          <div class="chain" role="group" aria-label="Software supply chain">
            @for (node of chain; track node.id; let i = $index) {
              <button
                type="button"
                class="chain-node"
                [class.has-risk]="!!node.risk"
                [class.is-active]="activeId() === node.id"
                (click)="select(node.id)"
                [attr.aria-pressed]="activeId() === node.id"
              >
                <span class="node-label mono">{{ node.label }}</span>
                @if (node.risk) {
                  <span class="risk-dot" aria-hidden="true"></span>
                }
              </button>
              @if (i < chain.length - 1) {
                <span class="chain-arrow" aria-hidden="true">&rarr;</span>
              }
            }
          </div>

          @if (activeRisk(); as risk) {
            <div class="risk-callout">
              <p class="risk-heading mono">{{ activeLabel() }} — RISK</p>
              <p class="risk-text">{{ risk }}</p>
            </div>
          } @else {
            <div class="risk-callout is-muted">
              <p class="risk-text">
                {{ activeLabel() }} hands the artifact to the next link unchanged — the risks worth remembering sit
                at the nodes marked with a dot above.
              </p>
            </div>
          }

          <p class="lab-note">
            Secrets handling and registry scanning each get their own deep dive earlier in this chapter — this view
            is here to connect the dots: a supply chain is only as trustworthy as its weakest link.
          </p>
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
      --do-pending: #fbbf24;
    }

    .chain { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; }
    .chain-node {
      position: relative; display: flex; align-items: center; gap: 8px; padding: 12px 16px;
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm);
      color: var(--text-muted); transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
    }
    .chain-node:hover { border-color: var(--do-cyan); color: var(--text); }
    .chain-node.is-active { border-color: var(--do-accent); color: var(--text); background: color-mix(in srgb, var(--do-accent) 10%, var(--surface)); }
    .chain-node.has-risk { border-color: color-mix(in srgb, var(--do-danger) 35%, var(--border)); }
    .node-label { font-size: 0.8125rem; font-weight: 600; }
    .risk-dot {
      width: 6px; height: 6px; border-radius: 50%; background: var(--do-danger);
      box-shadow: 0 0 6px color-mix(in srgb, var(--do-danger) 60%, transparent);
    }
    .chain-arrow { color: var(--text-faint); font-size: 0.75rem; }

    .risk-callout {
      margin-top: 24px; padding: 18px 20px; border-radius: var(--radius-md);
      background: color-mix(in srgb, var(--do-danger) 8%, var(--surface));
      border: 1px solid color-mix(in srgb, var(--do-danger) 30%, var(--border));
    }
    .risk-callout.is-muted { background: var(--surface); border-color: var(--border); }
    .risk-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--do-danger); margin: 0 0 8px; }
    .risk-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }
  `,
})
export class SecuritySupplyChain {
  protected readonly chain = CHAIN;
  protected readonly activeId = signal('deps');

  protected readonly activeLabel = () => this.chain.find((n) => n.id === this.activeId())?.label ?? '';
  protected readonly activeRisk = () => this.chain.find((n) => n.id === this.activeId())?.risk;

  protected select(id: string): void {
    this.activeId.set(id);
  }
}
