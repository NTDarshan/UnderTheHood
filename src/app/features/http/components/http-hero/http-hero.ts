import { AfterViewInit, Component, ElementRef, computed, effect, signal, viewChild } from '@angular/core';
import gsap from 'gsap';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';
import { TermTip } from '../../../../shared/components/term-tip/term-tip';

type HeroPhase = 'idle' | 'dns' | 'building' | 'traveling-out' | 'processing' | 'traveling-back' | 'done' | 'error';
type ExplainMode = 'simple' | 'technical';

interface ServerStage {
  label: string;
  detail: string;
}

const SERVER_STAGES: ServerStage[] = [
  { label: 'Routing', detail: 'Match GET /api/users to a handler' },
  { label: 'Auth check', detail: 'Verify the request is allowed' },
  { label: 'Handler', detail: 'Run the application logic' },
  { label: 'Database', detail: 'Query rows for the response' },
  { label: 'Serialize', detail: 'Turn data into JSON bytes' },
];

const RESULT_ROWS = ['ada@example.com', 'grace@example.com', 'alan@example.com'];

const CAPTIONS: Record<HeroPhase, { simple: string; technical: string }> = {
  idle: {
    simple: 'Press "Load Users" below and watch what really happens, step by step.',
    technical: 'Idle — no request in flight yet.',
  },
  dns: {
    simple: "Your browser looks up the server's address — like checking a phone book before you can call someone.",
    technical: 'DNS resolves the hostname to an IP address before any connection opens.',
  },
  building: {
    simple: "Your browser writes down exactly what it wants, like filling out an order slip.",
    technical: 'The client constructs the request line, headers, and (optionally) a body.',
  },
  'traveling-out': {
    simple: 'Your request zooms across the internet, hopping between routers, to reach the server.',
    technical: 'The request travels over the established connection to the server.',
  },
  processing: {
    simple: "The server reads your request and works through it, step by step, to prepare an answer.",
    technical: 'The server routes, authenticates, runs handler logic, and queries data before building a response.',
  },
  'traveling-back': {
    simple: "The server's answer travels all the way back across the internet to your browser.",
    technical: 'The response — status line, headers, and body — travels back over the same connection.',
  },
  done: {
    simple: 'Your browser received the answer and shows it to you. That whole round trip — that\'s HTTP.',
    technical: 'Response received (200 OK). The browser parses and renders the payload.',
  },
  error: {
    simple: "Something went wrong on the server's side, so it sends back a \"sorry, I couldn't do that\" answer instead.",
    technical: 'The server returned 500 Internal Server Error — request received, but processing failed.',
  },
};

