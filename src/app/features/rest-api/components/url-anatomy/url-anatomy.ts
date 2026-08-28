import { Component, computed, signal } from '@angular/core';

interface UrlSegment {
  id: string;
  text: string;
  label: string;
  explanation: string;
}

const SEGMENTS: UrlSegment[] = [
  { id: 'scheme', text: 'https://', label: 'Scheme', explanation: 'The protocol used to transfer the request — https means the connection is encrypted with TLS.' },
  { id: 'host', text: 'api.example.com', label: 'Host', explanation: 'The domain name identifying which server (or server cluster) should receive the request.' },
  { id: 'base', text: '/api', label: 'Base path', explanation: 'A prefix that separates API traffic from other things the same domain might serve.' },
  { id: 'version', text: '/v1', label: 'Version', explanation: 'The API version — lets the server support v1 and v2 clients simultaneously during a migration.' },
  { id: 'resource', text: '/books', label: 'Resource', explanation: 'The collection being addressed — "books" is the noun this whole request is about.' },
  { id: 'id', text: '/42', label: 'Resource ID', explanation: 'Narrows the collection down to one specific member — book #42.' },
  { id: 'sub', text: '/reviews', label: 'Sub-resource', explanation: 'A resource that only makes sense in the context of its parent — the reviews belonging to book #42.' },
  { id: 'query', text: '?page=2', label: 'Query', explanation: 'Optional parameters that modify the request — here, requesting page 2 of the reviews.' },
];

@Component({
  selector: 'app-url-anatomy',
  standalone: true,
  template: `
    <section class="lab-section" id="url-anatomy">
      <div class="container">
        <p class="lab-index">REST API / 08 — URL ANATOMY</p>
        <h2 class="lab-title">Every URL is made of parts. Click one to see what it does.</h2>

        <div class="lab-panel">
          <p class="url-render mono">
            @for (s of segments; track s.id) {
              <span class="seg" [class.is-selected]="selected() === s.id" (click)="selected.set(s.id)">{{ s.text }}</span>
            }
          </p>

          <div class="seg-btn-row">
            @for (s of segments; track s.id) {
              <button type="button" class="lab-btn" [class.is-active]="selected() === s.id" (click)="selected.set(s.id)">{{ s.label }}</button>
            }
          </div>

          @if (currentSegment(); as s) {
            <p class="seg-explanation">
              <span class="seg-explanation-label mono">{{ s.label.toUpperCase() }}</span>
              {{ s.explanation }}
            </p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .url-render { font-size: 0.9375rem; line-height: 1.8; word-break: break-all; padding: 16px 18px; background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); }
    .seg { color: var(--text-muted); cursor: pointer; border-radius: 3px; padding: 2px 1px; transition: background 0.15s ease, color 0.15s ease; }
    .seg:hover { color: var(--text); }
    .seg.is-selected { color: var(--accent-strong); background: color-mix(in srgb, var(--accent) 18%, transparent); }

    .seg-btn-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; }

    .seg-explanation { margin-top: 20px; padding: 14px 16px; border-left: 3px solid var(--accent); background: var(--surface); border-radius: var(--radius-sm); font-size: 0.875rem; color: var(--text-muted); line-height: 1.6; }
    .seg-explanation-label { display: block; color: var(--accent); font-size: 0.6875rem; letter-spacing: 0.08em; margin-bottom: 6px; }
  `,
})
export class UrlAnatomy {
  protected readonly segments = SEGMENTS;
  protected readonly selected = signal<string>('resource');
  protected readonly currentSegment = computed(() => this.segments.find((s) => s.id === this.selected()) ?? null);
}
