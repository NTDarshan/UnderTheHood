import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type FieldId = 'fin' | 'rsv' | 'opcode' | 'mask' | 'len' | 'maskkey' | 'payload';
type LenMode = 'small' | 'ext16' | 'ext64';

interface FieldInfo {
  title: string;
  detail: string;
}

const FIELD_INFO: Record<FieldId, FieldInfo> = {
  fin: {
    title: 'FIN (1 bit)',
    detail: 'Set to 1 if this is the final fragment of a message, 0 if more fragments are coming. A single-frame message simply has FIN=1 on its only frame.',
  },
  rsv: {
    title: 'RSV1 / RSV2 / RSV3 (1 bit each)',
    detail: 'Reserved for extensions negotiated during the handshake (e.g. permessage-deflate compression). Must be 0 unless such an extension is in use.',
  },
  opcode: {
    title: 'Opcode (4 bits)',
    detail: '0x0 continuation · 0x1 text · 0x2 binary · 0x8 close · 0x9 ping · 0xA pong. Tells the receiver what kind of frame this is and how to interpret the payload.',
  },
  mask: {
    title: 'MASK (1 bit)',
    detail: 'Must be 1 on every frame sent from client to server. Servers never mask frames sent to clients. This is a protocol requirement, not optional behavior.',
  },
  len: {
    title: 'Payload length (7, 7+16, or 7+64 bits)',
    detail: 'If the 7-bit value is ≤125, that is the payload length. If it is 126, the next 2 bytes hold the real length. If it is 127, the next 8 bytes hold it. This lets small frames stay tiny while still supporting huge payloads.',
  },
  maskkey: {
    title: 'Masking key (32 bits, client frames only)',
    detail: 'A 4-byte value chosen per frame. The payload is XORed with this key, byte by byte, cyclically. Present only when MASK=1.',
  },
  payload: {
    title: 'Payload data',
    detail: 'The actual application bytes — masked (if from a client) or plain (if from a server). Its meaning depends on the opcode.',
  },
};

const OPCODES = [
  { hex: '0x0', name: 'continuation', detail: 'A continuation of a fragmented message — combine with the frames before it.' },
  { hex: '0x1', name: 'text', detail: 'UTF-8 text payload.' },
  { hex: '0x2', name: 'binary', detail: 'Arbitrary binary payload.' },
  { hex: '0x8', name: 'close', detail: 'Starts or acknowledges the close handshake, optionally carrying a close code.' },
  { hex: '0x9', name: 'ping', detail: 'A liveness check — the receiver should reply with a pong carrying the same payload.' },
  { hex: '0xA', name: 'pong', detail: 'A reply to a ping (or an unsolicited heartbeat).' },
];

