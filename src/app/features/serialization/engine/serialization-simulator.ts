export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type JsonKind = 'string' | 'number' | 'boolean' | 'null' | 'array' | 'object';

export function kindOf(value: JsonValue): JsonKind {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value as JsonKind;
}

export interface SerializeResult {
  ok: boolean;
  json?: string;
  error?: string;
}

/** Native object -> wire representation. In real systems this is a library call; here it's JSON.stringify with a friendly failure path (e.g. circular references). */
export function serialize(value: unknown): SerializeResult {
  try {
    const json = JSON.stringify(value, null, 2);
    return { ok: true, json };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Could not serialize this value.' };
  }
}

export interface DeserializeResult {
  ok: boolean;
  value?: JsonValue;
  error?: string;
  hint?: string;
}

/**
 * Wire representation -> native object. Wraps JSON.parse but replaces the raw
 * parser error with a friendlier, syntax-level explanation aimed at teaching
 * *why* a payload failed rather than reproducing an engine-specific message.
 */
export function deserialize(text: string): DeserializeResult {
  try {
    const value = JSON.parse(text);
    return { ok: true, value };
  } catch {
    return { ok: false, error: 'Deserialization failed.', hint: explainJsonSyntaxError(text) };
  }
}

function explainJsonSyntaxError(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return 'There is nothing to parse — the payload is empty.';
  if (/,\s*[}\]]/.test(text)) return 'A trailing comma appears before a closing "}" or "]" — standard JSON does not allow a comma after the last item.';
  if (/[{,]\s*[A-Za-z_$][\w$]*\s*:/.test(text)) return 'An object key is missing double quotes — JSON requires keys to be quoted strings, e.g. "name" not name.';
  if (/'/.test(text)) return "Single quotes were used somewhere — JSON strings must use double quotes.";
  if (/\/\/|\/\*/.test(text)) return 'JSON has no concept of comments — remove // or /* */ style comments.';
  if ((text.match(/{/g) || []).length !== (text.match(/}/g) || []).length) return 'The number of "{" and "}" does not match — an object was likely never closed.';
  if ((text.match(/\[/g) || []).length !== (text.match(/]/g) || []).length) return 'The number of "[" and "]" does not match — an array was likely never closed.';
  return 'The text is not syntactically valid JSON — check for a stray character, missing quote, or missing comma/colon.';
}

export interface SchemaField {
  name: string;
  type: JsonKind;
  required: boolean;
}

export interface FieldValidation {
  name: string;
  status: 'ok' | 'wrong-type' | 'missing' | 'unknown';
  detail: string;
}

export interface ValidationResult {
  ok: boolean;
  fields: FieldValidation[];
}

/**
 * Application-level validation — a step that is *separate* from parsing.
 * JSON.parse succeeding only proves the syntax is valid; this proves the
 * resulting shape satisfies what the receiving application actually expects.
 */
export function validateAgainstSchema(value: JsonValue, schema: SchemaField[]): ValidationResult {
  const fields: FieldValidation[] = [];
  const obj = typeof value === 'object' && value !== null && !Array.isArray(value) ? (value as Record<string, JsonValue>) : {};

  for (const field of schema) {
    if (!(field.name in obj)) {
      if (field.required) {
        fields.push({ name: field.name, status: 'missing', detail: `Expected a required field "${field.name}", but it is absent.` });
      }
      continue;
    }
    const actual = kindOf(obj[field.name]);
    if (actual !== field.type) {
      fields.push({ name: field.name, status: 'wrong-type', detail: `Expected "${field.name}" to be ${field.type}, but received ${actual}.` });
    } else {
      fields.push({ name: field.name, status: 'ok', detail: `"${field.name}" is a valid ${field.type}.` });
    }
  }

  const known = new Set(schema.map((f) => f.name));
  for (const key of Object.keys(obj)) {
    if (!known.has(key)) {
      fields.push({ name: key, status: 'unknown', detail: `"${key}" is not part of the expected schema — many servers ignore it, some reject it.` });
    }
  }

  return { ok: fields.every((f) => f.status === 'ok' || f.status === 'unknown'), fields };
}

export type PipelineStage =
  | 'idle'
  | 'serializing'
  | 'serialized'
  | 'transmitting'
  | 'received'
  | 'deserializing'
  | 'deserialized'
  | 'validating'
  | 'valid'
  | 'invalid';

export const PIPELINE_ORDER: PipelineStage[] = [
  'idle',
  'serializing',
  'serialized',
  'transmitting',
  'received',
  'deserializing',
  'deserialized',
  'validating',
  'valid',
];
