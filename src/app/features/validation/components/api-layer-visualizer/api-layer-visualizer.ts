import { Component, computed, signal } from '@angular/core';

interface Layer {
  id: string;
  name: string;
  responsibilities: string[];
}

const LAYERS: Layer[] = [
  { id: 'controller', name: 'CONTROLLER', responsibilities: ['Receives the HTTP request', 'Route matching', 'Input binding', 'Boundary validation', 'Produces the HTTP response'] },
  { id: 'service', name: 'SERVICE', responsibilities: ['Business rules', 'Business decisions', 'Orchestration', 'Domain behavior'] },
  { id: 'repository', name: 'REPOSITORY', responsibilities: ['Persistence', 'Database interaction', 'Data retrieval / storage'] },
];

@Component({
  selector: 'app-api-layer-visualizer',
  standalone: true,
  template: `
    <section class="lab-section" id="api-layers">
      <div class="container">
        <p class="lab-index">VALIDATION / 02 — THE API EXECUTION PIPELINE</p>
        <h2 class="lab-title">Click a layer to see what it's actually responsible for.</h2>

        <div class="layer-stack mono">
          <div class="layer-node top">CLIENT</div>
          <div class="layer-arrow">↓ HTTP</div>
          @for (l of layers; track l.id; let last = $last) {
            <button type="button" class="layer-node clickable" [class.is-active]="selected() === l.id" (click)="selected.set(l.id)">{{ l.name }}</button>
            @if (!last) { <div class="layer-arrow">↓</div> }
          }
          <div class="layer-arrow">↓</div>
          <div class="layer-node top">DATABASE</div>
        </div>

        <div class="lab-panel layer-detail">
          <p class="layer-detail-title mono">{{ active().name }}</p>
          <ul>
            @for (r of active().responsibilities; track r) { <li>{{ r }}</li> }
          </ul>
        </div>

        <p class="lab-note lab-note-warn">
          Not every application needs exactly three layers named this way. This is a common
          organization — different architectures draw these boundaries differently.
        </p>
      </div>
    </section>
  `,
  styles: `
    .layer-stack { margin-top: 32px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; }
    .layer-node { padding: 12px 26px; border-radius: var(--radius-md); border: 1px solid var(--border-strong); background: var(--surface-raised); color: var(--text-muted); font-size: 0.8125rem; font-weight: 600; }
    .layer-node.top { color: var(--text-faint); }
    .layer-node.clickable { cursor: pointer; }
    .layer-node.clickable.is-active { color: var(--accent-strong); border-color: var(--accent); box-shadow: 0 0 16px var(--glow-accent); }
    .layer-arrow { color: var(--border-strong); font-size: 0.75rem; }

    .layer-detail { margin-top: 24px; }
    .layer-detail-title { font-size: 0.8125rem; color: var(--accent-2); margin-bottom: 12px; }
    .layer-detail ul { display: flex; flex-direction: column; gap: 8px; }
    .layer-detail li { font-size: 0.875rem; color: var(--text-muted); padding-left: 16px; position: relative; }
    .layer-detail li::before { content: '›'; position: absolute; left: 0; color: var(--accent-2); }
  `,
})
export class ApiLayerVisualizer {
  protected readonly layers = LAYERS;
  protected readonly selected = signal('controller');
  protected readonly active = computed(() => this.layers.find((l) => l.id === this.selected())!);
}