@Component({
  selector: 'app-frame-inspector',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="frame-inspector">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 008 — FRAME STRUCTURE</p>
        <h2 class="lab-title">Click any field of a real WebSocket frame.</h2>
        <p class="lab-lede">
          This is what RFC 6455 actually defines as the unit of transmission — click a field below to see what
          it means.
        </p>

        <app-explain-simply>
          Think of it like a shipping label glued to a box: a few small flags up front, then "how much stuff is
          inside," then (if it's from a customer, not the warehouse) a lock code, then the contents.
        </app-explain-simply>

        <div class="frame-grid" role="group" aria-label="WebSocket frame fields">
          <button type="button" class="field field-fin" [class.is-selected]="selected() === 'fin'" (click)="selected.set('fin')">FIN</button>
          <button type="button" class="field field-rsv" [class.is-selected]="selected() === 'rsv'" (click)="selected.set('rsv')">RSV 1-3</button>
          <button type="button" class="field field-opcode" [class.is-selected]="selected() === 'opcode'" (click)="selected.set('opcode')">Opcode</button>
          <button type="button" class="field field-mask" [class.is-selected]="selected() === 'mask'" (click)="selected.set('mask')">MASK</button>
          <button type="button" class="field field-len" [class.is-selected]="selected() === 'len'" (click)="selected.set('len')">Payload len</button>
          <button type="button" class="field field-maskkey" [class.is-selected]="selected() === 'maskkey'" (click)="selected.set('maskkey')">Masking key</button>
          <button type="button" class="field field-payload" [class.is-selected]="selected() === 'payload'" (click)="selected.set('payload')">Payload data</button>
        </div>

        <div class="lab-panel field-info">
          <p class="field-info-title mono">{{ info().title }}</p>
          <p class="field-info-detail">{{ info().detail }}</p>
        </div>

        <h3 class="sub-heading">Opcodes</h3>
        <div class="opcode-table">
          @for (op of opcodes; track op.hex) {
            <div class="opcode-row">
              <span class="opcode-hex mono">{{ op.hex }}</span>
              <span class="opcode-name mono">{{ op.name }}</span>
              <span class="opcode-detail">{{ op.detail }}</span>
            </div>
          }
        </div>

        <h3 class="sub-heading">Payload length isn't always the same size</h3>
        <p class="len-lede">
          The 7-bit length field can't count past 125 by itself. Larger payloads borrow extra bytes.
        </p>
        <div class="len-row" role="group" aria-label="Payload size">
          <button type="button" class="lab-btn" [class.is-active]="lenMode() === 'small'" (click)="lenMode.set('small')">42 bytes</button>
          <button type="button" class="lab-btn" [class.is-active]="lenMode() === 'ext16'" (click)="lenMode.set('ext16')">50,000 bytes</button>
          <button type="button" class="lab-btn" [class.is-active]="lenMode() === 'ext64'" (click)="lenMode.set('ext64')">3,000,000,000 bytes</button>
        </div>
        <div class="lab-panel len-panel">
          @if (lenMode() === 'small') {
            <p><span class="mono">len field = 42</span> — since 42 ≤ 125, this <em>is</em> the payload length. No extra bytes needed.</p>
          } @else if (lenMode() === 'ext16') {
            <p><span class="mono">len field = 126</span> — a sentinel meaning "look at the next 2 bytes." Those 16 bits hold the real length: <span class="mono">50000</span>.</p>
          } @else {
            <p><span class="mono">len field = 127</span> — a sentinel meaning "look at the next 8 bytes." Those 64 bits hold the real length: <span class="mono">3000000000</span>.</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .frame-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 28px; }
    .field { padding: 12px 16px; border: 1px solid var(--border-strong); border-radius: var(--radius-sm); background: var(--surface-elevated); font-family: var(--font-mono); font-size: 0.8125rem; color: var(--text-muted); transition: border-color 0.15s ease, color 0.15s ease, background 0.15s ease; }
    .field:hover { border-color: var(--accent-2); color: var(--accent-2); }
    .field.is-selected { border-color: var(--accent); color: var(--accent); background: color-mix(in srgb, var(--accent) 12%, var(--surface-elevated)); }

    .field-info { margin-top: 20px; }
    .field-info-title { color: var(--accent-2); margin-bottom: 8px; font-size: 0.875rem; }
    .field-info-detail { color: var(--text-muted); font-size: 0.9375rem; line-height: 1.65; }

    .sub-heading { margin-top: 40px; font-size: 1.125rem; color: var(--text); }
    .opcode-table { margin-top: 16px; display: flex; flex-direction: column; gap: 6px; }
    .opcode-row { display: flex; gap: 14px; align-items: baseline; padding: 8px 12px; background: var(--surface); border-radius: var(--radius-sm); border-left: 2px solid var(--accent-2-dim); font-size: 0.8125rem; }
    .opcode-hex { color: var(--accent-2); width: 40px; flex-shrink: 0; }
    .opcode-name { color: var(--text); width: 100px; flex-shrink: 0; }
    .opcode-detail { color: var(--text-muted); }

    .len-lede { margin-top: 8px; color: var(--text-muted); font-size: 0.9375rem; max-width: 600px; }
    .len-row { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
    .len-panel p { font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; }
    .len-panel em { color: var(--accent-strong); font-style: normal; }
  `,
})
export class FrameInspector {
  protected readonly selected = signal<FieldId>('opcode');
  protected readonly info = computed(() => FIELD_INFO[this.selected()]);
  protected readonly opcodes = OPCODES;
  protected readonly lenMode = signal<LenMode>('small');
}
