import { RequestHandlerContext } from '../../../../src/core/server';
import {
  AssistantSettingsAttributes,
  AssistantSettingsProvider,
  pick,
} from './types';

/**
 * Single entry point for reading/writing the AI Assistant's plugin-wide settings, no matter which
 * backend actually holds each field. One instance is built by
 * `server/settings/route-handler-context.ts`'s `createAssistantSettingsManager` and registered
 * once at plugin start (`server/plugin.ts`'s `setup()`) via
 * `core.http.registerRouteHandlerContext('wazuh_ai_assistant', ...)`; route handlers
 * (server/routes/settings.ts, server/routes/chat.ts) reach it as
 * `context.wazuh_ai_assistant.assistantSettings` rather than importing this class or either
 * provider directly.
 *
 * Every provider declares the exact fields it owns (`AssistantSettingsProvider.fields`); the
 * providers registered here must partition `AssistantSettingsAttributes` completely and without
 * overlap, but nothing enforces that at the type level — a field left out of every provider's
 * `fields` would silently read back as `undefined` (an object built entirely from
 * `Object.assign({}, ...parts)`), and a field claimed by two providers would let whichever
 * settles last win. Get this right in `createAssistantSettingsManager`.
 */
export class AssistantSettingsManager {
  // `AssistantSettingsProvider<any>`, not the default `AssistantSettingsProvider` (which resolves
  // to `AssistantSettingsProvider<keyof AssistantSettingsAttributes>`, i.e. a provider claiming
  // EVERY field): providers registered here each own only a SUBSET of fields
  // (`IndexSettingsProvider<IndexField>`, `IsmSettingsProvider<IsmField>`), and TypeScript treats a
  // narrower provider's `defaults` (a plain property, checked covariantly) as incompatible with
  // the wider shape — `any` is the standard escape for storing a heterogeneous set of instances of
  // a generic interface, each parameterized differently, in one array.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly providers: AssistantSettingsProvider<any>[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  registerProvider(provider: AssistantSettingsProvider<any>): void {
    this.providers.push(provider);
  }

  /**
   * Fetches every provider's slice, bootstrapping (via `createDefaults`) whichever provider(s)
   * report `undefined` — a "read, creating on first access" behavior, fanned out per provider.
   * Also default-fills any INDIVIDUAL missing field within a provider's own slice (a document
   * written before a field existed has that key simply absent from `_source`), falling back in
   * both cases to the provider's OWN `defaults`, never a value supplied by the caller.
   */
  async getOrCreateSettings(
    context: RequestHandlerContext,
  ): Promise<AssistantSettingsAttributes> {
    const parts = await Promise.all(
      this.providers.map(async provider => {
        const found = await provider.getSettings(context);
        if (found === undefined) {
          return provider.createDefaults(context);
        }
        const filled: Record<string, unknown> = {};
        for (const field of provider.fields) {
          filled[field] = found[field] ?? provider.defaults[field];
        }
        return filled;
      }),
    );
    return Object.assign({}, ...parts) as AssistantSettingsAttributes;
  }

  /**
   * Splits `attributes` across every registered provider (each gets only the keys in its own
   * `fields`) and merges what each one reports back was actually persisted — not necessarily an
   * echo of the input; `IsmSettingsProvider` reports the value now in effect on the policy it just
   * edited.
   */
  async updateSettings(
    context: RequestHandlerContext,
    attributes: AssistantSettingsAttributes,
  ): Promise<AssistantSettingsAttributes> {
    const parts = await Promise.all(
      this.providers.map(provider =>
        provider.updateSettings(context, pick(attributes, provider.fields)),
      ),
    );
    return Object.assign({}, ...parts) as AssistantSettingsAttributes;
  }
}
