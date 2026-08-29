import { Component } from '@angular/core';

const ITEMS = [
  'What HTTP is',
  'Where HTTP sits in the network stack',
  'How client/server communication works',
  'What an HTTP request contains',
  'What an HTTP response contains',
  'Why headers exist',
  'What HTTP methods mean',
  'Safe vs idempotent vs cacheable',
  'Why OPTIONS exists',
  'How browser CORS preflight works',
  'What status code classes mean',
  'How HTTP caching works',
  'ETag / conditional requests',
  'Content negotiation',
  'Compression',
  'Persistent connections',
  'HTTP/1.1 vs HTTP/2 vs HTTP/3',
  'Multipart requests',
  'Chunked transfer coding',
  'HTTPS and TLS',
  'How all of these pieces fit into one request journey',
];

@Component({
  selector: 'app-knowledge-summary',
  standalone: true,
  template: `
    <section class="lab-section" id="summary">
      <div class="container">
        <p class="lab-index">HTTP / 20 — WHAT YOU SHOULD NOW UNDERSTAND</p>
        <h2 class="lab-title">A checklist, not a wall of text.</h2>

        <ul class="checklist">
          @for (item of items; track item) {
            <li class="checklist-item">
              <span class="check-mark" aria-hidden="true">✓</span>
              <span>{{ item }}</span>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    .checklist {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
    }

    @media (min-width: 720px) {
      .checklist {
        grid-template-columns: 1fr 1fr;
      }
    }

    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      font-size: 0.9375rem;
      color: var(--text-muted);
    }

    .check-mark {
      color: var(--accent-2);
      font-weight: 700;
      flex-shrink: 0;
    }
  `,
})
export class KnowledgeSummary {
  protected readonly items = ITEMS;
}
