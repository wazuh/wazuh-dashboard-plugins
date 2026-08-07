import { SavedObjectsType } from '../../../../src/core/server';
import { CONVERSATION_SAVED_OBJECT_TYPE } from '../../common/constants';
import { PersistedChatMessage } from '../../common/types';

/**
 * Persistent (saved) conversations. One saved object per conversation, owner-scoped by the
 * `owner` attribute (server/routes/conversations.ts's `resolveOwner`/CRUD stamps and checks this
 * on every request; storage itself is NOT per-user isolated — `encryptedSavedObjects` is absent
 * from this deployment and standard saved objects have no built-in per-user ACL).
 *
 * PRIVACY INTERACTION (important — read before changing this shape): `messages` here are the
 * DISPLAYED chat messages, i.e. already real-valued (de-pseudonymized answers + the model's prose,
 * exactly what message_bubble.tsx rendered). That is inherent to "saving a conversation" and is
 * exactly why owner-scoping (this file) and retention (`AssistantSettingsAttributes.
 * conversationRetentionDays`, server/saved_objects/assistant-settings.ts) both exist — a stored
 * conversation is sensitive at rest the same way any other real-valued Wazuh data is. The
 * per-turn pseudonym MAP (common/types.ts's `PseudonymEntry[]`) is deliberately NOT part of this
 * saved object and is never persisted anywhere server-side: it is wire-only, per-request state
 * (server/routes/chat.ts constructs a fresh `Pseudonymizer` per request, seeded from whatever the
 * client sends). Resuming a saved conversation therefore starts with an EMPTY client-side
 * pseudonym map — same as starting a brand new conversation — so privacy mode's on-the-wire
 * protection (what reaches the LLM going forward) is completely unaffected by persistence; only
 * the already-real digest/table history from before a resume could, in principle, be re-sent
 * un-pseudonymized on the next turn, which is the same behavior privacy-off history always had.
 */
export interface ConversationAttributes {
  /** Resolved dashboard username, or the `CONVERSATION_OWNER_FALLBACK` sentinel
   * (common/constants.ts) when it couldn't be resolved for this request. Stamped server-side only
   * — never accepted from the request body (server/routes/conversations.ts). */
  owner: string;
  /** Title = the first user message, truncated (~60 chars) client-side at auto-save time
   * (public/components/chat/chat-page.tsx); editable in principle via PUT, though no UI exposes
   * renaming yet. */
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: PersistedChatMessage[];
}

export const conversationSavedObjectType: SavedObjectsType = {
  name: CONVERSATION_SAVED_OBJECT_TYPE,
  // Hidden for the same reason provider-settings.ts and assistant-settings.ts are hidden: this is
  // per-user chat content, not admin-facing configuration — keep it out of the generic Saved
  // Objects management UI entirely. Reached the same way those two are, too: NOT through the
  // plain route-context `context.core.savedObjects.client` (which sees no hidden types on this
  // OSD version), but through server/routes/conversations.ts's `conversationClient()`, which calls
  // the start contract's `getSavedObjectsStart().getScopedClient(request, {includedHiddenTypes:
  // [CONVERSATION_SAVED_OBJECT_TYPE]})` to get a client that can see this hidden type.
  hidden: true,
  namespaceType: 'single',
  migrations: {},
  mappings: {
    properties: {
      owner: { type: 'keyword' },
      title: { type: 'text' },
      createdAt: { type: 'date' },
      updatedAt: { type: 'date' },
      // Opaque JSON bag, same rationale as assistant-settings.ts's fieldPolicy/actions: no useful
      // search surface over a full chat transcript, and indexing every message's free-form text
      // would be pure overhead for a type that is only ever fetched by id or by owner.
      messages: { type: 'object', enabled: false },
    },
  },
};
