import { Component, computed, signal } from '@angular/core';

type LayerKey =
  | 'input-validation'
  | 'authentication'
  | 'authorization'
  | 'rate-limiting'
  | 'secure-db-access'
  | 'network-controls'
  | 'monitoring'
  | 'incident-response';

interface Layer {
  key: LayerKey;
  index: number;
  label: string;
  desc: string;
}

const LAYERS: Layer[] = [
  { key: 'input-validation', index: 1, label: 'Input validation', desc: 'Rejects malformed or unexpected request payloads.' },
  { key: 'authentication', index: 2, label: 'Authentication', desc: 'Confirms the request carries a valid identity.' },
  { key: 'authorization', index: 3, label: 'Authorization', desc: 'Confirms that identity is allowed to do this action.' },
  { key: 'rate-limiting', index: 4, label: 'Rate limiting', desc: 'Caps how many requests one client can make.' },
  { key: 'secure-db-access', index: 5, label: 'Secure database access', desc: 'Parameterized queries prevent injection.' },
  { key: 'network-controls', index: 6, label: 'Network controls', desc: 'Firewalls and segmentation limit reachability.' },
  { key: 'monitoring', index: 7, label: 'Monitoring', desc: 'Detects abnormal patterns in traffic and behavior.' },
  { key: 'incident-response', index: 8, label: 'Incident response', desc: 'A human or automated process reacts once alerted.' },
];

/** The attack scenario used in this lab: an attacker with a stolen session token requests another user's data. */
const NORMAL_STOP: LayerKey = 'authorization';
/** If authorization is disabled, the resulting abuse pattern (many rapid unauthorized-shaped requests) still gets caught here. */
const FALLBACK_STOP: LayerKey = 'rate-limiting';

type RunState = 'idle' | 'running' | 'stopped';

