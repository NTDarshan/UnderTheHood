import { Component, computed, signal } from '@angular/core';

type NodeKey = 'client' | 'api' | 'cache' | 'db' | 'external' | 'queue';
type FailureKey = 'db-down' | 'external-slow' | 'server-crash' | 'queue-backlog';
type MitigationKey = 'timeouts' | 'retries' | 'circuit-breaker' | 'rate-limit' | 'backpressure' | 'bulkheads';

interface FailureDef {
  key: FailureKey;
  label: string;
  affected: NodeKey;
  symptom: string;
  rippleTo: NodeKey;
  rippleSymptom: string;
  helpedBy: MitigationKey[];
}

interface MitigationDef {
  key: MitigationKey;
  label: string;
  mechanism: string;
  caveat?: string;
}

const FAILURES: FailureDef[] = [
  {
    key: 'db-down',
    label: 'Database unavailable',
    affected: 'db',
    symptom: 'DB connections hang waiting for a server that never responds.',
    rippleTo: 'api',
    rippleSymptom: 'API request threads pile up waiting on the DB — the API itself starts refusing new work.',
    helpedBy: ['timeouts', 'circuit-breaker', 'bulkheads'],
  },
  {
    key: 'external-slow',
    label: 'External API slow',
    affected: 'external',
    symptom: 'Third-party API takes 10x longer to respond than usual.',
    rippleTo: 'api',
    rippleSymptom: 'API threads pile up waiting on the slow call — the API itself becomes slow to its own callers.',
    helpedBy: ['timeouts', 'circuit-breaker', 'bulkheads'],
  },
  {
    key: 'server-crash',
    label: 'One server crashes',
    affected: 'api',
    symptom: 'One API instance goes down mid-traffic, dropping any in-flight requests it held.',
    rippleTo: 'client',
    rippleSymptom: 'Clients routed to the crashed instance see failed requests until traffic is rerouted.',
    helpedBy: ['retries', 'rate-limit'],
  },
  {
    key: 'queue-backlog',
    label: 'Queue backlog grows',
    affected: 'queue',
    symptom: 'Producers keep enqueueing work faster than consumers can drain it.',
    rippleTo: 'api',
    rippleSymptom: 'The queue keeps growing unbounded — memory pressure risks taking the whole system down with it.',
    helpedBy: ['backpressure', 'rate-limit'],
  },
];

const MITIGATIONS: MitigationDef[] = [
  {
    key: 'timeouts',
    label: 'Timeouts',
    mechanism: 'Give up waiting on a slow call after a fixed time instead of hanging forever.',
  },
  {
    key: 'retries',
    label: 'Retries',
    mechanism: 'Automatically re-attempt a failed call, often against a different healthy instance.',
    caveat: 'Overused retries amplify load on an already-struggling dependency and can make an outage worse.',
  },
  {
    key: 'circuit-breaker',
    label: 'Circuit breakers',
    mechanism: 'After repeated failures, stop calling the failing dependency for a cooldown period and fail fast.',
  },
  {
    key: 'rate-limit',
    label: 'Rate limits',
    mechanism: 'Cap incoming request rate so the system is never overwhelmed further mid-incident.',
  },
  {
    key: 'backpressure',
    label: 'Backpressure',
    mechanism: 'Queue or reject excess work once capacity is reached, instead of accepting it unbounded.',
  },
  {
    key: 'bulkheads',
    label: 'Bulkheads',
    mechanism: 'Isolate a separate resource pool per dependency, so one failing dependency can\'t exhaust resources needed by others.',
  },
];

const NODE_LABELS: Record<NodeKey, string> = {
  client: 'CLIENT',
  api: 'API',
  cache: 'CACHE',
  db: 'DB',
  external: 'EXTERNAL',
  queue: 'QUEUE',
};

