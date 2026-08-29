import { Component, computed, signal } from '@angular/core';
import { TriState, httpMethods } from '../../../../data/http/http-methods.data';
import { ExplainSimply } from '../../../../shared/components/explain-simply/explain-simply';

const PILL_LABEL: Record<TriState, string> = { yes: 'YES', no: 'NO', conditional: 'DEPENDS' };
const PILL_CLASS: Record<TriState, string> = { yes: 'pill-yes', no: 'pill-no', conditional: 'pill-conditional' };

@Component({
  selector: 'app-method-explorer',
  standalone: true,
  imports: [ExplainSimply],
  template: `
    <section class="lab-section" id="methods">
      <div class="container">
        <p class="lab-index">HTTP / 07 — METHODS</p>
        <h2 class="lab-title">The method communicates the intended semantics of the request.</h2>
        <p class="lab-lede">Select a method to see its purpose and its safety, idempotency and caching characteristics.</p>

        <app-explain-simply>
          Methods are like verbs telling the server what to do: GET means "show me," POST means "create this,"
          PUT means "replace this with what I'm giving you," and DELETE means "remove this."
        </app-explain-simply>

        <div class="method-tabs mono" role="tablist">
          @for (m of methods; track m.method) {
            <button type="button" role="tab" class="lab-btn" [class.is-active]="selected().method === m.method" (click)="selectedMethod.set(m.method)">
              {{ m.method }}
            </button>
          }
        </div>

        <div class="lab-panel method-detail">
          <p class="method-purpose">{{ selected().purpose }}</p>
          <div class="method-pills">
            <div class="pill-row">
              <span class="pill-row-label mono">Safe</span>
              <span class="pill" [class]="pillClass(selected().safe)">{{ pillLabel(selected().safe) }}</span>
            </div>
            <div class="pill-row">
              <span class="pill-row-label mono">Idempotent</span>
              <span class="pill" [class]="pillClass(selected().idempotent)">{{ pillLabel(selected().idempotent) }}</span>
            </div>
            <div class="pill-row">
              <span class="pill-row-label mono">Cacheable</span>
              <span class="pill" [class]="pillClass(selected().cacheable)">{{ pillLabel(selected().cacheable) }}</span>
            </div>
          </div>
          <p class="method-note"><strong>Idempotency —</strong> {{ selected().idempotentNote }}</p>
          <p class="method-note"><strong>Caching —</strong> {{ selected().cacheableNote }}</p>
          @if (selected().hasRequestBody) {
            <p class="method-note">Typically carries a request body.</p>
          }
        </div>
      </div>
    </section>
  `,
  styles: `
    .method-tabs {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 24px;
    }

    .method-detail {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .method-purpose {
      font-size: 1.0625rem;
      color: var(--text);
    }

    .method-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
    }

    .pill-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .pill-row-label {
      font-size: 0.75rem;
      color: var(--text-faint);
    }

    .method-note {
      font-size: 0.875rem;
      color: var(--text-muted);
      line-height: 1.6;
      max-width: 620px;
    }

    .method-note strong {
      color: var(--text);
    }
  `,
})
export class MethodExplorer {
  protected readonly methods = httpMethods;
  protected readonly selectedMethod = signal('GET');
  protected readonly selected = computed(
    () => this.methods.find((m) => m.method === this.selectedMethod()) ?? this.methods[0],
  );

  protected pillLabel(v: TriState): string {
    return PILL_LABEL[v];
  }

  protected pillClass(v: TriState): string {
    return PILL_CLASS[v];
  }
}
