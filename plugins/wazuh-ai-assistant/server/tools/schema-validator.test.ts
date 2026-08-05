import assert from 'node:assert/strict';
import { validate } from './schema-validator';
import { JsonSchemaObject } from '../../common/types';

const AGENT_SCHEMA: JsonSchemaObject = {
  type: 'object',
  properties: {
    agent_id: { type: 'string' },
    limit: { type: 'number' },
    active: { type: 'boolean' },
    severity: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
  required: ['agent_id'],
};

// Mirrors search-wazuh-data.ts's query_dsl parameter: a `jsonString`-marked string-typed property
// that carries a JSON-encoded OpenSearch search request body.
const DSL_SCHEMA: JsonSchemaObject = {
  type: 'object',
  properties: {
    query_dsl: { type: 'string', jsonString: true },
  },
  required: ['query_dsl'],
};

// An ordinary, UNMARKED string property (e.g. search-wazuh-data.ts's own index_pattern, or
// agent_name on other tools) — the regression guard against over-broad coercion.
const PLAIN_STRING_SCHEMA: JsonSchemaObject = {
  type: 'object',
  properties: {
    agent_name: { type: 'string' },
  },
  required: ['agent_name'],
};

const ARRAY_SCHEMA: JsonSchemaObject = {
  type: 'object',
  properties: {
    categories: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: 2,
    },
  },
  required: ['categories'],
};

test('validate: rejects non-object arguments', () => {
  assert.equal(validate(null, AGENT_SCHEMA).ok, false);
  assert.equal(validate('a string', AGENT_SCHEMA).ok, false);
  assert.equal(validate([1, 2], AGENT_SCHEMA).ok, false);
  assert.equal(validate(undefined, AGENT_SCHEMA).ok, false);
});

test('validate: enforces required fields', () => {
  const result = validate({}, AGENT_SCHEMA);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(
      result.errors.some(e => /Missing required property "agent_id"/.test(e)),
    );
  }
});

test('validate: rejects unknown properties', () => {
  const result = validate({ agent_id: '001', bogus: 'x' }, AGENT_SCHEMA);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some(e => /Unknown property "bogus"/.test(e)));
  }
});

test('validate: rejects a type mismatch', () => {
  const result = validate(
    { agent_id: '001', limit: 'not-a-number-or-numeric-string' },
    AGENT_SCHEMA,
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some(e => /must be of type number/.test(e)));
  }
});

test('validate: coerces a numeric string to a number', () => {
  const result = validate({ agent_id: '001', limit: '5' }, AGENT_SCHEMA);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.limit, 5);
    assert.equal(typeof result.value.limit, 'number');
  }
});

test('validate: coerces "true"/"false" strings to booleans', () => {
  const trueResult = validate(
    { agent_id: '001', active: 'true' },
    AGENT_SCHEMA,
  );
  const falseResult = validate(
    { agent_id: '001', active: 'false' },
    AGENT_SCHEMA,
  );
  assert.equal(trueResult.ok, true);
  assert.equal(falseResult.ok, true);
  if (trueResult.ok) {
    assert.equal(trueResult.value.active, true);
  }
  if (falseResult.ok) {
    assert.equal(falseResult.value.active, false);
  }
});

test('validate: rejects an enum value not in the allowed set', () => {
  const result = validate(
    { agent_id: '001', severity: 'critical' },
    AGENT_SCHEMA,
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some(e => /must be one of/.test(e)));
  }
});

test('validate: accepts a valid enum value', () => {
  const result = validate({ agent_id: '001', severity: 'high' }, AGENT_SCHEMA);
  assert.equal(result.ok, true);
});

test('validate: a bare (non-numeric) string is not coerced and fails type check', () => {
  const result = validate({ agent_id: '001', limit: 'abc' }, AGENT_SCHEMA);
  assert.equal(result.ok, false);
});

test('validateArray (via validate): enforces minItems', () => {
  const result = validate({ categories: [] }, ARRAY_SCHEMA);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some(e => /at least 1 item/.test(e)));
  }
});

test('validateArray (via validate): enforces maxItems', () => {
  const result = validate({ categories: ['a', 'b', 'c'] }, ARRAY_SCHEMA);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some(e => /at most 2 item/.test(e)));
  }
});

test('validateArray (via validate): accepts an array within bounds', () => {
  const result = validate({ categories: ['a', 'b'] }, ARRAY_SCHEMA);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value.categories, ['a', 'b']);
  }
});

test('validateArray (via validate): rejects a non-array value for an array property', () => {
  const result = validate({ categories: 'not-an-array' }, ARRAY_SCHEMA);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some(e => /must be an array/.test(e)));
  }
});

test('validateArray (via validate): rejects a wrong-typed item within the array', () => {
  const badArraySchema: JsonSchemaObject = {
    type: 'object',
    properties: { ids: { type: 'array', items: { type: 'number' } } },
  };
  const result = validate({ ids: [1, 'two', 3] }, badArraySchema);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some(e => /ids\[1\]/.test(e)));
  }
});

test('validate: an object-form query_dsl is stringified to match the declared string type', () => {
  const dsl = { query: { match_all: {} } };
  const result = validate({ query_dsl: dsl }, DSL_SCHEMA);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(typeof result.value.query_dsl, 'string');
    assert.deepEqual(JSON.parse(result.value.query_dsl as string), dsl);
  }
});

test('validate: a string-form query_dsl continues to work unchanged (regression)', () => {
  const dslString = JSON.stringify({ query: { match_all: {} } });
  const result = validate({ query_dsl: dslString }, DSL_SCHEMA);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.query_dsl, dslString);
  }
});

test('validate: an object-form query_dsl carrying a "script" key round-trips intact, so the ' +
  'downstream DSL lint (guardrails.ts lintDsl, which parses this string) still sees and rejects ' +
  'it exactly as a hand-written string — widening the accepted TYPE must not widen what is ' +
  'ALLOWED', () => {
  const maliciousDsl = { query: { match_all: {} }, script: { source: 'evil' } };
  const result = validate({ query_dsl: maliciousDsl }, DSL_SCHEMA);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(
      JSON.parse(result.value.query_dsl as string),
      maliciousDsl,
    );
  }
});

test('validate: an array-form query_dsl is NOT coerced (only plain objects are) and still fails ' +
  'the type check, same as before this change', () => {
  const result = validate({ query_dsl: ['a', 'b'] }, DSL_SCHEMA);
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some(e => /must be of type string/.test(e)));
  }
});

test('validate: an object for an UNMARKED string property (no jsonString) is rejected, not ' +
  'silently stringified — the regression guard against over-broad coercion', () => {
  const result = validate(
    { agent_name: { not: 'a plain string' } },
    PLAIN_STRING_SCHEMA,
  );
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some(e => /must be of type string/.test(e)));
  }
});

test('validate: omitted optional properties are simply absent from the output', () => {
  const result = validate({ agent_id: '001' }, AGENT_SCHEMA);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value, { agent_id: '001' });
  }
});