@Component({
  selector: 'app-http-hero',
  standalone: true,
  imports: [ExplainSimply, TermTip],
  template: `
    <section class="hero" id="foundations">
      <div class="bg-grid" aria-hidden="true"></div>
      <div class="container hero-inner">
        <p class="lab-index">HTTP / 001 — CORE BACKEND ENGINEERING</p>
        <h1 class="hero-title">What actually happens when you make an HTTP request?</h1>
        <p class="hero-lede">
          HTTP looks simple from the outside — a request goes in and a response comes back. Underneath
          that abstraction are messages, methods, headers, status codes, caching, negotiation,
          connections, security and multiple protocol versions.
        </p>
        <p class="hero-stakes">
          This exact exchange — client asks, server answers — is what happens every time you load a page,
          tap a button in an app, or an API call fires in the background. Everything else on this page is a
          detail of how that exchange actually works.
        </p>

        <app-explain-simply>
          Think of it like ordering at a counter. You (the <strong>client</strong>) ask for something specific —
          "a burger, no onions." The person behind the counter (the <strong>server</strong>) makes it and hands it
          back. Your order is the request; what you get handed back is the response.
        </app-explain-simply>

        <ul class="vocab-strip mono" aria-label="Key vocabulary used on this page">
          <li><app-term def="Whatever starts an HTTP exchange by sending a request — a browser tab, a mobile app, curl, another server.">Client</app-term></li>
          <li><app-term def="A program that listens for HTTP requests and sends back responses — could be one process or hundreds behind a load balancer.">Server</app-term></li>
          <li><app-term def="The message a client sends: a method, a path, headers, and optionally a body.">Request</app-term></li>
          <li><app-term def="The message a server sends back: a status code, headers, and optionally a body.">Response</app-term></li>
          <li><app-term def="A three-digit number in every response summarising the outcome — 200 means success, 404 means not found, 500 means the server failed.">Status Code</app-term></li>
        </ul>

        <div class="mode-row" role="group" aria-label="Explanation style">
          <span class="mode-label mono">NARRATOR:</span>
          <button type="button" class="mode-toggle" [class.is-on]="explainMode() === 'simple'" (click)="explainMode.set('simple')">
            🧒 New to this
          </button>
          <button type="button" class="mode-toggle" [class.is-on]="explainMode() === 'technical'" (click)="explainMode.set('technical')">
            🧑‍💻 I know the basics
          </button>
        </div>

        <div class="sim-row" role="group" aria-label="Simulation options">
          <span class="sim-label mono">SIMULATE:</span>
          <button type="button" class="sim-toggle" [class.is-on]="simDns()" [disabled]="!canSend()" (click)="simDns.set(!simDns())">
            Cold DNS lookup
          </button>
          <button type="button" class="sim-toggle" [class.is-on]="simSlow()" [disabled]="!canSend()" (click)="simSlow.set(!simSlow())">
            Slow network
          </button>
          <button type="button" class="sim-toggle sim-toggle-danger" [class.is-on]="simError()" [disabled]="!canSend()" (click)="simError.set(!simError())">
            Server error (500)
          </button>
        </div>

        <div class="hero-actions">
          <button type="button" class="btn btn-primary" (click)="send()" [disabled]="!canSend()">
            {{ canSend() ? 'Send Request' : 'Sending…' }}
          </button>
          <button type="button" class="btn btn-ghost" (click)="inspect.set(!inspect())" [attr.aria-pressed]="inspect()">
            {{ inspect() ? 'Hide Details' : 'Inspect Request' }}
          </button>
        </div>

        <div class="narrator-bar" aria-live="polite">
          <span class="narrator-icon" aria-hidden="true">{{ explainMode() === 'simple' ? '💬' : '⚙️' }}</span>
          <p #captionEl class="narrator-text">{{ captionText() }}</p>
        </div>

        <div class="browser-chrome" [class.is-shake]="errorFlash()">
          <div class="browser-topbar">
            <span class="tl-dot tl-red" aria-hidden="true"></span>
            <span class="tl-dot tl-yellow" aria-hidden="true"></span>
            <span class="tl-dot tl-green" aria-hidden="true"></span>
            <div class="browser-urlbar mono">
              <span class="lock" [class.is-active]="phase() !== 'idle'" aria-hidden="true">🔒</span>
              <span>example.com/users</span>
            </div>
            <span class="tab-spinner" [class.is-spinning]="!canSend()" aria-hidden="true"></span>
          </div>
          <div class="load-bar-track" aria-hidden="true">
            <div class="load-bar" [class.is-active]="!canSend()" [style.width.%]="loadBarPercent()"></div>
          </div>
          <div class="browser-page">
            <p class="page-heading">Users Directory</p>

            <div class="page-btn-wrap">
              <button
                type="button"
                class="page-btn"
                [class.is-clicked]="clicked()"
                (click)="send(true)"
                [disabled]="!canSend()"
              >
                Load Users
              </button>
              <svg #cursorEl class="cursor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M4 2 L4 21 L9 16 L12.5 23 L15.3 21.6 L11.9 14.8 L18.5 14.6 Z" />
              </svg>
            </div>

            @if (phase() === 'done' && !simError()) {
              <ul class="page-results mono">
                @for (row of resultRows; track row; let i = $index) {
                  <li class="result-row" [style.animation-delay.ms]="i * 90">{{ row }}</li>
                }
              </ul>
            } @else if (phase() === 'error') {
              <p class="page-error mono">Failed to load users — 500 Internal Server Error</p>
            } @else if (phase() !== 'idle') {
              <p class="page-loading mono">
                <span class="loading-dots" aria-hidden="true"><span></span><span></span><span></span></span>
                Loading…
              </p>
            }
          </div>
        </div>

        <div class="hero-diagram" role="img" aria-label="Diagram of a request travelling from client to server and a response travelling back">
          <div #clientNode class="node node-client" [class.is-active]="phase() !== 'idle'">
            <span class="pulse-ring" aria-hidden="true"></span>
            <svg class="node-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.5" />
              <line x1="2" y1="8" x2="22" y2="8" stroke="currentColor" stroke-width="1.5" />
              <circle cx="5" cy="6" r="0.8" fill="currentColor" />
              <circle cx="7.5" cy="6" r="0.8" fill="currentColor" />
            </svg>
            <span class="node-label mono">CLIENT</span>
          </div>

          <div class="wire">
            <svg viewBox="0 0 100 40" preserveAspectRatio="none" class="wire-svg" aria-hidden="true">
              <line x1="2" y1="12" x2="98" y2="12" class="wire-line" />
              <line x1="98" y1="28" x2="2" y2="28" class="wire-line wire-line-return" />
            </svg>
            <div class="hops" aria-hidden="true">
              <span class="hop" [class.is-active]="phase() === 'traveling-out' || phase() === 'traveling-back'"></span>
              <span class="hop" [class.is-active]="phase() === 'traveling-out' || phase() === 'traveling-back'"></span>
              <span class="hop" [class.is-active]="phase() === 'traveling-out' || phase() === 'traveling-back'"></span>
            </div>

            <div class="packet-ghost pg-1" [class.is-flying]="phase() === 'traveling-out'" [class.is-slow]="isSlowMotion()" aria-hidden="true"></div>
            <div class="packet-ghost pg-2" [class.is-flying]="phase() === 'traveling-out'" [class.is-slow]="isSlowMotion()" aria-hidden="true"></div>
            <div class="packet packet-request" [class.is-flying]="phase() === 'traveling-out'" [class.is-slow]="isSlowMotion()" aria-hidden="true">
              <span class="mono">GET /api/users</span>
            </div>

            <div
              class="packet-ghost pg-response pg-1"
              [class.is-flying]="phase() === 'traveling-back'"
              [class.is-slow]="isSlowMotion()"
              [class.is-error]="simError()"
              aria-hidden="true"
            ></div>
            <div
              class="packet-ghost pg-response pg-2"
              [class.is-flying]="phase() === 'traveling-back'"
              [class.is-slow]="isSlowMotion()"
              [class.is-error]="simError()"
              aria-hidden="true"
            ></div>
            <div
              class="packet packet-response"
              [class.is-flying]="phase() === 'traveling-back'"
              [class.is-slow]="isSlowMotion()"
              [class.is-error]="simError()"
              aria-hidden="true"
            >
              <span class="mono">{{ responseStatusLabel() }}</span>
            </div>
          </div>

          <div
            #serverNode
            class="node node-server"
            [class.is-active]="phase() === 'processing' || phase() === 'traveling-back' || phase() === 'done' || phase() === 'error'"
          >
            <span class="pulse-ring" aria-hidden="true"></span>
            <svg class="node-icon" viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="2" width="18" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5" />
              <rect x="3" y="9" width="18" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5" />
              <rect x="3" y="16" width="18" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="1.5" />
              <circle cx="6" cy="5" r="0.8" fill="currentColor" />
              <circle cx="6" cy="12" r="0.8" fill="currentColor" />
              <circle cx="6" cy="19" r="0.8" fill="currentColor" />
            </svg>
            <span class="node-label mono">HTTP SERVER</span>
          </div>
        </div>

        <ol class="server-internals mono" aria-label="What the server does while processing">
          @for (s of serverStages; track s.label; let i = $index) {
            <li [class.is-active]="serverStageIndex() === i + 1" [class.is-past]="serverStageIndex() > i + 1">
              <span class="stage-marker" aria-hidden="true">
                @if (serverStageIndex() > i + 1) {
                  <span class="stage-check">✓</span>
                } @else if (serverStageIndex() === i + 1) {
                  <span class="stage-spinner"></span>
                } @else {
                  <span class="stage-num">{{ i + 1 }}</span>
                }
              </span>
              <span class="stage-label">{{ s.label }}</span>
              <span class="stage-detail">{{ s.detail }}</span>
              <span class="stage-bar-track" aria-hidden="true">
                <span class="stage-bar-fill" [style.animation-duration.ms]="stageDurationMs()"></span>
              </span>
            </li>
          }
        </ol>

        @if (inspect()) {
          <div class="hero-inspect lab-code" [class.is-visible]="inspect()">
            <div class="inspect-col">
              <p class="mono inspect-heading">REQUEST</p>
              <p><span class="tok-method">GET</span> <span class="tok-key">/api/users</span> HTTP/1.1</p>
              <p class="tok-dim">Host: example.com</p>
              <p class="tok-dim">Accept: application/json</p>
            </div>
            <div class="inspect-col">
              <p class="mono inspect-heading">RESPONSE</p>
              @if (simError()) {
                <p>HTTP/1.1 <span class="tok-status-err">500 Internal Server Error</span></p>
                <p class="tok-dim">Content-Type: application/json</p>
                <p class="tok-dim">{{ '{ "error": "unexpected condition" }' }}</p>
              } @else {
                <p>HTTP/1.1 <span class="tok-status-ok">200 OK</span></p>
                <p class="tok-dim">Content-Type: application/json</p>
                <p class="tok-dim">{{ '{ "count": 3 }' }}</p>
              }
            </div>
          </div>
        }

        <ol class="hero-timeline mono" aria-label="Request timeline">
          @if (simDns()) {
            <li [class.is-active]="phase() === 'dns'">DNS lookup</li>
            <li class="timeline-arrow" aria-hidden="true">→</li>
          }
          <li [class.is-active]="phase() === 'building'">Request created</li>
          <li class="timeline-arrow" aria-hidden="true">→</li>
          <li [class.is-active]="phase() === 'traveling-out'">Network</li>
          <li class="timeline-arrow" aria-hidden="true">→</li>
          <li [class.is-active]="phase() === 'processing'">Server</li>
          <li class="timeline-arrow" aria-hidden="true">→</li>
          <li [class.is-active]="phase() === 'traveling-back' || phase() === 'done' || phase() === 'error'" [class.is-error]="phase() === 'error'">
            {{ phase() === 'error' ? 'Error' : 'Response' }}
          </li>
          <li class="timeline-elapsed">t+{{ elapsedMs() }}ms</li>
        </ol>
        <p class="hero-timing-note mono">
          Illustrative timing — not a real network trace. "New to this" mode narrates slower on purpose.
        </p>
      </div>
    </section>
  `,
  styles: `
    .hero {
      position: relative;
      padding-block: 96px 72px;
      overflow: hidden;
    }

    .hero-inner {
      position: relative;
      z-index: 1;
    }

    .hero-title {
      margin-top: 18px;
      font-size: clamp(2rem, 1.5rem + 2.2vw, 3.5rem);
      max-width: 900px;
    }

    .hero-lede {
      margin-top: 20px;
      max-width: 620px;
      font-size: 1.0625rem;
      color: var(--text-muted);
      line-height: 1.65;
    }

    .hero-stakes {
      margin-top: 12px;
      max-width: 620px;
      font-size: 0.9375rem;
      color: var(--text-faint);
      line-height: 1.6;
    }

    .vocab-strip {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 4px;
      margin-top: 20px;
      list-style: none;
      padding: 0;
      font-size: 0.75rem;
      color: var(--text-faint);
    }

    .vocab-strip li:not(:last-child)::after {
      content: '·';
      margin-left: 8px;
      color: var(--border-strong);
    }

    .mode-row,
    .sim-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 8px;
      margin-top: 24px;
    }

    .sim-row {
      margin-top: 12px;
    }

    .mode-label,
    .sim-label {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--text-faint);
      margin-right: 4px;
    }

    .mode-toggle {
      padding: 6px 14px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--text-faint);
      font-size: 0.8125rem;
      transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease, transform 0.15s ease;
    }

    .mode-toggle.is-on {
      border-color: var(--accent);
      color: var(--accent);
      background: var(--surface-elevated);
      transform: scale(1.03);
    }

    .sim-toggle {
      padding: 6px 12px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      background: var(--surface);
      color: var(--text-faint);
      font-size: 0.75rem;
      transition: border-color 0.2s ease, color 0.2s ease, background 0.2s ease;
    }

    .sim-toggle.is-on {
      border-color: var(--accent-2-dim);
      color: var(--accent-2);
      background: var(--surface-elevated);
    }

    .sim-toggle-danger.is-on {
      border-color: var(--danger);
      color: var(--danger);
    }

    .sim-toggle:disabled {
      opacity: 0.5;
    }

    .hero-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      margin-top: 16px;
    }

    .narrator-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 24px;
      padding: 14px 18px;
      border-radius: var(--radius-md);
      border: 1px solid var(--accent-dim);
      background: linear-gradient(180deg, var(--surface-elevated), var(--surface-raised));
      min-height: 24px;
    }

    .narrator-icon {
      font-size: 1.125rem;
      flex-shrink: 0;
    }

    .narrator-text {
      font-size: 0.9375rem;
      color: var(--text);
      line-height: 1.55;
    }

    .browser-chrome {
      margin-top: 24px;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-lg);
      overflow: hidden;
      background: var(--surface);
      transition: box-shadow 0.3s ease, border-color 0.3s ease;
    }

    .browser-chrome.is-shake {
      animation: chrome-shake 0.4s ease;
      border-color: var(--danger);
      box-shadow: 0 0 0 1px var(--danger);
    }

    @keyframes chrome-shake {
      0%, 100% { transform: translateX(0); }
      20% { transform: translateX(-6px); }
      40% { transform: translateX(5px); }
      60% { transform: translateX(-3px); }
      80% { transform: translateX(2px); }
    }

    .browser-topbar {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 10px 14px;
      background: var(--surface-elevated);
      border-bottom: 1px solid var(--border);
    }

    .tl-dot {
      width: 9px;
      height: 9px;
      border-radius: 50%;
      opacity: 0.6;
    }

    .tl-red { background: #ff6161; }
    .tl-yellow { background: #ffbd44; }
    .tl-green { background: #00ca4e; }

    .browser-urlbar {
      margin-left: 12px;
      flex: 1;
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 5px 12px;
      border-radius: 999px;
      background: var(--surface);
      border: 1px solid var(--border);
      font-size: 0.75rem;
      color: var(--text-muted);
      max-width: 320px;
    }

    .lock {
      opacity: 0.4;
      font-size: 0.75rem;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .lock.is-active {
      opacity: 1;
      animation: lock-pop 0.3s ease;
    }

    @keyframes lock-pop {
      0% { transform: scale(1); }
      50% { transform: scale(1.35); }
      100% { transform: scale(1); }
    }

    .tab-spinner {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 1.5px solid var(--border-strong);
      border-top-color: transparent;
      opacity: 0;
      flex-shrink: 0;
    }

    .tab-spinner.is-spinning {
      opacity: 1;
      border-top-color: var(--accent);
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .load-bar-track {
      position: relative;
      height: 2px;
      background: transparent;
      overflow: hidden;
    }

    .load-bar {
      position: relative;
      height: 100%;
      width: 0%;
      background: linear-gradient(90deg, var(--accent-2), var(--accent));
      opacity: 0;
      transition: width 0.25s ease, opacity 0.4s ease 0.3s;
    }

    .load-bar.is-active {
      opacity: 1;
      transition: width 0.25s ease, opacity 0.15s ease;
    }

    .load-bar.is-active::after {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent);
      animation: shimmer 1s linear infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .browser-page {
      padding: 24px 20px;
    }

    .page-heading {
      font-weight: 600;
      color: var(--text);
      margin-bottom: 14px;
    }

    .page-btn-wrap {
      position: relative;
      display: inline-block;
    }

    .page-btn {
      padding: 8px 16px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--accent-dim);
      background: var(--surface-raised);
      color: var(--accent);
      font-size: 0.875rem;
      transition: transform 0.12s ease;
    }

    .page-btn:disabled {
      opacity: 0.6;
    }

    .page-btn.is-clicked {
      animation: btn-press 0.25s ease;
    }

    @keyframes btn-press {
      0% { transform: scale(1); }
      40% { transform: scale(0.94); }
      100% { transform: scale(1); }
    }

    .cursor {
      position: absolute;
      width: 20px;
      height: 20px;
      right: -14px;
      bottom: -12px;
      color: var(--text);
      fill: var(--text);
      stroke: var(--bg, #0a0e14);
      stroke-width: 1;
      opacity: 0;
      pointer-events: none;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
      transform-origin: 20% 15%;
    }

    .page-results {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 0.8125rem;
      color: var(--accent-2);
    }

    .result-row {
      opacity: 0;
      transform: translateY(6px);
      animation: row-in 0.35s ease forwards;
    }

    @keyframes row-in {
      to { opacity: 1; transform: translateY(0); }
    }

    .page-loading {
      margin-top: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.8125rem;
      color: var(--text-faint);
    }

    .loading-dots {
      display: inline-flex;
      gap: 3px;
    }

    .loading-dots span {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: var(--accent);
      animation: dot-bounce 1s ease-in-out infinite;
    }

    .loading-dots span:nth-child(2) { animation-delay: 0.15s; }
    .loading-dots span:nth-child(3) { animation-delay: 0.3s; }

    @keyframes dot-bounce {
      0%, 80%, 100% { opacity: 0.3; transform: translateY(0); }
      40% { opacity: 1; transform: translateY(-3px); }
    }

    .page-error {
      margin-top: 16px;
      font-size: 0.8125rem;
      color: var(--danger);
      animation: row-in 0.3s ease forwards;
    }

    .hero-diagram {
      display: flex;
      align-items: center;
      gap: 0;
      margin-top: 24px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 32px 20px;
    }

    .node {
      position: relative;
      flex-shrink: 0;
      width: 96px;
      height: 76px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      text-align: center;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      background: var(--surface-elevated);
      color: var(--text-faint);
      transition: border-color 0.3s ease, box-shadow 0.3s ease, color 0.3s ease;
    }

    @media (min-width: 640px) {
      .node {
        width: 140px;
        height: 92px;
      }
    }

    .node-icon {
      width: 22px;
      height: 22px;
    }

    .node.is-active {
      border-color: var(--accent);
      box-shadow: 0 0 24px var(--glow-accent);
      color: var(--accent);
    }

    .pulse-ring {
      position: absolute;
      inset: 0;
      border-radius: inherit;
      border: 1px solid var(--accent);
      opacity: 0;
      pointer-events: none;
    }

    .node.is-active .pulse-ring {
      animation: pulse-ring 1.6s ease-out infinite;
    }

    @keyframes pulse-ring {
      0% { opacity: 0.6; transform: scale(1); }
      100% { opacity: 0; transform: scale(1.25); }
    }

    .node-label {
      font-size: 0.6875rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      color: var(--text);
    }

    .wire {
      position: relative;
      flex: 1;
      height: 76px;
      min-width: 60px;
    }

    .wire-svg {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
    }

    .wire-line {
      stroke: var(--border-strong);
      stroke-width: 1;
      stroke-dasharray: 4 4;
    }

    .wire-line-return {
      stroke: var(--border);
    }

    .hops {
      position: absolute;
      inset: 0;
      display: flex;
      align-items: center;
      justify-content: space-evenly;
      pointer-events: none;
    }

    .hop {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: var(--border-strong);
      opacity: 0.5;
    }

    .hop.is-active {
      background: var(--accent);
      animation: hop-pulse 1s ease-in-out infinite;
    }

    .hop.is-active:nth-child(2) { animation-delay: 0.15s; }
    .hop.is-active:nth-child(3) { animation-delay: 0.3s; }

    @keyframes hop-pulse {
      0%, 100% { opacity: 0.5; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.6); }
    }

    .packet {
      position: absolute;
      top: 0;
      left: 4px;
      transform: translateX(0);
      opacity: 0;
      font-size: 0.625rem;
      color: var(--accent);
      white-space: nowrap;
      background: var(--surface);
      border: 1px solid var(--accent-dim);
      border-radius: 999px;
      padding: 3px 8px;
      z-index: 2;
    }

    .packet-response {
      top: auto;
      bottom: 0;
      color: var(--accent-2);
      border-color: var(--accent-2-dim);
    }

    .packet-response.is-error {
      color: var(--danger);
      border-color: var(--danger);
    }

    .packet.is-flying {
      animation: packet-travel 1.1s cubic-bezier(0.45, 0, 0.55, 1) forwards;
    }

    .packet.is-flying.is-slow {
      animation-duration: 2.4s;
    }

    .packet-response.is-flying {
      animation: packet-travel-return 1.1s cubic-bezier(0.45, 0, 0.55, 1) forwards;
    }

    .packet-response.is-flying.is-slow {
      animation-duration: 2.4s;
    }

    @keyframes packet-travel {
      0% { left: 4px; opacity: 0; transform: translateY(0) scale(0.9); }
      8% { opacity: 1; transform: translateY(0) scale(1.05); }
      25% { transform: translateY(-5px) scale(1); }
      50% { transform: translateY(3px) scale(1); }
      75% { transform: translateY(-3px) scale(1); }
      92% { opacity: 1; }
      100% { left: calc(100% - 90px); opacity: 0; transform: translateY(0) scale(0.95); }
    }

    @keyframes packet-travel-return {
      0% { left: calc(100% - 90px); opacity: 0; transform: translateY(0) scale(0.9); }
      8% { opacity: 1; transform: translateY(0) scale(1.05); }
      25% { transform: translateY(5px) scale(1); }
      50% { transform: translateY(-3px) scale(1); }
      75% { transform: translateY(3px) scale(1); }
      92% { opacity: 1; }
      100% { left: 4px; opacity: 0; transform: translateY(0) scale(0.95); }
    }

    .packet-ghost {
      position: absolute;
      top: 0;
      left: 4px;
      width: 14px;
      height: 8px;
      border-radius: 999px;
      background: var(--accent);
      opacity: 0;
      filter: blur(1.5px);
      z-index: 1;
    }

    .packet-ghost.pg-response {
      top: auto;
      bottom: 2px;
      background: var(--accent-2);
    }

    .packet-ghost.pg-response.is-error {
      background: var(--danger);
    }

    .packet-ghost.is-flying.pg-1 {
      animation: ghost-travel 1.1s cubic-bezier(0.45, 0, 0.55, 1) 0.08s forwards;
    }

    .packet-ghost.is-flying.pg-2 {
      animation: ghost-travel 1.1s cubic-bezier(0.45, 0, 0.55, 1) 0.16s forwards;
    }

    .packet-ghost.pg-response.is-flying.pg-1 {
      animation-name: ghost-travel-return;
    }

    .packet-ghost.pg-response.is-flying.pg-2 {
      animation-name: ghost-travel-return;
    }

    .packet-ghost.is-flying.is-slow {
      animation-duration: 2.4s;
    }

    @keyframes ghost-travel {
      0% { left: 4px; opacity: 0; }
      10% { opacity: 0.35; }
      85% { opacity: 0.15; }
      100% { left: calc(100% - 90px); opacity: 0; }
    }

    @keyframes ghost-travel-return {
      0% { left: calc(100% - 90px); opacity: 0; }
      10% { opacity: 0.35; }
      85% { opacity: 0.15; }
      100% { left: 4px; opacity: 0; }
    }

    @media (prefers-reduced-motion: reduce) {
      .packet.is-flying,
      .packet-response.is-flying,
      .packet-ghost.is-flying,
      .pulse-ring,
      .browser-chrome.is-shake {
        animation: none;
        opacity: 1;
      }
    }

    .server-internals {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .server-internals li {
      position: relative;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 7px 10px;
      border-radius: var(--radius-sm);
      font-size: 0.75rem;
      color: var(--text-faint);
      opacity: 0.5;
      overflow: hidden;
      transition: opacity 0.2s ease, background 0.2s ease, color 0.2s ease;
    }

    .server-internals li.is-past {
      opacity: 0.75;
      color: var(--text-muted);
    }

    .server-internals li.is-active {
      opacity: 1;
      background: var(--surface-elevated);
      color: var(--accent);
    }

    .stage-marker {
      width: 16px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stage-num {
      color: var(--text-faint);
    }

    .stage-check {
      color: var(--accent-2);
      font-weight: 700;
    }

    .stage-spinner {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      border: 1.5px solid var(--accent-dim);
      border-top-color: var(--accent);
      animation: spin 0.6s linear infinite;
    }

    .stage-label {
      width: 90px;
      flex-shrink: 0;
      font-weight: 600;
    }

    .stage-detail {
      color: var(--text-faint);
      flex: 1;
    }

    .stage-bar-track {
      position: absolute;
      left: 0;
      bottom: 0;
      width: 100%;
      height: 2px;
      background: transparent;
    }

    .stage-bar-fill {
      display: block;
      height: 100%;
      width: 0%;
      background: var(--accent);
    }

    .server-internals li.is-active .stage-bar-fill {
      animation-name: stage-fill;
      animation-timing-function: linear;
      animation-fill-mode: forwards;
    }

    @keyframes stage-fill {
      from { width: 0%; }
      to { width: 100%; }
    }

    .hero-inspect {
      margin-top: 20px;
      display: grid;
      gap: 20px;
      grid-template-columns: 1fr;
    }

    @media (min-width: 640px) {
      .hero-inspect {
        grid-template-columns: 1fr 1fr;
      }
    }

    .inspect-heading {
      color: var(--accent-2);
      margin-bottom: 8px;
      font-size: 0.6875rem;
      letter-spacing: 0.1em;
    }

    .tok-status-err {
      color: var(--danger);
    }

    .hero-timeline {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 10px;
      margin-top: 28px;
      font-size: 0.75rem;
      color: var(--text-faint);
    }

    .hero-timeline li.is-active {
      color: var(--accent);
    }

    .hero-timeline li.is-active.is-error {
      color: var(--danger);
    }

    .timeline-arrow {
      color: var(--border-strong);
    }

    .timeline-elapsed {
      margin-left: auto;
      color: var(--accent-2);
    }

    .hero-timing-note {
      margin-top: 8px;
      font-size: 0.6875rem;
      color: var(--text-faint);
    }
  `,
})
export class HttpHero implements AfterViewInit {
  protected readonly serverStages = SERVER_STAGES;
  protected readonly resultRows = RESULT_ROWS;

