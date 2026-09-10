import { Component, OnDestroy, signal } from '@angular/core';

type ContainerStatus = 'idle' | 'building' | 'starting' | 'healthy';

interface Packet {
  id: number;
}

@Component({
  selector: 'app-running-a-container',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section do-scene" id="do-running-a-container">
      <div class="container">
        <p class="lab-index mono">5 — RUNNING A CONTAINER</p>
        <h2 class="lab-title">Container &rarr; process &rarr; port &rarr; network</h2>
        <p class="lab-lede">
          Starting a container means launching a process inside it and mapping a host port to the port that process
          listens on. Traffic to <code class="mono">localhost:{{ hostPort }}</code> gets forwarded straight
          into the container's network namespace.
        </p>

        <div class="lab-panel">
          <div class="run-config mono">
            docker run -p {{ hostPort }}:{{ containerPort }} -e NODE_ENV=production --health-cmd="curl -f localhost:{{ containerPort }}/health" myapp:latest
          </div>

          <div class="topology">
            <div class="node node-client">
              <span class="node-label mono">CLIENT</span>
              <span class="node-sub mono">localhost:{{ hostPort }}</span>
            </div>
            <span class="lab-flow-arrow" [class.is-live]="trafficRunning()">&rarr;</span>
            <div class="node node-portmap">
              <span class="node-label mono">PORT MAPPING</span>
              <span class="node-sub mono">host {{ hostPort }} &rarr; container {{ containerPort }}</span>
            </div>
            <span class="lab-flow-arrow" [class.is-live]="trafficRunning()">&rarr;</span>
            <div class="node node-container" [attr.data-status]="status()">
              <span class="node-label mono">CONTAINER PROCESS</span>
              <span class="status-row">
                <span class="pulse-dot" [attr.data-status]="status()" aria-hidden="true"></span>
                <span class="node-sub mono">{{ statusLabel() }}</span>
              </span>
            </div>
          </div>

          @if (trafficRunning()) {
            <div class="packet-lane" aria-hidden="true">
              @for (p of packets(); track p.id) {
                <span class="packet mono">•</span>
              }
            </div>
          }

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="startContainer()" [disabled]="status() !== 'idle'">
              START CONTAINER
            </button>
            <button type="button" class="lab-btn" (click)="sendTraffic()" [disabled]="status() !== 'healthy'">
              SEND REQUEST TRAFFIC
            </button>
            <button type="button" class="lab-btn" (click)="reset()" [disabled]="status() === 'idle'">RESET</button>
          </div>
          <p class="log-line mono" aria-live="polite">{{ logLine() }}</p>
        </div>

        <div class="concepts-row">
          <div class="concept-card">
            <p class="concept-title mono">HOST PORT vs CONTAINER PORT</p>
            <p class="concept-body">The container's process only knows about its own port ({{ containerPort }}).
              The host port ({{ hostPort }}) is where the outside world connects — Docker forwards between them.</p>
          </div>
          <div class="concept-card">
            <p class="concept-title mono">ENVIRONMENT VARIABLES</p>
            <p class="concept-body">Config like <code class="mono">NODE_ENV</code> or database URLs is injected at
              start time with <code class="mono">-e</code> — the same image behaves differently per environment.</p>
          </div>
          <div class="concept-card">
            <p class="concept-title mono">HEALTH CHECKS</p>
            <p class="concept-body">A health check command runs inside the container periodically. Only once it
              passes does the container count as ready to receive traffic.</p>
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

    .run-config { padding: 12px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.75rem; color: var(--text-muted); overflow-x: auto; white-space: nowrap; margin-bottom: 20px; }

    .topology { display: flex; align-items: stretch; gap: 12px; flex-wrap: wrap; }
    .node { flex: 1; min-width: 150px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 20px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); text-align: center; transition: border-color 0.3s ease, box-shadow 0.3s ease; }
    .node-client { border-color: var(--do-cyan); }
    .node-container[data-status='building'] { border-color: var(--do-warning); }
    .node-container[data-status='starting'] { border-color: var(--do-accent); box-shadow: 0 0 0 1px color-mix(in srgb, var(--do-accent) 25%, transparent); }
    .node-container[data-status='healthy'] { border-color: var(--do-success); box-shadow: 0 0 0 1px color-mix(in srgb, var(--do-success) 25%, transparent); }
    .node-label { font-size: 0.8125rem; color: var(--text); letter-spacing: 0.06em; font-weight: 700; }
    .node-sub { font-size: 0.6875rem; color: var(--text-faint); }

    .status-row { display: inline-flex; align-items: center; gap: 6px; }
    .pulse-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--do-pending); }
    .pulse-dot[data-status='building'] { background: var(--do-warning); animation: pulse 1.2s ease-in-out infinite; }
    .pulse-dot[data-status='starting'] { background: var(--do-accent); animation: pulse 0.8s ease-in-out infinite; }
    .pulse-dot[data-status='healthy'] { background: var(--do-success); box-shadow: 0 0 8px color-mix(in srgb, var(--do-success) 60%, transparent); animation: pulse 1.6s ease-in-out infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.3); } }

    .lab-flow-arrow.is-live { color: var(--do-accent); animation: arrow-flash 0.6s ease-in-out infinite; }
    @keyframes arrow-flash { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }

    .packet-lane { display: flex; gap: 10px; height: 20px; align-items: center; padding-left: 20%; margin-top: 8px; overflow: hidden; }
    .packet { color: var(--do-accent); animation: packet-flow 0.9s linear infinite; }
    .packet:nth-child(2) { animation-delay: 0.2s; }
    .packet:nth-child(3) { animation-delay: 0.4s; }
    @keyframes packet-flow { from { transform: translateX(0); opacity: 1; } to { transform: translateX(220px); opacity: 0; } }

    .log-line { margin-top: 14px; font-size: 0.75rem; color: var(--text-faint); min-height: 1.2em; }

    .concepts-row { margin-top: 24px; display: grid; grid-template-columns: 1fr; gap: 14px; }
    @media (min-width: 720px) { .concepts-row { grid-template-columns: repeat(3, 1fr); } }
    .concept-card { padding: 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .concept-title { font-size: 0.75rem; color: var(--do-cyan); letter-spacing: 0.06em; margin: 0 0 8px; }
    .concept-body { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; margin: 0; }

    @media (prefers-reduced-motion: reduce) {
      .pulse-dot, .lab-flow-arrow.is-live, .packet { animation: none; }
    }
  `,
})
export class RunningAContainer implements OnDestroy {
  protected readonly hostPort = 8080;
  protected readonly containerPort = 3000;

  protected readonly status = signal<ContainerStatus>('idle');
  protected readonly trafficRunning = signal(false);
  protected readonly packets = signal<Packet[]>([{ id: 0 }, { id: 1 }, { id: 2 }]);
  protected readonly logLine = signal('Click START CONTAINER to launch the process.');

  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    this.timers.forEach(clearTimeout);
  }

  protected statusLabel(): string {
    switch (this.status()) {
      case 'building': return 'BUILDING…';
      case 'starting': return 'STARTING…';
      case 'healthy': return 'HEALTHY — ACCEPTING TRAFFIC';
      default: return 'NOT RUNNING';
    }
  }

  protected startContainer(): void {
    if (this.status() !== 'idle') return;
    this.status.set('building');
    this.logLine.set('Pulling image and creating the container…');

    this.timers.push(setTimeout(() => {
      this.status.set('starting');
      this.logLine.set('Process starting inside the container, port ' + this.containerPort + ' mapped to host ' + this.hostPort + '…');
    }, 900));

    this.timers.push(setTimeout(() => {
      this.status.set('healthy');
      this.logLine.set('Health check passed — the container is ready to receive traffic.');
    }, 1900));
  }

  protected sendTraffic(): void {
    if (this.status() !== 'healthy') return;
    this.trafficRunning.set(true);
    this.logLine.set('Requests flowing into localhost:' + this.hostPort + ', forwarded to the container process…');
    this.timers.push(setTimeout(() => {
      this.trafficRunning.set(false);
      this.logLine.set('Traffic settled. The container is still healthy and listening.');
    }, 2400));
  }

  protected reset(): void {
    this.status.set('idle');
    this.trafficRunning.set(false);
    this.logLine.set('Click START CONTAINER to launch the process.');
  }
}
