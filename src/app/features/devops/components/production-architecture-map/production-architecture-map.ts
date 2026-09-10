import { Component, signal } from '@angular/core';

interface ArchNode {
  id: string;
  label: string;
  zone: 'source' | 'pipeline' | 'cluster' | 'ops';
  what: string;
  why: string;
  ifItFails: string;
}

const NODES: ArchNode[] = [
  {
    id: 'developer',
    label: 'Developer',
    zone: 'source',
    what: 'Writes, reviews, and commits code changes on a local machine or dev environment.',
    why: 'Every change to production behavior starts as a human decision encoded in source code.',
    ifItFails: 'Not a running-system dependency — but an untested or unreviewed change here is the root cause of most incidents that show up later in the pipeline.',
  },
  {
    id: 'git',
    label: 'Git',
    zone: 'source',
    what: 'A version-controlled repository holding the full history of the codebase.',
    why: 'It is the single source of truth for what the code actually is, and lets changes be reviewed, reverted, and audited.',
    ifItFails: 'If Git hosting is unreachable, nobody can push or pull new code — but already-deployed production traffic is completely unaffected.',
  },
  {
    id: 'ci',
    label: 'CI',
    zone: 'pipeline',
    what: 'A continuous integration server that automatically builds and validates every commit or pull request.',
    why: 'It catches problems on a branch before they merge, instead of relying on a human to remember to run checks.',
    ifItFails: 'New code can\'t be validated or merged safely, so releases stall — but the currently running production version keeps serving traffic.',
  },
  {
    id: 'tests',
    label: 'Tests',
    zone: 'pipeline',
    what: 'Automated unit, integration, and end-to-end tests run as part of the CI pipeline.',
    why: 'They verify the code behaves as expected before it is trusted with real user traffic.',
    ifItFails: 'If tests are skipped, flaky, or fail open, regressions and bugs ship straight through to production undetected.',
  },
  {
    id: 'docker-build',
    label: 'Docker Build',
    zone: 'pipeline',
    what: 'Packages the application, its dependencies, and its runtime into an immutable container image.',
    why: 'It guarantees the exact same artifact runs in every environment — no more "works on my machine."',
    ifItFails: 'No new deployable artifact is produced, so the next release is blocked; nothing already running is affected.',
  },
  {
    id: 'registry',
    label: 'Registry',
    zone: 'pipeline',
    what: 'A versioned store that holds built container images and serves them on request.',
    why: 'It decouples "build once" from "deploy many times" and gives every deployment a known, addressable artifact.',
    ifItFails: 'Kubernetes can\'t pull the image for new pods, restarts, or scale-up events — existing running pods are unaffected until they need to be replaced.',
  },
  {
    id: 'kubernetes',
    label: 'Kubernetes',
    zone: 'cluster',
    what: 'The orchestrator that schedules containers onto machines, restarts failed ones, and reconciles the cluster toward its declared desired state.',
    why: 'It automates deployment, scaling, and self-healing so humans don\'t have to manually manage individual servers.',
    ifItFails: 'If the control plane goes down, already-running pods keep serving traffic, but no new deploys, scaling, or automatic pod recovery can happen until it recovers.',
  },
  {
    id: 'load-balancer',
    label: 'Load Balancer',
    zone: 'cluster',
    what: 'The single entry point that distributes incoming requests across all healthy backend pods.',
    why: 'It spreads load evenly and hides the fact that there are many interchangeable instances behind one address.',
    ifItFails: 'All traffic to otherwise-healthy pods is lost or routed nowhere — a full outage even though the application itself is working fine.',
  },
  {
    id: 'backend-pods',
    label: 'Backend Pods',
    zone: 'cluster',
    what: 'Running instances of the application that actually execute business logic and answer requests.',
    why: 'This is where the real work happens — everything upstream exists to get correct code running here.',
    ifItFails: 'A single pod crashing is routine: Kubernetes reschedules it and traffic continues via the rest. If too many crash at once, capacity drops and requests queue or get dropped.',
  },
  {
    id: 'data-services',
    label: 'Database / Cache / External Services',
    zone: 'cluster',
    what: 'The database holds durable state, the cache holds fast, disposable copies of hot data, and external services provide integrations the app doesn\'t own.',
    why: 'Pods are stateless and disposable by design — durable state and third-party functionality have to live somewhere else.',
    ifItFails: 'DB down means reads and writes fail outright. Cache down means higher latency and load pressure on the DB, but usually not a hard outage. External service down means only the features depending on it degrade.',
  },
  {
    id: 'observability',
    label: 'Observability',
    zone: 'ops',
    what: 'Logs, metrics, and traces collected from every layer and surfaced through dashboards and alerts.',
    why: 'It\'s the only way to know what production is actually doing — without it you are guessing.',
    ifItFails: 'The application may keep running perfectly fine, but incidents go undetected and diagnosis becomes guesswork instead of evidence-based investigation.',
  },
  {
    id: 'incident-response',
    label: 'Incident Response',
    zone: 'ops',
    what: 'The on-call rotation and process that responds when observability signals something is wrong.',
    why: 'Detecting a problem is only useful if a human (or automation) acts on it quickly and effectively.',
    ifItFails: 'Without a working on-call process, incidents linger far longer than necessary, turning a contained blip into an extended, customer-visible outage.',
  },
];

