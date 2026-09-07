import { Component, signal } from '@angular/core';

interface FailedDelivery { id: string; event: string; attempts: number; lastError: string; status: 'exhausted' | 'retrying' | 'discarded'; }

@Component({
  selector: 'app-dead-letter-queue',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-dlq">
      <div class="container">
        <p class="lab-index mono">13 — WHEN RETRIES RUN OUT</p>
        <h2 class="lab-title">Exhausted deliveries need a home, not the trash</h2>
        <p class="lab-lede">
          Once retries are exhausted, a delivery lands in a failed-delivery store rather than disappearing. From
          there a human or an automated process can inspect, retry, replay, or discard it.
        </p>

        <div class="lab-panel">
          <div class="dlq-list">
            @for (d of deliveries(); track d.id) {
              <div class="dlq-row" [attr.data-status]="d.status">
                <div class="dlq-info">
                  <span class="dlq-id mono">{{ d.id }}</span>
                  <span class="dlq-event mono">{{ d.event }}</span>
                  <span class="dlq-meta mono">{{ d.attempts }} attempts · {{ d.lastError }}</span>
                </div>
                <div class="dlq-actions">
                  <button type="button" class="lab-btn" [disabled]="d.status !== 'exhausted'" (click)="retryNow(d.id)">RETRY NOW</button>
                  <button type="button" class="lab-btn" (click)="inspect(d.id)">INSPECT</button>
                  <button type="button" class="lab-btn" [disabled]="d.status !== 'exhausted'" (click)="replay(d.id)">REPLAY</button>
                  <button type="button" class="lab-btn lab-btn-danger" [disabled]="d.status !== 'exhausted'" (click)="discard(d.id)">DISCARD</button>
                </div>
                <span class="pill" [class.pill-conditional]="d.status === 'retrying'" [class.pill-no]="d.status === 'discarded'" [class.pill-yes]="d.status === 'exhausted'">
                  {{ d.status.toUpperCase() }}
                </span>
              </div>
            }
          </div>
          @if (inspected(); as ins) {
            <div class="inspect-panel">
              <p class="body-text">Inspecting {{ ins }}: full request/response history, headers sent, and every response code across all attempts would be shown here for debugging.</p>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .dlq-list { display: flex; flex-direction: column; gap: 12px; }
    .dlq-row { display: flex; flex-wrap: wrap; align-items: center; gap: 14px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .dlq-row[data-status='discarded'] { opacity: 0.5; }
    .dlq-info { display: flex; flex-direction: column; gap: 4px; flex: 1; min-width: 180px; }
    .dlq-id { font-size: 0.75rem; color: var(--text); }
    .dlq-event { font-size: 0.75rem; color: var(--text-muted); }
    .dlq-meta { font-size: 0.6875rem; color: var(--text-faint); }
    .dlq-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .inspect-panel { margin-top: 16px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .body-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; margin: 0; }
  `,
})
export class DeadLetterQueue {
  protected readonly deliveries = signal<FailedDelivery[]>([
    { id: 'dlv_7a21', event: 'invoice.paid', attempts: 8, lastError: 'connection timeout', status: 'exhausted' },
    { id: 'dlv_c930', event: 'order.shipped', attempts: 6, lastError: '500 Internal Server Error', status: 'exhausted' },
  ]);
  protected readonly inspected = signal<string | null>(null);

  protected retryNow(id: string): void {
    this.updateStatus(id, 'retrying');
    setTimeout(() => this.updateStatus(id, 'exhausted'), 1500);
  }

  protected replay(id: string): void {
    this.updateStatus(id, 'retrying');
    setTimeout(() => this.updateStatus(id, 'exhausted'), 1500);
  }

  protected discard(id: string): void {
    this.updateStatus(id, 'discarded');
  }

  protected inspect(id: string): void {
    this.inspected.set(id);
  }

  private updateStatus(id: string, status: FailedDelivery['status']): void {
    this.deliveries.update((list) => list.map((d) => (d.id === id ? { ...d, status } : d)));
  }
}
