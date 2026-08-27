import { Directive, HostListener, inject, input } from '@angular/core';
import { Router } from '@angular/router';

/**
 * Smooth-scrolls to a section by id, from any route, on every click —
 * including repeat clicks between two links that target the same section
 * (a plain `<a href="#id">` only re-scrolls when the hash actually
 * changes, so alternating between e.g. "Explore" and "Roadmap", which
 * both point at #roadmap, would otherwise silently do nothing on the
 * second click).
 */
@Directive({
  selector: '[appScrollTo]',
  standalone: true,
})
export class ScrollToDirective {
  readonly appScrollTo = input.required<string>();

  private readonly router = inject(Router);

  @HostListener('click', ['$event'])
  onClick(event: Event) {
    event.preventDefault();
    const id = this.appScrollTo();

    if (location.pathname === '/') {
      this.scrollToId(id);
      return;
    }

    this.router.navigateByUrl('/').then(() => {
      setTimeout(() => this.scrollToId(id), 60);
    });
  }

  private scrollToId(id: string) {
    const el = document.getElementById(id);
    if (!el) {
      return;
    }
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    history.replaceState(null, '', `#${id}`);
  }
}
