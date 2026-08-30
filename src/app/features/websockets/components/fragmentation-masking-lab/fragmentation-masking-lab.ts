import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type Tab = 'fragmentation' | 'masking';

const FRAGMENTS = [
  { text: 'HEL', fin: 0 },
  { text: 'LO ', fin: 0 },
  { text: 'WORLD', fin: 1 },
];

function xorMask(text: string, key: number[]): string {
  return text
    .split('')
    .map((c, i) => (c.charCodeAt(0) ^ key[i % key.length]).toString(16).padStart(2, '0'))
    .join(' ');
}

@Component({
  selector: 'app-fragmentation-masking-lab',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="fragmentation">
      <div class="container">
        <p class="lab-index">WEBSOCKETS / 009 — FRAGMENTATION & MASKING</p>
        <h2 class="lab-title">One message can be split into pieces — and every client frame gets scrambled.</h2>

        <div class="tab-row">
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'fragmentation'" (click)="tab.set('fragmentation')">Fragmentation</button>
          <button type="button" class="lab-btn" [class.is-active]="tab() === 'masking'" (click)="tab.set('masking')">Masking</button>
        </div>

        @if (tab() === 'fragmentation') {
          <div class="lab-panel">
            <app-explain-simply>
              Fragmentation is like sending a long fax page by page instead of waiting to scan the whole
              document first — the receiver reassembles the pages once the last one arrives.
            </app-explain-simply>

            <p class="lab-note-inline">
              A sender doesn't have to buffer an entire large message before transmitting — it can start
              sending as soon as the first chunk is ready, using <span class="mono">continuation</span> frames.
            </p>

            <p class="logical-msg mono">Logical message: "HELLO WORLD"</p>

            <div class="frame-row">
              @for (f of fragments; track $index) {
                <div class="frame-card">
                  <p class="frame-header mono">FRAME {{ $index + 1 }} · FIN={{ f.fin }} · opcode={{ $index === 0 ? '0x1 text' : '0x0 continuation' }}</p>
                  <p class="frame-payload mono">"{{ f.text }}"</p>
                </div>
              }
            </div>

            <button type="button" class="lab-btn lab-btn-primary" (click)="reconstruct()" [disabled]="reconstructing()">
              {{ reconstructed() ? 'Replay reconstruction' : 'Reconstruct on the receiving side' }}
            </button>

            @if (reconstructing() || reconstructed()) {
              <div class="reconstruct-row mono">
                @for (part of visibleParts(); track $index) {
                  <span class="reconstruct-part">{{ part }}</span>
                }
                @if (reconstructed()) {
                  <span class="reconstruct-final">→ ONE LOGICAL MESSAGE</span>
                }
              </div>
            }

            <p class="frag-note">
              The receiver knows the message is complete only when it sees a frame with <span class="mono">FIN=1</span>.
              Until then, every arriving frame is buffered and appended. Fragmentation and "one small network
              packet" are unrelated ideas — see the message/frame/segment/packet section above.
            </p>
          </div>
        }

        @if (tab() === 'masking') {
          <div class="lab-panel">
            <app-explain-simply>
              XOR masking scrambles the bytes with a key both sides already know from the frame itself — like
              shuffling a deck with a pattern you wrote down, not locking it with a key only you own.
            </app-explain-simply>

            <p class="lab-note-inline">Client → server frames must be masked. Server → client frames are not masked.</p>

            <div class="mask-flow">
              <div class="mask-step">
                <p class="mask-label mono">CLIENT PAYLOAD</p>
                <p class="mask-value mono">"HELLO"</p>
              </div>
              <span class="mask-arrow">↓ XOR with masking key {{ maskKeyHex() }}</span>
              <div class="mask-step">
                <p class="mask-label mono">MASKED BYTES ON THE WIRE</p>
                <p class="mask-value mono">{{ maskedHex() }}</p>
              </div>
              <span class="mask-arrow">↓ server XORs again with the same key</span>
              <div class="mask-step">
                <p class="mask-label mono">SERVER UNMASKS TO</p>
                <p class="mask-value mono">"HELLO"</p>
              </div>
            </div>

            <div class="claim-box">
              <p class="claim-wrong mono">✗ "Masking encrypts the payload."</p>
              <p class="claim-right">
                False. The masking key travels in <em>plaintext</em> right there in the frame — anyone who can
                see the wire can unmask it just as easily as the server can. Masking exists to stop a specific
                class of cache/proxy-poisoning attacks by making client-sent bytes unpredictable, not to hide
                data. <strong>Confidentiality comes from TLS (wss://), not from masking.</strong>
              </p>
            </div>
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .tab-row { display: flex; gap: 8px; margin-top: 28px; }
    .lab-note-inline { margin-top: 8px; max-width: 620px; color: var(--text-muted); font-size: 0.9375rem; line-height: 1.6; }

    .logical-msg { margin-top: 20px; color: var(--accent); font-size: 0.9375rem; }

    .frame-row { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 16px; }
    .frame-card { padding: 14px 16px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface); min-width: 140px; }
    .frame-header { font-size: 0.625rem; color: var(--accent-2); margin-bottom: 8px; }
    .frame-payload { font-size: 1rem; color: var(--text); }

    .reconstruct-row { margin-top: 20px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 1rem; }
    .reconstruct-part { padding: 6px 10px; background: var(--surface-elevated); border-radius: var(--radius-sm); color: var(--accent-2); animation: part-in 0.35s ease; }
    @keyframes part-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
    .reconstruct-final { margin-left: 10px; color: var(--accent); font-weight: 700; }

    .frag-note { margin-top: 20px; max-width: 640px; font-size: 0.875rem; color: var(--text-faint); line-height: 1.6; }

    .mask-flow { margin-top: 24px; display: flex; flex-direction: column; align-items: flex-start; gap: 10px; }
    .mask-step { padding: 14px 18px; border: 1px solid var(--border-strong); border-radius: var(--radius-md); background: var(--surface); }
    .mask-label { font-size: 0.625rem; letter-spacing: 0.06em; color: var(--accent-2); margin-bottom: 6px; }
    .mask-value { font-size: 0.9375rem; color: var(--text); word-break: break-all; }
    .mask-arrow { font-size: 0.75rem; color: var(--text-faint); margin-left: 8px; }

    .claim-box { margin-top: 28px; max-width: 680px; padding: 20px 22px; background: var(--surface-raised); border-left: 2px solid var(--danger); border-radius: var(--radius-sm); }
    .claim-wrong { color: var(--danger); font-size: 0.875rem; margin-bottom: 10px; }
    .claim-right { color: var(--text-muted); font-size: 0.9375rem; line-height: 1.65; }
    .claim-right em { color: var(--text); font-style: normal; }
    .claim-right strong { color: var(--accent-2); }
  `,
})
export class FragmentationMaskingLab {
  protected readonly tab = signal<Tab>('fragmentation');
  protected readonly fragments = FRAGMENTS;
  protected readonly reconstructing = signal(false);
  protected readonly reconstructed = signal(false);
  protected readonly visibleParts = signal<string[]>([]);

  private readonly maskKey = [0x37, 0xfa, 0x21, 0x3d];
  protected readonly maskKeyHex = signal(this.maskKey.map((b) => b.toString(16).padStart(2, '0')).join(' '));
  protected readonly maskedHex = signal(xorMask('HELLO', this.maskKey));

  async reconstruct(): Promise<void> {
    this.reconstructing.set(true);
    this.reconstructed.set(false);
    this.visibleParts.set([]);
    for (const f of this.fragments) {
      await new Promise((r) => setTimeout(r, 450));
      this.visibleParts.update((p) => [...p, f.text]);
    }
    await new Promise((r) => setTimeout(r, 300));
    this.reconstructing.set(false);
    this.reconstructed.set(true);
  }
}
