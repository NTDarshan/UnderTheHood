import { Component, computed, signal } from '@angular/core';

interface JourneyStep {
  label: string;
  detail: string;
  category: 'network' | 'http' | 'application' | 'data';
  ms: number;
}

const STEPS: JourneyStep[] = [
  { label: 'Browser', detail: 'User clicks a link — the browser prepares to make a request.', category: 'application', ms: 0 },
  { label: 'DNS / connection setup', detail: 'The hostname resolves to an IP address via DNS (the internet’s directory service), and a connection begins.', category: 'network', ms: 8 },
  { label: 'TLS handshake', detail: 'Certificate exchanged, keys negotiated — the channel is now encrypted.', category: 'network', ms: 42 },
  { label: 'HTTP request + headers', detail: 'GET /products travels through the encrypted connection.', category: 'http', ms: 61 },
  { label: 'Server routing', detail: 'The server matches the path and method to a handler.', category: 'application', ms: 78 },
  { label: 'Application processing', detail: 'Business logic runs — validation, auth, orchestration.', category: 'application', ms: 94 },
  { label: 'Cache check', detail: 'Is a fresh representation already stored? Miss — continue.', category: 'data', ms: 108 },
  { label: 'Database', detail: 'A query runs against persistent storage for the product rows.', category: 'data', ms: 131 },
  { label: 'HTTP response', detail: '200 OK, with headers describing what is being sent back.', category: 'http', ms: 158 },
  { label: 'Compression', detail: 'The body is compressed before it leaves the server.', category: 'http', ms: 163 },
  { label: 'Network', detail: 'Encrypted bytes travel back across the internet.', category: 'network', ms: 190 },
  { label: 'Browser cache', detail: 'The response is evaluated against caching rules for reuse.', category: 'application', ms: 205 },
  { label: 'Rendered data', detail: 'The browser parses the response and paints it on screen.', category: 'application', ms: 214 },
];

const CATEGORY_LABEL: Record<JourneyStep['category'], string> = {
  network: 'NETWORK',
  http: 'HTTP',
  application: 'APPLICATION',
  data: 'DATA',
};

