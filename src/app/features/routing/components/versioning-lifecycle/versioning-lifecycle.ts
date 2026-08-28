import { Component, signal } from '@angular/core';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

type Lifecycle = 'active' | 'deprecated' | 'sunset';

@Component({
  selector: 'app-versioning-lifecycle',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="versioning">
      <div class="container">
        <p class="lab-index">ROUTING / 11 — ROUTE VERSIONING &amp; DEPRECATION</p>
        <h2 class="lab-title">APIs change. Existing clients shouldn't break because of it.</h2>
        <p class="lab-lede">
          Versioning gives a route space to evolve without pulling the floor out from under whoever is
          already calling it.
        </p>

        <app-explain-simply>
          It's like renovating a building while people still live in it — you open a new wing (v2) instead
          of demolishing the old one (v1) overnight. Residents move at their own pace.
        </app-explain-simply>

        <div class="version-split">
          <div class="version-col">
            <p class="version-client mono">Client A</p>
            <p class="version-arrow" aria-hidden="true">↓</p>
            <p class="version-route mono">/api/v1/users</p>
            <p class="version-arrow" aria-hidden="true">↓</p>
            <p class="version-handler mono">Version 1 Handler</p>
          </div>
          <div class="version-col">
            <p class="version-client mono">Client B</p>
            <p class="version-arrow" aria-hidden="true">↓</p>
            <p class="version-route mono">/api/v2/users</p>
            <p class="version-arrow" aria-hidden="true">↓</p>
            <p class="version-handler mono">Version 2 Handler</p>
          </div>
        </div>

        <p class="lab-note">
          Both handlers can run side by side, indefinitely — a client only has to migrate when it chooses to.
        </p>

        <p class="sub-heading mono">DEPRECATION LIFECYCLE</p>
        <p class="lab-lede small-lede">
          Deprecation is a communication strategy, not a deletion. A route usually passes through three
          states before it's ever actually removed.
        </p>

        <div class="lifecycle-row">
          @for (stage of stages; track stage) {
            <button type="button" class="lifecycle-node" [class.is-active]="current() === stage" (click)="current.set(stage)">
              {{ stage.toUpperCase() }}
            </button>
          }
        </div>

        <div class="lifecycle-panel">
          <p class="lifecycle-route mono">/api/v1/users <span class="badge" [class]="'badge-' + current()">{{ current().toUpperCase() }}</span></p>
          <p class="lifecycle-detail">{{ detail() }}</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .version-split {
      margin-top: 28px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    @media (min-width: 640px) {
      .version-split {
        grid-template-columns: 1fr 1fr;
      }
    }

    .version-col {
      text-align: center;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 20px;
    }

    .version-client {
      color: var(--text-faint);
      font-size: 0.8125rem;
    }

    .version-arrow {
      color: var(--border-strong);
      margin: 8px 0;
    }

    .version-route {
      color: var(--accent-2);
      font-size: 0.9375rem;
    }

    .version-handler {
      color: var(--accent);
      font-weight: 600;
      margin-top: 8px;
    }

    .sub-heading {
      margin-top: 44px;
      color: var(--accent-2);
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
    }

    .small-lede {
      margin-top: 8px;
      font-size: 0.9375rem;
      max-width: 620px;
    }

    .lifecycle-row {
      margin-top: 24px;
      display: flex;
      gap: 12px;
    }

    .lifecycle-node {
      flex: 1;
      padding: 12px;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-strong);
      background: var(--surface-elevated);
      color: var(--text-faint);
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.04em;
    }

    .lifecycle-node.is-active {
      border-color: var(--accent);
      color: var(--accent);
      box-shadow: 0 0 16px var(--glow-accent);
    }

    .lifecycle-panel {
      margin-top: 20px;
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 22px;
    }

    .lifecycle-route {
      color: var(--text);
      font-size: 0.9375rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .badge {
      font-size: 0.625rem;
      padding: 3px 8px;
      border-radius: 999px;
      letter-spacing: 0.06em;
    }

    .badge-active {
      color: var(--accent-2);
      border: 1px solid var(--accent-2-dim);
    }

    .badge-deprecated {
      color: var(--accent);
      border: 1px solid var(--accent-dim);
    }

    .badge-sunset {
      color: var(--danger);
      border: 1px solid var(--danger);
    }

    .lifecycle-detail {
      margin-top: 12px;
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
    }
  `,
})
export class VersioningLifecycle {
  protected readonly stages: Lifecycle[] = ['active', 'deprecated', 'sunset'];
  protected readonly current = signal<Lifecycle>('deprecated');

  protected detail(): string {
    switch (this.current()) {
      case 'active':
        return 'Fully supported. New integrations are welcome to use this version.';
      case 'deprecated':
        return 'Still works, but a warning is usually attached to responses (a Deprecation header, docs notice, or changelog entry) telling clients to migrate before it disappears.';
      case 'sunset':
        return 'The route is removed or returns an error. By this point, clients should already have migrated to a newer version.';
    }
  }
}
