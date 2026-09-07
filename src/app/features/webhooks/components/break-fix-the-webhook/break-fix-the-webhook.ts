import { Component, signal } from '@angular/core';

type FailureMode = 'slowReceiver' | 'error500' | 'timeout' | 'duplicate' | 'replay' | 'invalidSignature' | 'outOfOrder' | 'networkFailure' | 'expiredTimestamp';
type Engineering = 'hmac' | 'rawBody' | 'constantTime' | 'timestampValidation' | 'idempotency' | 'fastAck' | 'retriesBackoff' | 'durableOutbox' | 'deliveryRecords' | 'deadLetter' | 'observability';

@Component({
  selector: 'app-break-fix-the-webhook',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section wh-scene" id="wh-break-fix">
      <div class="container">
        <p class="lab-index mono">29 — BREAK IT, THEN FIX IT</p>
        <h2 class="lab-title">Toggle failure modes on, then toggle engineering controls to survive them</h2>
        <p class="lab-lede">Enable a few failure modes, send the event, and watch it fail. Then enable the matching engineering controls and send again.</p>

        <div class="lab-panel">
          <p class="body-label mono">FAILURE MODES</p>
          <div class="toggle-grid">
            @for (f of failureModes; track f.key) {
              <button type="button" class="lab-btn lab-btn-danger" [attr.aria-pressed]="failures().has(f.key)" (click)="toggleFailure(f.key)">{{ f.label }}</button>
            }
          </div>

          <p class="body-label mono controls-heading">ENGINEERING CONTROLS</p>
          <div class="toggle-grid">
            @for (e of controls; track e.key) {
              <button type="button" class="lab-btn" [attr.aria-pressed]="enabled().has(e.key)" (click)="toggleControl(e.key)">{{ e.label }}</button>
            }
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn lab-btn-primary" (click)="sendEvent()">SEND EVENT</button>
          </div>

          <div class="result-log mono" aria-live="polite">
            @for (l of results(); track $index) {
              <div class="result-line" [attr.data-kind]="l.kind">{{ l.text }}</div>
            }
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .wh-scene { --success: #4ade80; --pending: var(--accent); --retry: #fbbf24; --failure: var(--danger); --security: #a78bfa; --info: var(--accent-2); }
    .body-label { font-size: 0.6875rem; color: var(--info); letter-spacing: 0.05em; margin: 0 0 12px; }
    .controls-heading { margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
    .toggle-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .lab-btn-row { margin-top: 20px; }
    .result-log { margin-top: 20px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; min-height: 120px; display: flex; flex-direction: column; gap: 6px; }
    .result-line { font-size: 0.75rem; color: var(--text-muted); }
    .result-line[data-kind='fail'] { color: var(--failure); }
    .result-line[data-kind='ok'] { color: var(--success); }
  `,
})
export class BreakFixTheWebhook {
  protected readonly failureModes: { key: FailureMode; label: string }[] = [
    { key: 'slowReceiver', label: 'Slow receiver' },
    { key: 'error500', label: '500 response' },
    { key: 'timeout', label: 'Timeout' },
    { key: 'duplicate', label: 'Duplicate delivery' },
    { key: 'replay', label: 'Replay' },
    { key: 'invalidSignature', label: 'Invalid signature' },
    { key: 'outOfOrder', label: 'Out-of-order' },
    { key: 'networkFailure', label: 'Network failure' },
    { key: 'expiredTimestamp', label: 'Expired timestamp' },
  ];

  protected readonly controls: { key: Engineering; label: string }[] = [
    { key: 'hmac', label: 'HMAC verification' },
    { key: 'rawBody', label: 'Raw-body verification' },
    { key: 'constantTime', label: 'Constant-time comparison' },
    { key: 'timestampValidation', label: 'Timestamp validation' },
    { key: 'idempotency', label: 'Idempotency' },
    { key: 'fastAck', label: 'Fast-ack + async' },
    { key: 'retriesBackoff', label: 'Retries + backoff + jitter' },
    { key: 'durableOutbox', label: 'Durable outbox' },
    { key: 'deliveryRecords', label: 'Delivery records' },
    { key: 'deadLetter', label: 'Dead-letter queue' },
    { key: 'observability', label: 'Observability' },
  ];

  protected readonly failures = signal(new Set<FailureMode>());
  protected readonly enabled = signal(new Set<Engineering>());
  protected readonly results = signal<{ text: string; kind: 'info' | 'ok' | 'fail' }[]>([]);

  protected toggleFailure(k: FailureMode): void {
    const s = new Set(this.failures());
    s.has(k) ? s.delete(k) : s.add(k);
    this.failures.set(s);
  }

  protected toggleControl(k: Engineering): void {
    const s = new Set(this.enabled());
    s.has(k) ? s.delete(k) : s.add(k);
    this.enabled.set(s);
  }

  protected sendEvent(): void {
    const out: { text: string; kind: 'info' | 'ok' | 'fail' }[] = [];
    const f = this.failures();
    const e = this.enabled();

    if (f.has('invalidSignature')) {
      out.push(e.has('hmac') ? { text: 'Invalid signature — HMAC verification rejects the request before processing.', kind: 'ok' } : { text: 'Invalid signature accepted — no HMAC verification in place.', kind: 'fail' });
    }
    if (f.has('replay')) {
      out.push(e.has('timestampValidation') ? { text: 'Replayed request rejected — timestamp is outside the freshness window.', kind: 'ok' } : { text: 'Replayed request accepted — no timestamp/nonce check.', kind: 'fail' });
    }
    if (f.has('expiredTimestamp')) {
      out.push(e.has('timestampValidation') ? { text: 'Expired timestamp rejected before processing.', kind: 'ok' } : { text: 'Expired timestamp not checked — request processed anyway.', kind: 'fail' });
    }
    if (f.has('duplicate')) {
      out.push(e.has('idempotency') ? { text: 'Duplicate delivery detected by idempotency store — side effect not repeated.', kind: 'ok' } : { text: 'Duplicate delivery processed again — side effect repeated.', kind: 'fail' });
    }
    if (f.has('outOfOrder')) {
      out.push(e.has('deliveryRecords') ? { text: 'Out-of-order event detected via delivery/sequence tracking and handled correctly.', kind: 'ok' } : { text: 'Out-of-order event applied in the wrong order — state is now inconsistent.', kind: 'fail' });
    }
    if (f.has('slowReceiver')) {
      out.push(e.has('fastAck') ? { text: 'Slow processing offloaded to a background worker — ack still returned fast.', kind: 'ok' } : { text: 'Slow synchronous processing risks a provider-side timeout.', kind: 'fail' });
    }
    if (f.has('timeout') || f.has('error500') || f.has('networkFailure')) {
      out.push(e.has('retriesBackoff') ? { text: 'Transient failure retried with backoff and jitter until it succeeds or exhausts.', kind: 'ok' } : { text: 'Transient failure with no retry policy — the event is simply lost.', kind: 'fail' });
      out.push(e.has('durableOutbox') ? { text: 'Underlying event was captured via a durable outbox, so it survives this failure regardless.', kind: 'ok' } : { text: 'No durable outbox — if the dispatcher itself crashes here, the event may never have existed anywhere durable.', kind: 'fail' });
    }
    if (out.some((r) => r.kind === 'fail') && !e.has('deadLetter')) {
      out.push({ text: 'No dead-letter handling — an exhausted delivery simply disappears instead of landing somewhere inspectable.', kind: 'fail' });
    } else if (out.some((r) => r.kind === 'fail')) {
      out.push({ text: 'Exhausted delivery lands in the dead-letter store for manual retry/replay/discard.', kind: 'ok' });
    }
    if (!e.has('observability')) {
      out.push({ text: 'No observability configured — none of this would have been visible without this simulator.', kind: 'fail' });
    } else {
      out.push({ text: 'Observability dashboard would have surfaced this failure rate immediately.', kind: 'ok' });
    }

    if (out.length === 0) {
      out.push({ text: 'No failure modes enabled — delivery succeeds cleanly.', kind: 'ok' });
    }

    this.results.set(out);
  }
}
