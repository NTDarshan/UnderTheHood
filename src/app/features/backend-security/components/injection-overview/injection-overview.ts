import { Component, computed, signal } from '@angular/core';

type InterpreterKey = 'sql' | 'shell' | 'template' | 'expression';

interface Interpreter {
  key: InterpreterKey;
  label: string;
  example: string;
  dataExample: string;
  codeExample: string;
}

const INTERPRETERS: Interpreter[] = [
  {
    key: 'sql',
    label: 'SQL',
    example: 'Executes database queries.',
    dataExample: `WHERE name = 'ann'`,
    codeExample: `WHERE name = '' OR '1'='1'`,
  },
  {
    key: 'shell',
    label: 'Shell',
    example: 'Runs OS commands.',
    dataExample: `ping ann.txt`,
    codeExample: `ping ; rm -rf /`,
  },
  {
    key: 'template',
    label: 'Template',
    example: 'Renders text by evaluating embedded expressions.',
    dataExample: `Hello, ann`,
    codeExample: `Hello, {{ 7*7 }}`,
  },
  {
    key: 'expression',
    label: 'Expression',
    example: 'Evaluates a formula or expression at runtime.',
    dataExample: `total = "ann's order"`,
    codeExample: `total = __import__('os').system('id')`,
  },
];

