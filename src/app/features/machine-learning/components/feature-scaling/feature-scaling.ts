import { Component, computed, signal } from '@angular/core';

interface Person {
  name: string;
  age: number;
  salary: number;
}

const PEOPLE: Person[] = [
  { name: 'Aiko', age: 24, salary: 38000 },
  { name: 'Ben', age: 35, salary: 72000 },
  { name: 'Carla', age: 48, salary: 95000 },
  { name: 'Deepak', age: 60, salary: 150000 },
  { name: 'Elena', age: 77, salary: 190000 },
];

const AGE_MIN = Math.min(...PEOPLE.map((p) => p.age));
const AGE_MAX = Math.max(...PEOPLE.map((p) => p.age));
const SALARY_MIN = Math.min(...PEOPLE.map((p) => p.salary));
const SALARY_MAX = Math.max(...PEOPLE.map((p) => p.salary));

function normalize(value: number, min: number, max: number): number {
  return (value - min) / (max - min);
}

@Component({
  selector: 'app-feature-scaling',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section" id="feature-scaling">
      <div class="container">
        <p class="lab-index">MACHINE LEARNING / 018 — FEATURE SCALING</p>
        <h2 class="lab-title">Two features, wildly different rulers — and distance doesn't know that.</h2>
        <p class="lab-lede">
          Age is measured in tens. Salary is measured in tens of thousands. A distance calculation treats both
          numbers as if they lived on the same scale — they don't.
        </p>

        <div class="lab-panel">
          <p class="lab-node">A SMALL DATASET — PICK TWO PEOPLE</p>
          <div class="people-table" role="table" aria-label="People dataset">
            <div class="people-header mono" role="row">
              <span role="columnheader">Name</span>
              <span role="columnheader">Age</span>
              <span role="columnheader">Salary</span>
              <span role="columnheader">Point</span>
            </div>
            @for (p of people; track p.name; let i = $index) {
              <div class="people-row mono" role="row" [class.is-a]="i === pointAIndex()" [class.is-b]="i === pointBIndex()">
                <span role="cell">{{ p.name }}</span>
                <span role="cell">{{ p.age }}</span>
                <span role="cell">{{ p.salary.toLocaleString() }}</span>
                <span role="cell" class="point-tag">
                  @if (i === pointAIndex()) { <span class="pill pill-conditional">A</span> }
                  @if (i === pointBIndex()) { <span class="pill pill-yes">B</span> }
                </span>
              </div>
            }
          </div>

          <div class="picker-row">
            <div class="lab-field">
              <label for="point-a">Point A</label>
              <select id="point-a" [value]="pointAIndex()" (change)="setPointA($event)">
                @for (p of people; track p.name; let i = $index) {
                  <option [value]="i">{{ p.name }}</option>
                }
              </select>
            </div>
            <div class="lab-field">
              <label for="point-b">Point B</label>
              <select id="point-b" [value]="pointBIndex()" (change)="setPointB($event)">
                @for (p of people; track p.name; let i = $index) {
                  <option [value]="i">{{ p.name }}</option>
                }
              </select>
            </div>
          </div>
        </div>

        <div class="lab-panel">
          <div class="lab-btn-row">
            <button type="button" class="lab-btn" [class.is-active]="!normalized()" (click)="normalized.set(false)">Raw values</button>
            <button type="button" class="lab-btn lab-btn-primary" [class.is-active]="normalized()" (click)="normalized.set(true)">Normalize features</button>
          </div>

          <p class="lab-node calc-heading">
            {{ normalized() ? 'DISTANCE — MIN-MAX NORMALIZED (0–1 RANGE)' : 'DISTANCE — RAW VALUES' }}
          </p>

          <div class="calc-block mono">
            <p>age(A) = {{ activeAgeA().toFixed(normalized() ? 3 : 0) }} &nbsp;·&nbsp; age(B) = {{ activeAgeB().toFixed(normalized() ? 3 : 0) }}</p>
            <p>salary(A) = {{ activeSalaryA().toFixed(normalized() ? 3 : 0) }} &nbsp;·&nbsp; salary(B) = {{ activeSalaryB().toFixed(normalized() ? 3 : 0) }}</p>
            <p class="calc-term">(age_A − age_B)² = {{ activeAgeDiffSq().toFixed(3) }}</p>
            <p class="calc-term">(salary_A − salary_B)² = {{ activeSalaryDiffSq().toFixed(3) }}</p>
            <p class="calc-result">distance = √( {{ activeAgeDiffSq().toFixed(3) }} + {{ activeSalaryDiffSq().toFixed(3) }} ) = {{ activeDistance().toFixed(3) }}</p>
          </div>

          <div class="dominance-bar-row">
            <div class="dominance-bar">
              <div class="dominance-fill dominance-age" [style.width.%]="agePercentOfTerms()"></div>
              <div class="dominance-fill dominance-salary" [style.width.%]="100 - agePercentOfTerms()"></div>
            </div>
            <p class="dominance-caption">
              Share of the squared-term total: <span class="tok-key">age</span> {{ agePercentOfTerms().toFixed(1) }}% ·
              <span class="tok-key">salary</span> {{ (100 - agePercentOfTerms()).toFixed(1) }}%
            </p>
          </div>
        </div>

        <div class="chip-row">
          <div class="concept-chip">
            <p class="chip-title mono">STANDARDIZATION</p>
            <p class="chip-text">Rescale using the feature's mean and standard deviation.</p>
          </div>
          <div class="concept-chip">
            <p class="chip-title mono">NORMALIZATION</p>
            <p class="chip-text">Rescale into a fixed range, typically 0–1.</p>
          </div>
        </div>

        <p class="lab-note">
          Feature scaling matters especially for algorithms that rely on distance calculations — without it, a
          feature with a naturally larger numeric range can dominate the result even if it isn't actually more
          important.
        </p>
      </div>
    </section>
  `,
  styles: `
    .people-table { margin-top: 16px; display: flex; flex-direction: column; gap: 3px; font-size: 0.8125rem; }
    .people-header, .people-row { display: grid; grid-template-columns: 1.2fr 0.8fr 1.2fr 0.9fr; gap: 10px; padding: 9px 12px; border-radius: var(--radius-sm); align-items: center; }
    .people-header { color: var(--text-faint); font-size: 0.6875rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .people-row { background: var(--surface); color: var(--text-muted); border: 1px solid transparent; }
    .people-row.is-a { border-color: var(--accent-dim); color: var(--text); }
    .people-row.is-b { border-color: var(--accent-2-dim); color: var(--text); }
    .point-tag { display: flex; gap: 6px; }

    .picker-row { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 18px; }
    .picker-row .lab-field { min-width: 160px; }

    .calc-heading { margin-top: 24px; color: var(--accent-2); }
    .calc-block { margin-top: 12px; display: flex; flex-direction: column; gap: 6px; font-size: 0.875rem; color: var(--text-muted); background: var(--surface); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 16px; }
    .calc-term { color: var(--text); }
    .calc-result { margin-top: 6px; color: var(--accent-strong); font-size: 0.9375rem; }

    .dominance-bar-row { margin-top: 18px; }
    .dominance-bar { display: flex; height: 14px; border-radius: 999px; overflow: hidden; border: 1px solid var(--border); background: var(--surface); }
    .dominance-fill { height: 100%; transition: width 0.3s ease; }
    .dominance-age { background: var(--accent-2); }
    .dominance-salary { background: var(--accent); }
    .dominance-caption { margin-top: 8px; font-size: 0.8125rem; color: var(--text-faint); }

    .chip-row { display: flex; flex-wrap: wrap; gap: 14px; margin-top: 28px; }
    .concept-chip { flex: 1 1 220px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-md); padding: 14px 16px; }
    .chip-title { font-size: 0.6875rem; letter-spacing: 0.06em; color: var(--accent); margin-bottom: 6px; }
    .chip-text { font-size: 0.875rem; color: var(--text-muted); line-height: 1.5; margin: 0; }
  `,
})
export class FeatureScaling {
  protected readonly people = PEOPLE;

  protected readonly pointAIndex = signal<number>(0);
  protected readonly pointBIndex = signal<number>(1);
  protected readonly normalized = signal(false);

  private readonly pointA = computed(() => this.people[this.pointAIndex()]);
  private readonly pointB = computed(() => this.people[this.pointBIndex()]);

  protected readonly activeAgeA = computed(() =>
    this.normalized() ? normalize(this.pointA().age, AGE_MIN, AGE_MAX) : this.pointA().age,
  );
  protected readonly activeAgeB = computed(() =>
    this.normalized() ? normalize(this.pointB().age, AGE_MIN, AGE_MAX) : this.pointB().age,
  );
  protected readonly activeSalaryA = computed(() =>
    this.normalized() ? normalize(this.pointA().salary, SALARY_MIN, SALARY_MAX) : this.pointA().salary,
  );
  protected readonly activeSalaryB = computed(() =>
    this.normalized() ? normalize(this.pointB().salary, SALARY_MIN, SALARY_MAX) : this.pointB().salary,
  );

  protected readonly activeAgeDiffSq = computed(() => (this.activeAgeA() - this.activeAgeB()) ** 2);
  protected readonly activeSalaryDiffSq = computed(() => (this.activeSalaryA() - this.activeSalaryB()) ** 2);
  protected readonly activeDistance = computed(() => Math.sqrt(this.activeAgeDiffSq() + this.activeSalaryDiffSq()));

  protected readonly agePercentOfTerms = computed(() => {
    const total = this.activeAgeDiffSq() + this.activeSalaryDiffSq();
    return total === 0 ? 50 : (this.activeAgeDiffSq() / total) * 100;
  });

  setPointA(ev: Event): void {
    this.pointAIndex.set(+(ev.target as HTMLSelectElement).value);
  }

  setPointB(ev: Event): void {
    this.pointBIndex.set(+(ev.target as HTMLSelectElement).value);
  }
}
