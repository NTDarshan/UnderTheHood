import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { serialize } from '../../engine/serialization-simulator';

@Component({
  selector: 'app-serialization-playground',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="lab-section" id="serialize-playground">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 12 — SERIALIZATION PLAYGROUND</p>
        <h2 class="lab-title">Build an object. Watch it become JSON, live.</h2>
        <p class="lab-lede">
          Everything here is a real transformation, not a canned example — change any field on the left and
          the wire representation on the right updates immediately.
        </p>

        <div class="playground-columns">
          <div class="pg-col">
            <p class="pg-heading mono">NATIVE DATA EDITOR</p>
            <div class="pg-panel lab-panel">
              <label class="lab-field">
                <span>Name</span>
                <input class="mono" [ngModel]="name()" (ngModelChange)="name.set($event)" />
              </label>
              <label class="lab-field">
                <span>Age</span>
                <input class="mono" type="number" [ngModel]="age()" (ngModelChange)="age.set($event)" />
              </label>
              <label class="lab-field">
                <span>Active</span>
                <select class="mono" [ngModel]="active()" (ngModelChange)="active.set($event)">
                  <option [ngValue]="true">true</option>
                  <option [ngValue]="false">false</option>
                </select>
              </label>
              <label class="lab-field">
                <span>Skills (comma separated)</span>
                <input class="mono" [ngModel]="skillsText()" (ngModelChange)="skillsText.set($event)" />
              </label>
            </div>
          </div>

          <div class="pg-col pg-engine">
            <p class="pg-heading mono">SERIALIZATION ENGINE</p>
            <div class="pg-panel lab-panel pg-engine-panel">
              <span class="pg-engine-label mono">SERIALIZE</span>
              <span class="pg-engine-arrow">→</span>
            </div>
          </div>

          <div class="pg-col">
            <p class="pg-heading mono">WIRE REPRESENTATION</p>
            <div class="pg-panel lab-panel">
              <pre class="pg-json mono">{{ json() }}</pre>
            </div>
          </div>
        </div>
      </div>
    </section>
  `,
  styles: `
    .playground-columns {
      margin-top: 32px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 1000px) {
      .playground-columns {
        grid-template-columns: 1fr auto 1fr;
        align-items: start;
      }
    }

    .pg-heading {
      font-size: 0.6875rem;
      letter-spacing: 0.08em;
      color: var(--accent-2);
      margin-bottom: 10px;
    }

    .pg-panel {
      margin-top: 0;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }

    .pg-engine {
      align-self: center;
    }

    .pg-engine-panel {
      align-items: center;
      justify-content: center;
      gap: 10px;
      min-width: 100px;
    }

    .pg-engine-label {
      font-size: 0.75rem;
      color: var(--accent);
    }

    .pg-engine-arrow {
      font-size: 1.5rem;
      color: var(--accent-dim);
    }

    .pg-json {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.7;
      white-space: pre-wrap;
    }
  `,
})
export class SerializationPlayground {
  protected readonly name = signal('Alice');
  protected readonly age = signal(30);
  protected readonly active = signal(true);
  protected readonly skillsText = signal('backend, cloud');

  protected readonly json = computed(() => {
    const skills = this.skillsText()
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const result = serialize({ name: this.name(), age: this.age(), active: this.active(), skills });
    return result.json ?? '';
  });
}
