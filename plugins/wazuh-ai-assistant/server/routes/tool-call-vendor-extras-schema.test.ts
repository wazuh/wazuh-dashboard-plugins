import assert from 'node:assert/strict';
import { chatRequestMessageSchema } from './chat';
import { chatMessageSchema } from './conversations';

/**
 * Regression guard for the Gemini `thought_signature` fix's FIX-DEFEATING gap (Opus validation of
 * 8d36abc69): the client replays a prior turn's tool call verbatim --
 * common/chat-history.ts's `buildOutgoingMessages` (POST /chat) and `toPersistedMessages`
 * (conversations save/reload) both resend `exchange.toolCall` whole, including whatever
 * `ToolCall.vendorExtras`/`functionVendorExtras` server/providers/openai-compatible.ts captured
 * for it. `@osd/config-schema` rejects unknown object keys by default, so BOTH request-body
 * schemas below must have an explicit (optional) place for these two fields, or every replayed
 * call carrying a vendor extra 400s on the very next turn / conversation save -- silently undoing
 * the whole fix one round-trip later. Mirrors conversations-table-schema.test.ts's own
 * type<->schema drift guard for `TableSpec`.
 */

/** Minimal structural shape both target schemas share -- avoids depending on the exact exported
 * `@osd/config-schema` type name for an object schema, which this repo's other route files never
 * import directly either. */
interface ValidatableSchema {
  validate(value: unknown): unknown;
}

const MINIMAL_TOOL_CALL = {
  id: 'call-1',
  name: 'list_agents',
  arguments: {},
};

function assistantMessage(toolCall: Record<string, unknown>) {
  return {
    role: 'assistant' as const,
    content: '',
    toolCalls: [toolCall],
  };
}

/** Runs the same four assertions against one target schema -- called once per schema below so a
 * failure names exactly which one (POST /chat vs conversations save/reload) regressed. */
function checkSchemaAcceptsVendorExtras(
  label: string,
  targetSchema: ValidatableSchema,
): void {
  test(`${label}: accepts a toolCall with no vendor extras`, () => {
    assert.doesNotThrow(() =>
      targetSchema.validate(assistantMessage(MINIMAL_TOOL_CALL)),
    );
  });

  test(`${label}: accepts a replayed toolCall carrying vendorExtras`, () => {
    assert.doesNotThrow(() =>
      targetSchema.validate(
        assistantMessage({
          ...MINIMAL_TOOL_CALL,
          vendorExtras: { thought_signature: 'sig-abc' },
        }),
      ),
    );
  });

  test(`${label}: accepts a toolCall carrying functionVendorExtras`, () => {
    assert.doesNotThrow(() =>
      targetSchema.validate(
        assistantMessage({
          ...MINIMAL_TOOL_CALL,
          functionVendorExtras: { thought_signature: 'sig-abc' },
        }),
      ),
    );
  });

  test(`${label}: still rejects a genuinely unknown toolCall key`, () => {
    assert.throws(() =>
      targetSchema.validate(
        assistantMessage({
          ...MINIMAL_TOOL_CALL,
          somethingNobodyDefined: true,
        }),
      ),
    );
  });
}

checkSchemaAcceptsVendorExtras('chat.ts', chatRequestMessageSchema);
checkSchemaAcceptsVendorExtras('conversations.ts', chatMessageSchema);

/**
 * Same drift risk, new field: the wire-proof fix (common/types.ts's `ChatMessage.privacyEnabled`
 * doc comment) has the client replay `privacyEnabled` on every historical `role:'tool'` digest and
 * `role:'assistant'` prose message, so `excludePrivacyOffHistory` (common/chat-history.ts) can
 * fail-closed-exclude a privacy-off turn once privacy is on. Both request-body schemas below must
 * accept it or every replayed privacy-flagged message 400s the very next turn / conversation save.
 */
function checkSchemaAcceptsPrivacyEnabled(
  label: string,
  targetSchema: ValidatableSchema,
): void {
  test(`${label}: accepts a role:'tool' message carrying privacyEnabled`, () => {
    assert.doesNotThrow(() =>
      targetSchema.validate({
        role: 'tool',
        content: 'digest',
        toolCallId: 'call-1',
        privacyEnabled: false,
      }),
    );
  });

  test(`${label}: accepts a role:'assistant' prose message carrying privacyEnabled`, () => {
    assert.doesNotThrow(() =>
      targetSchema.validate({
        role: 'assistant',
        content: 'answer',
        privacyEnabled: true,
      }),
    );
  });

  test(`${label}: still accepts a message with no privacyEnabled at all (pre-fix conversations)`, () => {
    assert.doesNotThrow(() =>
      targetSchema.validate({ role: 'assistant', content: 'answer' }),
    );
  });
}

checkSchemaAcceptsPrivacyEnabled('chat.ts', chatRequestMessageSchema);
checkSchemaAcceptsPrivacyEnabled('conversations.ts', chatMessageSchema);
