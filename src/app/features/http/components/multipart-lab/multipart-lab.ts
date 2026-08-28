import { Component, computed, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

interface Part {
  id: number;
  kind: 'text' | 'file';
  name: string;
}

@Component({
  selector: 'app-multipart-lab',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="multipart">
      <div class="container">
        <p class="lab-index">HTTP / 14 — MULTIPART DATA</p>
        <h2 class="lab-title">One HTTP body, several independent parts.</h2>
        <p class="lab-lede">
          <span class="mono">multipart/form-data</span> separates a body into parts, each with its own metadata,
          divided by a boundary string — the mechanism behind file uploads alongside form fields.
        </p>

        <app-explain-simply>
          It's like a single envelope containing several separate letters, each with its own label, and a
          labeled divider slipped between them — so whoever opens the envelope knows exactly where one letter
          ends and the next one starts.
        </app-explain-simply>

        <div class="lab-btn-row">
          <button type="button" class="lab-btn lab-btn-primary" (click)="addPart('text')">Add Text Part</button>
          <button type="button" class="lab-btn" (click)="addPart('file')">Add File Part</button>
          <button type="button" class="lab-btn lab-btn-danger" (click)="removePart()" [disabled]="parts().length === 0">Remove Part</button>
        </div>

        <div class="lab-panel">
          <p class="mono content-type-line">Content-Type: multipart/form-data; boundary=----UnderTheHood</p>
          <pre class="lab-code body-preview">{{ bodyPreview() }}</pre>
        </div>
        <p class="lab-note">Each part carries its own headers — a file part typically declares a filename and content type; a text part is usually just a name.</p>
        <p class="lab-note">
          The <strong>boundary</strong> is just a unique string the client picks and repeats before every part — the
          server splits the raw body wherever that exact line appears, and a final boundary with a trailing
          <span class="mono">--</span> marks the end.
        </p>
      </div>
    </section>
  `,
  styles: `
    .content-type-line {
      color: var(--accent-2);
      font-size: 0.8125rem;
      margin-bottom: 16px;
    }

    .body-preview {
      max-height: 420px;
      overflow-y: auto;
    }
  `,
})
export class MultipartLab {
  private nextId = 1;
  protected readonly parts = signal<Part[]>([
    { id: 1, kind: 'text', name: 'title' },
    { id: 2, kind: 'file', name: 'avatar' },
  ]);

  constructor() {
    this.nextId = 3;
  }

  addPart(kind: 'text' | 'file'): void {
    const name = kind === 'file' ? `upload-${this.nextId}` : `field-${this.nextId}`;
    this.parts.update((p) => [...p, { id: this.nextId++, kind, name }]);
  }

  removePart(): void {
    this.parts.update((p) => p.slice(0, -1));
  }

  protected readonly bodyPreview = computed(() => {
    const boundary = '----UnderTheHood';
    const chunks = this.parts().map((p) => {
      const disposition =
        p.kind === 'file'
          ? `Content-Disposition: form-data; name="${p.name}"; filename="${p.name}.png"\nContent-Type: image/png`
          : `Content-Disposition: form-data; name="${p.name}"`;
      const body = p.kind === 'file' ? '[binary file data]' : '{ sample text value }';
      return `--${boundary}\n${disposition}\n\n${body}`;
    });
    return [...chunks, `--${boundary}--`].join('\n');
  });
}
