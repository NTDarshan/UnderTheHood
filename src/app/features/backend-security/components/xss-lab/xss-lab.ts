import { Component, computed, signal } from '@angular/core';

type Mode = 'unsafe' | 'escaped';

interface XssType {
  id: string;
  label: string;
  mechanism: string;
  example: string;
}

interface Defense {
  id: string;
  label: string;
  description: string;
}

const XSS_TYPES: XssType[] = [
  {
    id: 'stored',
    label: 'Stored XSS',
    mechanism: 'Malicious content is saved server-side — e.g. in a comment or profile field — and served to every future visitor who views that page.',
    example: 'A forum comment containing a script tag gets saved to the database and rendered for every reader of the thread.',
  },
  {
    id: 'reflected',
    label: 'Reflected XSS',
    mechanism: "Malicious content comes from the current request — e.g. a query parameter — and is immediately echoed back into the page's response.",
    example: 'A search page prints ?q= back onto the results page without encoding it, so the query string itself becomes markup.',
  },
  {
    id: 'dom',
    label: 'DOM-based XSS',
    mechanism: 'The vulnerability lives entirely in client-side JavaScript that unsafely inserts untrusted data into the page, without the server necessarily reflecting anything.',
    example: 'Front-end code reads location.hash and writes it into innerHTML directly — the server response never contained the payload at all.',
  },
];

const DEFENSES: Defense[] = [
  {
    id: 'encoding',
    label: 'Output encoding',
    description: 'Convert special characters so they display as text instead of being parsed as markup.',
  },
  {
    id: 'context',
    label: 'Context-aware escaping',
    description: "The correct encoding differs depending on whether you're inserting into HTML body, an HTML attribute, a URL, or JavaScript — one-size-fits-all escaping doesn't work everywhere.",
  },
  {
    id: 'csp',
    label: 'Content Security Policy',
    description: 'A browser-enforced allowlist restricting what scripts/resources a page may load or execute, as defense-in-depth beyond escaping.',
  },
  {
    id: 'input',
    label: 'Input handling',
    description: 'Validating/normalizing input is helpful but is a secondary control — it does not replace safe output handling.',
  },
];

const DEFAULT_COMMENT = `<script>alert('you have been xss-ed')</script>`;

