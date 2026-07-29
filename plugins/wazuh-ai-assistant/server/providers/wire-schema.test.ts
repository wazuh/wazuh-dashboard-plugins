import assert from 'node:assert/strict';
import { widenNumericTypes } from './wire-schema';
import { JsonSchemaObject } from '../../common/types';

/** Shape of a property after `widenNumericTypes` has run: `type` may have become a
 * `[primitive, "string"]` pair (see wire-schema.ts), which no longer fits `JsonSchemaProperty`'s
 * single-type shape -- hence this test-local widened view rather than the production type. */
interface WidenedProperty {
  type: string | string[];
  description?: string;
  enum?: Array<string | number>;
  items?: WidenedProperty;
  minItems?: number;
  maxItems?: number;
}

function widenedProperties(
  out: Record<string, unknown>,
): Record<string, WidenedProperty> {
  return out.properties as Record<string, WidenedProperty>;
}

test('widenNumericTypes: widens a number property to ["number","string"]', () => {
  const schema: JsonSchemaObject = {
    type: 'object',
    properties: { limit: { type: 'number', description: 'max results' } },
  };
  const out = widenNumericTypes(schema);
  assert.deepEqual(widenedProperties(out).limit.type, ['number', 'string']);
  assert.equal(widenedProperties(out).limit.description, 'max results');
});

test('widenNumericTypes: widens a boolean property to ["boolean","string"]', () => {
  const schema: JsonSchemaObject = {
    type: 'object',
    properties: { active: { type: 'boolean' } },
  };
  const out = widenNumericTypes(schema);
  assert.deepEqual(widenedProperties(out).active.type, ['boolean', 'string']);
});

test('widenNumericTypes: widens array-of-number items', () => {
  const schema: JsonSchemaObject = {
    type: 'object',
    properties: { ids: { type: 'array', items: { type: 'number' } } },
  };
  const out = widenNumericTypes(schema);
  assert.deepEqual(widenedProperties(out).ids.type, 'array');
  assert.deepEqual(widenedProperties(out).ids.items?.type, [
    'number',
    'string',
  ]);
});

test('widenNumericTypes: widens array-of-boolean items', () => {
  const schema: JsonSchemaObject = {
    type: 'object',
    properties: { flags: { type: 'array', items: { type: 'boolean' } } },
  };
  const out = widenNumericTypes(schema);
  assert.deepEqual(widenedProperties(out).flags.items?.type, [
    'boolean',
    'string',
  ]);
});

test('widenNumericTypes: leaves string properties untouched', () => {
  const schema: JsonSchemaObject = {
    type: 'object',
    properties: { agent_id: { type: 'string', enum: ['001', '002'] } },
  };
  const out = widenNumericTypes(schema);
  assert.deepEqual(out.properties, schema.properties);
});

test('widenNumericTypes: leaves array-of-string items untouched', () => {
  const schema: JsonSchemaObject = {
    type: 'object',
    properties: {
      categories: {
        type: 'array',
        items: { type: 'string' },
        minItems: 1,
        maxItems: 2,
      },
    },
  };
  const out = widenNumericTypes(schema);
  assert.deepEqual(widenedProperties(out).categories.items?.type, 'string');
});

test('widenNumericTypes: preserves minItems/maxItems on array properties through widening', () => {
  const schema: JsonSchemaObject = {
    type: 'object',
    properties: {
      levels: {
        type: 'array',
        items: { type: 'number' },
        minItems: 1,
        maxItems: 3,
      },
    },
  };
  const out = widenNumericTypes(schema);
  const levels = widenedProperties(out).levels;
  assert.equal(levels.minItems, 1);
  assert.equal(levels.maxItems, 3);
  assert.deepEqual(levels.items?.type, ['number', 'string']);
});

test('widenNumericTypes: top-level schema shape (type/required) is preserved', () => {
  const schema: JsonSchemaObject = {
    type: 'object',
    properties: { limit: { type: 'number' } },
    required: ['limit'],
  };
  const out = widenNumericTypes(schema);
  assert.equal(out.type, 'object');
  assert.deepEqual(out.required, ['limit']);
});
