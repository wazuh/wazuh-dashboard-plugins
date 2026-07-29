import {
  JsonSchemaArray,
  JsonSchemaObject,
  JsonSchemaPrimitive,
} from '../../common/types';

export interface SchemaValidationSuccess {
  ok: true;
  value: Record<string, unknown>;
}

export interface SchemaValidationFailure {
  ok: false;
  errors: string[];
}

export type SchemaValidationResult =
  | SchemaValidationSuccess
  | SchemaValidationFailure;

/**
 * Hand-rolled validator for the minimal `JsonSchemaObject` subset the tool catalog is authored
 * against (flat objects, string/number/boolean/enum properties, arrays of those). Shared by both
 * native tool-call argument validation and the prompted-JSON fallback path, so the two only
 * diverge in how they obtain `args`, never in how they're
 * checked. Pure function: no side effects, nothing thrown, safe to unit-test directly.
 */
export function validate(
  args: unknown,
  schema: JsonSchemaObject,
): SchemaValidationResult {
  if (typeof args !== 'object' || args === null || Array.isArray(args)) {
    return { ok: false, errors: ['Arguments must be a JSON object.'] };
  }

  const input = args as Record<string, unknown>;
  const propertyNames = Object.keys(schema.properties);
  const errors: string[] = [];

  for (const key of Object.keys(input)) {
    if (!propertyNames.includes(key)) {
      errors.push(`Unknown property "${key}".`);
    }
  }

  for (const required of schema.required ?? []) {
    if (input[required] === undefined) {
      errors.push(`Missing required property "${required}".`);
    }
  }

  const value: Record<string, unknown> = {};
  for (const [key, propertySchema] of Object.entries(schema.properties)) {
    if (input[key] === undefined) {
      continue;
    }
    const result =
      propertySchema.type === 'array'
        ? validateArray(key, input[key], propertySchema)
        : validatePrimitive(key, input[key], propertySchema);
    if (result.errors.length) {
      errors.push(...result.errors);
    } else {
      value[key] = result.value;
    }
  }

  if (errors.length) {
    return { ok: false, errors };
  }
  return { ok: true, value };
}

function validateArray(
  key: string,
  raw: unknown,
  arraySchema: JsonSchemaArray,
): { value: unknown; errors: string[] } {
  if (!Array.isArray(raw)) {
    return { value: raw, errors: [`Property "${key}" must be an array.`] };
  }
  const errors: string[] = [];
  // minItems/maxItems (common/types.ts's JsonSchemaArray extension) — currently only exercised by
  // the stage-1 router's route_question.categories param (server/tools/router.ts).
  if (arraySchema.minItems !== undefined && raw.length < arraySchema.minItems) {
    errors.push(
      `Property "${key}" must have at least ${arraySchema.minItems} item(s) (got ${raw.length}).`,
    );
  }
  if (arraySchema.maxItems !== undefined && raw.length > arraySchema.maxItems) {
    errors.push(
      `Property "${key}" must have at most ${arraySchema.maxItems} item(s) (got ${raw.length}).`,
    );
  }
  const value = raw.map((item, index) => {
    const result = validatePrimitive(
      `${key}[${index}]`,
      item,
      arraySchema.items,
    );
    errors.push(...result.errors);
    return result.value;
  });
  return { value, errors };
}

/**
 * Coerces a numeric-looking string to a number, or "true"/"false" to a boolean, before
 * type-checking, per the design spec — the server-side half of `wire-schema.ts`'s
 * `widenNumericTypes` wire widening (that widens the declared type so the provider accepts a
 * quoted value; this coerces it back once the call arrives).
 */
function coerce(
  raw: unknown,
  expectedType: JsonSchemaPrimitive['type'],
): unknown {
  if (
    expectedType === 'number' &&
    typeof raw === 'string' &&
    raw.trim() !== ''
  ) {
    const coerced = Number(raw);
    if (!Number.isNaN(coerced)) {
      return coerced;
    }
  }
  if (expectedType === 'boolean' && typeof raw === 'string') {
    if (raw === 'true') {
      return true;
    }
    if (raw === 'false') {
      return false;
    }
  }
  return raw;
}

function validatePrimitive(
  label: string,
  raw: unknown,
  propertySchema: JsonSchemaPrimitive,
): { value: unknown; errors: string[] } {
  const value = coerce(raw, propertySchema.type);
  const actualType = typeof value;

  if (actualType !== propertySchema.type) {
    return {
      value,
      errors: [
        `Property "${label}" must be of type ${propertySchema.type} (got ${actualType}).`,
      ],
    };
  }

  if (
    propertySchema.enum &&
    !propertySchema.enum.includes(value as string | number)
  ) {
    const allowed = propertySchema.enum.join(', ');
    return {
      value,
      errors: [
        `Property "${label}" must be one of [${allowed}] (got ${JSON.stringify(
          value,
        )}).`,
      ],
    };
  }

  return { value, errors: [] };
}
