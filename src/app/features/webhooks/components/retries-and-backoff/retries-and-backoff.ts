import { Component, OnDestroy, signal } from '@angular/core';

@Component({
  selector: 'app-retries-and-backoff',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-retries-backoff">
      <div class="container">
        <p class="lab-index mono">12 — RETRIES, BACKOFF, AND JITTER</p>
        <h2 class="lab-title">Retrying immediately just moves the failure sooner</h2>
        <p class="lab-lede">
          Watch one delivery's attempt history, then compare fixed retry spacing against exponential backoff, with
          and without jitter.
        </p>

        <div class="lab-panel">
          <p class="body-label mono">ATTEMPT TIMELINE FOR ONE DELIVERY</p>
          <div class="attempt-row mono">
            @for (a of attempts; track $index) {
              <span class="attempt-chip" [attr.data-kind]="a.kind">{{ a.label }}</span>
              @if (!$last) { <span class="attempt-arrow">&rarr;</span> }
            }
          </div>

          <p class="body-label mono backoff-heading">EXPONENTIAL BACKOFF vs JITTERED BACKOFF</p>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="run()" [disabled]="running()">SIMULATE 3 FAILING RECEIVERS RETRYING</button>
          </div>
          <div class="backoff-cols">
            <div class="backoff-col">
              <p class="col-heading mono">NO JITTER — all 3 retry at the same instant</p>
              @for (row of noJitterRows(); track $index) {
                <div class="backoff-bar-row">
                  <span class="backoff-tag mono">receiver {{ $index + 1 }}</span>
                  <div class="backoff-bar" [style.width.%]="row"></div>
                </div>
              }
            </div>
            <div class="backoff-col">
              <p class="col-heading mono">WITH JITTER — retries spread out</p>
              @for (row of jitterRows(); track $index) {
                <div class="backoff-bar-row">
                  <span class="backoff-tag mono">receiver {{ $index + 1 }}</span>
                  <div class="backoff-bar is-jitter" [style.width.%]="row"></div>
                </div>
              }
            </div>
          </div>
          <p class="lab-note">Without jitter, every failed receiver retries at the exact same computed delay — a thundering herd that can re-overwhelm a recovering system. Jitter spreads retries out so they don't all land at once.</p>
          <p class="lab-note">There isn't one universal retry policy — retries are constrained by a time budget, an attempt-limit, and the provider's own policy, and those numbers vary by provider.</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 0 0 12px; }
    .backoff-heading { margin-top: 28px; padding-top: 24px; border-top: 1px solid var(--border); }
    .attempt-row { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .attempt-chip { font-size: 0.75rem; padding: 8px 12px; border-radius: var(--radius-sm); border: 1px solid var(--border-strong); background: var(--surface); color: var(--text-muted); }
    .attempt-chip[data-kind='fail'] { border-color: var(--failure); color: var(--failure); }
    .attempt-chip[data-kind='ok'] { border-color: var(--success); color: var(--success); }
    .attempt-arrow { color: var(--text-faint); font-size: 0.75rem; }
    .backoff-cols { display: grid; grid-template-columns: 1fr; gap: 24px; }
    @media (min-width: 720px) { .backoff-cols { grid-template-columns: 1fr 1fr; } }
    .col-heading { font-size: 0.6875rem; color: var(--text-faint); margin-bottom: 12px; }
    .backoff-bar-row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .backoff-tag { width: 90px; flex-shrink: 0; font-size: 0.6875rem; color: var(--text-faint); }
    .backoff-bar { height: 10px; background: var(--retry); border-radius: 4px; transition: width 0.3s ease; }
    .backoff-bar.is-jitter { background: var(--info); }
  `,
})
export class RetriesAndBackoff implements OnDestroy {
  protected readonly attempts = [
    { label: 'Attempt 1 — 500', kind: 'fail' },
    { label: 'Attempt 2 — 500', kind: 'fail' },
    { label: 'Attempt 3 — timeout', kind: 'fail' },
    { label: 'Attempt 4 — 200 OK', kind: 'ok' },
  ];

  protected readonly noJitterRows = signal([0, 0, 0]);
  protected readonly jitterRows = signal([0, 0, 0]);
  protected readonly running = signal(false);
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void { this.timers.forEach(clearTimeout); }

  protected run(): void {
    if (this.running()) return;
    this.running.set(true);
    this.noJitterRows.set([0, 0, 0]);
    this.jitterRows.set([0, 0, 0]);

    // No jitter: all three converge to the same computed delay bar (same width, in lockstep).
    this.timers.push(setTimeout(() => this.noJitterRows.set([70, 70, 70]), 400));

    // With jitter: each spreads to a different width representing a different actual delay.
    this.timers.push(setTimeout(() => this.jitterRows.set([45, 70, 30]), 400));

    this.timers.push(setTimeout(() => this.running.set(false), 1200));
  }
}