@Component({
  selector: 'app-xss-lab',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="xss-lab">
      <div class="container">
        <p class="lab-index">20 — CROSS-SITE SCRIPTING (XSS)</p>
        <h2 class="lab-title">Untrusted content becomes dangerous the moment it's treated as code instead of text.</h2>
        <p class="lab-lede">
          XSS happens when untrusted content is interpreted as executable browser-side code instead of being
          treated as inert text/data — the same DATA vs CODE confusion behind every injection class.
        </p>

        <div class="lab-panel">
          <div class="flow-row mono" aria-hidden="false">
            <span class="lab-node" style="color: var(--c-attacker)">ATTACKER-CONTROLLED INPUT</span>
            <span class="lab-flow-arrow">&#8594;</span>
            <span class="lab-node" style="color: var(--c-server)">WEB PAGE</span>
            <span class="lab-flow-arrow">&#8594;</span>
            <span class="lab-node" style="color: var(--c-client)">BROWSER</span>
          </div>

          <p class="part-label mono">TRY IT — WHAT THE PAGE DOES WITH YOUR COMMENT</p>

          <div class="lab-field">
            <label for="xss-comment">Comment text</label>
            <textarea
              id="xss-comment"
              class="comment-input mono"
              rows="2"
              [value]="comment()"
              (input)="onCommentInput($event)"
            ></textarea>
          </div>

          <div class="lab-btn-row" role="group" aria-label="Rendering mode">
            <button
              type="button"
              class="lab-btn lab-btn-danger"
              [class.is-active]="mode() === 'unsafe'"
              [attr.aria-pressed]="mode() === 'unsafe'"
              (click)="setMode('unsafe')"
            >
              UNSAFE (interpreted as markup)
            </button>
            <button
              type="button"
              class="lab-btn"
              [class.is-active]="mode() === 'escaped'"
              [attr.aria-pressed]="mode() === 'escaped'"
              (click)="setMode('escaped')"
            >
              ESCAPED (rendered as text)
            </button>
          </div>

          <div class="render-preview" [class.is-unsafe]="mode() === 'unsafe'" [class.is-safe]="mode() === 'escaped'">
            <p class="preview-label mono">PAGE OUTPUT</p>
            <div class="preview-body">
              <span class="preview-comment-prefix mono">comment:</span>
              @if (mode() === 'escaped') {
                <span class="preview-text mono">{{ comment() }}</span>
              } @else {
                <span class="preview-text preview-text-dim mono">[rendered as page markup — see below]</span>
              }
            </div>

            @if (mode() === 'unsafe' && hasScript()) {
              <div class="mock-alert" role="alert">
                <div class="mock-alert-titlebar mono">
                  <span>this page says</span>
                </div>
                <div class="mock-alert-body">{{ alertMessage() }}</div>
                <button type="button" class="lab-btn mock-alert-ok" (click)="dismissAlert()">OK</button>
                <p class="mock-alert-caption mono">illustrative mock — no real script executed on this page</p>
              </div>
            } @else if (mode() === 'escaped') {
              <p class="safe-note mono">&amp;lt;script&amp;gt;...&amp;lt;/script&amp;gt; — displayed as literal characters, never parsed.</p>
            }
          </div>

          <p class="part-label mono">THREE KINDS OF XSS</p>
          <div class="types-grid">
            @for (t of xssTypes; track t.id) {
              <div class="type-card">
                <p class="type-label mono">{{ t.label }}</p>
                <p class="type-mechanism">{{ t.mechanism }}</p>
                <p class="type-example mono">{{ t.example }}</p>
              </div>
            }
          </div>

          <p class="part-label mono">DEFENSIVE CONCEPTS</p>
          <div class="defenses-grid">
            @for (d of defenses; track d.id) {
              <div class="defense-card">
                <p class="defense-label mono">{{ d.label }}</p>
                <p class="defense-desc">{{ d.description }}</p>
              </div>
            }
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          Input filtering alone does not solve XSS — the fix is safe OUTPUT handling at the point content is
          rendered, since the same value can need different treatment in different contexts.
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

    .flow-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
      padding: 14px 16px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
    }

    .part-label { color: var(--text-faint); letter-spacing: 0.12em; font-size: 0.75rem; margin-bottom: 10px; margin-top: 28px; }
    .part-label:first-of-type { margin-top: 24px; }

    .comment-input {
      resize: vertical;
      min-height: 60px;
      width: 100%;
    }

    .render-preview {
      margin-top: 18px;
      padding: 16px;
      background: var(--surface);
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-md);
      transition: border-color 0.2s ease;
    }
    .render-preview.is-unsafe { border-color: var(--attack); }
    .render-preview.is-safe { border-color: var(--trust); }

    .preview-label { font-size: 0.6875rem; color: var(--text-faint); letter-spacing: 0.08em; margin-bottom: 8px; }
    .preview-body { display: flex; gap: 8px; flex-wrap: wrap; align-items: baseline; }
    .preview-comment-prefix { color: var(--text-faint); }
    .preview-text { color: var(--text); word-break: break-word; }
    .preview-text-dim { color: var(--text-faint); font-style: italic; }

    .mock-alert {
      margin-top: 16px;
      max-width: 360px;
      background: var(--surface-elevated);
      border: 2px solid var(--attack);
      border-radius: var(--radius-md);
      box-shadow: 0 0 0 4px color-mix(in srgb, var(--attack) 14%, transparent);
      overflow: hidden;
    }
    .mock-alert-titlebar {
      background: color-mix(in srgb, var(--attack) 22%, var(--surface-elevated));
      color: var(--attack);
      padding: 6px 12px;
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }
    .mock-alert-body { padding: 16px 14px 8px; color: var(--text); font-size: 0.9375rem; }
    .mock-alert-ok { margin: 4px 14px 12px; }
    .mock-alert-caption { padding: 0 14px 12px; font-size: 0.6875rem; color: var(--text-faint); }

    .safe-note { margin-top: 12px; font-size: 0.8125rem; color: var(--trust); }

    .types-grid, .defenses-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 14px;
    }
    @media (min-width: 720px) {
      .types-grid, .defenses-grid { grid-template-columns: 1fr 1fr 1fr; }
    }

    .type-card, .defense-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 16px;
    }
    .type-label, .defense-label { font-size: 0.8125rem; font-weight: 700; color: var(--c-attacker); margin-bottom: 8px; letter-spacing: 0.02em; }
    .defense-label { color: var(--blocked); }
    .type-mechanism, .defense-desc { font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }
    .type-example { margin-top: 10px; font-size: 0.75rem; color: var(--text-faint); line-height: 1.5; }
  `,
})
export class XssLab {
  protected readonly xssTypes = XSS_TYPES;
  protected readonly defenses = DEFENSES;

  protected readonly comment = signal(DEFAULT_COMMENT);
  protected readonly mode = signal<Mode>('unsafe');
  protected readonly alertDismissed = signal(false);

  protected readonly hasScript = computed(() => !this.alertDismissed() && this.comment().trim().length > 0);

  protected readonly alertMessage = computed(() => {
    const match = this.comment().match(/alert\((['"])(.*?)\1\)/);
    return match ? match[2] : 'you have been xss-ed';
  });

  onCommentInput(event: Event): void {
    const value = (event.target as HTMLTextAreaElement).value;
    this.comment.set(value);
    this.alertDismissed.set(false);
  }

  setMode(mode: Mode): void {
    this.mode.set(mode);
    this.alertDismissed.set(false);
  }

  dismissAlert(): void {
    this.alertDismissed.set(true);
  }
}
