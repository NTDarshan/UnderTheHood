import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';
import { TermTip } from '../../../../shared/components/term-tip/term-tip';

type Tab = 'connections' | 'fds' | 'four-tuple' | 'memory';

const CLIENTS = [
  { name: 'Client A', ip: '10.0.0.15', port: 51001 },
  { name: 'Client B', ip: '10.0.0.22', port: 51002 },
  { name: 'Client C', ip: '10.0.0.31', port: 51003 },
];

@Component({
  selector: 'app-scaling-resources',
  standalone: true,
  imports: [ExplainSimply, TermTip],
  template: `
    <section class="lab-section" id="scaling">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 011 — SCALING PROBLEM #1: RESOURCES</p>
        <h2 class="lab-title">"WebSockets scale infinitely." They don't — a connection is a resource.</h2>
        <p class="lab-lede">
          A persistent connection reduces repeated request overhead, but it also sits there, held open,
          consuming memory and operating-system resources for as long as it's connected.
        </p>

        <div class="tab-row">
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'connections'" (click)="tab.set('connections')">Persistent vs per-request</button>
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'fds'" (click)="tab.set('fds')">File descriptors</button>
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'four-tuple'" (click)="tab.set('four-tuple')">Ports & four-tuple</button>
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'memory'" (click)="tab.set('memory')">Memory per connection</button>
        </div>

        @if (tab() === 'connections') {
          <div class="lab-panel">
            <div class="compare-row">
              <div class="compare-col">
                <p class="compare-heading mono">TRADITIONAL HTTP · 1000 USERS</p>
                <div class="dot-grid">
                  @for (d of dots; track $index) {
                    <span class="dot" [class.is-flashing]="httpFlash()"></span>
                  }
                </div>
                <p class="compare-text">Each user's activity produces many short-lived request lifecycles — connect, respond, done. Nothing sits idle between requests.</p>
              </div>
              <div class="compare-col">
                <p class="compare-heading mono">WEBSOCKET · 1000 USERS</p>
                <div class="dot-grid">
                  @for (d of dots; track $index) { <span class="dot dot-persistent"></span> }
                </div>
                <p class="compare-text">1000 users means 1000 connections held open <strong>simultaneously</strong>, whether or not anyone is actively sending a message right now.</p>
              </div>
            </div>
            <button type="button" class="lab-btn" (click)="pulseHttp()">Simulate a burst of HTTP activity</button>
          </div>
        }

        @if (tab() === 'fds') {
          <div class="lab-panel">
            <app-explain-simply>
              A file descriptor is like a numbered coat-check ticket the operating system hands out for every
              open connection. Run out of tickets, and it can't accept anyone else's coat.
            </app-explain-simply>
            <p class="lab-note-inline">
              On Unix-like systems, every open network socket is tracked using a
              <app-term def="A small integer the OS uses to reference an open resource — a file, a socket, a pipe. Each process has a limited number available.">file descriptor</app-term>.
              A WebSocket connection holds one open for its entire lifetime.
            </p>
            <p class="fd-status mono">FD limit: 1000 &nbsp;·&nbsp; Connections: {{ fdCount() }} / 1000</p>
            <div class="fd-bar-track"><div class="fd-bar-fill" [style.width.%]="fdPercent()" [class.is-full]="fdCount() >= 1000"></div></div>
            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" (click)="connectOne()">Connect a user</button>
              <button type="button" class="lab-btn" (click)="connectMany(100)">Connect +100</button>
              <button type="button" class="lab-btn" (click)="fdCount.set(0); fdError.set(false)">Reset</button>
            </div>
            @if (fdError()) {
              <p class="fd-error mono">Connection #1001 → FAILED / RESOURCE LIMIT. The process has hit its file-descriptor ceiling — the OS refuses new sockets until one closes.</p>
            }
            <p class="fd-note">Scaling persistent connections means planning OS limits (<span class="mono">ulimit -n</span>), load-balancer capacity, and process count — not just writing more application code.</p>
          </div>
        }

        @if (tab() === 'four-tuple') {
          <div class="lab-panel">
            <app-explain-simply>
              Everyone dialing the same phone number can still be on separate calls — the phone company tracks
              each call by who's on both ends, not just the number that was dialed.
            </app-explain-simply>
            <p class="lab-note-inline">
              Every client below connects to the same server on the same port (443) — yet the server tells
              their connections apart perfectly, using the full four-tuple.
            </p>
            <div class="tuple-table">
              <div class="tuple-header mono">
                <span>CLIENT</span><span>SOURCE IP</span><span>SOURCE PORT</span><span>DEST IP</span><span>DEST PORT</span>
              </div>
              @for (c of clients; track c.name) {
                <div class="tuple-row mono">
                  <span>{{ c.name }}</span><span>{{ c.ip }}</span><span class="tuple-highlight">{{ c.port }}</span><span>10.0.0.20</span><span>443</span>
                </div>
              }
            </div>
            <p class="tuple-note">
              The tuple <span class="mono">(source IP, source port, destination IP, destination port)</span>
              uniquely identifies each TCP connection. Three clients, one destination port, three completely
              distinct connections — because their <em>source</em> ports differ.
            </p>
          </div>
        }

        @if (tab() === 'memory') {
          <div class="lab-panel">
            <p class="lab-note-inline">
              Each connection carries socket state, buffers, application state, and connection metadata. There
              is no honest universal "X KB per WebSocket" number — it depends on the OS, runtime, WebSocket
              implementation, buffer sizes, application state, traffic pattern, framework, and configuration.
            </p>
            <div class="mem-row" role="group" aria-label="Connection count">
              @for (n of memOptions; track n) {
                <button type="button" class="lab-btn" [class.is-active]="memCount() === n" (click)="memCount.set(n)">{{ n.toLocaleString() }}</button>
              }
            </div>
            <div class="mem-bar-track"><div class="mem-bar-fill" [style.width.%]="memPercent()"></div></div>
            <p class="mem-caption">Conceptual growth only — not a real measurement. What actually scales with connection count:</p>
            <ul class="mem-list">
              <li>Socket buffers (send/receive) held by the OS per connection</li>
              <li>Per-connection application objects (user session, subscriptions, auth context)</li>
              <li>Framework/runtime overhead per open handle (event loop bookkeeping, timers)</li>
              <li>Any message queues buffered per connection (see backpressure, further down)</li>
            </ul>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .tab-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }

    .compare-row { display: grid; gap: 20px; grid-template-columns: 1fr; }
    @media (min-width: 640px) { .compare-row { grid-template-columns: 1fr 1fr; } }
    .compare-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-bottom: 14px; }
    .dot-grid { display: grid; grid-template-columns: repeat(20, 1fr); gap: 3px; }
    .dot { width: 100%; aspect-ratio: 1; border-radius: 2px; background: var(--border-strong); transition: background 0.15s ease; }
    .dot-persistent { background: var(--accent); box-shadow: 0 0 4px var(--glow-accent); }
    .dot.is-flashing { animation: dot-flash 0.8s ease infinite; }
    @keyframes dot-flash { 0%, 100% { background: var(--border-strong); } 50% { background: var(--accent-2); } }
    .compare-text { margin-top: 12px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.55; }
    .compare-text strong { color: var(--accent-strong); }
    .lab-note-inline { max-width: 660px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; }

    .fd-status { margin-top: 20px; font-size: 0.875rem; color: var(--text); }
    .fd-bar-track { margin-top: 8px; height: 10px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); overflow: hidden; }
    .fd-bar-fill { height: 100%; background: var(--accent-2); transition: width 0.3s ease; }
    .fd-bar-fill.is-full { background: var(--danger); }
    .fd-error { margin-top: 16px; color: var(--danger); font-size: 0.875rem; max-width: 620px; line-height: 1.55; }
    .fd-note { margin-top: 16px; max-width: 620px; font-size: 0.8125rem; color: var(--text-faint); }

    .tuple-table { margin-top: 20px; display: flex; flex-direction: column; gap: 4px; }
    .tuple-header, .tuple-row { display: grid; grid-template-columns: 90px 1fr 1fr 1fr 70px; gap: 10px; padding: 8px 10px; font-size: 0.75rem; }
    .tuple-header { color: var(--text-faint); letter-spacing: 0.04em; }
    .tuple-row { background: var(--surface); border-radius: var(--radius-sm); color: var(--text-muted); }
    .tuple-highlight { color: var(--accent); font-weight: 700; }
    .tuple-note { margin-top: 18px; max-width: 640px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }
    .tuple-note em { color: var(--accent-2); font-style: normal; }

    .mem-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }
    .mem-bar-track { margin-top: 16px; height: 14px; border-radius: 999px; background: var(--surface); border: 1px solid var(--border); overflow: hidden; }
    .mem-bar-fill { height: 100%; background: linear-gradient(90deg, var(--accent-2), var(--accent)); transition: width 0.4s ease; }
    .mem-caption { margin-top: 14px; font-size: 0.8125rem; color: var(--text-faint); }
    .mem-list { margin-top: 10px; display: flex; flex-direction: column; gap: 6px; }
    .mem-list li { position: relative; padding-left: 16px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
    .mem-list li::before { content: '—'; position: absolute; left: 0; color: var(--text-faint); }
  `,
})
export class ScalingResources {
  protected readonly tab = signal<Tab>('connections');
  protected readonly dots = new Array(60).fill(0);
  protected readonly httpFlash = signal(false);
  protected readonly clients = CLIENTS;

  protected readonly fdCount = signal(0);
  protected readonly fdError = signal(false);
  protected readonly fdPercent = computed(() => Math.min(100, (this.fdCount() / 1000) * 100));

  protected readonly memOptions = [100, 1000, 10000, 100000];
  protected readonly memCount = signal(1000);
  protected readonly memPercent = computed(() => {
    const idx = this.memOptions.indexOf(this.memCount());
    return ((idx + 1) / this.memOptions.length) * 100;
  });

  pulseHttp(): void {
    this.httpFlash.set(true);
    setTimeout(() => this.httpFlash.set(false), 2000);
  }

  connectOne(): void {
    if (this.fdCount() >= 1000) {
      this.fdError.set(true);
      return;
    }
    this.fdCount.update((v) => v + 1);
    this.fdError.set(this.fdCount() >= 1000 ? false : this.fdError());
  }

  connectMany(n: number): void {
    const next = this.fdCount() + n;
    if (next > 1000) {
      this.fdCount.set(1000);
      this.fdError.set(true);
    } else {
      this.fdCount.set(next);
    }
  }
}
