import { Component, computed, signal } from '@angular/core';

interface FormatInfo {
  id: string;
  name: string;
  category: 'text' | 'binary';
  readability: string;
  typicalUse: string;
  size: string;
  schema: string;
  sample: string;
}

const FORMATS: FormatInfo[] = [
  {
    id: 'json',
    name: 'JSON',
    category: 'text',
    readability: 'High — plain text, easy to eyeball',
    typicalUse: 'HTTP APIs, config files, logs',
    size: 'Moderate — field names repeated in every payload',
    schema: 'None enforced by the format itself',
    sample: '{\n  "name": "Alice",\n  "age": 30\n}',
  },
  {
    id: 'xml',
    name: 'XML',
    category: 'text',
    readability: 'High, but verbose — tags wrap every value',
    typicalUse: 'Legacy enterprise APIs, document formats, SOAP',
    size: 'Larger than JSON for the same data — opening and closing tags',
    schema: 'Often paired with a schema definition (XSD)',
    sample: '<user>\n  <name>Alice</name>\n  <age>30</age>\n</user>',
  },
  {
    id: 'yaml',
    name: 'YAML',
    category: 'text',
    readability: 'Very high — indentation instead of braces',
    typicalUse: 'Configuration files, infrastructure-as-code',
    size: 'Compact on the page, rarely used for wire transfer',
    schema: 'None enforced by the format itself',
    sample: 'name: Alice\nage: 30',
  },
  {
    id: 'protobuf',
    name: 'Protocol Buffers',
    category: 'binary',
    readability: 'Low — compact bytes, not human-readable',
    typicalUse: 'Service-to-service calls, high-throughput systems',
    size: 'Small — no field names on the wire, just schema-defined positions',
    schema: 'Required — a .proto schema defines the structure',
    sample: '// schema-defined:\nmessage User {\n  string name = 1;\n  int32 age = 2;\n}',
  },
  {
    id: 'avro',
    name: 'Avro',
    category: 'binary',
    readability: 'Low — binary, schema travels alongside the data',
    typicalUse: 'Data pipelines, event streaming (e.g. Kafka)',
    size: 'Compact — schema is stored once, not per message',
    schema: 'Required — schema evolves independently of the data',
    sample: '// schema-defined:\n{ "type": "record", "fields": [...] }',
  },
];

@Component({
  selector: 'app-format-explorer',
  standalone: true,
  template: `
    <section class="lab-section" id="formats">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 07 — SERIALIZATION FORMATS</p>
        <h2 class="lab-title">JSON is one option among several.</h2>
        <p class="lab-lede">
          These are common examples, not an exhaustive list. Pick one to compare its characteristics.
        </p>

        <div class="format-cards">
          @for (f of formats; track f.id) {
            <button
              type="button"
              class="format-card"
              [class.is-active]="selected() === f.id"
              [class.is-binary]="f.category === 'binary'"
              (click)="selected.set(f.id)"
            >
              <span class="format-name mono">{{ f.name }}</span>
              <span class="format-category mono">{{ f.category === 'text' ? 'TEXT-BASED' : 'BINARY' }}</span>
            </button>
          }
        </div>

        <div class="format-detail lab-panel">
          <pre class="format-sample mono">{{ active().sample }}</pre>
          <dl class="format-facts">
            <div><dt>Readability</dt><dd>{{ active().readability }}</dd></div>
            <div><dt>Typical use</dt><dd>{{ active().typicalUse }}</dd></div>
            <div><dt>Relative size</dt><dd>{{ active().size }}</dd></div>
            <div><dt>Schema</dt><dd>{{ active().schema }}</dd></div>
          </dl>
        </div>
      </div>
    </section>

    <section class="lab-section" id="text-vs-binary">
      <div class="container">
        <p class="lab-index">SERIALIZATION / 15 — TEXT VS. BINARY</p>
        <h2 class="lab-title">Two families, two sets of trade-offs.</h2>

        <div class="tvb-grid">
          <div class="tvb-card">
            <p class="tvb-title mono">TEXT-BASED — JSON, XML, YAML</p>
            <ul>
              <li>Human-readable — you can open it and understand it</li>
              <li>Easy to inspect and debug in transit</li>
              <li>Often larger than an equivalent compact binary format</li>
            </ul>
          </div>
          <div class="tvb-card">
            <p class="tvb-title mono">BINARY — PROTOBUF, AVRO</p>
            <ul>
              <li>Compact — no repeated field names on the wire</li>
              <li>Can be efficient to encode and decode</li>
              <li>Typically not human-readable without tooling</li>
            </ul>
          </div>
        </div>

        <p class="lab-note lab-note-warn">
          "Binary is always faster" is an overstatement. Binary formats <em>can</em> offer advantages in size
          and processing efficiency — but the actual outcome depends on the specific format, the
          implementation, and the workload.
        </p>
      </div>
    </section>
  `,
  styles: `
    .format-cards {
      margin-top: 28px;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .format-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 12px 18px;
      border-radius: var(--radius-sm);
      border: 1px solid var(--border-strong);
      background: var(--surface-raised);
      color: var(--text-muted);
      min-width: 140px;
    }

    .format-card.is-binary {
      border-style: dashed;
    }

    .format-card.is-active {
      border-color: var(--accent);
      color: var(--text);
      background: color-mix(in srgb, var(--accent) 10%, var(--surface-raised));
    }

    .format-name {
      font-size: 0.9375rem;
      font-weight: 700;
    }

    .format-category {
      font-size: 0.625rem;
      letter-spacing: 0.06em;
      color: var(--text-faint);
    }

    .format-detail {
      margin-top: 20px;
    }

    .format-sample {
      font-size: 0.8125rem;
      color: var(--text-muted);
      line-height: 1.7;
      white-space: pre-wrap;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: 14px 16px;
    }

    .format-facts {
      margin-top: 18px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 12px;
    }

    @media (min-width: 700px) {
      .format-facts {
        grid-template-columns: 1fr 1fr;
      }
    }

    .format-facts dt {
      font-size: 0.6875rem;
      letter-spacing: 0.06em;
      color: var(--accent-2);
      margin-bottom: 4px;
    }

    .format-facts dd {
      font-size: 0.875rem;
      color: var(--text-muted);
    }

    .tvb-grid {
      margin-top: 28px;
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }

    @media (min-width: 800px) {
      .tvb-grid {
        grid-template-columns: 1fr 1fr;
      }
    }

    .tvb-card {
      background: var(--surface-raised);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 22px;
    }

    .tvb-title {
      font-size: 0.75rem;
      color: var(--accent-2);
      margin-bottom: 14px;
    }

    .tvb-card ul {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .tvb-card li {
      font-size: 0.875rem;
      color: var(--text-muted);
      padding-left: 16px;
      position: relative;
      line-height: 1.5;
    }

    .tvb-card li::before {
      content: '›';
      position: absolute;
      left: 0;
      color: var(--accent-2);
    }
  `,
})
export class FormatExplorer {
  protected readonly formats = FORMATS;
  protected readonly selected = signal('json');
  protected readonly active = computed(() => this.formats.find((f) => f.id === this.selected())!);
}
