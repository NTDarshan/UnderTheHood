import { Component, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-fast-ack-vs-sync-processing',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-fast-ack">
      <div class="container">
        <p class="lab-index mono">07 — RESPOND FAST, PROCESS LATER</p>
        <h2 class="lab-title">Synchronous processing is the most common way to break webhooks</h2>
        <p class="lab-lede">
          Run both timelines. The "bad" one does all the work before responding; the "good" one persists just
          enough to be safe, acknowledges immediately, and finishes the real work in the background.
        </p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="running()">RUN BOTH TIMELINES</button>
          </div>

          <div class="timelines">
            <div class="timeline-row">
              <p class="timeline-label mono is-bad">SYNCHRONOUS (bad)</p>
              <div class="timeline-track">
                <div class="timeline-bar is-bad" [style.width.%]="badPct()"></div>
                <span class="timeout-marker" style="left: 55%">provider timeout ~5s</span>
              </div>
              <p class="timeline-status mono">{{ badStatus() }}</p>
            </div>

            <div class="timeline-row">
              <p class="timeline-label mono is-good">FAST-ACK + ASYNC (good)</p>
              <div class="timeline-track">
                <div class="timeline-bar is-good" [style.width.%]="goodPct()"></div>
              </div>
              <p class="timeline-status mono">{{ goodStatus() }}</p>
            </div>
          </div>

          <p class="lab-note">The recommended pattern is: verify the request, persist or enqueue what you need, respond 2xx fast — then do the heavier work asynchronously. Not all processing has to finish before you respond, but nothing should be lost if it doesn't.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .timelines { margin-top: 24px; display: flex; flex-direction: column; gap: 24px; }
    .timeline-label { font-size: 0.75rem; margin-bottom: 8px; }
    .timeline-label.is-bad { color: var(--failure); }
    .timeline-label.is-good { color: var(--success); }
    .timeline-track { position: relative; height: 14px; background: var(--surface); border: 1px solid var(--border); border-radius: 999px; overflow: hidden; }
    .timeline-bar { height: 100%; border-radius: 999px; transition: width 0.1s linear; }
    .timeline-bar.is-bad { background: var(--failure); }
    .timeline-bar.is-good { background: var(--success); }
    .timeout-marker { position: absolute; top: -20px; font-size: 0.625rem; color: var(--retry); transform: translateX(-50%); white-space: nowrap; }
    .timeout-marker::after { content: ''; position: absolute; top: 20px; left: 50%; width: 1px; height: 14px; background: var(--retry); }
    .timeline-status { margin-top: 8px; font-size: 0.75rem; color: var(--text-faint); min-height: 1.2em; }
  `,
})
export class FastAckVsSyncProcessing implements OnDestroy {
  protected readonly badPct = signal(0);
  protected readonly goodPct = signal(0);
  protected readonly running = signal(false);
  protected readonly badStatus = signal('Idle — processes everything synchronously before responding (~8.7s).');
  protected readonly goodStatus = signal('Idle — verifies, persists, and acks in ~120ms, then processes async.');

  private raf: number | null = null;
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void {
    if (this.raf) cancelAnimationFrame(this.raf);
    this.timers.forEach(clearTimeout);
  }

  protected run(): void {
    if (this.running()) return;
    this.running.set(true);
    this.badPct.set(0);
    this.goodPct.set(0);
    this.badStatus.set('Verifying signature, parsing, calling 3 downstream services synchronously…');
    this.goodStatus.set('Verifying signature, persisting event…');

    const badDurationMs = 5000; // animate to timeout point at 5s of an 8.7s real duration
    const goodDurationMs = 900;
    const start = performance.now();

    const step = (now: number) => {
      const elapsed = now - start;
      this.goodPct.set(Math.min(100, (elapsed / goodDurationMs) * 100));
      this.badPct.set(Math.min(100, (elapsed / badDurationMs) * 100));
      if (elapsed < Math.max(badDurationMs, goodDurationMs)) {
        this.raf = requestAnimationFrame(step);
      }
    };
    this.raf = requestAnimationFrame(step);

    this.timers.push(setTimeout(() => {
      this.goodStatus.set('200 OK returned in ~120ms. Background worker now sends the email and updates the ledger.');
    }, goodDurationMs));

    this.timers.push(setTimeout(() => {
      this.badStatus.set('Provider gave up waiting at ~5s and marked this attempt failed — even though your server was still working.');
    }, badDurationMs));

    this.timers.push(setTimeout(() => {
      this.badStatus.set('Your server finally finishes at ~8.7s and returns 200 — too late. The provider already retries, risking a duplicate.');
      this.running.set(false);
    }, 6600));
  }
}
