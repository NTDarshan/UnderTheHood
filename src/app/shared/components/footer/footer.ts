import { Component } from '@angular/core';
import { Logo } from '../logo/logo';
import { siteConfig } from '../../../data/site-config';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [Logo],
  template: `
    <footer class="site-footer">
      <div class="container footer-inner">
        <div class="footer-brand">
          <app-logo />
          <p class="footer-tagline">See how software really works.</p>
        </div>

        <p class="footer-note">
          Built by {{ siteConfig.name }} while learning backend engineering from first principles.
        </p>

        <div class="footer-links">
          @if (siteConfig.github) {
            <a [href]="siteConfig.github" target="_blank" rel="noopener">GitHub</a>
          }
          @if (siteConfig.linkedin) {
            <a [href]="siteConfig.linkedin" target="_blank" rel="noopener">LinkedIn</a>
          }
          @if (!siteConfig.github && !siteConfig.linkedin) {
            <span class="mono footer-links-pending">Links coming soon</span>
          }
        </div>

        <p class="footer-copy mono">© {{ year }} UnderTheHood</p>
      </div>
    </footer>
  `,
  styles: `
    .site-footer {
      border-top: 1px solid var(--border);
      background: var(--surface);
      padding-block: 48px;
    }

    .footer-inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
      text-align: center;
    }

    .footer-tagline {
      color: var(--text-muted);
      font-size: 0.9rem;
      margin-top: 6px;
    }

    .footer-note {
      color: var(--text-muted);
      font-size: 0.875rem;
      max-width: 420px;
    }

    .footer-links {
      display: flex;
      gap: 20px;
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    .footer-links a:hover {
      color: var(--accent-strong);
    }

    .footer-links-pending {
      color: var(--text-faint);
      font-size: 0.75rem;
    }

    .footer-copy {
      color: var(--text-faint);
      font-size: 0.75rem;
      margin-top: 8px;
    }
  `,
})
export class Footer {
  protected readonly siteConfig = siteConfig;
  protected readonly year = new Date().getFullYear();
}