@Component({
  selector: 'app-injection-overview',
  standalone: true,
  imports: [],
  template: `
    <section class="lab-section inj-scene" id="injection-overview">
      <div class="container">
        <p class="lab-index">03 — INJECTION ATTACKS</p>
        <h2 class="lab-title">The moment attacker-controlled data becomes code, the interpreter can't tell the difference.</h2>
        <p class="lab-lede">
          An injection vulnerability happens when an attacker-controlled value becomes part of something that
          should have been treated as code or instructions, not data.
        </p>

        <div class="lab-panel">
          <div class="flow-row">
            <div class="node node-input"><span class="node-label mono">USER INPUT</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node node-app"><span class="node-label mono">APPLICATION</span></div>
            <span class="lab-flow-arrow">&rarr;</span>
            <div class="node node-interp"><span class="node-label mono">{{ active().label.toUpperCase() }} INTERPRETER</span></div>
          </div>

          <p class="part-label mono">CHOOSE AN INTERPRETER</p>
          <div class="lab-btn-row" role="group" aria-label="Interpreter type">
            @for (i of interpreters; track i.key) {
              <button type="button" class="lab-btn" [class.is-active]="activeKey() === i.key" (click)="activeKey.set(i.key)">
                {{ i.label }}
              </button>
            }
          </div>
          <p class="interp-example mono">{{ active().label }} — {{ active().example }}</p>

          <p class="part-label mono motif-label">DATA vs CODE</p>
          <p class="lab-lede motif-lede">
            The same user-supplied value can land in two very different places. Watch what happens to it once it
            reaches the {{ active().label }} interpreter.
          </p>

          <div class="motif-grid">
            <div class="motif-card motif-data">
              <p class="motif-heading mono">STAYS AS DATA</p>
              <div class="motif-flow">
                <span class="motif-value mono">ann</span>
                <span class="lab-flow-arrow">&rarr;</span>
                <span class="motif-slot mono">value slot</span>
              </div>
              <p class="motif-code mono">{{ active().dataExample }}</p>
              <p class="motif-caption">The input sits inside a fixed value slot. It can't change what the interpreter does — only what it looks up.</p>
              <span class="pill motif-pill motif-pill-trust">SAFE</span>
            </div>

            <div class="motif-card motif-code-card">
              <p class="motif-heading mono">MERGES INTO CODE</p>
              <div class="motif-flow">
                <span class="motif-value mono">' OR '1'='1</span>
                <span class="lab-flow-arrow">&rarr;</span>
                <span class="motif-slot mono">grammar itself</span>
              </div>
              <p class="motif-code mono motif-code-attack">{{ active().codeExample }}</p>
              <p class="motif-caption">The input closes out the intended structure and adds its own — the interpreter now executes attacker-chosen logic.</p>
              <span class="pill motif-pill motif-pill-attack">EXPLOITED</span>
            </div>
          </div>

          <p class="lab-note lab-note-warn">
            Every injection class — SQL injection, command injection, template injection — is a specific instance of
            this same failure: a boundary between data and code that the application didn't actually enforce. This
            chapter walks through SQL injection and command injection as the two concrete examples.
          </p>
        </div>
      </div>
    </section>
  `,
  styles: `
    .inj-scene {
      --trust: #4ade80;
      --suspicious: var(--accent);
      --attack: var(--danger);
      --compromised: #dc2626;
      --blocked: #4fd3e8;
      --c-client: var(--accent-2);
      --c-server: #60a5fa;
      --c-db: #a78bfa;
      --c-attacker: #f472b6;
      display: block;
    }

    .flow-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .node { flex: 1; min-width: 130px; display: flex; align-items: center; justify-content: center; padding: 16px 12px; background: var(--surface); border: 1px solid var(--border-strong); border-radius: var(--radius-md); text-align: center; }
    .node-input { border-color: var(--c-attacker); }
    .node-app { border-color: var(--c-server); }
    .node-interp { border-color: var(--suspicious); }
    .node-label { font-size: 0.75rem; color: var(--text); letter-spacing: 0.05em; font-weight: 600; }

    .part-label { margin-top: 26px; color: var(--text-faint); letter-spacing: 0.12em; font-size: 0.75rem; margin-bottom: 4px; }
    .motif-label { margin-top: 32px; }

    .interp-example { margin-top: 14px; font-size: 0.8125rem; color: var(--text-muted); }

    .motif-lede { margin-top: 6px; max-width: 600px; }

    .motif-grid { margin-top: 16px; display: grid; grid-template-columns: 1fr; gap: 16px; }
    @media (min-width: 720px) { .motif-grid { grid-template-columns: 1fr 1fr; } }

    .motif-card { padding: 16px; border-radius: var(--radius-md); background: var(--surface); border: 1px solid var(--border-strong); position: relative; }
    .motif-data { border-color: color-mix(in srgb, var(--trust) 45%, var(--border-strong)); }
    .motif-code-card { border-color: color-mix(in srgb, var(--attack) 45%, var(--border-strong)); }

    .motif-heading { font-size: 0.75rem; letter-spacing: 0.08em; color: var(--text-faint); margin-bottom: 12px; }

    .motif-flow { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; font-size: 0.8125rem; }
    .motif-value { padding: 4px 8px; border-radius: var(--radius-sm); background: var(--surface-elevated); color: var(--text); border: 1px solid var(--border-strong); }
    .motif-slot { color: var(--text-muted); }

    .motif-code { margin-top: 12px; padding: 10px 12px; background: var(--surface-raised); border: 1px solid var(--border); border-radius: var(--radius-sm); font-size: 0.75rem; color: var(--trust); overflow-x: auto; }
    .motif-code-attack { color: var(--attack); }

    .motif-caption { margin-top: 12px; font-size: 0.8125rem; color: var(--text-muted); line-height: 1.55; }

    .motif-pill { position: absolute; top: 14px; right: 14px; }
    .motif-pill-trust { color: var(--trust); border-color: color-mix(in srgb, var(--trust) 55%, transparent); }
    .motif-pill-attack { color: var(--attack); border-color: color-mix(in srgb, var(--attack) 55%, transparent); }
  `,
})
export class InjectionOverview {
  protected readonly interpreters = INTERPRETERS;

  protected readonly activeKey = signal<InterpreterKey>('sql');

  protected readonly active = computed<Interpreter>(
    () => this.interpreters.find((i) => i.key === this.activeKey()) ?? this.interpreters[0]
  );
}
