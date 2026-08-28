import { Component, computed, signal } from '@angular/core';

interface BulkOption {
  id: string;
  url: string;
  notes: string[];
}

const BULK_OPTIONS: BulkOption[] = [
  {
    id: 'comma',
    url: 'DELETE /books/1,2,3',
    notes: [
      'Stays within standard HTTP method semantics — DELETE, no body needed.',
      'The identifier list is baked into the URL, which has a practical length limit and gets awkward for large batches.',
      'Partial failure is ambiguous: if book 2 does not exist, does the whole request fail, or do 1 and 3 still get deleted?',
      'No natural place to return a per-item result — the response is just a single status code.',
    ],
  },
  {
    id: 'action',
    url: 'POST /books/bulk-delete',
    notes: [
      'Reads as an action endpoint rather than a pure resource operation — a deliberate, explicit escape hatch.',
      'A JSON body naturally carries an arbitrary-length list of IDs, with no URL length limit.',
      'Non-idempotent by default like any POST, though the operation could be made idempotent by design (e.g. deleting the same IDs twice is a no-op).',
      'Response can be a structured per-item report: which IDs succeeded, which failed and why.',
    ],
  },
  {
    id: 'patch',
    url: 'PATCH /books { ids: [1,2,3], op: "delete" }',
    notes: [
      'Reuses PATCH\'s "partial modification" semantics, applied to a collection instead of one resource.',
      'Less conventional — PATCH is usually scoped to a single resource, so this shape needs clear API documentation to avoid confusion.',
      'Same body-carries-the-list advantage as the action endpoint, with a similarly flexible response shape.',
      'Idempotency again depends entirely on how the operation is implemented, not on the method alone.',
    ],
  },
];

type JobStatus = 'idle' | 'accepted' | 'processing' | 'completed';

@Component({
  selector: 'app-bulk-async-operations',
  standalone: true,
  template: `
    <section class="lab-section" id="bulk-async">
      <div class="container">
        <p class="lab-index">REST API / 35 — BULK &amp; ASYNC OPERATIONS</p>
        <h2 class="lab-title">Deleting many things, and doing things that take a while.</h2>

        <div class="lab-panel">
          <p class="lab-node">"Delete multiple books." — three defensible designs</p>
          <div class="bulk-cards">
            @for (o of bulkOptions; track o.id) {
              <button type="button" class="bulk-card" [class.is-active]="selectedBulk() === o.id" (click)="selectedBulk.set(o.id)">
                <p class="lab-code bulk-code"><span class="tok-method">{{ o.url.split(' ')[0] }}</span> {{ o.url.slice(o.url.indexOf(' ') + 1) }}</p>
              </button>
            }
          </div>
          @if (currentBulk(); as b) {
            <div class="reveal-box">
              @for (n of b.notes; track n) {
                <p class="reveal-line">{{ n }}</p>
              }
            </div>
          }
          <p class="lab-note lab-note-warn">
            There is no single universal answer here — the right shape depends on batch size limits, how partial
            failure should be reported, and how the rest of the API already handles multi-item operations.
          </p>
        </div>

        <div class="lab-panel">
          <p class="lab-node">"Generate a report." — an operation that takes a while</p>
          <p class="lab-code">
            <span class="tok-method">POST</span> /reports<br />
            <span class="tok-dim">→</span> <span class="tok-status-ok">202 Accepted</span> <span class="tok-key">{{ '{' }} "jobId": "123" {{ '}' }}</span>
          </p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" [disabled]="status() !== 'idle'" (click)="startJob()">Submit report request</button>
            <button type="button" class="lab-btn" [disabled]="status() === 'idle' || status() === 'completed'" (click)="checkStatus()">Check job status</button>
            <button type="button" class="lab-btn" (click)="reset()">Reset</button>
          </div>

          @if (status() !== 'idle') {
            <div class="reveal-box">
              <p class="lab-code job-code">
                <span class="tok-method">GET</span> /jobs/123<br />
                <span class="tok-dim">→</span>
                @switch (status()) {
                  @case ('accepted') { <span class="tok-status-ok">202 Accepted</span> <span class="tok-key">{{ '{' }} "status": "ACCEPTED" {{ '}' }}</span> }
                  @case ('processing') { <span class="tok-status-ok">200 OK</span> <span class="tok-key">{{ '{' }} "status": "PROCESSING" {{ '}' }}</span> }
                  @case ('completed') { <span class="tok-status-ok">200 OK</span> <span class="tok-key">{{ '{' }} "status": "COMPLETED", "resultUrl": "/reports/123.pdf" {{ '}' }}</span> }
                }
              </p>
            </div>
          }

          <p class="lab-note lab-note-warn">
            <strong>202 Accepted</strong> means the request was accepted for processing — it is not a promise that the
            operation is already done. The client is expected to poll (or receive a callback/webhook) until the job
            reaches a terminal state.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .bulk-cards { margin-top: 18px; display: flex; flex-direction: column; gap: 10px; }
    .bulk-card { text-align: left; padding: 4px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface-elevated); transition: border-color 0.15s ease; }
    .bulk-card:hover { border-color: var(--accent); }
    .bulk-card.is-active { border-color: var(--accent-2); }
    .bulk-code { border: none; margin: 0; background: transparent; }

    .reveal-box { margin-top: 18px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .reveal-line { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.6; margin-top: 8px; }
    .reveal-line:first-child { margin-top: 0; }

    .job-code { line-height: 2; }
  `,
})
export class BulkAsyncOperations {
  protected readonly bulkOptions = BULK_OPTIONS;
  protected readonly selectedBulk = signal<string | null>(null);
  protected readonly currentBulk = computed(() => this.bulkOptions.find((o) => o.id === this.selectedBulk()) ?? null);

  protected readonly status = signal<JobStatus>('idle');

  startJob(): void {
    this.status.set('accepted');
  }

  checkStatus(): void {
    if (this.status() === 'accepted') this.status.set('processing');
    else if (this.status() === 'processing') this.status.set('completed');
  }

  reset(): void {
    this.status.set('idle');
  }
}
