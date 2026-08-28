import { Component, computed, signal } from '@angular/core';

interface CookieFlag {
  id: string;
  name: string;
  detail: string;
}

const FLAGS: CookieFlag[] = [
  { id: 'httponly', name: 'HttpOnly', detail: 'Helps prevent client-side scripts from directly reading the cookie — a mitigation against certain XSS-driven token theft.' },
  { id: 'secure', name: 'Secure', detail: 'The cookie is only sent over an HTTPS connection, never plain HTTP.' },
  { id: 'samesite', name: 'SameSite', detail: 'Controls whether the cookie is sent along with cross-site requests, and is an important part of CSRF defense.' },
];

@Component({
  selector: 'app-cookie-visualizer',
  standalone: true,
  template: `
    <section class="lab-section" id="cookies">
      <div class="container">
        <p class="lab-index">AUTH / 15 — COOKIES</p>
        <h2 class="lab-title">A browser mechanism — not itself an authentication scheme.</h2>

        <div class="cookie-flow">
          <div class="cookie-step">
            <p class="step-title mono">1. Server responds</p>
            <pre class="lab-code mono">Set-Cookie: session_id=abc123</pre>
          </div>
          <div class="cookie-arrow">→</div>
          <div class="cookie-step">
            <p class="step-title mono">2. Browser stores it</p>
            <p class="step-note">Associated with this site's origin.</p>
          </div>
          <div class="cookie-arrow">→</div>
          <div class="cookie-step">
            <p class="step-title mono">3. Sent automatically</p>
            <pre class="lab-code mono">GET /profile
Cookie: session_id=abc123</pre>
          </div>
        </div>

        <p class="lab-note">
          Cookies are a browser mechanism for storing and automatically sending small pieces of data
          back to a site. They are not authentication by themselves — a cookie can carry a session
          identifier, an access token, or arbitrary other state. What the value <em>means</em> is
          decided entirely by the server's authentication architecture.
        </p>
      </div>
    </section>

    <section class="lab-section" id="cookie-flags">
      <div class="container">
        <p class="lab-index">AUTH / 16 — COOKIE SECURITY FLAGS</p>
        <h2 class="lab-title">Click an attribute to see what it actually guards against.</h2>

        <div class="flags-row">
          @for (f of flags; track f.id) {
            <button type="button" class="flag-chip mono" [class.is-active]="selected() === f.id" (click)="selected.set(f.id)">
              {{ f.name }}
            </button>
          }
        </div>

        <div class="lab-panel flag-detail">
          <p class="flag-name mono">{{ current().name }}</p>
          <p class="flag-text">{{ current().detail }}</p>
        </div>

        <p class="lab-note lab-note-warn">
          These flags reduce specific risks — they do not, by themselves, make an application secure.
        </p>
      </div>
    </section>
  `,
  styles: `
    .cookie-flow { margin-top: 28px; display: flex; flex-wrap: wrap; align-items: flex-start; gap: 16px; }
    .cookie-step { flex: 1 1 200px; }
    .step-title { font-size: 0.75rem; color: var(--accent-2); margin-bottom: 10px; }
    .step-note { font-size: 0.8125rem; color: var(--text-muted); }
    .cookie-arrow { align-self: center; color: var(--border-strong); font-size: 1.25rem; }

    .flags-row { margin-top: 28px; display: flex; flex-wrap: wrap; gap: 10px; }
    .flag-chip {
      padding: 10px 18px;
      border-radius: 999px;
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text-muted);
      font-size: 0.8125rem;
    }
    .flag-chip.is-active { border-color: var(--accent); color: var(--accent-strong); background: color-mix(in srgb, var(--accent) 12%, var(--surface-raised)); }

    .flag-detail { margin-top: 20px; }
    .flag-name { font-size: 0.9375rem; color: var(--accent-strong); }
    .flag-text { margin-top: 10px; font-size: 0.9375rem; color: var(--text-muted); line-height: 1.6; max-width: 640px; }
  `,
})
export class CookieVisualizer {
  protected readonly flags = FLAGS;
  protected readonly selected = signal('httponly');
  protected readonly current = computed(() => this.flags.find((f) => f.id === this.selected())!);
}
