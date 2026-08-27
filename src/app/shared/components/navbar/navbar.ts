import { Component, HostListener, signal } from '@angular/core';
import { Logo } from '../logo/logo';
import { ScrollToDirective } from '../../directives/scroll-to.directive';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [Logo, ScrollToDirective],
  template: `
    <header class="navbar" [class.scrolled]="scrolled()">
      <div class="navbar-inner container">
        <a class="navbar-brand" href="#top" appScrollTo="top" (click)="closeMenu()">
          <app-logo />
        </a>

        <nav class="navbar-links" aria-label="Primary">
          <a href="#roadmap" appScrollTo="roadmap">Explore</a>
          <a href="#roadmap" appScrollTo="roadmap">Roadmap</a>
          <a href="#about" appScrollTo="about">About</a>
        </nav>

        <button
          type="button"
          class="navbar-toggle"
          [attr.aria-expanded]="menuOpen()"
          aria-controls="mobile-nav"
          [attr.aria-label]="menuOpen() ? 'Close menu' : 'Open menu'"
          (click)="toggleMenu()"
        >
          <span class="navbar-toggle-bar"></span>
          <span class="navbar-toggle-bar"></span>
          <span class="navbar-toggle-bar"></span>
        </button>
      </div>

      @if (menuOpen()) {
        <nav id="mobile-nav" class="mobile-nav" aria-label="Mobile">
          <a href="#roadmap" appScrollTo="roadmap" (click)="closeMenu()">Explore</a>
          <a href="#roadmap" appScrollTo="roadmap" (click)="closeMenu()">Roadmap</a>
          <a href="#about" appScrollTo="about" (click)="closeMenu()">About</a>
        </nav>
      }
    </header>
  `,
  styles: `
    .navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      height: var(--nav-height);
      display: flex;
      align-items: center;
      background: color-mix(in srgb, var(--bg) 72%, transparent);
      backdrop-filter: blur(14px) saturate(140%);
      -webkit-backdrop-filter: blur(14px) saturate(140%);
      border-bottom: 1px solid transparent;
      transition: height 0.25s ease, border-color 0.25s ease, background 0.25s ease;
    }

    .navbar.scrolled {
      height: var(--nav-height-scrolled);
      border-bottom-color: var(--border);
      background: color-mix(in srgb, var(--bg) 90%, transparent);
    }

    .navbar-inner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    .navbar-links {
      display: none;
      align-items: center;
      gap: 28px;
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--text-muted);
    }

    .navbar-links a {
      transition: color 0.15s ease;
    }

    .navbar-links a:hover {
      color: var(--text);
    }

    .navbar-toggle {
      display: inline-flex;
      flex-direction: column;
      justify-content: center;
      gap: 5px;
      width: 40px;
      height: 40px;
      background: transparent;
      border: 1px solid var(--border-strong);
      border-radius: var(--radius-sm);
      padding: 0;
    }

    .navbar-toggle-bar {
      width: 16px;
      height: 1.5px;
      background: var(--text);
      margin-inline: auto;
    }

    .mobile-nav {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 24px 24px;
      background: var(--bg);
      border-bottom: 1px solid var(--border);
    }

    .mobile-nav a {
      padding: 12px 4px;
      font-size: 1rem;
      font-weight: 500;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border);
    }

    .mobile-nav a:last-child {
      border-bottom: none;
    }

    @media (min-width: 900px) {
      .navbar-links {
        display: flex;
      }
      .navbar-toggle {
        display: none;
      }
    }
  `,
})
export class Navbar {
  protected readonly scrolled = signal(false);
  protected readonly menuOpen = signal(false);

  @HostListener('window:scroll')
  onScroll() {
    this.scrolled.set(window.scrollY > 8);
  }

  toggleMenu() {
    this.menuOpen.update((v) => !v);
  }

  closeMenu() {
    this.menuOpen.set(false);
  }
}
