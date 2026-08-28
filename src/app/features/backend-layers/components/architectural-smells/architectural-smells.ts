import { Component, signal } from '@angular/core';

const SMELLS = [
  'Fat controller',
  'God service',
  'Repository containing business rules',
  'Business logic dependent on HTTP status codes',
  'Controllers directly executing SQL',
  'Global mutable request state',
  'Context object containing everything',
  'Passing HTTP request objects deep into business logic',
  'Repeating authentication/logging/error handling in every controller',
  'Repository methods that do unrelated operations',
];

@Component({
  selector: 'app-architectural-smells',
  standalone: true,
  template: `
    <section class="lab-section" id="architectural-smells">
      <div class="container">
        <p class="lab-index">BACKEND LAYERS / 23 — COMMON ARCHITECTURAL MISTAKES</p>
        <h2 class="lab-title">Ten smells that show up in almost every codebase that skipped this chapter.</h2>

        <div class="smell-grid">
          @for (s of smells; track s) {
            <div class="smell-card">{{ s }}</div>
          }
        </div>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'controller'" (click)="mode.set('controller')">God Controller</button>
            <button type="button" class="lab-btn" [class.is-active]="mode() === 'service'" (click)="mode.set('service')">God Service</button>
            <button type="button" class="lab-btn lab-btn-primary" (click)="refactored.set(!refactored())">{{ refactored() ? 'Show Before' : 'Refactor →' }}</button>
          </div>

          @if (mode() === 'controller') {
            @if (!refactored()) {
              <pre class="lab-code mono">OrderController
  authenticate()
  validate()
  calculatePrice()
  checkInventory()
  queryDatabase()
  sendEmail()
  log()
  formatResponse()</pre>
            } @else {
              <pre class="lab-code mono">Middleware
   ↓
Controller
   ↓
OrderService
   ↓
OrderRepository</pre>
              <p class="lab-note">Each responsibility moved to the layer that owns it — the controller now only parses, delegates, and formats.</p>
            }
          } @else {
            @if (!refactored()) {
              <pre class="lab-code mono">MegaService
  user logic
  payment logic
  inventory logic
  notification logic
  reporting logic
  database logic</pre>
            } @else {
              <pre class="lab-code mono">UserService
PaymentService
InventoryService
NotificationService
ReportingService</pre>
              <p class="lab-note">The goal isn't "more classes" — it's cohesive responsibilities, clear boundaries, and manageable dependencies per service.</p>
            }
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .smell-grid { margin-top: 28px; display: grid; grid-template-columns: 1fr; gap: 8px; }
    @media (min-width: 700px) { .smell-grid { grid-template-columns: repeat(2, 1fr); } }
    .smell-card { font-size: 0.8125rem; color: var(--danger); padding: 10px 14px; border: 1px solid var(--danger); border-radius: var(--radius-sm); opacity: 0.85; }
  `,
})
export class ArchitecturalSmells {
  protected readonly smells = SMELLS;
  protected readonly mode = signal<'controller' | 'service'>('controller');
  protected readonly refactored = signal(false);
}
