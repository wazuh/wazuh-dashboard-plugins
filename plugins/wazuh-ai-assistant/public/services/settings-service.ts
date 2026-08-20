import { HttpSetup } from '../../../../src/core/public';
import { API_PATHS } from '../../common/constants';
import {
  ProviderInput,
  ProviderSummary,
  ProviderTestResult,
} from '../../common/types';
import { fetchAllPages } from './fetch-all-pages';
import { SettingsAccess } from './session-heal';

/**
 * Window event announcing that the plugin-wide assistant settings document was just saved
 * (`updateAssistantSettings`). Every mounted ChatPage listens and refetches, so an admin's privacy
 * policy change lands in the chat immediately instead of only after a full page reload.
 *
 * A window event rather than a prop callback on purpose: the Chat and Settings views stay mounted
 * side by side behind `display: none` (public/application.tsx), and there is a SECOND, independent
 * ChatPage mount in the header flyout (public/components/header/assistant-chat-panel.tsx) that no
 * prop from the Settings page could ever reach. Lives here — the module that owns the settings
 * GET/PUT — so neither view has to import the other.
 */
export const ASSISTANT_SETTINGS_CHANGED_EVENT =
  'wazuhAiAssistant:assistantSettingsChanged';

/**
 * Window event announcing that the provider list changed (created/updated/deleted, or a new
 * default). Consumed by `useProviders` (public/hooks/use-providers.ts), so every mounted consumer
 * refreshes — including the header flyout's own independent `useProviders` instance, which the
 * Settings page's `onProvidersChanged` prop callback can never reach for the same reason described
 * above. That prop path stays in place; a duplicate refresh is harmless.
 */
export const PROVIDERS_CHANGED_EVENT = 'wazuhAiAssistant:providersChanged';

/** Mirrors server/tools/privacy.ts's `FieldPolicyAction` — that file lives under server/ (out of
 * scope to import from public/), so this is a hand-kept public-side copy of the same wire values
 * (server/routes/settings.ts's `fieldPolicyActionSchema` is the source of truth). */
export type FieldPolicyAction = 'allow' | 'allow-scan' | 'anonymize' | 'never';

/** Mirrors server/tools/privacy.ts's `FieldPolicyEntry`. */
export interface FieldPolicyEntry {
  field: string;
  action: FieldPolicyAction;
}

/**
 * Public-side mirror of server/settings/types.ts's `AssistantSettingsAttributes` (a server/ type,
 * out of scope to import here) — this is the exact GET/PUT body shape of `API_PATHS.SETTINGS`
 * (server/routes/settings.ts).
 */
export interface AssistantSettings {
  privacyDefaultOn: boolean;
  privacyDefaultPerProvider: Record<string, boolean>;
  userCanOverride: boolean;
  fieldPolicy: FieldPolicyEntry[];
  /** Days a saved conversation is kept before the ISM policy governing
   * `CONVERSATION_SESSIONS_INDEX_ALIAS` deletes its backing index; `0` means keep forever. Backed
   * by an ISM policy rather than this settings document — see
   * server/settings/ism-settings-provider.ts — but travels through this same GET/PUT shape.
   * Mirrors server/settings/types.ts's `AssistantSettingsAttributes.conversationRetentionDays`. */
  conversationRetentionDays: number;
}

/** Shape of the paginated GET /providers response (server/routes/settings.ts). */
interface ProvidersPage {
  providers: ProviderSummary[];
  total: number;
  page: number;
  perPage: number;
}

/** Server-side page size used when looping pages in `list()`. Matches the server's default/max. */
const PROVIDERS_PAGE_SIZE = 100;
/** Hard safety ceiling so a runaway `total` can never cause an unbounded fetch loop. */
const PROVIDERS_MAX_PAGES = 20;

/**
 * Thin wrapper over the settings CRUD routes. Uses the platform's `http` service (buffering is
 * fine here: these are small JSON payloads, not the streaming chat response).
 */
export class SettingsService {
  constructor(private readonly http: HttpSetup) {}

  /** Fetches every provider by looping pages (server truncates to `perPage` per call), so callers
   * keep seeing the complete list ("show all", no client-side Load-More). Stops once every page
   * has been collected, or at a hard ceiling of 20 pages / 2000 providers — whichever comes first —
   * to guard against an unbounded loop if the server ever reports a bogus `total`. */
  list(): Promise<ProviderSummary[]> {
    return fetchAllPages(
      async page => {
        const response = await this.http.get<ProvidersPage>(
          API_PATHS.PROVIDERS,
          {
            query: { page, perPage: PROVIDERS_PAGE_SIZE },
          },
        );
        return { items: response.providers, total: response.total };
      },
      PROVIDERS_PAGE_SIZE,
      PROVIDERS_MAX_PAGES,
      'AI Assistant: provider list exceeds 2000; showing the first 2000',
    );
  }

  // These writes run against the Wazuh indexer as the current user (server/settings/
  // opensearch-user.ts) — no Manager/wz-token involved, so no session-heal-retry wrapping here;
  // the indexer's own `plugin:wazuh/ai_assistant/settings/write` permission on the caller's
  // backend role is what authorizes them, and a real 403 surfaces as-is (see `describeHttpError`).
  create(input: ProviderInput): Promise<ProviderSummary> {
    return this.http.post<ProviderSummary>(API_PATHS.PROVIDERS, {
      body: JSON.stringify(input),
    });
  }

  update(id: string, input: ProviderInput): Promise<ProviderSummary> {
    return this.http.put<ProviderSummary>(API_PATHS.PROVIDER_BY_ID(id), {
      body: JSON.stringify(input),
    });
  }

  async remove(id: string): Promise<void> {
    await this.http.delete(API_PATHS.PROVIDER_BY_ID(id));
  }

  test(id: string): Promise<ProviderTestResult> {
    return this.http.post<ProviderTestResult>(API_PATHS.PROVIDER_TEST(id));
  }

  setDefault(id: string): Promise<ProviderSummary> {
    return this.http.post<ProviderSummary>(API_PATHS.PROVIDER_SET_DEFAULT(id));
  }

  /** Plugin-wide settings singleton: privacy defaults/override/field policy. The GET route
   * creates it with defaults on first access (server/settings/assistant-settings-manager.ts's
   * `AssistantSettingsManager.getOrCreateSettings`), so this never 404s. */
  getAssistantSettings(): Promise<AssistantSettings> {
    return this.http.get<AssistantSettings>(API_PATHS.SETTINGS);
  }

  updateAssistantSettings(
    settings: AssistantSettings,
  ): Promise<AssistantSettings> {
    return this.http.put<AssistantSettings>(API_PATHS.SETTINGS, {
      body: JSON.stringify(settings),
    });
  }

  /** Manager-session liveness probe (server/routes/settings.ts's GET /settings/access) — NOT an
   * authorization check. Never rejects to report a session problem — the server always resolves
   * 200 here with `managerSessionOk: false` and an actionable `message` instead; a REJECTED
   * promise means the probe itself failed, which callers should treat as fail-open.
   *
   * `defaultApiHostId` (client-side session auto-heal): the Manager host id to pass to
   * `session-heal.ts`'s `healManagerSession` when `managerSessionOk` is false; `null` when the
   * server could not resolve any configured Wazuh manager host.
   *
   * `apiKeyEncryptionEnabled`: false when the server cannot encrypt keys at rest; the form then
   * warns and blocks saving a key (the server's 503 gate is the backstop). */
  getSettingsAccess(): Promise<SettingsAccess> {
    return this.http.get<SettingsAccess>(API_PATHS.SETTINGS_ACCESS);
  }
}
