import { Component, computed, signal } from '@angular/core';
import { IdempotencyMethod, runIdempotencyTest } from '../../engine/rest-simulator';

const METHOD_OPTIONS: { id: IdempotencyMethod; label: string }[] = [
  { id: 'GET', label: 'GET' },
  { id: 'POST', label: 'POST' },
  { id: 'PUT', label: 'PUT' },
  { id: 'PATCH_SET', label: 'PATCH (set)' },
  { id: 'PATCH_INCREMENT', label: 'PATCH (increment)' },
  { id: 'DELETE', label: 'DELETE' },
];

@Component({
  selector: 'app-idempotency-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="idempotency-lab">
      <div class="container">
        <p class="lab-index">REST API / 12 — IDEMPOTENCY LAB</p>
        <h2 class="lab-title">Send it once. Send it again. Watch whether the end state moves.</h2>
        <p class="lab-lede">Pick a method, fire requests, and read the state transitions. The verdict is computed the same way every time — from the actual before/after state, not a memorized label.</p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            @for (o of methodOptions; track o.id) {
              <button type="button" class="lab-btn" [class.is-active]="method() === o.id" (click)="selectMethod(o.id)">{{ o.label }}</button>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="sendOnce()">Send Request</button>
            <button type="button" class="lab-btn" [disabled]="repeats() === 0" (click)="sendAgain()">Send Again</button>
            <button type="button" class="lab-btn" [disabled]="repeats() === 0" (click)="sendFiveMore()">Send 5 More Times</button>
            <button type="button" class="lab-btn" (click)="reset()">↻ Reset</button>
          </div>

          @if (repeats() === 0) {
            <p class="lab-note">No requests sent yet — click "Send Request" to start.</p>
          } @else {
            <div class="step-list mono">
              @for (s of result().steps; track $index; let i = $index) {
                <p class="step-row">
                  <span class="tok-dim">#{{ i + 1 }}</span> {{ s.action }} <span class="tok-dim">—</span>
                  <span class="tok-dim">before:</span> {{ s.stateBefore }} <span class="tok-dim">→</span>
                  <span class="tok-key">after:</span> {{ s.stateAfter }}
                </p>
              }
            </div>

            <div class="verdict-box" [class.is-idempotent]="result().isIdempotent" [class.is-not]="!result().isIdempotent">
              <span class="pill" [class.pill-yes]="result().isIdempotent" [class.pill-no]="!result().isIdempotent">{{ result().isIdempotent ? 'idempotent' : 'not idempotent' }}</span>
              <p class="verdict-text">{{ result().verdict }}</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .step-list { margin-top: 24px; display: flex; flex-direction: column; gap: 6px; font-size: 0.75rem; max-height: 320px; overflow-y: auto; }
    .step-row { padding: 6px 10px; background: var(--surface); border-radius: var(--radius-sm); border: 1px solid var(--border); }
    .verdict-box { margin-top: 20px; padding: 16px 18px; border-radius: var(--radius-md); background: var(--surface); border: 1px solid var(--border-strong); display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
    .verdict-box.is-idempotent { border-color: var(--accent-2-dim); }
    .verdict-box.is-not { border-color: var(--accent-dim); }
    .verdict-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }
  `,
})
export class IdempotencyLab {
  protected readonly methodOptions = METHOD_OPTIONS;
  protected readonly method = signal<IdempotencyMethod>('GET');
  protected readonly repeats = signal(0);

  protected readonly result = computed(() => runIdempotencyTest(this.method(), this.repeats()));

  selectMethod(m: IdempotencyMethod): void {
    this.method.set(m);
    this.repeats.set(0);
  }

  sendOnce(): void {
    if (this.repeats() === 0) this.repeats.set(1);
  }

  sendAgain(): void {
    this.repeats.update((r) => r + 1);
  }

  sendFiveMore(): void {
    this.repeats.update((r) => r + 5);
  }

  reset(): void {
    this.repeats.set(0);
  }
}
