import { Component, signal } from '@angular/core';
import { SAMPLE_BOOKS } from '../../engine/rest-simulator';

@Component({
  selector: 'app-list-api-semantics',
  standalone: true,
  template: `
    <section class="lab-section" id="list-semantics">
      <div class="container">
        <p class="lab-index">REST API / 16 — LIST API SEMANTICS</p>
        <h2 class="lab-title">An empty list is still a successful list.</h2>
        <p class="lab-lede">Toggle the result set and watch what stays constant: the status code never moves off 200, because the request itself always succeeds — only the data changes.</p>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="!empty()" (click)="empty.set(false)">Populated result set</button>
            <button type="button" class="lab-btn" [class.is-active]="empty()" (click)="empty.set(true)">Simulate empty result set</button>
          </div>

          <p class="lab-code">
            <span class="tok-method">GET</span> <span class="tok-key">/books</span> <span class="tok-dim">→</span> <span class="tok-status-ok">200 OK</span>
          </p>

          <div class="response-body lab-code mono">
            {{ '{' }}<br />
            &nbsp;&nbsp;<span class="tok-key">"data"</span>: [
            @if (empty()) {
              <span class="tok-dim">]</span>
            } @else {
              <br />
              @for (b of books; track b.id; let i = $index) {
                &nbsp;&nbsp;&nbsp;&nbsp;{{ '{' }} <span class="tok-key">"id"</span>: {{ b.id }}, <span class="tok-key">"title"</span>: <span class="tok-dim">"{{ b.title }}"</span> {{ '}' }}{{ i < books.length - 1 ? ',' : '' }}<br />
              }
              &nbsp;&nbsp;]
            }
            <br />
            {{ '}' }}
          </div>

          <p class="result-count mono">{{ empty() ? '0 results' : books.length + ' results' }} — status stayed <span class="tok-status-ok">200</span> either way.</p>

          <p class="lab-note">An empty collection is still a valid collection result. Don't use 404 merely because a collection currently has zero matching members — 404 means "this specific resource doesn't exist," not "this query found nothing."</p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .response-body { margin-top: 16px; }
    .result-count { margin-top: 14px; font-size: 0.8125rem; color: var(--text-muted); }
  `,
})
export class ListApiSemantics {
  protected readonly books = SAMPLE_BOOKS.slice(0, 3);
  protected readonly empty = signal(false);
}