  protected readonly phase = signal<HeroPhase>('idle');
  protected readonly inspect = signal(false);
  protected readonly simSlow = signal(false);
  protected readonly simError = signal(false);
  protected readonly simDns = signal(false);
  protected readonly explainMode = signal<ExplainMode>('simple');
  protected readonly serverStageIndex = signal(0);
  protected readonly elapsedMs = signal(0);
  protected readonly clicked = signal(false);
  protected readonly errorFlash = signal(false);

  private readonly cursorEl = viewChild<ElementRef<SVGElement>>('cursorEl');
  private readonly clientNode = viewChild<ElementRef<HTMLElement>>('clientNode');
  private readonly serverNode = viewChild<ElementRef<HTMLElement>>('serverNode');
  private readonly captionEl = viewChild<ElementRef<HTMLElement>>('captionEl');

  protected readonly canSend = computed(
    () => this.phase() === 'idle' || this.phase() === 'done' || this.phase() === 'error',
  );

  protected readonly isSlowMotion = computed(() => this.simSlow() || this.explainMode() === 'simple');

  protected readonly responseStatusLabel = computed(() =>
    this.simError() ? '500 Error' : '200 OK',
  );

  protected readonly captionText = computed(() => CAPTIONS[this.phase()][this.explainMode()]);