@Component({
  selector: 'app-request-journey',
  standalone: true,
  template: `
    <section class="lab-section journey-section" id="journey">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container">
        <p class="lab-index">HTTP / 17 — THE FULL JOURNEY</p>
        <h2 class="lab-title">Follow one request under the hood.</h2>
        <p class="lab-lede">Everything on this page, in one continuous pass — from browser click to rendered pixels.</p>

        <div class="journey-controls">
          <div class="lab-btn-row">
            <button type="button" class="btn btn-primary" (click)="play()" [disabled]="playing()">
              {{ playing() ? 'Following the request…' : 'GET /products' }}
            </button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>
          <p class="elapsed mono">
            @if (lit() > 0) {
              t+{{ elapsedMs() }}ms
              @if (lit() === steps.length) {
                · request complete
              }
            } @else {
              awaiting request
            }
          </p>
        </div>

        <div class="journey-panel">
          <div class="journey-rail" aria-hidden="true">
            <div class="rail-line"></div>
            <div class="rail-fill" [style.height.%]="fillPercent()"></div>
            <div class="rail-pulse" [class.is-active]="playing()" [style.top.%]="fillPercent()"></div>
          </div>

          <ol class="journey-track">
            @for (s of steps; track s.label; let i = $index) {
              <li class="journey-step" [class.is-lit]="lit() > i" [class.is-current]="lit() === i + 1 && playing()" [class]="'cat-' + s.category">
                <span class="journey-dot" aria-hidden="true"></span>
                <div class="journey-body">
                  <div class="journey-heading">
                    <span class="journey-cat mono">{{ categoryLabel(s.category) }}</span>
                    <span class="journey-label">{{ s.label }}</span>
                  </div>
                  <p class="journey-detail">{{ s.detail }}</p>
                </div>
              </li>
            }
          </ol>
        </div>

        <div class="legend mono">
          <span class="legend-item cat-network">NETWORK</span>
          <span class="legend-item cat-http">HTTP</span>
          <span class="legend-item cat-application">APPLICATION</span>
          <span class="legend-item cat-data">DATA</span>
        </div>
        <p class="lab-note">Timings are illustrative only, to convey relative ordering — not a real network trace.</p>
      </div>
    </section>
  `,
  styles: `
    .journey-section {
      border-top-color: var(--accent-dim);
      position: relative;
      overflow: hidden;
    }

    .journey-controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 20px;
      margin-top: 28px;
    }

    .elapsed {
      font-size: 0.75rem;
      color: var(--accent-2);
      min-width: 12ch;
    }

    .journey-panel {
      position: relative;
      margin-top: 32px;
      display: grid;
      grid-template-columns: 22px 1fr;
      gap: 0 4px;
    }

    .journey-rail {
      position: relative;
      width: 22px;
    }

    .rail-line {
      position: absolute;
      left: 50%;
      top: 6px;
      bottom: 6px;
      width: 2px;
      transform: translateX(-50%);
      background: var(--border-strong);
    }

    .rail-fill {
      position: absolute;
      left: 50%;
      top: 6px;
      width: 2px;
      transform: translateX(-50%);
      background: linear-gradient(var(--accent-2), var(--accent));
      transition: height 0.24s linear;
      box-shadow: 0 0 8px var(--glow-accent);
    }

    .rail-pulse {
      position: absolute;
      left: 50%;
      width: 11px;
      height: 11px;
      border-radius: 50%;
      background: var(--accent);
      transform: translate(-50%, -50%);
      box-shadow: 0 0 12px 4px var(--glow-accent);
      opacity: 0;
      transition: top 0.24s linear, opacity 0.2s ease;
    }

    .rail-pulse.is-active {
      opacity: 1;
      animation: pulse-node 1s ease-in-out infinite;
    }

    .journey-track {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .journey-step {
      position: relative;
      display: flex;
      align-items: flex-start;
      gap: 14px;
      padding: 12px 16px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      opacity: 0.4;
      transform: translateX(-6px);
      transition: opacity 0.3s ease, transform 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease;
    }

    .journey-dot {
      display: none;
    }

    .journey-step.is-lit {
      opacity: 1;
      transform: translateX(0);
    }

    .journey-step.is-current {
      border-color: var(--accent);
      box-shadow: 0 0 18px var(--glow-accent);
    }

    .cat-network.is-lit { border-left: 3px solid var(--accent-2); }
    .cat-http.is-lit { border-left: 3px solid var(--accent); }
    .cat-application.is-lit { border-left: 3px solid #b48cff; }
    .cat-data.is-lit { border-left: 3px solid #6fe38a; }

    .journey-body {
      flex: 1;
      min-width: 0;
    }

    .journey-heading {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: 10px;
    }

    .journey-cat {
      width: 90px;
      flex-shrink: 0;
      font-size: 0.625rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
    }

    .journey-label {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--text);
    }

    .journey-detail {
      margin-top: 4px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.5;
      max-width: 520px;
    }

    .legend {
      margin-top: 28px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .legend-item {
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.625rem;
      letter-spacing: 0.06em;
      border: 1px solid var(--border-strong);
      color: var(--text-faint);
    }

    .legend-item.cat-network { border-color: var(--accent-2-dim); color: var(--accent-2); }
    .legend-item.cat-http { border-color: var(--accent-dim); color: var(--accent); }
    .legend-item.cat-application { border-color: #4a3a70; color: #b48cff; }
    .legend-item.cat-data { border-color: #2a5c37; color: #6fe38a; }

    @media (max-width: 560px) {
      .journey-panel {
        grid-template-columns: 14px 1fr;
      }
      .journey-cat {
        width: auto;
      }
    }
  `,
})
export class RequestJourney {
  protected readonly steps = STEPS;
  protected readonly lit = signal(0);
  protected readonly playing = signal(false);

  protected readonly fillPercent = computed(() => {
    const total = this.steps.length;
    const i = this.lit();
    if (i === 0) return 0;
    return (Math.min(i, total) / total) * 100;
  });

  protected readonly elapsedMs = computed(() => {
    const i = this.lit();
    if (i === 0) return 0;
    return this.steps[Math.min(i, this.steps.length) - 1].ms;
  });

  categoryLabel(c: JourneyStep['category']): string {
    return CATEGORY_LABEL[c];
  }

  play(): void {
    this.reset();
    this.playing.set(true);
    let i = 0;
    const tick = () => {
      i += 1;
      this.lit.set(i);
      if (i < this.steps.length) {
        setTimeout(tick, 320);
      } else {
        this.playing.set(false);
      }
    };
    setTimeout(tick, 200);
  }

  reset(): void {
    this.lit.set(0);
    this.playing.set(false);
  }
}
