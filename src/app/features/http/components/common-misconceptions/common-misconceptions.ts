import { Component, computed, signal } from '@angular/core';

interface Misconception {
  myth: string;
  reality: string;
}

const MISCONCEPTIONS: Misconception[] = [
  {
    myth: 'GET requests can never have a body.',
    reality: "The spec doesn't strictly forbid it, but a GET body has no defined meaning — many servers, proxies and clients ignore or reject it. In practice: don't rely on it.",
  },
  {
    myth: 'POST can never be made idempotent.',
    reality: 'The POST method itself has no idempotency guarantee — but an application can still design a POST endpoint to behave idempotently, commonly with an idempotency key the server deduplicates on.',
  },
  {
    myth: '404 means the whole site is down.',
    reality: "404 only means this specific resource wasn't found at this path. Everything else on the server can be working perfectly fine.",
  },
  {
    myth: '401 and 403 mean the same thing.',
    reality: "401 means you're not authenticated — no credentials, or invalid ones. 403 means the server knows who you are and is refusing anyway.",
  },
  {
    myth: '"no-cache" means the browser won\'t cache the response.',
    reality: '"no-cache" still allows storing the response — it just requires revalidating with the server before every reuse. "no-store" is the one that means don\'t cache at all.',
  },
  {
    myth: 'HTTPS means the website itself is trustworthy.',
    reality: "HTTPS only guarantees the connection is encrypted and the server's identity is verified. It says nothing about whether the site's content or intent is trustworthy.",
  },
  {
    myth: 'HTTP/3 is just "HTTP over UDP."',
    reality: 'HTTP/3 runs over QUIC — a full transport protocol built on top of UDP, handling reliability and encryption itself. It is not raw HTTP dropped directly onto UDP.',
  },
  {
    myth: 'CORS protects servers from receiving bad requests.',
    reality: "CORS protects users. It's enforced entirely by the browser — a server can still receive and process a blocked request; the browser just refuses to hand the response to the page's JavaScript.",
  },
  {
    myth: 'A 200 status means the request did exactly what you wanted.',
    reality: '200 only means the server successfully handled the request and returned a representation. The body itself might still describe an application-level failure, depending on how the API is designed.',
  },
];

@Component({
  selector: 'app-common-misconceptions',
  standalone: true,
  template: `
    <section class="lab-section" id="misconceptions">
      <div class="container">
        <p class="lab-index">HTTP / 18 — COMMON MISCONCEPTIONS</p>
        <h2 class="lab-title">Things that sound right about HTTP, but aren't.</h2>
        <p class="lab-lede">Pick one — most people believe at least a few of these.</p>

        <div class="myth-grid">
          @for (m of misconceptions; track m.myth; let i = $index) {
            <button type="button" class="myth-card" [class.is-selected]="selectedIndex() === i" (click)="selectedIndex.set(i)">
              <span class="myth-tag mono">MYTH</span>
              <span class="myth-text">{{ m.myth }}</span>
            </button>
          }
        </div>

        <div class="lab-panel reality-panel">
          <span class="reality-tag mono">ACTUALLY</span>
          <p class="reality-text">{{ active().reality }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .myth-grid {
      margin-top: 28px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 10px;
    }

    @media (min-width: 720px) {
      .myth-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .myth-card {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 16px 18px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      text-align: left;
      transition: border-color 0.15s ease, transform 0.15s ease;
    }

    .myth-card:hover {
      transform: translateY(-2px);
    }

    .myth-card.is-selected {
      border-color: var(--danger);
      box-shadow: 0 0 18px -6px var(--danger);
    }

    .myth-tag {
      font-size: 0.625rem;
      letter-spacing: 0.08em;
      color: var(--danger);
    }

    .myth-text {
      font-size: 0.9375rem;
      color: var(--text);
      line-height: 1.5;
    }

    .reality-panel {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .reality-tag {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--accent-2);
    }

    .reality-text {
      font-size: 1rem;
      color: var(--text);
      line-height: 1.65;
      max-width: 640px;
    }
  `,
})
export class CommonMisconceptions {
  protected readonly misconceptions = MISCONCEPTIONS;
  protected readonly selectedIndex = signal(0);
  protected readonly active = computed(() => this.misconceptions[this.selectedIndex()]);
}