  protected readonly stageDurationMs = computed(() => 140 * this.paceFactor());

  protected readonly loadBarPercent = computed(() => {
    switch (this.phase()) {
      case 'idle':
        return 0;
      case 'dns':
        return 12;
      case 'building':
        return 28;
      case 'traveling-out':
        return 55;
      case 'processing':
        return 78;
      case 'traveling-back':
        return 95;
      case 'done':
      case 'error':
        return 100;
      default:
        return 0;
    }
  });

  private get paceFactor(): () => number {
    return () => (this.simSlow() ? 2.2 : 1) * (this.explainMode() === 'simple' ? 1.4 : 0.85);
  }

  private elapsedTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    // Narrator caption crossfades on every phase/mode change so it reads as a live subtitle, not a jump-cut.
    effect(() => {
      const _ = this.captionText();
      const el = this.captionEl()?.nativeElement;
      if (!el) return;
      gsap.fromTo(el, { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.32, ease: 'power2.out' });
    });

    // Spotlight: the active side of the exchange gently scales up and glows; the idle side settles back.
    effect(() => {
      const p = this.phase();
      const clientActive = p !== 'idle';
      const serverActive = p === 'processing' || p === 'traveling-back' || p === 'done' || p === 'error';
      const clientEl = this.clientNode()?.nativeElement;
      const serverEl = this.serverNode()?.nativeElement;
      if (clientEl) {
        gsap.to(clientEl, { scale: clientActive ? 1.05 : 1, duration: 0.45, ease: 'back.out(1.6)' });
      }
      if (serverEl) {
        gsap.to(serverEl, { scale: serverActive ? 1.05 : 1, duration: 0.45, ease: 'back.out(1.6)' });
      }
    });
  }

  ngAfterViewInit(): void {
    const cursor = this.cursorEl()?.nativeElement;
    if (cursor) {
      gsap.set(cursor, { opacity: 0, x: 38, y: -34, scale: 1.4, rotation: -8, transformOrigin: '20% 15%' });
    }
  }

  send(fromPage = false): void {
    if (!this.canSend()) return;
    if (fromPage) {
      this.clicked.set(true);
      setTimeout(() => this.clicked.set(false), 550);
      this.playCursorClick();
    }
    this.run();
  }

  private playCursorClick(): void {
    const cursor = this.cursorEl()?.nativeElement;
    if (!cursor) return;
    gsap
      .timeline()
      .set(cursor, { opacity: 0, x: 38, y: -34, scale: 1.4, rotation: -8 })
      .to(cursor, { opacity: 1, x: 4, y: -4, scale: 1.1, rotation: -3, duration: 0.28, ease: 'power2.out' })
      .to(cursor, { x: 0, y: 0, scale: 0.8, rotation: 0, duration: 0.12, ease: 'power1.in' })
      .to(cursor, { scale: 1, duration: 0.14, ease: 'back.out(2)' })
      .to(cursor, { opacity: 0, duration: 0.25, delay: 0.15 });
  }

  private async run(): Promise<void> {
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const factor = this.paceFactor();

    this.serverStageIndex.set(0);
    this.elapsedMs.set(0);
    if (this.elapsedTimer) clearInterval(this.elapsedTimer);
    this.elapsedTimer = setInterval(() => this.elapsedMs.update((v) => v + 20), 20);

    if (this.simDns()) {
      this.phase.set('dns');
      await wait(500 * factor);
    }

    this.phase.set('building');
    await wait(350 * factor);

    this.phase.set('traveling-out');
    await wait(1100 * factor);

    this.phase.set('processing');
    for (let i = 0; i < this.serverStages.length; i++) {
      this.serverStageIndex.set(i + 1);
      await wait(140 * factor);
    }
    // Push past the last index so the final stage flips from "spinning" to "done" (checkmark).
    this.serverStageIndex.set(this.serverStages.length + 1);

    this.phase.set('traveling-back');
    await wait(1100 * factor);

    if (this.elapsedTimer) {
      clearInterval(this.elapsedTimer);
      this.elapsedTimer = null;
    }

    const failed = this.simError();
    this.phase.set(failed ? 'error' : 'done');

    if (failed) {
      this.errorFlash.set(true);
      setTimeout(() => this.errorFlash.set(false), 500);
    }
  }
}
