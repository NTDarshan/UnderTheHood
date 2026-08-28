import { Component, computed, signal } from '@angular/core';
import { httpVersions } from '../../../../data/http/http-versions.data';
import { RevealDirective } from '../../../../shared/directives/reveal.directive';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

@Component({
  selector: 'app-http-evolution',
  standalone: true,
  imports: [RevealDirective, ExplainSimply],
  template: `
    <section class="lab-section" id="evolution">
      <div class="container">
        <p class="lab-index">HTTP / 03 — EVOLUTION</p>
        <h2 class="lab-title">HTTP evolved to solve the problems of the version before it.</h2>
        <p class="lab-lede">
          Each revision responded to a real engineering limitation. Click a version to see what problem
          it was built to solve.
        </p>

        <app-explain-simply>
          Think of it like mail delivery. HTTP/0.9 was one letter, one trip, then done. HTTP/1.1 realized the
          mail truck could wait at your house and deliver several letters before driving off. HTTP/2 is one
          truck carrying many parcels bundled together instead of one at a time. HTTP/3 switches to a faster
          kind of truck built to handle traffic jams better.
        </app-explain-simply>

        <div class="timeline" appReveal>
          @for (v of versions; track v.version; let i = $index) {
            <button
              type="button"
              class="timeline-item"
              [class.is-selected]="selectedIndex() === i"
              (click)="selectedIndex.set(i)"
            >
              <span class="timeline-year mono">{{ v.year }}</span>
              <span class="timeline-dot" aria-hidden="true"></span>
              <span class="timeline-version mono">{{ v.version }}</span>
            </button>
          }
        </div>

        @if (active(); as v) {
          <div class="version-detail">
            <p class="version-title">{{ v.title }}</p>
            <p class="version-desc">{{ v.description }}</p>
            @if (v.problem) {
              <div class="version-problem">
                <span class="problem-arrow mono" aria-hidden="true">↓ problem it left behind</span>
                <p>{{ v.problem }}</p>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
  styles: `
    .timeline {
      margin-top: 32px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      border-left: 1px solid var(--border-strong);
      padding-left: 4px;
    }

    @media (min-width: 900px) {
      .timeline {
        flex-direction: row;
        border-left: none;
        border-top: 1px solid var(--border-strong);
        padding-left: 0;
        padding-top: 4px;
      }
    }

    .timeline-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: transparent;
      border: 1px solid transparent;
      border-radius: var(--radius-sm);
      color: var(--text-muted);
      text-align: left;
    }

    @media (min-width: 900px) {
      .timeline-item {
        flex: 1;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }
    }

    .timeline-item:hover {
      background: var(--surface-raised);
    }

    .timeline-item.is-selected {
      border-color: var(--border);
      background: var(--surface-raised);
    }

    .timeline-year {
      font-size: 0.6875rem;
      color: var(--text-faint);
    }

    .timeline-dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--border-strong);
      flex-shrink: 0;
    }

    .timeline-item.is-selected .timeline-dot {
      background: var(--accent);
      box-shadow: 0 0 6px var(--glow-accent);
    }

    .timeline-version {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--text);
    }

    .version-detail {
      margin-top: 28px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 24px;
    }

    .version-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: var(--text);
    }

    .version-desc {
      margin-top: 10px;
      color: var(--text-muted);
      line-height: 1.65;
      max-width: 620px;
    }

    .version-problem {
      margin-top: 18px;
      padding-top: 18px;
      border-top: 1px solid var(--border);
    }

    .problem-arrow {
      display: block;
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      color: var(--accent);
      margin-bottom: 8px;
    }

    .version-problem p {
      color: var(--text-muted);
      font-size: 0.9375rem;
      line-height: 1.6;
      max-width: 600px;
    }
  `,
})
export class HttpEvolution {
  protected readonly versions = httpVersions;
  protected readonly selectedIndex = signal(2);
  protected readonly active = computed(() => this.versions[this.selectedIndex()]);
}
