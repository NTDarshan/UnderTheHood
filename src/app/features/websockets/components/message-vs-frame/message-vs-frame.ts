import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';
import { TermTip } from '../../../../shared/components/term-tip/term-tip';

type Size = 'small' | 'large';

@Component({
  selector: 'app-message-vs-frame',
  standalone: true,
  imports: [ExplainSimply, TermTip],
  template: `
    <section class="lab-section" id="message-vs-frame">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 007 — MESSAGE, FRAME, SEGMENT, PACKET</p>
        <h2 class="lab-title">"One WebSocket message equals one network packet." <span class="wrong-tag mono">FALSE</span></h2>
        <p class="lab-lede">
          Four different concepts get collapsed into one in most people's heads. They're not the same layer,
          and they don't have to match up 1:1.
        </p>

        <app-explain-simply>
          It's like mailing a long letter: you write one letter (message), fold it to fit an envelope or two
          (frame), the postal service splits your shipment across several trucks (TCP segments), and each truck
          takes a different route made of many short hops (network packets).
        </app-explain-simply>

        <div class="size-row" role="group" aria-label="Message size">
          <button type="button" class="lab-btn" [class.is-active]="size() === 'small'" (click)="size.set('small')">Small message ("hi")</button>
          <button type="button" class="lab-btn" [class.is-active]="size() === 'large'" (click)="size.set('large')">Large message (200KB image)</button>
        </div>

        <div class="stack">
          <div class="stack-row">
            <span class="stack-label mono">APPLICATION</span>
            <div class="stack-blocks">
              <div class="block block-msg">1 message</div>
            </div>
          </div>
          <span class="stack-down">↓ WebSocket framing</span>
          <div class="stack-row">
            <span class="stack-label mono"><app-term def="The unit WebSocket itself defines — has FIN, opcode, mask, payload length, and a payload. One or more frames make up one logical message.">WEBSOCKET FRAME(S)</app-term></span>
            <div class="stack-blocks">
              @for (b of frameBlocks(); track $index) {
                <div class="block block-frame">frame {{ $index + 1 }}</div>
              }
            </div>
          </div>
          <span class="stack-down">↓ handed to the OS socket</span>
          <div class="stack-row">
            <span class="stack-label mono"><app-term def="TCP splits whatever bytes you write into segments sized to fit the path's MTU and congestion window — it has no idea what a WebSocket frame is.">TCP SEGMENTS</app-term></span>
            <div class="stack-blocks">
              @for (b of segmentBlocks(); track $index) {
                <div class="block block-segment">seg {{ $index + 1 }}</div>
              }
            </div>
          </div>
          <span class="stack-down">↓ wrapped with IP + link-layer headers</span>
          <div class="stack-row">
            <span class="stack-label mono">NETWORK PACKETS</span>
            <div class="stack-blocks">
              @for (b of packetBlocks(); track $index) {
                <div class="block block-packet">pkt {{ $index + 1 }}</div>
              }
            </div>
          </div>
        </div>

        <p class="stack-note">
          @if (size() === 'small') {
            Here the counts line up 1:1:1:1 — but that's a coincidence of a tiny payload, not a rule.
          } @else {
            One application message became <strong>{{ frameBlocks().length }}</strong> WebSocket frame(s),
            carried across <strong>{{ segmentBlocks().length }}</strong> TCP segments, inside
            <strong>{{ packetBlocks().length }}</strong> network packets. None of these layers know about the
            layer two steps away — TCP doesn't know what a "WebSocket frame" is, and the network layer doesn't
            know what "TCP segment" means either. Each layer just sees bytes from the one above it.
          }
        </p>

        <p class="tcp-note">
          Underneath all of it, WebSocket relies on <strong>TCP</strong> — WebSocket itself defines message
          framing, not reliable transport. TCP is what actually guarantees ordered, reliable delivery,
          retransmission and congestion control; WebSocket frames simply ride on top of that byte stream.
        </p>
      </div>
    </section>
  `,
  styles: `
    .wrong-tag { display: inline-flex; padding: 3px 10px; border-radius: 999px; border: 1px solid var(--danger); color: var(--danger); font-size: 0.75rem; vertical-align: middle; margin-left: 8px; }
    .size-row { display: flex; gap: 8px; margin-top: 28px; flex-wrap: wrap; }

    .stack { margin-top: 28px; display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
    .stack-row { width: 100%; display: flex; flex-wrap: wrap; align-items: center; gap: 14px; }
    .stack-label { flex-shrink: 0; width: 190px; font-size: 0.6875rem; letter-spacing: 0.05em; color: var(--text-faint); }
    .stack-blocks { display: flex; flex-wrap: wrap; gap: 6px; }
    .block { padding: 8px 12px; border-radius: var(--radius-sm); font-family: var(--font-mono); font-size: 0.6875rem; border: 1px solid var(--border-strong); background: var(--surface-elevated); color: var(--text-muted); }
    .block-msg { border-color: var(--accent-dim); color: var(--accent); }
    .block-frame { border-color: var(--accent-2-dim); color: var(--accent-2); }
    .stack-down { margin-left: 190px; font-size: 0.6875rem; color: var(--text-faint); }

    .stack-note { margin-top: 24px; max-width: 660px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.65; }
    .stack-note strong { color: var(--accent-strong); }
    .tcp-note { margin-top: 16px; max-width: 660px; font-size: 0.875rem; color: var(--text-faint); line-height: 1.6; }
    .tcp-note strong { color: var(--text); }
  `,
})
export class MessageVsFrame {
  protected readonly size = signal<Size>('small');

  protected readonly frameBlocks = computed(() => new Array(this.size() === 'small' ? 1 : 1).fill(0));
  protected readonly segmentBlocks = computed(() => new Array(this.size() === 'small' ? 1 : 6).fill(0));
  protected readonly packetBlocks = computed(() => new Array(this.size() === 'small' ? 1 : 9).fill(0));
}
