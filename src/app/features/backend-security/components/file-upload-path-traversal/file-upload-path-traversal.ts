import { Component, computed, signal } from '@angular/core';

interface UploadIssue {
  id: string;
  label: string;
  consequence: string;
}

interface PipelineStage {
  id: string;
  label: string;
  detail: string;
}

const ISSUES: UploadIssue[] = [
  {
    id: 'unexpected-type',
    label: 'Unexpected file types',
    consequence: 'A user uploads "vacation.jpg.php" — an executable script disguised behind an image-looking extension.',
  },
  {
    id: 'oversized',
    label: 'Oversized files',
    consequence: 'A 40 GB upload arrives with no limit set, exhausting disk space and memory on the server.',
  },
  {
    id: 'malicious-content',
    label: 'Malicious content',
    consequence: 'The file is renamed to look like a PNG, but its actual bytes are an executable — content does not match the claimed type.',
  },
  {
    id: 'path-traversal',
    label: 'Path traversal',
    consequence: 'The filename itself contains "../" segments that walk the stored path outside the intended folder — see Part B below.',
  },
  {
    id: 'executable-uploads',
    label: 'Executable uploads',
    consequence: 'The upload lands inside a directory the web server will actually execute as code, not just serve as a static file.',
  },
];

const PIPELINE: PipelineStage[] = [
  { id: 'validate', label: 'Validate', detail: 'Check the actual file content/type, not just the extension the client sent.' },
  { id: 'limit', label: 'Limit size', detail: 'Reject uploads above a sane maximum before they consume disk or memory.' },
  { id: 'rename', label: 'Generate safe filename', detail: 'Never trust the client-provided name directly — assign a new generated name or ID.' },
  { id: 'store', label: 'Store outside executable paths', detail: 'Uploads live somewhere the web server will not execute as code.' },
  { id: 'scan', label: 'Scan where appropriate', detail: 'Malware scanning for user-generated content at scale, before it is served to others.' },
  { id: 'serve', label: 'Serve safely', detail: 'Serve via a controlled download endpoint (or separate domain) with correct content-type headers — never executed directly.' },
];

type TraversalState = 'normal' | 'attack' | 'blocked';

