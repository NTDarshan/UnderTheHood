import { Component, signal } from '@angular/core';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

interface StackLayer {
  id: string;
  name: string;
  detail: string;
  note: string;
}

const LAYERS: StackLayer[] = [
  { id: 'application', name: 'Application', detail: 'HTTP', note: 'You are here. HTTP defines the messages — methods, headers, status codes — that clients and servers exchange.' },
  { id: 'transport', name: 'Transport', detail: 'TCP / QUIC', note: 'HTTP/1.1 and HTTP/2 commonly run over TCP (Transmission Control Protocol), which guarantees ordered, reliable delivery. HTTP/3 runs over QUIC instead — a newer transport built on UDP.' },
  { id: 'internet', name: 'Internet', detail: 'IP', note: 'Routes packets between hosts across networks, addressed by IP (Internet Protocol) — the address every device on the network is reachable at.' },
  { id: 'link', name: 'Link', detail: 'Ethernet / Wi-Fi', note: 'Moves frames across the physical or local network medium — the actual wire or radio signal.' },
];

@Component({
  selector: 'app-protocol-basics',
  standalone: true,
  imports: [RevealDirective, ExplainSimply],
  template: `
    <section class="lab-section" id="what-is-http">
      <div class="container">
        <p class="lab-index">HTTP / 03 — PROTOCOL FOUNDATION</p>
        <h2 class="lab-title">HTTP is a language for communication between clients and servers.</h2>

        <div class="define-flow mono" appReveal>
          <div class="define-step">
            <span class="define-who">CLIENT</span>
            <span class="define-say">“I want this resource / action.”</span>
          </div>
          <div class="define-step">
            <span class="define-who">HTTP MESSAGE</span>
            <span class="define-say">“Here is the structured request.”</span>
          </div>
          <div class="define-step">
            <span class="define-who">SERVER</span>
            <span class="define-say">“I processed it.”</span>
          </div>
          <div class="define-step">
            <span class="define-who">HTTP RESPONSE</span>
            <span class="define-say">“Here is the result.”</span>
          </div>
        </div>

        <p class="lab-lede">
          HTTP is an application-layer protocol used for communication between clients and servers
          through requests and responses.
        </p>

        <app-explain-simply>
          The <strong>client</strong> is whatever's asking — usually your browser or an app. The
          <strong>server</strong> is the computer somewhere else that has what's being asked for. HTTP is just
          the shared language they both agree to speak so the question and the answer make sense to each other.
        </app-explain-simply>

        <h3 class="stack-heading">Where HTTP lives in the network stack</h3>
        <p class="lab-note">
          HTTP itself is not a full network stack — it operates at the application layer and relies on
          underlying transport and network mechanisms to actually move bytes.
        </p>

        <app-explain-simply>
          HTTP is like the words you actually say on a phone call. The layers underneath — the phone network,
          the towers, the cables — are what carries your voice, but they don't care what you're saying. HTTP
          is the "what"; the layers below are the "how it physically gets there."
        </app-explain-simply>

        <div class="stack" appReveal>
          @for (layer of layers; track layer.id) {
            <button
              type="button"
              class="stack-layer"
              [class.is-selected]="selected() === layer.id"
              [class.is-dimmed]="selected() !== null && selected() !== layer.id"
              (click)="select(layer.id)"
            >
              <span class="stack-layer-name mono">{{ layer.name }}</span>
              <span class="stack-layer-detail">{{ layer.detail }}</span>
              @if (selected() === layer.id) {
                <span class="stack-here mono">YOU ARE HERE</span>
              }
            </button>
          }
        </div>

        @if (activeLayer(); as l) {
          <p class="stack-note">{{ l.note }}</p>
        } @else {
          <p class="stack-note stack-note-hint">Click a layer above to explore it.</p>
        }
      </div>
    </section>
  `,
  styles: `
    .define-flow {
      margin-top: 28px;
      display: grid;
      gap: 10px;
      grid-template-columns: 1fr;
      max-width: 620px;
    }

    .define-step {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 12px 16px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-sm);
      font-size: 0.8125rem;
    }

    .define-who {
      color: var(--accent-2);
      flex-shrink: 0;
    }

    .define-say {
      color: var(--text-muted);
      text-align: right;
    }

    .stack-heading {
      margin-top: 56px;
      font-size: 1.25rem;
      color: var(--text);
    }

    .stack {
      margin-top: 24px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 2px;
      background: var(--border);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      overflow: hidden;
    }

    .stack-layer {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      padding: 18px 20px;
      background: var(--surface-raised);
      border: none;
      color: var(--text);
      text-align: left;
      transition: background 0.2s ease, opacity 0.2s ease;
    }

    .stack-layer:hover {
      background: var(--surface-elevated);
    }

    .stack-layer.is-selected {
      background: color-mix(in srgb, var(--accent) 10%, var(--surface-raised));
    }

    .stack-layer.is-dimmed {
      opacity: 0.4;
    }

    .stack-layer-name {
      font-size: 0.8125rem;
      letter-spacing: 0.06em;
      color: var(--text-faint);
      width: 120px;
      flex-shrink: 0;
    }

    .stack-layer.is-selected .stack-layer-name {
      color: var(--accent);
    }

    .stack-layer-detail {
      flex: 1;
      font-weight: 600;
    }

    .stack-here {
      font-size: 0.625rem;
      letter-spacing: 0.08em;
      color: var(--accent);
      border: 1px solid var(--accent-dim);
      border-radius: 999px;
      padding: 3px 8px;
    }

    .stack-note {
      margin-top: 16px;
      font-size: 0.875rem;
      color: var(--text-muted);
      max-width: 560px;
      min-height: 1.5em;
    }

    .stack-note-hint {
      color: var(--text-faint);
    }
  `,
})
export class ProtocolBasics {
  protected readonly layers = LAYERS;
  protected readonly selected = signal<string | null>(null);
  protected readonly activeLayer = signal<StackLayer | null>(null);

  select(id: string): void {
    const layer = LAYERS.find((l) => l.id === id) ?? null;
    this.selected.set(id);
    this.activeLayer.set(layer);
  }
}
