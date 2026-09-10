import { Component, computed, signal } from '@angular/core';

type Strategy = 'trunk' | 'gitflow' | 'release';

interface Commit {
  id: string;
  x: number;
  y: number;
  lane: string;
}

interface Lane {
  id: string;
  label: string;
  y: number;
  color: string;
}

interface Edge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const VIEW_W = 640;

@Component({
  selector: 'app-git-branching-strategies',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-git-branching">
      <div class="container">
        <p class="lab-index mono">03 — BRANCHING STRATEGY</p>
        <h2 class="lab-title">Branching solves one problem: how do many people change the same code at once?</h2>
        <p class="lab-lede">
          Every strategy trades off integration speed against isolation. Switch between three common approaches and
          watch the commit graph change shape.
        </p>

        <div class="lab-panel">
          <div class="strategy-tabs">
            <button type="button" class="lab-btn" [class.is-active]="strategy() === 'trunk'" (click)="setStrategy('trunk')">
              TRUNK-BASED
            </button>
            <button type="button" class="lab-btn" [class.is-active]="strategy() === 'gitflow'" (click)="setStrategy('gitflow')">
              GIT FLOW
            </button>
            <button type="button" class="lab-btn" [class.is-active]="strategy() === 'release'" (click)="setStrategy('release')">
              RELEASE BRANCHES
            </button>
          </div>

          <p class="strategy-desc">{{ description() }}</p>

          <div class="graph-wrap">
            <svg [attr.viewBox]="'0 0 ' + viewW + ' ' + viewH()" class="graph-svg" role="img" [attr.aria-label]="strategy() + ' branch graph'">
              @for (lane of lanes(); track lane.id) {
                <line class="lane-line" [attr.x1]="40" [attr.y1]="lane.y" [attr.x2]="viewW - 20" [attr.y2]="lane.y" [style.stroke]="lane.color" />
                <text class="lane-label" [attr.x]="8" [attr.y]="lane.y + 4">{{ lane.label }}</text>
              }
              @for (edge of edges(); track edge.x1 + '-' + edge.y1 + '-' + edge.x2 + '-' + edge.y2) {
                <line class="edge-line" [attr.x1]="edge.x1" [attr.y1]="edge.y1" [attr.x2]="edge.x2" [attr.y2]="edge.y2" />
              }
              @for (c of commits(); track c.id) {
                <circle class="commit-dot" [attr.cx]="c.x" [attr.cy]="c.y" r="6" [attr.data-lane]="c.lane" />
              }
            </svg>
          </div>
        </div>

        <div class="lab-panel divergence-panel">
          <h3 class="panel-heading">Watch divergence grow</h3>
          <p class="lab-note">
            A long-lived branch that isn't merged back regularly drifts further from <span class="mono">main</span>
            with every commit. Each click grows a feature branch one step further — watch conflict risk rise.
          </p>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="growDivergence()">GROW THE BRANCH</button>
            <button type="button" class="lab-btn" (click)="resetDivergence()">RESET</button>
          </div>

          <div class="divergence-meter">
            <div class="divergence-track">
              <div class="divergence-fill" [style.width.%]="divergencePct()" [class.is-conflict]="hasConflict()"></div>
            </div>
            <span class="divergence-value mono">{{ divergenceSteps() }} commits behind main</span>
          </div>

          @if (hasConflict()) {
            <div class="conflict-banner mono">
              MERGE CONFLICT — this branch and <span class="mono">main</span> have both changed the same lines.
              Manual resolution required before merging.
            </div>
          }
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

    .strategy-tabs { display: flex; flex-wrap: wrap; gap: 10px; }
    .strategy-desc { margin-top: 18px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; max-width: 640px; }

    .graph-wrap { margin-top: 24px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px; overflow-x: auto; }
    .graph-svg { width: 100%; height: auto; min-width: 480px; }

    .lane-line { stroke-width: 2; opacity: 0.5; }
    .lane-label { font-family: var(--font-mono); font-size: 9px; fill: var(--text-faint); }
    .edge-line { stroke: var(--border-strong); stroke-width: 1.5; }
    .commit-dot { fill: var(--do-accent); stroke: var(--surface); stroke-width: 2; transition: cx 0.4s ease, cy 0.4s ease; }
    .commit-dot[data-lane='develop'] { fill: var(--do-cyan); }
    .commit-dot[data-lane='release'] { fill: var(--do-violet); }
    .commit-dot[data-lane='feature'] { fill: var(--do-warning); }
    @media (prefers-reduced-motion: reduce) {
      .commit-dot { transition: none; }
    }

    .panel-heading { margin: 0 0 8px; font-size: 1.0625rem; color: var(--text); }
    .divergence-panel { margin-top: 24px; }

    .divergence-meter { margin-top: 20px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; }
    .divergence-track { flex: 1; min-width: 180px; height: 8px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
    .divergence-fill { height: 100%; background: linear-gradient(90deg, var(--do-cyan), var(--do-warning)); transition: width 0.3s ease, background 0.3s ease; }
    .divergence-fill.is-conflict { background: var(--do-danger); }
    .divergence-value { font-size: 0.75rem; color: var(--text-faint); }

    .conflict-banner {
      margin-top: 16px;
      padding: 12px 16px;
      background: color-mix(in srgb, var(--do-danger) 12%, var(--surface));
      border: 1px solid var(--do-danger);
      border-radius: var(--radius-sm);
      color: var(--do-danger);
      font-size: 0.75rem;
      line-height: 1.5;
    }
  `,
})
export class GitBranchingStrategies {
  protected readonly viewW = VIEW_W;
  protected readonly strategy = signal<Strategy>('trunk');
  protected readonly divergenceSteps = signal(0);

  protected readonly divergencePct = computed(() => Math.min(100, (this.divergenceSteps() / 10) * 100));
  protected readonly hasConflict = computed(() => this.divergenceSteps() >= 6);

  protected readonly description = computed(() => {
    switch (this.strategy()) {
      case 'trunk':
        return 'Everyone commits to short-lived branches and merges into main at least daily, often behind feature flags. Minimal isolation, maximum integration speed — favored by teams that deploy continuously.';
      case 'gitflow':
        return 'A heavier model with a long-lived develop branch, feature branches off develop, and dedicated release branches for stabilization before merging to main. Gives strong isolation and a formal release process, at the cost of merge overhead and slower integration.';
      case 'release':
        return 'Main stays close to trunk-based development, but a release branch is cut for each version to stabilize and cherry-pick fixes onto, while main keeps moving forward. A middle ground used when releases need a stabilization window.';
    }
  });

  protected readonly lanes = computed<Lane[]>(() => {
    switch (this.strategy()) {
      case 'trunk':
        return [{ id: 'main', label: 'main', y: 60, color: 'var(--do-accent)' }];
      case 'gitflow':
        return [
          { id: 'main', label: 'main', y: 40, color: 'var(--do-accent)' },
          { id: 'develop', label: 'develop', y: 90, color: 'var(--do-cyan)' },
          { id: 'feature', label: 'feature/*', y: 140, color: 'var(--do-warning)' },
          { id: 'release', label: 'release/*', y: 190, color: 'var(--do-violet)' },
        ];
      case 'release':
        return [
          { id: 'main', label: 'main', y: 50, color: 'var(--do-accent)' },
          { id: 'release', label: 'release/2.4', y: 110, color: 'var(--do-violet)' },
        ];
    }
  });

  protected readonly viewH = computed(() => {
    const maxY = Math.max(...this.lanes().map((l) => l.y));
    return maxY + 50;
  });

  protected readonly commits = computed<Commit[]>(() => {
    const lanes = this.lanes();
    const laneY = (id: string) => lanes.find((l) => l.id === id)?.y ?? 60;

    switch (this.strategy()) {
      case 'trunk':
        return Array.from({ length: 9 }, (_, i) => ({
          id: `m${i}`,
          x: 60 + i * 65,
          y: laneY('main'),
          lane: 'main',
        }));
      case 'gitflow':
        return [
          { id: 'm0', x: 60, y: laneY('main'), lane: 'main' },
          { id: 'd0', x: 100, y: laneY('develop'), lane: 'develop' },
          { id: 'd1', x: 160, y: laneY('develop'), lane: 'develop' },
          { id: 'f0', x: 180, y: laneY('feature'), lane: 'feature' },
          { id: 'f1', x: 240, y: laneY('feature'), lane: 'feature' },
          { id: 'd2', x: 280, y: laneY('develop'), lane: 'develop' },
          { id: 'r0', x: 320, y: laneY('release'), lane: 'release' },
          { id: 'r1', x: 380, y: laneY('release'), lane: 'release' },
          { id: 'd3', x: 420, y: laneY('develop'), lane: 'develop' },
          { id: 'm1', x: 460, y: laneY('main'), lane: 'main' },
          { id: 'd4', x: 500, y: laneY('develop'), lane: 'develop' },
          { id: 'm2', x: 560, y: laneY('main'), lane: 'main' },
        ];
      case 'release':
        return [
          { id: 'm0', x: 60, y: laneY('main'), lane: 'main' },
          { id: 'm1', x: 130, y: laneY('main'), lane: 'main' },
          { id: 'r0', x: 170, y: laneY('release'), lane: 'release' },
          { id: 'r1', x: 230, y: laneY('release'), lane: 'release' },
          { id: 'm2', x: 260, y: laneY('main'), lane: 'main' },
          { id: 'r2', x: 300, y: laneY('release'), lane: 'release' },
          { id: 'm3', x: 380, y: laneY('main'), lane: 'main' },
          { id: 'r3', x: 420, y: laneY('release'), lane: 'release' },
          { id: 'm4', x: 500, y: laneY('main'), lane: 'main' },
          { id: 'm5', x: 570, y: laneY('main'), lane: 'main' },
        ];
    }
  });

  protected readonly edges = computed<Edge[]>(() => {
    const cs = this.commits();
    const lanes = this.lanes();
    const laneY = (id: string) => lanes.find((l) => l.id === id)?.y ?? 60;
    const byLane = new Map<string, Commit[]>();
    for (const c of cs) {
      byLane.set(c.lane, [...(byLane.get(c.lane) ?? []), c]);
    }
    const edges: Edge[] = [];
    for (const list of byLane.values()) {
      for (let i = 1; i < list.length; i++) {
        edges.push({ x1: list[i - 1].x, y1: list[i - 1].y, x2: list[i].x, y2: list[i].y });
      }
    }

    if (this.strategy() === 'gitflow') {
      edges.push({ x1: 100, y1: laneY('develop'), x2: 180, y2: laneY('feature') });
      edges.push({ x1: 240, y1: laneY('feature'), x2: 280, y2: laneY('develop') });
      edges.push({ x1: 280, y1: laneY('develop'), x2: 320, y2: laneY('release') });
      edges.push({ x1: 380, y1: laneY('release'), x2: 420, y2: laneY('develop') });
      edges.push({ x1: 380, y1: laneY('release'), x2: 460, y2: laneY('main') });
      edges.push({ x1: 500, y1: laneY('develop'), x2: 560, y2: laneY('main') });
    }
    if (this.strategy() === 'release') {
      edges.push({ x1: 130, y1: laneY('main'), x2: 170, y2: laneY('release') });
      edges.push({ x1: 230, y1: laneY('release'), x2: 260, y2: laneY('main') });
      edges.push({ x1: 260, y1: laneY('main'), x2: 300, y2: laneY('release') });
      edges.push({ x1: 380, y1: laneY('main'), x2: 420, y2: laneY('release') });
    }

    return edges;
  });

  protected setStrategy(s: Strategy): void {
    this.strategy.set(s);
  }

  protected growDivergence(): void {
    this.divergenceSteps.update((v) => Math.min(10, v + 1));
  }

  protected resetDivergence(): void {
    this.divergenceSteps.set(0);
  }
}
