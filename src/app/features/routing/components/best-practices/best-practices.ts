import { Component } from '@angular/core';

const GOOD = ['/users', '/users/123', '/users/123/orders'];
const BAD = ['/getUsers', '/createUser', '/deleteUser/123'];

const PRACTICES = [
  'Keep URLs predictable',
  'Prefer resource-oriented naming over action-oriented naming',
  'Use HTTP methods consistently to express intent',
  'Use path parameters for resource identity',
  'Use query parameters for filtering, sorting, and pagination',
  'Be deliberate about route ordering — specific before generic',
  'Use constraints where they prevent an obviously wrong match',
  'Keep versioning strategy explicit',
  'Avoid overly broad catch-all routes placed too early',
  'Keep route structures maintainable as the table grows',
  'Design routes for long-term API evolution',
];

@Component({
  selector: 'app-best-practices',
  standalone: true,
  template: `
    <section class="lab-section" id="best-practices">
      <div class="container">
        <p class="lab-index">ROUTING / 17 — ROUTE NAMING &amp; BEST PRACTICES</p>
        <h2 class="lab-title">The method already says what you're doing. The URL doesn't need to repeat it.</h2>
        <p class="lab-lede">
          Resource-oriented URLs paired with the right HTTP method communicate intent more cleanly than
          baking the verb into the path.
        </p>

        <div class="naming-grid">
          <div class="naming-col good">
            <p class="naming-heading mono">GOOD</p>
            <ul class="naming-list mono">
              @for (u of good; track u) {
                <li>{{ u }}</li>
              }
            </ul>
          </div>
          <div class="naming-col bad">
            <p class="naming-heading mono">AVOID</p>
            <ul class="naming-list mono">
              @for (u of bad; track u) {
                <li>{{ u }}</li>
              }
            </ul>
          </div>
        </div>

        <p class="lab-note">
          <span class="mono">DELETE /users/123</span> already says "delete user 123" — spelling that out
          again as <span class="mono">/deleteUser/123</span> just duplicates what the method already told you.
        </p>

        <ul class="checklist">
          @for (p of practices; track p) {
            <li class="checklist-item">
              <span class="check-mark" aria-hidden="true">✓</span>
              <span>{{ p }}</span>
            </li>
          }
        </ul>
      </div>
    </section>
  `,
  styles: `
    .naming-grid {
      margin-top: 28px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 16px;
    }

    @media (min-width: 640px) {
      .naming-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .naming-col {
      padding: 18px;
      border-radius: var(--radius-lg);
      border: 1px solid var(--border);
      background: var(--surface-raised);
    }

    .naming-col.good {
      border-left: 3px solid var(--accent-2);
    }

    .naming-col.bad {
      border-left: 3px solid var(--danger);
    }

    .naming-heading {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      margin-bottom: 10px;
    }

    .naming-col.good .naming-heading { color: var(--accent-2); }
    .naming-col.bad .naming-heading { color: var(--danger); }

    .naming-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      font-size: 0.875rem;
      color: var(--text);
    }

    .checklist {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 4px;
    }

    @media (min-width: 720px) {
      .checklist {
        grid-template-columns: 1fr 1fr;
      }
    }

    .checklist-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      font-size: 0.9375rem;
      color: var(--text-muted);
    }

    .check-mark {
      color: var(--accent-2);
      font-weight: 700;
      flex-shrink: 0;
    }
  `,
})
export class BestPractices {
  protected readonly good = GOOD;
  protected readonly bad = BAD;
  protected readonly practices = PRACTICES;
}
