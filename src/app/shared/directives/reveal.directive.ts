import { AfterViewInit, Directive, ElementRef, OnDestroy, inject, input } from '@angular/core';

/**
 * Adds `.reveal` + toggles `.is-visible` when the host enters the viewport.
 * Pure CSS handles the actual transition (see styles.css `.reveal`).
 */
@Directive({
  selector: '[appReveal]',
  standalone: true,
  host: {
    class: 'reveal',
  },
})
export class RevealDirective implements AfterViewInit, OnDestroy {
  readonly appRevealDelay = input(0, { alias: 'appRevealDelay' });

  private readonly el = inject(ElementRef<HTMLElement>);
  private observer?: IntersectionObserver;

  ngAfterViewInit(): void {
    const host = this.el.nativeElement;

    if (typeof IntersectionObserver === 'undefined') {
      host.classList.add('is-visible');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            window.setTimeout(() => host.classList.add('is-visible'), this.appRevealDelay());
            this.observer?.unobserve(host);
          }
        }
      },
      { threshold: 0.15 },
    );

    this.observer.observe(host);
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
