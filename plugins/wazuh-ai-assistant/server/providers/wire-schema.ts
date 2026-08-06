import { JsonSchemaObject } from '../../common/types';

/**
 * Widens `number`/`boolean` parameter types to `["number","string"]`/`["boolean","string"]`, and a
 * `jsonString`-marked `string` parameter (common/types.ts's `JsonSchemaPrimitive.jsonString` doc
 * comment) to `["string","object"]`, on the provider wire only. Weak models (e.g. llama via Groq)
 * often emit numeric or boolean arguments as quoted strings, and a model may just as naturally
 * emit a JSON-in-a-string parameter (e.g. search-wazuh-data.ts's `query_dsl`) as a live object
 * instead of hand-serializing it — and some providers (Groq) validate arguments server-side
 * against the declared schema and fail the whole request (HTTP 400 `tool_use_failed`) instead of
 * returning the call. The canonical ToolSpec stays strictly typed; the plugin's schema-validator
 * coerces the wider wire value back to its real type once the call arrives (numeric/boolean
 * strings, or an object back to its JSON-encoded string form for a `jsonString` property).
 *
 * The `jsonString` marker itself is NOT a standard JSON Schema keyword and must never reach the
 * wire: the branch below destructures it out of the copy it builds, rather than spreading the
 * source property wholesale, so a provider never sees an unrecognized keyword on the tool schema it
 * validates against.
 *
 * Kept as `widenNumericTypes` rather than renamed despite now widening a non-numeric case too: it
 * has exactly two call sites (openai-compatible.ts, anthropic.ts) and the rename would only touch
 * those two lines, but this doc comment is the authoritative description either way, so a rename
 * bought little beyond the name itself — not worth the extra diff surface for this fix.
 *
 * No catalog tool has a boolean-typed parameter today, so that half of this widening is currently
 * a no-op in practice — pure future-proofing so a future boolean param gets the same wire
 * treatment as `number` without anyone having to remember to add it.
 *
 * Array `minItems`/`maxItems` (common/types.ts's JsonSchemaArray extension, added for the stage-1
 * router's `route_question.categories` param, server/tools/router.ts) are NOT stripped or
 * rewritten here: the `else` branch below copies the property object through unchanged, so those
 * keywords reach the wire verbatim. Both wire formats accept them as-is: OpenAI's function
 * `parameters` and Anthropic's tool `input_schema` are each a standard JSON Schema object and both
 * document support for `minItems`/`maxItems` on array-typed properties, so no widening/translation
 * is needed the way `number`/`boolean` types require above. Enforcement of the bound is best-effort
 * per model; schema-validator.ts's `validateArray` is the actual server-side enforcement point.
 */
export function widenNumericTypes(
  parameters: JsonSchemaObject,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  for (const [key, property] of Object.entries(parameters.properties)) {
    if (property.type === 'number') {
      properties[key] = { ...property, type: ['number', 'string'] };
    } else if (property.type === 'boolean') {
      properties[key] = { ...property, type: ['boolean', 'string'] };
    } else if (property.type === 'string' && property.jsonString) {
      // Destructure `jsonString` out explicitly (rather than spreading `property` wholesale) so
      // this non-standard marker can never leak onto the wire schema a provider validates against.
      const { jsonString: _jsonString, ...rest } = property;
      properties[key] = { ...rest, type: ['string', 'object'] };
    } else if (property.type === 'array' && property.items.type === 'number') {
      properties[key] = {
        ...property,
        items: { ...property.items, type: ['number', 'string'] },
      };
    } else if (property.type === 'array' && property.items.type === 'boolean') {
      properties[key] = {
        ...property,
        items: { ...property.items, type: ['boolean', 'string'] },
      };
    } else {
      properties[key] = property;
    }
  }
  return { ...parameters, properties };
}
