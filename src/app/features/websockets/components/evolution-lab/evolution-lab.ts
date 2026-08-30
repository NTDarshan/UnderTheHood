import { Component, OnDestroy, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type Tab = 'polling' | 'long-polling' | 'sse';
type Frequency = 'rare' | 'normal' | 'frequent';
type PollEntry = { n: number; outcome: 'empty' | 'useful' };
type LpPhase = 'idle' | 'connecting' | 'waiting' | 'responding';
type LpEntry = { n: number; waitedMs: number; detail: string };

const FREQ_CHANCE: Record<Frequency, number> = { rare: 0.12, normal: 0.35, frequent: 0.65 };

@Component({
  selector: 'app-evolution-lab',
  standalone: true,
  imports: [FormsModule, ExplainSimply],
  template: `
    <section class="lab-section" id="evolution">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 002 — HOW WE GOT HERE</p>
        <h2 class="lab-title">Three ways to fake real-time before WebSockets existed.</h2>
        <p class="lab-lede">
          Each of these solves "how does the server tell the client something" using only ordinary HTTP.
          Run each simulation and watch where it strains.
        </p>

        <div class="tab-row" role="tablist" aria-label="Technique">
          <button type="button" class="lab-btn" role="tab" [class.is-active]="tab() === 'polling'" (click)="switchTab('polling')">1. Polling</button>
          <button type="button" class="lab-btn" role="tab" [class.is-active]="tab() === 'long-polling'" (click)="switchTab('long-polling')">2. Long Polling</button>
          <button type="button" class="lab-btn" role="tab" [class.is-active]="tab() === 'sse'" (click)="switchTab('sse')">3. Server-Sent Events</button>
        </div>

        <!-- ============ POLLING ============ -->
        @if (tab() === 'polling') {
          <div class="lab-panel">
            <app-explain-simply>
              Polling is like repeatedly refreshing your email instead of waiting for a notification — you keep
              asking "anything new?" whether or not there actually is anything.
            </app-explain-simply>

            <div class="controls-row">
              <div class="lab-field">
                <label for="poll-interval">Polling interval</label>
                <select id="poll-interval" [ngModel]="interval()" (ngModelChange)="interval.set(+$event)" [disabled]="pollRunning()">
                  <option [ngValue]="1">Every 1s</option>
                  <option [ngValue]="2">Every 2s</option>
                  <option [ngValue]="5">Every 5s</option>
                  <option [ngValue]="10">Every 10s</option>
                </select>
              </div>
              <div class="lab-field">
                <label for="poll-freq">Server event frequency</label>
                <select id="poll-freq" [ngModel]="frequency()" (ngModelChange)="frequency.set($event)" [disabled]="pollRunning()">
                  <option value="rare">Rare</option>
                  <option value="normal">Normal</option>
                  <option value="frequent">Frequent</option>
                </select>
              </div>
              <button type="button" class="lab-btn lab-btn-primary" (click)="togglePolling()">
                {{ pollRunning() ? 'Stop polling' : 'Start polling' }}
              </button>
              <button type="button" class="lab-btn" (click)="resetPolling()">Reset</button>
            </div>

            <div class="poll-diagram" role="img" aria-label="Client repeatedly requesting updates from the server">
              <div class="node" [class.is-active]="pollPulse()">CLIENT</div>
              <div class="wire">
                <div class="packet" [class.is-flying]="pollPulse()"><span class="mono">GET /updates</span></div>
                <div class="packet packet-return" [class.is-flying]="pollReturnPulse()">
                  <span class="mono">{{ lastPollWasUseful() ? '200 · new data' : '200 · no new data' }}</span>
                </div>
              </div>
              <div class="node" [class.is-active]="pollReturnPulse()">SERVER</div>
            </div>

            <div class="metrics-row mono">
              <div class="metric"><span class="metric-value">{{ pollTotal() }}</span><span class="metric-label">requests sent</span></div>
              <div class="metric metric-danger"><span class="metric-value">{{ pollEmpty() }}</span><span class="metric-label">empty responses</span></div>
              <div class="metric metric-good"><span class="metric-value">{{ pollUseful() }}</span><span class="metric-label">useful responses</span></div>
              <div class="metric"><span class="metric-value">{{ pollOverheadKb() }}KB</span><span class="metric-label">approx. overhead sent</span></div>
            </div>
            @if (pollTotal() > 0) {
              <p class="waste-note">
                {{ pollWastePercent() }}% of requests carried headers, a TCP round trip and server work — for
                nothing. That's the fundamental problem: <strong>most requests may produce nothing useful.</strong>
              </p>
            }

            <div class="pros-cons">
              <div class="pros">
                <p class="pc-heading mono">WHY IT WAS INTRODUCED</p>
                <p class="pc-text">HTTP clients needed a simple way to periodically check whether something changed — no special server support required.</p>
                <p class="pc-heading mono">GOOD</p>
                <ul><li>Extremely simple</li><li>Works with normal HTTP infrastructure</li><li>Easy to implement and debug</li><li>Easy to scale compared with persistent connections</li></ul>
              </div>
              <div class="cons">
                <p class="pc-heading mono">BAD</p>
                <ul><li>Repeated requests, most producing nothing</li><li>Unnecessary network traffic</li><li>Latency bounded by the interval</li><li>Server load from constant re-checking</li></ul>
              </div>
            </div>
          </div>
        }

        <!-- ============ LONG POLLING ============ -->
        @if (tab() === 'long-polling') {
          <div class="lab-panel">
            <app-explain-simply>
              Long polling is like calling a restaurant and asking them to keep you on hold until your table is
              ready, instead of hanging up and calling back every minute.
            </app-explain-simply>

            <p class="lab-note-inline">
              The client sends <span class="mono">GET /updates</span> and the server <strong>holds the
              connection open</strong> instead of responding immediately — it only replies once something
              actually happens.
            </p>

            <div class="poll-diagram" role="img" aria-label="Client holding open a request until the server has something to send">
              <div class="node" [class.is-active]="lpPhase() !== 'idle'">CLIENT</div>
              <div class="wire">
                <div class="packet" [class.is-flying]="lpPhase() === 'connecting'"><span class="mono">GET /updates</span></div>
                @if (lpPhase() === 'waiting') {
                  <div class="held-line" aria-hidden="true"></div>
                }
                <div class="packet packet-return" [class.is-flying]="lpPhase() === 'responding'">
                  <span class="mono">200 · {{ lastLpDetail() }}</span>
                </div>
              </div>
              <div class="node" [class.is-active]="lpPhase() === 'waiting' || lpPhase() === 'responding'">
                SERVER
                @if (lpPhase() === 'waiting') { <span class="held-badge mono">HOLDING…</span> }
              </div>
            </div>

            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" (click)="lpConnect()" [disabled]="lpPhase() !== 'idle'">
                {{ lpPhase() === 'idle' ? 'Open request' : 'Connection in flight…' }}
              </button>
              <button type="button" class="lab-btn" (click)="lpFireEvent()" [disabled]="lpPhase() !== 'waiting'">
                Server: new event arrives
              </button>
              <button type="button" class="lab-btn" (click)="lpReset()">Reset</button>
            </div>

            @if (lpPhase() === 'waiting') {
              <p class="waiting-clock mono">Held open for {{ lpWaitedMs() }}ms — no data yet, no new request needed either.</p>
            }

            <div class="lab-panel history-panel">
              <p class="history-heading mono">ROUND-TRIP LOG</p>
              @if (lpHistory().length === 0) { <p class="history-empty">No round trips yet.</p> }
              <ol class="history-list">
                @for (h of lpHistory(); track h.n) {
                  <li class="history-item">
                    <span class="history-n mono">#{{ h.n }}</span>
                    <span class="history-detail">Held {{ h.waitedMs }}ms · {{ h.detail }}</span>
                  </li>
                }
              </ol>
            </div>
            <p class="reconnect-note">Notice: as soon as a response lands, the client immediately opens another request — the lifecycle repeats.</p>

            <div class="pros-cons">
              <div class="pros">
                <p class="pc-heading mono">GOOD</p>
                <ul><li>Lower latency than ordinary polling</li><li>Fewer empty responses</li><li>Still standard HTTP infrastructure</li></ul>
              </div>
              <div class="cons">
                <p class="pc-heading mono">BAD</p>
                <ul><li>Still a repeated request/response lifecycle</li><li>Connection management overhead per hold</li><li>More complex server behavior</li><li>Not truly bidirectional — client still can't be reached mid-hold</li></ul>
              </div>
            </div>
          </div>
        }

        <!-- ============ SSE ============ -->
        @if (tab() === 'sse') {
          <div class="lab-panel">
            <app-explain-simply>
              SSE is like a radio station: once you tune in, it keeps talking to you continuously. But if you
              want to talk back, you still have to pick up a separate phone.
            </app-explain-simply>

            <p class="lab-note-inline">
              One <span class="mono">EventSource</span> connection stays open. The server streams events down
              it whenever it wants — no new request per event.
            </p>

            <div class="sse-diagram" role="img" aria-label="One persistent connection streaming events from server to client">
              <div class="node sse-client" [class.is-active]="sseOpen()">CLIENT</div>
              <div class="sse-wire">
                <div class="sse-line" [class.is-live]="sseOpen()"></div>
                @for (p of ssePulses(); track p.id) {
                  <div class="sse-pulse" [style.animation-delay.ms]="0" [attr.data-id]="p.id"></div>
                }
              </div>
              <div class="node sse-server" [class.is-active]="sseOpen()">SERVER</div>
            </div>

            <div class="lab-btn-row">
              <button type="button" class="lab-btn lab-btn-primary" (click)="sseToggle()">
                {{ sseOpen() ? 'Close EventSource' : 'Open EventSource' }}
              </button>
              <button type="button" class="lab-btn" (click)="ssePush()" [disabled]="!sseOpen()">Server: push event →</button>
              <button type="button" class="lab-btn" (click)="sseClientSend()" [disabled]="!sseOpen()">Client: send a reply (normal HTTP POST)</button>
            </div>

            <div class="lab-panel history-panel">
              <p class="history-heading mono">EVENT STREAM</p>
              @if (sseEvents().length === 0) { <p class="history-empty">No events yet — open the connection and push one.</p> }
              <ol class="history-list">
                @for (e of sseEvents(); track e.n) {
                  <li class="history-item" [class]="e.dir === 'client-http' ? 'sse-out' : 'sse-in'">
                    <span class="history-n mono">#{{ e.n }}</span>
                    <span class="history-detail">{{ e.text }}</span>
                  </li>
                }
              </ol>
            </div>

            <p class="waste-note">
              Look at the direction of every entry above: server → client events flow through the open stream.
              The client's reply had to go out as a <strong>brand-new, ordinary HTTP request</strong> — SSE
              itself carries nothing back.
            </p>

            <div class="pros-cons">
              <div class="pros">
                <p class="pc-heading mono">GOOD</p>
                <ul><li>Simple, HTTP-based</li><li>Native <span class="mono">EventSource</span> browser support with auto-reconnect</li><li>Great for notifications, feeds, progress updates</li></ul>
              </div>
              <div class="cons">
                <p class="pc-heading mono">BAD</p>
                <ul><li>Primarily one-way: server → client</li><li>Client → server still needs a normal HTTP request</li><li>Not ideal for tightly interactive, bidirectional apps</li></ul>
              </div>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .tab-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }

    .controls-row, .lab-btn-row { display: flex; flex-wrap: wrap; gap: 14px; align-items: flex-end; margin-top: 24px; }

    .poll-diagram, .sse-diagram { display: flex; align-items: center; gap: 0; margin-top: 24px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 24px 16px; }
    .node { position: relative; flex-shrink: 0; width: 96px; height: 60px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; text-align: center; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface-elevated); font-family: var(--font-mono); font-size: 0.6875rem; font-weight: 600; letter-spacing: 0.05em; color: var(--text-faint); transition: border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease; }
    @media (min-width: 640px) { .node { width: 120px; height: 72px; } }
    .node.is-active { border-color: var(--accent); color: var(--accent); box-shadow: 0 0 20px var(--glow-accent); }
    .held-badge { font-size: 0.5625rem; color: var(--accent-2); }

    .wire { position: relative; flex: 1; height: 60px; min-width: 60px; }
    .packet { position: absolute; top: 4px; left: 4px; opacity: 0; font-size: 0.625rem; color: var(--accent); white-space: nowrap; background: var(--surface); border: 1px solid var(--accent-dim); border-radius: 999px; padding: 3px 8px; }
    .packet-return { top: auto; bottom: 4px; color: var(--accent-2); border-color: var(--accent-2-dim); }
    .packet.is-flying { animation: packet-out 0.5s ease forwards; }
    .packet-return.is-flying { animation: packet-in 0.5s ease forwards; }
    @keyframes packet-out { 0% { left: 4px; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { left: calc(100% - 60px); opacity: 0; } }
    @keyframes packet-in { 0% { left: calc(100% - 60px); opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { left: 4px; opacity: 0; } }

    .held-line { position: absolute; top: 50%; left: 8px; right: 8px; height: 2px; background: repeating-linear-gradient(90deg, var(--accent-2) 0 6px, transparent 6px 12px); animation: held-flow 1s linear infinite; opacity: 0.6; }
    @keyframes held-flow { to { background-position: 12px 0; } }

    .metrics-row { display: flex; flex-wrap: wrap; gap: 24px; margin-top: 24px; }
    .metric { display: flex; flex-direction: column; gap: 2px; }
    .metric-value { font-size: 1.5rem; font-weight: 700; color: var(--text); }
    .metric-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.04em; }
    .metric-danger .metric-value { color: var(--danger); }
    .metric-good .metric-value { color: var(--accent-2); }

    .waste-note { margin-top: 16px; max-width: 640px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }
    .waste-note strong { color: var(--accent-strong); }

    .lab-note-inline { margin-top: 8px; max-width: 640px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; }
    .lab-note-inline strong { color: var(--text); }

    .waiting-clock { margin-top: 12px; font-size: 0.8125rem; color: var(--accent-2); }

    .history-panel { margin-top: 20px; }
    .history-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-bottom: 12px; }
    .history-empty { color: var(--text-faint); font-size: 0.875rem; }
    .history-list { display: flex; flex-direction: column; gap: 6px; }
    .history-item { display: flex; gap: 12px; align-items: baseline; padding: 8px 12px; background: var(--surface); border-radius: var(--radius-sm); border-left: 2px solid var(--border-strong); font-size: 0.8125rem; }
    .history-n { color: var(--text-faint); flex-shrink: 0; }
    .history-detail { color: var(--text-muted); }
    .sse-in { border-left-color: var(--accent-2-dim); }
    .sse-out { border-left-color: var(--accent-dim); }

    .reconnect-note { margin-top: 12px; font-size: 0.8125rem; color: var(--text-faint); }

    .sse-wire { position: relative; flex: 1; height: 40px; min-width: 60px; }
    .sse-line { position: absolute; top: 50%; left: 8px; right: 8px; height: 2px; background: var(--border-strong); transition: background 0.3s ease; }
    .sse-line.is-live { background: var(--accent-2-dim); }
    .sse-pulse { position: absolute; top: 50%; left: 8px; width: 8px; height: 8px; margin-top: -4px; border-radius: 50%; background: var(--accent-2); animation: sse-travel 0.6s ease forwards; box-shadow: 0 0 8px var(--glow-accent-2); }
    @keyframes sse-travel { 0% { left: 8px; opacity: 1; } 100% { left: calc(100% - 16px); opacity: 0; } }

    .pros-cons { margin-top: 32px; display: grid; gap: 24px; grid-template-columns: 1fr; }
    @media (min-width: 640px) { .pros-cons { grid-template-columns: 1fr 1fr; } }
    .pc-heading { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); margin-top: 16px; margin-bottom: 8px; }
    .pc-heading:first-child { margin-top: 0; }
    .pc-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }
    .cons .pc-heading { color: var(--danger); }
    .pros-cons ul { display: flex; flex-direction: column; gap: 6px; }
    .pros-cons li { position: relative; padding-left: 16px; font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; }
    .pros-cons li::before { content: '—'; position: absolute; left: 0; color: var(--text-faint); }

    @media (prefers-reduced-motion: reduce) {
      .packet.is-flying, .packet-return.is-flying, .sse-pulse, .held-line { animation: none; opacity: 1; }
    }
  `,
})
export class EvolutionLab implements OnDestroy {
  protected readonly tab = signal<Tab>('polling');

  // ---- Polling state ----
  protected readonly interval = signal<number>(2);
  protected readonly frequency = signal<Frequency>('normal');
  protected readonly pollRunning = signal(false);
  protected readonly pollHistory = signal<PollEntry[]>([]);
  protected readonly pollPulse = signal(false);
  protected readonly pollReturnPulse = signal(false);
  protected readonly lastPollWasUseful = signal(false);
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly pollTotal = computed(() => this.pollHistory().length);
  protected readonly pollEmpty = computed(() => this.pollHistory().filter((h) => h.outcome === 'empty').length);
  protected readonly pollUseful = computed(() => this.pollHistory().filter((h) => h.outcome === 'useful').length);
  protected readonly pollOverheadKb = computed(() => Math.round((this.pollTotal() * 0.7) * 10) / 10);
  protected readonly pollWastePercent = computed(() =>
    this.pollTotal() === 0 ? 0 : Math.round((this.pollEmpty() / this.pollTotal()) * 100),
  );

  switchTab(t: Tab): void {
    this.tab.set(t);
  }

  togglePolling(): void {
    if (this.pollRunning()) {
      this.pollRunning.set(false);
      if (this.pollTimer) clearInterval(this.pollTimer);
      this.pollTimer = null;
      return;
    }
    this.pollRunning.set(true);
    const runOnce = () => {
      this.pollPulse.set(true);
      setTimeout(() => {
        this.pollPulse.set(false);
        const useful = Math.random() < FREQ_CHANCE[this.frequency()];
        this.lastPollWasUseful.set(useful);
        this.pollReturnPulse.set(true);
        setTimeout(() => this.pollReturnPulse.set(false), 500);
        this.pollHistory.update((h) => [...h, { n: h.length + 1, outcome: useful ? 'useful' : 'empty' }]);
      }, 500);
    };
    runOnce();
    this.pollTimer = setInterval(runOnce, this.interval() * 700 + 500);
  }

  resetPolling(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    this.pollTimer = null;
    this.pollRunning.set(false);
    this.pollHistory.set([]);
    this.pollPulse.set(false);
    this.pollReturnPulse.set(false);
  }

  // ---- Long polling state ----
  protected readonly lpPhase = signal<LpPhase>('idle');
  protected readonly lpHistory = signal<LpEntry[]>([]);
  protected readonly lastLpDetail = signal('');
  protected readonly lpWaitedMs = signal(0);
  private lpWaitStart = 0;
  private lpClockTimer: ReturnType<typeof setInterval> | null = null;

  lpConnect(): void {
    if (this.lpPhase() !== 'idle') return;
    this.lpPhase.set('connecting');
    setTimeout(() => {
      this.lpPhase.set('waiting');
      this.lpWaitStart = Date.now();
      this.lpWaitedMs.set(0);
      this.lpClockTimer = setInterval(() => this.lpWaitedMs.set(Date.now() - this.lpWaitStart), 100);
    }, 500);
  }

  lpFireEvent(): void {
    if (this.lpPhase() !== 'waiting') return;
    const waited = Date.now() - this.lpWaitStart;
    if (this.lpClockTimer) clearInterval(this.lpClockTimer);
    this.lpPhase.set('responding');
    this.lastLpDetail.set('new event delivered');
    setTimeout(() => {
      this.lpHistory.update((h) => [...h, { n: h.length + 1, waitedMs: waited, detail: 'event delivered, connection closed' }]);
      this.lpPhase.set('idle');
      setTimeout(() => this.lpConnect(), 350);
    }, 500);
  }

  lpReset(): void {
    if (this.lpClockTimer) clearInterval(this.lpClockTimer);
    this.lpClockTimer = null;
    this.lpPhase.set('idle');
    this.lpHistory.set([]);
    this.lpWaitedMs.set(0);
  }

  // ---- SSE state ----
  protected readonly sseOpen = signal(false);
  protected readonly sseEvents = signal<{ n: number; text: string; dir: 'server-push' | 'client-http' }[]>([]);
  protected readonly ssePulses = signal<{ id: number }[]>([]);
  private ssePulseId = 0;

  sseToggle(): void {
    this.sseOpen.update((v) => !v);
    if (!this.sseOpen()) {
      this.sseEvents.update((e) => [...e, { n: e.length + 1, text: 'EventSource closed', dir: 'server-push' }]);
    }
  }

  ssePush(): void {
    if (!this.sseOpen()) return;
    const id = this.ssePulseId++;
    this.ssePulses.update((p) => [...p, { id }]);
    setTimeout(() => this.ssePulses.update((p) => p.filter((x) => x.id !== id)), 650);
    const messages = ['price updated', 'new comment posted', 'build finished', 'stock level changed'];
    const text = messages[Math.floor(Math.random() * messages.length)];
    setTimeout(() => {
      this.sseEvents.update((e) => [...e, { n: e.length + 1, text: `event: ${text}`, dir: 'server-push' }]);
    }, 400);
  }

  sseClientSend(): void {
    if (!this.sseOpen()) return;
    this.sseEvents.update((e) => [...e, { n: e.length + 1, text: 'POST /reply — separate ordinary HTTP request (not over the SSE stream)', dir: 'client-http' }]);
  }

  ngOnDestroy(): void {
    if (this.pollTimer) clearInterval(this.pollTimer);
    if (this.lpClockTimer) clearInterval(this.lpClockTimer);
  }
}
