import { Component, computed, signal } from '@angular/core';

@Component({
  selector: 'app-resource-thinking-lab',
  standalone: true,
  template: `
    <section class="lab-section" id="resource-thinking">
      <div class="container">
        <p class="lab-index">REST API / 06 — RESOURCE THINKING</p>
        <h2 class="lab-title">Turn a plain-English requirement into a resource.</h2>

        <div class="lab-panel">
          <p class="req-string mono">"The user wants to manage books."</p>

          @if (stage() === 0) {
            <div class="stage-block">
              <p class="stage-question">What is the resource here?</p>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn" (click)="pick('books')">books</button>
                <button type="button" class="lab-btn" (click)="pick('manage')">manage</button>
                <button type="button" class="lab-btn" (click)="pick('user')">user</button>
              </div>
              @if (picked(); as p) {
                @if (p === 'books') {
                  <p class="feedback feedback-good">Correct — "books" is the noun being managed. That's the resource.</p>
                } @else {
                  <p class="feedback feedback-bad">Not quite — "{{ p }}" describes an action or an actor, not the thing being managed. Try "books".</p>
                }
              }
              @if (picked() === 'books') {
                <div class="lab-btn-row">
                  <button type="button" class="lab-btn lab-btn-primary" (click)="next()">Next →</button>
                </div>
              }
            </div>
          }

          @if (stage() >= 1) {
            <div class="stage-block">
              <p class="stage-question">Now — "one specific book" vs "all books"?</p>
              <div class="reveal-grid">
                <div class="reveal-card">
                  <p class="reveal-label">one specific book</p>
                  <p class="reveal-path mono">/books/42</p>
                </div>
                <div class="reveal-card">
                  <p class="reveal-label">all books</p>
                  <p class="reveal-path mono">/books</p>
                </div>
              </div>
              @if (stage() === 1) {
                <div class="lab-btn-row">
                  <button type="button" class="lab-btn lab-btn-primary" (click)="next()">Next →</button>
                </div>
              }
            </div>
          }

          @if (stage() >= 2) {
            <div class="stage-block">
              <div class="card-pair">
                <div class="pair-card">
                  <p class="pair-title mono">COLLECTION RESOURCE</p>
                  <p class="pair-path mono">/books</p>
                  <p class="pair-detail">Represents the whole set — used for listing and creating.</p>
                </div>
                <div class="pair-card">
                  <p class="pair-title mono">INDIVIDUAL RESOURCE</p>
                  <p class="pair-path mono">/books/42</p>
                  <p class="pair-detail">Represents one specific member — used for reading, replacing, updating, deleting.</p>
                </div>
              </div>
              <div class="lab-btn-row">
                <button type="button" class="lab-btn" (click)="restart()">↻ Restart</button>
              </div>
            </div>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .req-string { font-size: 1rem; color: var(--text); }
    .stage-block { margin-top: 24px; padding-top: 24px; border-top: 1px solid var(--border); }
    .stage-block:first-child { margin-top: 0; padding-top: 0; border-top: none; }
    .stage-question { font-size: 0.9375rem; color: var(--text-muted); margin-bottom: 4px; }

    .feedback { margin-top: 14px; font-size: 0.8125rem; line-height: 1.55; }
    .feedback-good { color: var(--accent-2); }
    .feedback-bad { color: var(--danger); }

    .reveal-grid { margin-top: 16px; display: flex; gap: 16px; flex-wrap: wrap; }
    .reveal-card { flex: 1; min-width: 160px; padding: 14px 16px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); }
    .reveal-label { font-size: 0.75rem; color: var(--text-faint); }
    .reveal-path { margin-top: 8px; font-size: 0.9375rem; color: var(--accent-strong); }

    .card-pair { display: grid; gap: 16px; grid-template-columns: 1fr; }
    @media (min-width: 640px) {
      .card-pair { grid-template-columns: 1fr 1fr; }
    }
    .pair-card { padding: 18px 20px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); }
    .pair-title { font-size: 0.6875rem; letter-spacing: 0.08em; color: var(--accent-2); }
    .pair-path { margin-top: 10px; font-size: 1.0625rem; color: var(--text); font-weight: 700; }
    .pair-detail { margin-top: 8px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }
  `,
})
export class ResourceThinkingLab {
  protected readonly stage = signal(0);
  protected readonly picked = signal<string | null>(null);

  protected readonly isCorrect = computed(() => this.picked() === 'books');

  pick(choice: string): void {
    this.picked.set(choice);
  }

  next(): void {
    if (this.stage() === 0 && !this.isCorrect()) return;
    this.stage.update((s) => s + 1);
  }

  restart(): void {
    this.stage.set(0);
    this.picked.set(null);
  }
}
