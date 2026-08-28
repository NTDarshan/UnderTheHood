import { Component, computed, signal } from '@angular/core';

interface OsiLayer {
  n: number;
  name: string;
  detail: string[];
}

const LAYERS: OsiLayer[] = [
  { n: 7, name: 'Application', detail: ['HTTP', 'JSON payload', 'Your API code'] },
  { n: 6, name: 'Presentation', detail: ['Data representation', 'Serialization format', 'Character encoding'] },
  { n: 5, name: 'Session', detail: ['Connection lifetime', 'TLS session state'] },
  { n: 4, name: 'Transport', detail: ['TCP', 'Segments, ports, reliability'] },
  { n: 3, name: 'Network', detail: ['IP', 'Routing between machines'] },
  { n: 2, name: 'Data Link', detail: ['Ethernet / Wi-Fi', 'Frames on the local link'] },
  { n: 1, name: 'Physical', detail: ['Bits', 'Electrical signals, radio, light'] },
];

@Component({
  selector: 'app-osi-visualizer',
  standalone: true,
  template: `
    <section class="lab-section" id="osi">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 06 — WHERE THIS SITS IN THE NETWORK STACK</p>
        <h2 class="lab-title">Serialization is an application-level concern.</h2>
        <p class="lab-lede">
          The OSI model is a conceptual map, not a literal description of every modern stack — most
          real-world systems don't implement seven distinct software layers. Still, it's useful for placing
          serialization in context: it lives near the top, close to your application code.
        </p>

        <div class="osi-stack">
          @for (layer of layers; track layer.n) {
            <button
              type="button"
              class="osi-layer mono"
              [class.is-active]="selected() === layer.n"
              [class.is-highlighted]="layer.n >= 6"
              (click)="selected.set(layer.n)"
            >
              <span class="osi-number">{{ layer.n }}</span>
              <span class="osi-name">{{ layer.name }}</span>
            </button>
          }
        </div>

        <div class="osi-detail lab-panel">
          <p class="osi-detail-title mono">LAYER {{ activeLayer().n }} — {{ activeLayer().name.toUpperCase() }}</p>
          <ul class="osi-detail-list">
            @for (d of activeLayer().detail; track d) {
              <li>{{ d }}</li>
            }
          </ul>
          @if (activeLayer().n >= 6) {
            <p class="osi-callout">This is where serialization happens.</p>
          }
        </div>

        <p class="lab-note">
          Backend engineers spend almost all of their time thinking about layers 7 and 6 — the HTTP request,
          the JSON body, the API contract. The layers below are handled by the operating system and network
          stack, not by application code.
        </p>
      </div>
    </section>
  `,
  styles: `
    .osi-stack {
      margin-top: 32px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      max-width: 420px;
    }

    .osi-layer {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text-muted);
      text-align: left;
      transition: border-color 0.15s ease, background 0.15s ease, color 0.15s ease;
    }

    .osi-layer.is-highlighted {
      border-color: var(--accent-2-dim);
    }

    .osi-layer.is-active {
      border-color: var(--accent);
      color: var(--text);
      background: color-mix(in srgb, var(--accent) 10%, var(--surface-raised));
    }

    .osi-number {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 1px solid currentColor;
      font-size: 0.6875rem;
      flex-shrink: 0;
    }

    .osi-name {
      font-size: 0.8125rem;
      font-weight: 600;
    }

    .osi-detail {
      margin-top: 20px;
      max-width: 420px;
    }

    .osi-detail-title {
      font-size: 0.75rem;
      color: var(--accent-2);
      margin-bottom: 12px;
    }

    .osi-detail-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .osi-detail-list li {
      font-size: 0.875rem;
      color: var(--text-muted);
      padding-left: 14px;
      position: relative;
    }

    .osi-detail-list li::before {
      content: '›';
      position: absolute;
      left: 0;
      color: var(--accent-2);
    }

    .osi-callout {
      margin-top: 14px;
      font-size: 0.8125rem;
      color: var(--accent);
      font-weight: 600;
    }
  `,
})
export class OsiVisualizer {
  protected readonly layers = LAYERS;
  protected readonly selected = signal(7);
  protected readonly activeLayer = computed(() => this.layers.find((l) => l.n === this.selected())!);
}