@Component({
  selector: 'app-file-upload-path-traversal',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="file-upload-security">
      <div class="container">
        <p class="lab-index">26 — FILE UPLOAD SECURITY &amp; PATH TRAVERSAL</p>
        <h2 class="lab-title">A file upload hands a stranger's bytes to your server. Every step after that is a trust decision.</h2>
        <p class="lab-lede">
          Part A covers what can go wrong when a user uploads a file. Part B is a focused mini-lab on one of those
          problems — path traversal — showing exactly how it happens and how it's fixed.
        </p>

        <div class="lab-panel">
          <p class="part-heading mono">PART A — FILE UPLOAD SECURITY</p>

          <div class="actor-flow mono">
            <span class="lab-node actor-user">USER</span>
            <span class="lab-flow-arrow">upload →</span>
            <span class="lab-node actor-server">SERVER</span>
            <span class="lab-flow-arrow">→</span>
            <span class="lab-node actor-storage">STORAGE</span>
          </div>

          <p class="issues-heading mono">POTENTIAL PROBLEMS — toggle to see the consequence</p>
          <div class="issue-grid" role="group" aria-label="Toggle upload issues">
            @for (issue of issues; track issue.id) {
              <button
                type="button"
                class="lab-btn issue-btn lab-btn-danger"
                [class.is-active]="isIssueOn(issue.id)"
                [attr.aria-pressed]="isIssueOn(issue.id)"
                (click)="toggleIssue(issue.id)"
              >
                {{ issue.label }}
              </button>
            }
          </div>
          <div class="issue-detail-list">
            @for (issue of issues; track issue.id) {
              @if (isIssueOn(issue.id)) {
                <p class="issue-consequence">{{ issue.consequence }}</p>
              }
            }
          </div>

          <p class="issues-heading mono">SECURE PIPELINE — click each stage</p>
          <div class="pipeline-row" role="group" aria-label="Upload pipeline stages">
            @for (stage of pipeline; track stage.id; let last = $last) {
              <button
                type="button"
                class="lab-btn stage-btn"
                [class.is-active]="activeStage() === stage.id"
                [attr.aria-pressed]="activeStage() === stage.id"
                (click)="toggleStage(stage.id)"
              >
                {{ stage.label }}
              </button>
              @if (!last) {
                <span class="lab-flow-arrow pipeline-arrow">→</span>
              }
            }
          </div>
          @if (activeStageDetail()) {
            <p class="stage-detail" role="status">{{ activeStageDetail() }}</p>
          }
        </div>

        <div class="lab-panel">
          <p class="part-heading mono">PART B — PATH TRAVERSAL MINI-LAB</p>
          <p class="part-sub">
            The app intends to serve files from <code class="mono">/uploads/&lt;filename&gt;</code>.
          </p>

          <div class="lab-field filename-field">
            <label for="traversal-filename">Filename requested</label>
            <input
              id="traversal-filename"
              type="text"
              [value]="filename()"
              (input)="onFilenameInput($event)"
              aria-describedby="resolved-path"
            />
          </div>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" (click)="setFilename('photo.jpg')">Use normal filename</button>
            <button type="button" class="lab-btn lab-btn-danger" (click)="setFilename('../../etc/passwd')">Try traversal</button>
            <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="fixOn()" [attr.aria-pressed]="fixOn()" (click)="fixOn.set(!fixOn())">
              Fix: {{ fixOn() ? 'ON' : 'OFF' }}
            </button>
          </div>

          <div class="path-visual" id="resolved-path" role="status">
            <p class="lab-node">INTENDED ROOT: /uploads/</p>
            <div class="path-segments mono">
              <span class="segment root-segment">/uploads/</span>
              @for (seg of segments(); track $index) {
                <span class="segment" [class.is-climb]="seg === '..'" [class.is-blocked]="state() === 'blocked'">{{ seg }}/</span>
              }
              @if (finalSegment()) {
                <span class="segment final-segment" [class.is-attack]="state() === 'attack'" [class.is-blocked]="state() === 'blocked'">{{ finalSegment() }}</span>
              }
            </div>

            @switch (state()) {
              @case ('normal') {
                <p class="pill pill-yes">RESOLVES INSIDE /uploads/</p>
                <p class="result-line">File is served correctly from the intended directory.</p>
              }
              @case ('attack') {
                <p class="pill pill-no result-pill-attack">ESCAPED /uploads/</p>
                <p class="result-line result-attack">
                  Each "../" climbs one directory up. The final path lands outside the allowed folder entirely —
                  the server would now read a file it was never meant to expose.
                </p>
              }
              @case ('blocked') {
                <p class="pill pill-yes result-pill-blocked">REJECTED</p>
                <p class="result-line result-blocked">
                  The server resolved all "../" segments to find the TRUE final path, recognized it as escaping
                  /uploads/, and rejected the request before touching the filesystem.
                </p>
              }
            }
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          Restrict access to allowed directories, and never trust a client-provided filename as a literal, safe
          path component — canonicalize the path first, then verify it is still inside the allowed directory
          before serving anything.
        </p>
      </div>
    </section>
  `,
  styles: `
    :host {
      --trust: #4ade80;
      --suspicious: var(--accent);
      --attack: var(--danger);
      --compromised: #dc2626;
      --blocked: #4fd3e8;
      --c-client: var(--accent-2);
      --c-server: #60a5fa;
      --c-db: #a78bfa;
      --c-attacker: #f472b6;
      display: block;
    }

    .part-heading { color: var(--accent-2); font-size: 0.75rem; letter-spacing: 0.1em; }
    .part-sub { margin-top: 8px; color: var(--text-muted); font-size: 0.9375rem; }

    .actor-flow { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; font-size: 0.75rem; margin-top: 4px; }
    .actor-user { color: var(--c-client); }
    .actor-server { color: var(--c-server); }
    .actor-storage { color: var(--c-db); }

    .issues-heading { margin-top: 26px; font-size: 0.6875rem; letter-spacing: 0.1em; color: var(--text-faint); }
    .issue-grid { margin-top: 12px; display: flex; flex-wrap: wrap; gap: 10px; }
    .issue-btn { text-transform: none; letter-spacing: normal; font-family: var(--font-sans); font-weight: 500; font-size: 0.8125rem; }
    .issue-detail-list { margin-top: 10px; display: flex; flex-direction: column; gap: 8px; }
    .issue-consequence { font-size: 0.8125rem; color: var(--attack); line-height: 1.55; border-left: 2px solid var(--attack); padding-left: 10px; }

    .pipeline-row { margin-top: 12px; display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
    .stage-btn { text-transform: none; letter-spacing: normal; font-family: var(--font-sans); font-weight: 500; font-size: 0.8125rem; }
    .pipeline-arrow { font-size: 0.875rem; }
    .stage-detail { margin-top: 12px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; padding: 10px 14px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }

    .filename-field { margin-top: 20px; max-width: 420px; }
    .filename-field input { width: 100%; }

    .path-visual { margin-top: 20px; padding: 16px; border: 1px solid var(--border); border-radius: var(--radius-md); background: var(--surface); }
    .path-segments { margin-top: 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 2px; font-size: 0.8125rem; }
    .segment { padding: 4px 6px; border-radius: var(--radius-sm); color: var(--text-muted); }
    .segment.root-segment { color: var(--trust); font-weight: 600; }
    .segment.is-climb { color: var(--attack); font-weight: 700; }
    .segment.final-segment { font-weight: 700; }
    .segment.final-segment.is-attack { color: var(--attack); background: color-mix(in srgb, var(--attack) 15%, transparent); }
    .segment.final-segment.is-blocked, .segment.is-blocked { color: var(--blocked); }

    .result-line { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }
    .result-attack { color: var(--text); }
    .result-blocked { color: var(--text); }
    .result-pill-attack { color: var(--attack); border-color: var(--attack); }
    .result-pill-blocked { color: var(--blocked); border-color: var(--blocked); }
  `,
})
export class FileUploadPathTraversal {
  protected readonly issues = ISSUES;
  protected readonly pipeline = PIPELINE;

  protected readonly activeIssues = signal<Set<string>>(new Set());
  protected readonly activeStage = signal<string | null>(null);

  protected readonly filename = signal('photo.jpg');
  protected readonly fixOn = signal(false);

  protected readonly activeStageDetail = computed(() => {
    const id = this.activeStage();
    return id ? this.pipeline.find((s) => s.id === id)?.detail ?? null : null;
  });

  protected readonly segments = computed(() => {
    const parts = this.filename().split('/');
    return parts.slice(0, -1);
  });

  protected readonly finalSegment = computed(() => {
    const parts = this.filename().split('/');
    return parts[parts.length - 1] ?? '';
  });

  protected readonly isTraversal = computed(() => this.filename().includes('..'));

  protected readonly state = computed<TraversalState>(() => {
    if (!this.isTraversal()) return 'normal';
    return this.fixOn() ? 'blocked' : 'attack';
  });

  protected isIssueOn(id: string): boolean {
    return this.activeIssues().has(id);
  }

  protected toggleIssue(id: string): void {
    this.activeIssues.update((set) => {
      const next = new Set(set);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  protected toggleStage(id: string): void {
    this.activeStage.update((cur) => (cur === id ? null : id));
  }

  protected onFilenameInput(event: Event): void {
    this.filename.set((event.target as HTMLInputElement).value);
  }

  protected setFilename(value: string): void {
    this.filename.set(value);
  }
}
