import { Component, computed, signal } from '@angular/core';

interface NestingLevel {
  segments: string[];
}

const BASE: NestingLevel = {
  segments: ['authors', '1', 'books', '2', 'reviews', '3', 'comments', '4', 'users', '5'],
};

@Component({
  selector: 'app-resource-hierarchy',
  standalone: true,
  template: `
    <section class="lab-section" id="resource-hierarchy">
      <div class="container">
        <p class="lab-index">REST API / 09 — RESOURCE HIERARCHY</p>
        <h2 class="lab-title">Nested URLs communicate relationships — until they don't.</h2>
        <p class="lab-lede">A resource sitting inside another resource's URL tells the reader exactly how the two relate. But nesting is a tool, not a rule to maximize.</p>

        <div class="lab-panel">
          <p class="lab-node">GOOD — ONE LEVEL OF RELATIONSHIP</p>
          <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/authors/10/books</span> <span class="tok-dim">— books belonging to author 10</span></p>
          <p class="lab-code"><span class="tok-method">GET</span> <span class="tok-key">/books/42/reviews</span> <span class="tok-dim">— reviews belonging to book 42</span></p>

          <p class="lab-note">Both examples read naturally: the URL path itself explains "these reviews belong to this book." That's the entire value of nesting — nothing more is needed.</p>
        </div>

        <div class="lab-panel">
          <p class="lab-node">TRY IT — ADD NESTING LEVELS TO A SAMPLE URL</p>
          <p class="lab-code depth-url">
            @for (seg of visibleSegments(); track seg + $index; let i = $index) {
              <span [class.tok-key]="i % 2 === 0" [class.tok-dim]="i % 2 === 1">/{{ seg }}</span>
            }
          </p>

          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [disabled]="depth() <= 1" (click)="removeLevel()">− Remove level</button>
            <button type="button" class="lab-btn" [disabled]="depth() >= maxDepth" (click)="addLevel()">+ Add level</button>
          </div>

          <p class="depth-readout mono">Depth: {{ depth() }} resource level{{ depth() === 1 ? '' : 's' }}</p>

          @if (depth() > 3) {
            <p class="lab-note lab-note-warn">
              <strong>Too deep.</strong> At {{ depth() }} nested levels, this URL is hard to read, hard to route, and fragile to change. A flatter alternative like <strong>/{{ flatAlternative() }}</strong> usually communicates the same intent more simply — the ID alone is often enough context.
            </p>
          } @else if (depth() === 3) {
            <p class="lab-note lab-note-warn">
              Getting deep. Two levels is usually the practical ceiling before a flatter URL like <strong>/{{ flatAlternative() }}</strong> becomes the better choice.
            </p>
          } @else {
            <p class="lab-note">This depth still reads clearly — one or two relationships is the sweet spot for nested resource URLs.</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .depth-url { display: flex; flex-wrap: wrap; }
    .depth-readout { margin-top: 14px; font-size: 0.8125rem; color: var(--text-muted); }
  `,
})
export class ResourceHierarchy {
  protected readonly maxDepth = 5;
  private readonly allSegments = BASE.segments;

  protected readonly depth = signal(1);

  protected readonly visibleSegments = computed(() => this.allSegments.slice(0, this.depth() * 2));

  protected readonly flatAlternative = computed(() => {
    const segs = this.visibleSegments();
    const last = segs[segs.length - 2];
    const id = segs[segs.length - 1];
    return `${last}/${id}`;
  });

  addLevel(): void {
    if (this.depth() < this.maxDepth) this.depth.update((d) => d + 1);
  }

  removeLevel(): void {
    if (this.depth() > 1) this.depth.update((d) => d - 1);
  }
}