@Component({
  selector: 'app-defense-in-depth',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="defense-in-depth">
      <div class="container">
        <p class="lab-index">29 &mdash; DEFENSE IN DEPTH</p>
        <h2 class="lab-title">No single layer has to be perfect &mdash; the stack has to be.</h2>
        <p class="lab-lede">
          A request travels down through eight independent controls before it reaches the database. Run the
          simulated attack, then disable the layer that normally stops it and run it again.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-danger" [class.is-active]="run() === 'running'" [disabled]="run() === 'running'" (click)="runAttack()">
              {{ run() === 'running' ? 'Request in flight…' : 'Send attack request' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          <p class="scenario-line">
            <strong>Scenario:</strong> a request carries a stolen but valid session token and asks for another
            user's account data. Layer {{ normalLayer().index }} ({{ normalLayer().label }}) is the control designed
            to catch exactly this.
          </p>

          <div class="stack" role="list" aria-label="Security control layers, request travels top to bottom">
            @for (l of layers; track l.key) {
              <div class="layer-row" role="listitem">
                <button
                  type="button"
                  class="lab-btn layer-toggle"
                  [class.is-active]="isOn(l.key)"
                  [attr.aria-pressed]="isOn(l.key)"
                  [attr.aria-label]="'Toggle ' + l.label + ' layer ' + (isOn(l.key) ? 'off' : 'on')"
                  (click)="toggleLayer(l.key)"
                >
                  {{ isOn(l.key) ? 'ON' : 'OFF' }}
                </button>
                <div
                  class="layer-band"
                  [class.layer-disabled]="!isOn(l.key)"
                  [class.layer-caught]="caughtAt() === l.key"
                  [class.layer-passed]="requestPastLayer(l.index)"
                >
                  <span class="layer-index mono">L{{ l.index }}</span>
                  <span class="layer-name">{{ l.label }}</span>
                  <span class="layer-desc">{{ l.desc }}</span>
                  @if (caughtAt() === l.key) {
                    <span class="layer-flag mono">BLOCKED HERE</span>
                  }
                </div>
              </div>
            }
            <div class="db-target mono" [class.db-hit]="run() === 'stopped' && caughtAt() === null">DATABASE</div>

            <div
              class="request-dot"
              [class.dot-hidden]="run() === 'idle'"
              [class.dot-blocked]="run() === 'stopped'"
              [style.top.px]="dotTopPx()"
            ></div>
          </div>

          @if (run() === 'stopped') {
            <p class="readout" [class.readout-fallback]="usedFallback()">
              @if (caughtAt(); as key) {
                <strong>Stopped at Layer {{ layerByKey(key).index }} &mdash; {{ layerByKey(key).label }}.</strong>
                @if (usedFallback()) {
                  Layer {{ normalLayer().index }} ({{ normalLayer().label }}) was disabled and let the request
                  through, but it never reached the database &mdash; the abuse pattern it created was still caught
                  one layer later.
                } @else {
                  This is the layer designed to catch this exact attack.
                }
              } @else {
                <strong>No layer caught it.</strong> Every control that could have stopped this attack is disabled.
              }
            </p>
          }

          <p class="lab-note">
            <strong>No single security control should be expected to stop every attack</strong> &mdash; defense in
            depth means multiple independent layers, so a single point of failure doesn't mean total compromise.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    :host {
      display: block;
      --trust: #4ade80;
      --suspicious: var(--accent);
      --attack: var(--danger);
      --compromised: #dc2626;
      --blocked: #4fd3e8;
      --c-client: var(--accent-2);
      --c-server: #60a5fa;
      --c-db: #a78bfa;
      --c-attacker: #f472b6;
    }

    .scenario-line { margin-top: 18px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; max-width: 620px; }
    .scenario-line strong { color: var(--text); }

    .stack { position: relative; margin-top: 24px; display: flex; flex-direction: column; gap: 8px; }

    .layer-row { display: grid; grid-template-columns: 56px 1fr; gap: 10px; align-items: stretch; }

    .layer-toggle { justify-content: center; padding: 0 10px; font-size: 0.6875rem; }

    .layer-band {
      position: relative;
      display: grid;
      grid-template-columns: auto auto 1fr auto;
      align-items: center;
      gap: 10px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      padding: 10px 14px;
      transition: opacity 0.2s ease, border-color 0.2s ease, background 0.2s ease;
    }
    .layer-disabled { opacity: 0.4; border-style: dashed; }
    .layer-caught { border-color: var(--blocked); background: color-mix(in srgb, var(--blocked) 14%, var(--surface)); box-shadow: 0 0 16px color-mix(in srgb, var(--blocked) 30%, transparent); }
    .layer-passed:not(.layer-caught) { border-color: var(--attack); }

    .layer-index { color: var(--text-faint); font-size: 0.75rem; }
    .layer-name { font-size: 0.875rem; font-weight: 600; color: var(--text); }
    .layer-desc { font-size: 0.75rem; color: var(--text-muted); grid-column: 3; }
    @media (max-width: 560px) { .layer-desc { display: none; } }
    .layer-flag { font-size: 0.6875rem; color: var(--blocked); font-weight: 700; letter-spacing: 0.06em; }

    .db-target {
      margin-top: 6px;
      margin-left: 66px;
      text-align: center;
      font-size: 0.75rem;
      letter-spacing: 0.1em;
      color: var(--c-db);
      border: 1px solid color-mix(in srgb, var(--c-db) 50%, var(--border-strong));
      border-radius: var(--radius-sm);
      padding: 8px;
    }
    .db-hit { border-color: var(--attack); color: var(--attack); box-shadow: 0 0 14px color-mix(in srgb, var(--attack) 40%, transparent); }

    .request-dot {
      position: absolute;
      left: 24px;
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: var(--attack);
      box-shadow: 0 0 10px color-mix(in srgb, var(--attack) 70%, transparent);
      transition: top 1.6s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease, box-shadow 0.3s ease;
      pointer-events: none;
    }
    .dot-hidden { opacity: 0; }
    .dot-blocked { background: var(--blocked); box-shadow: 0 0 10px color-mix(in srgb, var(--blocked) 70%, transparent); }

    .readout { margin-top: 18px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.65; max-width: 620px; padding: 12px 14px; border-left: 2px solid var(--blocked); background: var(--surface); border-radius: var(--radius-sm); }
    .readout strong { color: var(--text); }
    .readout-fallback { border-left-color: var(--trust); }
  `,
})
export class DefenseInDepth {
  protected readonly layers = LAYERS;

  private readonly disabled = signal<Set<LayerKey>>(new Set());
  protected readonly run = signal<RunState>('idle');
  protected readonly caughtAt = signal<LayerKey | null>(null);
  private readonly reachedIndex = signal(0);

  isOn(key: LayerKey): boolean {
    return !this.disabled().has(key);
  }

  toggleLayer(key: LayerKey): void {
    if (this.run() === 'running') return;
    const next = new Set(this.disabled());
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    this.disabled.set(next);
    this.run.set('idle');
    this.caughtAt.set(null);
    this.reachedIndex.set(0);
  }

  protected readonly normalLayer = computed(() => this.layerByKey(NORMAL_STOP));

  layerByKey(key: LayerKey): Layer {
    return this.layers.find((l) => l.key === key)!;
  }

  protected readonly usedFallback = computed(() => this.disabled().has(NORMAL_STOP) && this.caughtAt() === FALLBACK_STOP);

  private stopLayerForRun(): LayerKey | null {
    if (this.isOn(NORMAL_STOP)) return NORMAL_STOP;
    if (this.isOn(FALLBACK_STOP)) return FALLBACK_STOP;
    return null;
  }

  runAttack(): void {
    if (this.run() === 'running') return;
    this.run.set('running');
    this.caughtAt.set(null);
    this.reachedIndex.set(0);

    const stopKey = this.stopLayerForRun();
    const stopIndex = stopKey ? this.layerByKey(stopKey).index : this.layers.length;

    let i = 0;
    const step = () => {
      i += 1;
      this.reachedIndex.set(i);
      if (i >= stopIndex) {
        this.caughtAt.set(stopKey);
        this.run.set('stopped');
        return;
      }
      setTimeout(step, 260);
    };
    setTimeout(step, 260);
  }

  reset(): void {
    this.run.set('idle');
    this.caughtAt.set(null);
    this.reachedIndex.set(0);
  }

  requestPastLayer(index: number): boolean {
    return this.reachedIndex() >= index;
  }

  dotTopPx(): number {
    // Each layer-row is ~62px tall (band + gap) starting at row 0.
    const rowHeight = 62;
    const i = Math.max(this.reachedIndex(), 0);
    return 14 + i * rowHeight;
  }
}
