import { Component, OnDestroy, signal } from '@angular/core';

interface DeliveryRow {
  delivery_id: string; event_id: string; endpoint_id: string; attempt: number;
  status: string; response_code: string; response_time: string; created_at: string; next_retry_at: string;
}

let counter = 0;

@Component({
  selector: 'app-dispatcher-and-delivery-database',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-dispatcher-db">
      <div class="container">
        <p class="lab-index mono">22 — THE DISPATCHER AND THE DELIVERY DATABASE</p>
        <h2 class="lab-title">One loop, one table, tracking every attempt</h2>
        <p class="lab-lede">
          The dispatcher picks an event, creates a delivery record, signs and sends the request, then records the
          outcome. Fire a few events and watch the delivery table fill in live.
        </p>

        <div class="lab-panel">
          <div class="flow-strip mono">
            PICK EVENT &rarr; CREATE DELIVERY &rarr; SIGN &rarr; POST &rarr; RECORD RESPONSE &rarr; RETRY IF NEEDED &rarr; MARK FINAL STATE
          </div>
          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="dispatchOne()">DISPATCH AN EVENT</button>
          </div>

          <div class="table-wrap">
            <table class="cmp-table mono">
              <thead>
                <tr><th>delivery_id</th><th>event_id</th><th>endpoint_id</th><th>attempt</th><th>status</th><th>code</th><th>resp time</th><th>next retry</th></tr>
              </thead>
              <tbody>
                @for (r of rows(); track r.delivery_id) {
                  <tr class="clickable-row" (click)="selected.set(r.delivery_id)">
                    <td>{{ r.delivery_id }}</td><td>{{ r.event_id }}</td><td>{{ r.endpoint_id }}</td><td>{{ r.attempt }}</td>
                    <td [attr.data-status]="r.status">{{ r.status }}</td><td>{{ r.response_code }}</td><td>{{ r.response_time }}</td><td>{{ r.next_retry_at }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .flow-strip { font-size: 0.6875rem; color: var(--text-faint); padding: 10px 14px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-sm); overflow-x: auto; white-space: nowrap; }
    .lab-btn-row { margin: 20px 0; }
    .table-wrap { overflow-x: auto; }
    .cmp-table { width: 100%; border-collapse: collapse; font-size: 0.75rem; }
    .cmp-table th, .cmp-table td { text-align: left; padding: 8px 12px; border-bottom: 1px solid var(--border); white-space: nowrap; }
    .cmp-table th { color: var(--text-faint); font-weight: 600; }
    .cmp-table td { color: var(--text-muted); }
    .clickable-row { cursor: pointer; }
    .clickable-row:hover { background: var(--surface-elevated); }
    td[data-status='delivered'] { color: var(--success); }
    td[data-status='failed'], td[data-status='retrying'] { color: var(--retry); }
  `,
})
export class DispatcherAndDeliveryDatabase implements OnDestroy {
  protected readonly rows = signal<DeliveryRow[]>([]);
  protected readonly selected = signal<string | null>(null);
  private timers: ReturnType<typeof setTimeout>[] = [];

  ngOnDestroy(): void { this.timers.forEach(clearTimeout); }

  protected dispatchOne(): void {
    counter++;
    const id = `dlv_${(1000 + counter).toString(16)}`;
    const eventId = `evt_${(2000 + counter).toString(16)}`;
    const row: DeliveryRow = {
      delivery_id: id, event_id: eventId, endpoint_id: 'ep_customer_44', attempt: 1,
      status: 'sending', response_code: '-', response_time: '-', created_at: 'now', next_retry_at: '-',
    };
    this.rows.update((list) => [row, ...list].slice(0, 8));

    const succeeds = Math.random() > 0.3;
    this.timers.push(setTimeout(() => {
      this.rows.update((list) => list.map((r) => r.delivery_id === id ? {
        ...r,
        status: succeeds ? 'delivered' : 'retrying',
        response_code: succeeds ? '200' : '503',
        response_time: `${80 + Math.round(Math.random() * 300)}ms`,
        next_retry_at: succeeds ? '-' : '+2s',
      } : r));
    }, 700));
  }
}
