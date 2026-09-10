import { Component, signal } from '@angular/core';

interface FsLayer {
  name: string;
  kind: 'ro' | 'rw';
}

const FS_LAYERS: FsLayer[] = [
  { name: 'Container layer (writable)', kind: 'rw' },
  { name: 'Application layer', kind: 'ro' },
  { name: 'Dependencies layer', kind: 'ro' },
  { name: 'Base image layer', kind: 'ro' },
];

@Component({
  selector: 'app-container-internals',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-container-internals">
      <div class="container">
        <p class="lab-index mono">2 — CONTAINER INTERNALS</p>
        <h2 class="lab-title">A container is just a very isolated process</h2>
        <p class="lab-lede">
          There's no separate "container kernel." A container is a normal process on the host, made to believe it
          has the machine to itself using a few Linux kernel features. Toggle below to see what's actually going on.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row" role="group" aria-label="Detail level">
            <button type="button" class="lab-btn" [class.is-active]="!expanded()" (click)="expanded.set(false)">Simple view</button>
            <button type="button" class="lab-btn" [class.is-active]="expanded()" (click)="expanded.set(true)">Under the hood</button>
          </div>

          @if (!expanded()) {
            <div class="simple-view">
              <div class="simple-box">
                <span class="mono simple-label">CONTAINER</span>
                <p class="simple-desc">Your application, running like it owns the machine.</p>
              </div>
            </div>
          } @else {
            <div class="chain">
              <div class="chain-node chain-container">
                <span class="mono chain-label">CONTAINER</span>
                <p class="chain-desc">The unit you run and ship.</p>
              </div>
              <span class="chain-arrow mono" aria-hidden="true">&darr;</span>
              <div class="chain-node chain-process">
                <span class="mono chain-label">PROCESS</span>
                <p class="chain-desc">On the host, it's an ordinary OS process — same kernel as everything else.</p>
              </div>
              <span class="chain-arrow mono" aria-hidden="true">&darr;</span>
              <div class="chain-node chain-namespace">
                <span class="mono chain-label">NAMESPACES</span>
                <p class="chain-desc">Control <strong>what the process can see</strong>: its own PID tree, network
                  interfaces, mount points, hostname. It can't see other containers' processes or files.</p>
              </div>
              <span class="chain-arrow mono" aria-hidden="true">&darr;</span>
              <div class="chain-node chain-cgroup">
                <span class="mono chain-label">CGROUPS</span>
                <p class="chain-desc">Control <strong>how much the process can use</strong>: CPU shares, memory
                  limits, I/O bandwidth. This is accounting and limiting, not visibility.</p>
              </div>
              <span class="chain-arrow mono" aria-hidden="true">&darr;</span>
              <div class="chain-node chain-fs">
                <span class="mono chain-label">LAYERED FILESYSTEM</span>
                <p class="chain-desc">The root filesystem the process sees is stacked read-only layers plus one
                  thin writable layer on top.</p>
                <div class="fs-stack">
                  @for (l of fsLayers; track l.name) {
                    <div class="fs-layer" [class.is-rw]="l.kind === 'rw'">
                      <span class="mono">{{ l.name }}</span>
                    </div>
                  }
                </div>
              </div>
            </div>

            <div class="concepts-row">
              <div class="concept-card">
                <p class="concept-title mono">NAMESPACES = ISOLATION</p>
                <p class="concept-body">PID, network, mount, UTS, IPC namespaces each hide a slice of the host from
                  the process. Two containers can both think they're "PID 1."</p>
              </div>
              <div class="concept-card">
                <p class="concept-title mono">CGROUPS = LIMITS</p>
                <p class="concept-body">Cap CPU and memory per container so one noisy neighbor can't starve the
                  others on a shared host.</p>
              </div>
              <div class="concept-card">
                <p class="concept-title mono">SHARED KERNEL</p>
                <p class="concept-body">Every container on a host shares one kernel. That's why containers start in
                  milliseconds — and why they are not lightweight VMs.</p>
              </div>
            </div>
          }
        </div>

        <p class="lab-note">
          A virtual machine virtualizes hardware and boots its own kernel. A container shares the host kernel and is
          isolated by namespaces and limited by cgroups — much cheaper, but with a smaller isolation boundary.
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
      --do-pending: #64748b;
    }

    .simple-view { display: flex; justify-content: center; padding: 24px 0; }
    .simple-box {
      border: 1px solid var(--do-accent);
      border-radius: var(--radius-lg);
      padding: 32px 40px;
      background: color-mix(in srgb, var(--do-accent) 6%, var(--surface));
      text-align: center;
      max-width: 340px;
    }
    .simple-label { font-size: 0.8125rem; letter-spacing: 0.1em; color: var(--do-accent); }
    .simple-desc { margin-top: 10px; font-size: 0.8125rem; color: var(--text-muted); }

    .chain { display: flex; flex-direction: column; align-items: center; gap: 4px; padding-top: 12px; }
    .chain-node {
      width: 100%;
      max-width: 480px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 18px;
      background: var(--surface);
    }
    .chain-container { border-color: var(--do-accent); }
    .chain-namespace { border-color: var(--do-cyan); }
    .chain-cgroup { border-color: var(--do-violet); }
    .chain-fs { border-color: var(--do-warning); }
    .chain-label { font-size: 0.75rem; letter-spacing: 0.08em; color: var(--text); }
    .chain-desc { margin: 6px 0 0; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }
    .chain-arrow { color: var(--text-faint); font-size: 0.875rem; }

    .fs-stack { margin-top: 12px; display: flex; flex-direction: column; gap: 4px; }
    .fs-layer { padding: 6px 10px; border-radius: var(--radius-sm); background: var(--surface-elevated); border: 1px solid var(--border); font-size: 0.6875rem; color: var(--text-faint); }
    .fs-layer.is-rw { color: var(--do-warning); border-color: color-mix(in srgb, var(--do-warning) 50%, transparent); }

    .concepts-row { display: grid; grid-template-columns: 1fr; gap: 14px; padding-top: 20px; margin-top: 20px; border-top: 1px solid var(--border); }
    @media (min-width: 720px) { .concepts-row { grid-template-columns: repeat(3, 1fr); } }
    .concept-card { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .concept-title { font-size: 0.75rem; color: var(--do-cyan); letter-spacing: 0.06em; margin: 0 0 8px; }
    .concept-body { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; margin: 0; }
  `,
})
export class ContainerInternals {
  protected readonly expanded = signal(false);
  protected readonly fsLayers = FS_LAYERS;
}