@Component({
  selector: 'app-production-architecture-map',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene map-scene" id="production-architecture-map">
      <div class="container">
        <p class="lab-index mono">26 — THE WHOLE PICTURE</p>
        <h2 class="lab-title">One map, every piece</h2>
        <p class="lab-lede">
          Everything this chapter covered, in a single diagram. Click any node to see what it does, why it exists,
          and — the question that matters most in production — what happens if it fails.
        </p>

        <div class="lab-panel">
          <!--
            Desktop: single horizontal flow row (flex-wrap so it can break across lines on medium widths).
            Narrow viewports: the media query below switches the flow to a vertical column so the map
            never overflows or gets clipped on mobile.
          -->
          <div class="arch-flow" role="group" aria-label="Production architecture">
            @for (node of nodes; track node.id; let i = $index) {
              <button
                type="button"
                class="arch-node"
                [attr.data-zone]="node.zone"
                [class.is-active]="selectedId() === node.id"
                (click)="select(node.id)"
                [attr.aria-pressed]="selectedId() === node.id"
              >
                <span class="arch-node-label mono">{{ node.label }}</span>
              </button>
              @if (i < nodes.length - 1) {
                <span class="arch-arrow" aria-hidden="true">&rarr;</span>
              }
            }
          </div>

          <div class="legend mono" aria-hidden="true">
            <span><span class="legend-dot" data-zone="source"></span>SOURCE</span>
            <span><span class="legend-dot" data-zone="pipeline"></span>PIPELINE</span>
            <span><span class="legend-dot" data-zone="cluster"></span>CLUSTER</span>
            <span><span class="legend-dot" data-zone="ops"></span>OPERATIONS</span>
          </div>

          <div class="detail-panel">
            <p class="detail-title">{{ selected().label }}</p>
            <div class="detail-grid">
              <div class="detail-field">
                <p class="detail-field-heading mono">WHAT IT DOES</p>
                <p class="detail-field-text">{{ selected().what }}</p>
              </div>
              <div class="detail-field">
                <p class="detail-field-heading mono">WHY IT EXISTS</p>
                <p class="detail-field-text">{{ selected().why }}</p>
              </div>
              <div class="detail-field">
                <p class="detail-field-heading mono is-danger">IF IT FAILS</p>
                <p class="detail-field-text">{{ selected().ifItFails }}</p>
              </div>
            </div>
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
      --do-pending: #fbbf24;
    }

    .arch-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    @media (max-width: 560px) {
      .arch-flow { flex-direction: column; align-items: stretch; }
      .arch-arrow { transform: rotate(90deg); align-self: center; }
    }

    .arch-node {
      flex: 1; min-width: 128px; padding: 14px 12px; text-align: center;
      background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm);
      color: var(--text-muted); transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease, transform 0.15s ease;
    }
    .arch-node:hover { border-color: var(--do-cyan); color: var(--text); transform: translateY(-1px); }
    .arch-node.is-active { border-color: var(--do-accent); color: var(--text); background: color-mix(in srgb, var(--do-accent) 12%, var(--surface)); box-shadow: 0 0 16px color-mix(in srgb, var(--do-accent) 20%, transparent); }
    .arch-node-label { font-size: 0.75rem; font-weight: 600; line-height: 1.3; }
    .arch-node[data-zone='source'] { border-top: 2px solid var(--do-cyan); }
    .arch-node[data-zone='pipeline'] { border-top: 2px solid var(--do-accent); }
    .arch-node[data-zone='cluster'] { border-top: 2px solid var(--do-violet); }
    .arch-node[data-zone='ops'] { border-top: 2px solid var(--do-success); }
    .arch-arrow { color: var(--text-faint); font-size: 0.75rem; flex-shrink: 0; }

    .legend { display: flex; flex-wrap: wrap; gap: 18px; margin-top: 20px; font-size: 0.625rem; color: var(--text-faint); letter-spacing: 0.06em; }
    .legend span { display: inline-flex; align-items: center; gap: 6px; }
    .legend-dot { width: 8px; height: 8px; border-radius: 50%; }
    .legend-dot[data-zone='source'] { background: var(--do-cyan); }
    .legend-dot[data-zone='pipeline'] { background: var(--do-accent); }
    .legend-dot[data-zone='cluster'] { background: var(--do-violet); }
    .legend-dot[data-zone='ops'] { background: var(--do-success); }

    .detail-panel { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border); }
    .detail-title { font-size: 1.125rem; font-weight: 700; color: var(--text); margin-bottom: 18px; }
    .detail-grid { display: grid; grid-template-columns: 1fr; gap: 18px; }
    @media (min-width: 800px) { .detail-grid { grid-template-columns: repeat(3, 1fr); } }
    .detail-field-heading { font-size: 0.625rem; letter-spacing: 0.08em; color: var(--do-cyan); margin: 0 0 8px; }
    .detail-field-heading.is-danger { color: var(--do-danger); }
    .detail-field-text { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6; }
  `,
})
export class ProductionArchitectureMap {
  protected readonly nodes = NODES;
  protected readonly selectedId = signal('kubernetes');

  protected readonly selected = () => this.nodes.find((n) => n.id === this.selectedId()) ?? this.nodes[0];

  protected select(id: string): void {
    this.selectedId.set(id);
  }
}