@Component({
  selector: 'app-resilience-patterns',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="resilience-patterns">
      <div class="container">
        <p class="lab-index">27 — RESILIENCE UNDER LOAD</p>
        <h2 class="lab-title">A fast system that falls over is still a broken system.</h2>
        <p class="lab-lede">
          The system below is under heavy traffic. Inject a failure, watch it ripple through the architecture,
          then toggle defensive mechanisms on to see how each one changes the outcome.
        </p>

        <div class="lab-panel">
          <p class="part-label mono">INJECT A FAILURE</p>
          <div class="lab-btn-row" role="group" aria-label="Inject failure">
            @for (f of failures; track f.key) {
              <button type="button" class="lab-btn lab-btn-danger" [class.is-active]="activeFailure()?.key === f.key"
                (click)="toggleFailure(f)">
                {{ f.label }}
              </button>
            }
          </div>

          <svg class="diagram" viewBox="0 0 640 200">
            <line x1="70" y1="100" x2="150" y2="100" class="flow-line" />
            <line x1="230" y1="100" x2="300" y2="60" class="flow-line" />
            <line x1="230" y1="100" x2="300" y2="140" class="flow-line" />
            <line x1="380" y1="60" x2="450" y2="60" class="flow-line" />
            <line x1="380" y1="140" x2="450" y2="140" class="flow-line" />

            @for (n of nodeKeys; track n) {
              <g [attr.transform]="'translate(' + nodePos[n].x + ',' + nodePos[n].y + ')'">
                <rect x="-38" y="-22" width="76" height="44" rx="8" class="node-rect" [class]="'node-' + nodeState(n)" />
                <text text-anchor="middle" y="5" class="node-text mono">{{ nodeLabels[n] }}</text>
              </g>
            }

            @if (breakerOpen()) {
              <text x="450" y="30" class="breaker-label mono" text-anchor="middle">BREAKER: OPEN</text>
            }
            @if (showRetryCounter()) {
              <text x="300" y="30" class="retry-label mono" text-anchor="middle">RETRY ×{{ retryCount() }}</text>
            }
          </svg>

          @if (activeFailure(); as f) {
            <div class="symptom-box">
              <p class="symptom-text">
                <strong>{{ f.label }}:</strong>
                {{ mitigationActiveFor(f) ? mitigatedText(f) : f.symptom + ' ' + f.rippleSymptom }}
              </p>
            </div>
          } @else {
            <p class="lab-note">System healthy. Pick a failure above to see how it propagates.</p>
          }

          <p class="part-label mono defenses-label">DEFENSIVE MECHANISMS</p>
          <div class="mitigations-grid">
            @for (m of mitigations; track m.key) {
              <button type="button" class="lab-btn mitigation-pill" [class.is-active]="isOn(m.key)"
                [attr.aria-pressed]="isOn(m.key)" (click)="toggleMitigation(m.key)">
                <span class="mitigation-name">{{ m.label }}</span>
                <span class="mitigation-desc">{{ m.mechanism }}</span>
                @if (m.caveat && isOn(m.key)) {
                  <span class="mitigation-caveat">{{ m.caveat }}</span>
                }
              </button>
            }
          </div>

          @if (bulkheadsOn()) {
            <div class="bulkhead-pools">
              <div class="pool-card">
                <p class="pool-label mono">DB POOL</p>
                <div class="pool-slots">
                  @for (s of [1,2,3,4]; track s) {
                    <span class="pool-slot"></span>
                  }
                </div>
              </div>
              <div class="pool-card">
                <p class="pool-label mono">EXTERNAL API POOL</p>
                <div class="pool-slots">
                  @for (s of [1,2,3,4]; track s) {
                    <span class="pool-slot"></span>
                  }
                </div>
              </div>
            </div>
            <p class="lab-note bulkhead-note">
              Two isolated pools instead of one shared pool — a stuck DB call can't starve the threads the
              external-API path needs, and vice versa.
            </p>
          } @else {
            <div class="bulkhead-pools">
              <div class="pool-card pool-card-shared">
                <p class="pool-label mono">SHARED RESOURCE POOL</p>
                <div class="pool-slots">
                  @for (s of [1,2,3,4,5,6,7,8]; track s) {
                    <span class="pool-slot" [class.pool-slot-crit]="activeFailure() && s > 5"></span>
                  }
                </div>
              </div>
            </div>
          }

          <p class="lab-note-warn lab-note closing-note">
            Performance engineering and reliability engineering intersect under real load — a system that's fast
            when healthy also needs to degrade gracefully when something breaks.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      --ok: #4ade80; --warn: var(--accent); --crit: var(--danger);
      --c-client: var(--accent-2); --c-compute: #60a5fa; --c-db: #a78bfa; --c-cache: #2dd4bf; --c-queue: #fbbf24;
      display: block;
    }

    .part-label { color: var(--text-faint); letter-spacing: 0.12em; font-size: 0.75rem; margin-bottom: 4px; margin-top: 24px; }
    .part-label:first-child { margin-top: 0; }

    .diagram { width: 100%; height: auto; aspect-ratio: 640 / 200; margin-top: 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .flow-line { stroke: var(--border-strong); stroke-width: 1.5; }

    .node-rect { fill: var(--surface-elevated); stroke: var(--border-strong); stroke-width: 1.5; transition: fill 0.25s ease, stroke 0.25s ease; }
    .node-text { fill: var(--text); font-size: 11px; font-weight: 600; letter-spacing: 0.04em; }

    .node-normal { fill: var(--surface-elevated); stroke: var(--border-strong); }
    .node-warn { fill: color-mix(in srgb, var(--warn) 22%, var(--surface-elevated)); stroke: var(--warn); }
    .node-crit { fill: color-mix(in srgb, var(--crit) 25%, var(--surface-elevated)); stroke: var(--crit); }
    .node-ok { fill: color-mix(in srgb, var(--ok) 18%, var(--surface-elevated)); stroke: var(--ok); }

    .breaker-label { fill: var(--crit); font-size: 10px; font-weight: 700; }
    .retry-label { fill: var(--c-queue); font-size: 10px; font-weight: 700; }

    .symptom-box { margin-top: 16px; padding: 14px 16px; background: var(--surface); border-left: 2px solid var(--crit); border-radius: var(--radius-sm); }
    .symptom-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }
    .symptom-text strong { color: var(--text); }

    .defenses-label { margin-top: 30px; }

    .mitigations-grid { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 14px; }
    @media (min-width: 640px) { .mitigations-grid { grid-template-columns: 1fr 1fr; } }
    @media (min-width: 960px) { .mitigations-grid { grid-template-columns: 1fr 1fr 1fr; } }

    .mitigation-pill { flex-direction: column; align-items: flex-start; text-align: left; gap: 4px; padding: 12px 14px; height: auto; white-space: normal; }
    .mitigation-name { font-size: 0.8125rem; font-weight: 700; }
    .mitigation-desc { font-family: var(--font-sans); font-size: 0.75rem; font-weight: 400; color: var(--text-muted); letter-spacing: normal; text-transform: none; }
    .mitigation-caveat { font-family: var(--font-sans); font-size: 0.6875rem; font-weight: 400; color: var(--warn); letter-spacing: normal; text-transform: none; margin-top: 2px; }

    .bulkhead-pools { display: grid; grid-template-columns: 1fr; gap: 12px; margin-top: 18px; }
    @media (min-width: 560px) { .bulkhead-pools { grid-template-columns: 1fr 1fr; } }
    .pool-card-shared { grid-column: 1 / -1; }
    @media (min-width: 560px) { .pool-card-shared { max-width: 320px; } }

    .pool-card { background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 12px 14px; }
    .pool-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.06em; margin-bottom: 8px; }
    .pool-slots { display: flex; gap: 6px; flex-wrap: wrap; }
    .pool-slot { width: 16px; height: 16px; border-radius: 3px; background: var(--c-compute); opacity: 0.85; }
    .pool-slot-crit { background: var(--crit); }

    .bulkhead-note { max-width: 560px; }
    .closing-note { margin-top: 24px; }
  `,
})
export class ResiliencePatterns {
  protected readonly failures = FAILURES;
  protected readonly mitigations = MITIGATIONS;
  protected readonly nodeLabels = NODE_LABELS;
  protected readonly nodeKeys: NodeKey[] = ['client', 'api', 'cache', 'db', 'external', 'queue'];

  protected readonly nodePos: Record<NodeKey, { x: number; y: number }> = {
    client: { x: 40, y: 100 },
    api: { x: 190, y: 100 },
    cache: { x: 340, y: 60 },
    db: { x: 340, y: 140 },
    external: { x: 490, y: 60 },
    queue: { x: 490, y: 140 },
  };

  protected readonly activeFailure = signal<FailureDef | null>(null);
  protected readonly activeMitigations = signal<Set<MitigationKey>>(new Set());
  protected readonly retryCount = signal(0);

  private retryTimer: ReturnType<typeof setInterval> | null = null;

  toggleFailure(f: FailureDef): void {
    const next = this.activeFailure()?.key === f.key ? null : f;
    this.activeFailure.set(next);
    this.resetRetryCounter();
    if (next && this.isOn('retries') && !this.breakerOpen()) {
      this.startRetryCounter();
    }
  }

  toggleMitigation(key: MitigationKey): void {
    const set = new Set(this.activeMitigations());
    if (set.has(key)) {
      set.delete(key);
    } else {
      set.add(key);
    }
    this.activeMitigations.set(set);

    this.resetRetryCounter();
    if (this.activeFailure() && this.isOn('retries') && !this.breakerOpen()) {
      this.startRetryCounter();
    }
  }

  private startRetryCounter(): void {
    this.retryTimer = setInterval(() => {
      this.retryCount.update((c) => (c >= 5 ? 1 : c + 1));
    }, 900);
  }

  private resetRetryCounter(): void {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
    this.retryCount.set(0);
  }

  isOn(key: MitigationKey): boolean {
    return this.activeMitigations().has(key);
  }

  protected readonly bulkheadsOn = computed(() => this.isOn('bulkheads'));

  protected readonly showRetryCounter = computed(
    () => !!this.activeFailure() && this.isOn('retries') && !this.breakerOpen()
  );

  protected readonly breakerOpen = computed(() => {
    const f = this.activeFailure();
    return !!f && this.isOn('circuit-breaker') && (f.key === 'db-down' || f.key === 'external-slow');
  });

  mitigationActiveFor(f: FailureDef): boolean {
    return f.helpedBy.some((m) => this.isOn(m));
  }

  mitigatedText(f: FailureDef): string {
    const applied = f.helpedBy.filter((m) => this.isOn(m));
    if (applied.length === 0) return f.symptom + ' ' + f.rippleSymptom;

    const parts: string[] = [];
    if (applied.includes('circuit-breaker') && (f.key === 'db-down' || f.key === 'external-slow')) {
      parts.push('The circuit breaker tripped open after repeated failures — the API now fails fast instead of piling up threads waiting.');
    } else if (applied.includes('timeouts') && (f.key === 'db-down' || f.key === 'external-slow')) {
      parts.push('Timeouts cap how long the API waits, so threads free up instead of piling up indefinitely.');
    }
    if (applied.includes('bulkheads') && (f.key === 'db-down' || f.key === 'external-slow')) {
      parts.push('Bulkheads keep this failure contained to its own resource pool — other request paths keep working normally.');
    }
    if (applied.includes('retries') && f.key === 'server-crash') {
      parts.push('Retries reroute the failed request to a healthy replica, usually succeeding on the second attempt.');
    }
    if (applied.includes('rate-limit') && f.key === 'server-crash') {
      parts.push('Rate limiting keeps the remaining healthy servers from being overwhelmed by traffic meant for the crashed one.');
    }
    if (applied.includes('backpressure') && f.key === 'queue-backlog') {
      parts.push('Backpressure caps the queue and starts rejecting excess work instead of growing unbounded.');
    }
    if (applied.includes('rate-limit') && f.key === 'queue-backlog') {
      parts.push('Rate limiting slows the producers, so the queue drains instead of growing.');
    }
    return parts.length > 0 ? parts.join(' ') : f.symptom + ' ' + f.rippleSymptom;
  }

  nodeState(n: NodeKey): 'normal' | 'warn' | 'crit' | 'ok' {
    const f = this.activeFailure();
    if (!f) return 'normal';

    const mitigated = this.mitigationActiveFor(f);

    if (n === f.affected) {
      if (f.key === 'external-slow' && mitigated && (this.isOn('circuit-breaker') || this.isOn('timeouts'))) {
        return 'warn';
      }
      return 'crit';
    }
    if (n === f.rippleTo) {
      if (mitigated) return 'ok';
      return 'warn';
    }

    if (n === 'queue' && f.key === 'queue-backlog') return 'crit';
    return 'normal';
  }
}
