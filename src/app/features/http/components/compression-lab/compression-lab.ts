import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

interface Encoding {
  id: string;
  label: string;
  sizeKb: number;
  about: string;
}

const ENCODINGS: Encoding[] = [
  { id: 'none', label: 'Uncompressed', sizeKb: 1200, about: 'The raw response body, sent exactly as generated — no encoding step.' },
  { id: 'gzip', label: 'Gzip', sizeKb: 320, about: 'A widely supported, general-purpose compression algorithm — the long-standing default across the web.' },
  { id: 'br', label: 'Brotli', sizeKb: 270, about: 'A newer algorithm that often compresses text-based responses (HTML, JSON, CSS) more tightly than gzip.' },
];

@Component({
  selector: 'app-compression-lab',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="compression">
      <div class="container">
        <p class="lab-index">HTTP / 13 — COMPRESSION</p>
        <h2 class="lab-title">Smaller bytes on the wire, decompressed on arrival.</h2>
        <p class="lab-lede">
          The client advertises what it can decode with <span class="mono">Accept-Encoding</span>; the server
          picks one and labels the response with <span class="mono">Content-Encoding</span>.
        </p>

        <app-explain-simply>
          It's like vacuum-packing a suitcase before a flight, then unpacking it once you land — smaller to
          carry along the way, exactly the same stuff inside once you open it back up.
        </app-explain-simply>

        <div class="lab-panel compression-panel">
          <div class="bars">
            @for (e of encodings; track e.id) {
              <button type="button" class="bar-row" [class.is-selected]="selected() === e.id" (click)="selected.set(e.id)">
                <span class="bar-label mono">{{ e.label }}</span>
                <span class="bar-track">
                  <span class="bar-fill" [style.width.%]="widthPct(e.sizeKb)"></span>
                </span>
                <span class="bar-value mono">{{ e.sizeKb >= 1000 ? (e.sizeKb / 1000).toFixed(1) + ' MB' : e.sizeKb + ' KB' }}</span>
              </button>
            }
          </div>
          <p class="illustrative-note mono">Sizes are illustrative examples, not fixed compression ratios.</p>
          <p class="encoding-about">{{ activeEncoding().about }}</p>

          <div class="compression-headers">
            <p class="mono">Client — Accept-Encoding: br, gzip</p>
            <p class="mono">Server — Content-Encoding: {{ activeEncoding().id === 'none' ? '(none)' : activeEncoding().id }}</p>
          </div>

          <div class="pipeline mono">
            <span>Compressed bytes</span>
            <span class="lab-flow-arrow">↓</span>
            <span>Network</span>
            <span class="lab-flow-arrow">↓</span>
            <span>Decompression</span>
            <span class="lab-flow-arrow">↓</span>
            <span>Application</span>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .bars {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .bar-row {
      display: grid;
      grid-template-columns: 100px 1fr 80px;
      align-items: center;
      gap: 12px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      padding: 8px;
      text-align: left;
    }

    .bar-row:hover {
      background: var(--surface);
    }

    .bar-row.is-selected {
      border-color: var(--border-strong);
      background: var(--surface);
    }

    .bar-label {
      font-size: 0.8125rem;
      color: var(--text-muted);
    }

    .bar-row.is-selected .bar-label {
      color: var(--accent-strong);
    }

    .bar-track {
      height: 10px;
      background: var(--surface);
      border-radius: 999px;
      overflow: hidden;
    }

    .bar-fill {
      display: block;
      height: 100%;
      background: linear-gradient(90deg, var(--accent-dim), var(--accent));
      transition: width 0.4s ease;
    }

    .bar-value {
      font-size: 0.75rem;
      color: var(--text-faint);
      text-align: right;
    }

    .illustrative-note {
      margin-top: 12px;
      font-size: 0.6875rem;
      color: var(--text-faint);
    }

    .encoding-about {
      margin-top: 10px;
      font-size: 0.8125rem;
      color: var(--text-muted);
      max-width: 520px;
      line-height: 1.55;
    }

    .compression-headers {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.8125rem;
      color: var(--accent-2);
    }

    .pipeline {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.8125rem;
      color: var(--text-muted);
    }
  `,
})
export class CompressionLab {
  protected readonly encodings = ENCODINGS;
  protected readonly selected = signal('br');
  protected readonly activeEncoding = computed(
    () => this.encodings.find((e) => e.id === this.selected()) ?? this.encodings[0],
  );

  private readonly maxKb = Math.max(...ENCODINGS.map((e) => e.sizeKb));

  widthPct(sizeKb: number): number {
    return Math.max(4, (sizeKb / this.maxKb) * 100);
  }
}
