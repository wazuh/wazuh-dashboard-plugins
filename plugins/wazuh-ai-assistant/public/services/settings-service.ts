import { HttpSetup } from '../../../../src/core/public';
import { API_PATHS } from '../../common/constants';
import {
  ProviderInput,
  ProviderSummary,
  ProviderTestResult,
} from '../../common/types';
import { fetchAllPages } from './fetch-all-pages';
import { FieldPolicyEntry } from '../../common/field-policy';

/** Re-exported from common/field-policy.ts — the single definition both sides now share (it used to
 * be a hand-kept public-side copy of the server/ type, which public/ may not import). Kept exported
 * from here so the Settings page's existing imports are unaffected. */
export type {
  FieldPolicyAction,
  FieldPolicyEntry,
} from '../../common/field-policy';

/**
 * Public-side mirror of server/saved_objects/assistant-settings.ts's `AssistantSettingsAttributes`
 * (a server/ type, out of scope to import here) — this is the exact GET/PUT body shape of
 * `API_PATHS.SETTINGS` (server/routes/settings.ts).
 */
export interface AssistantSettings {
  privacyDefaultOn: boolean;
  privacyDefaultPerProvider: Record<string, boolean>;
  userCanOverride: boolean;
  fieldPolicy: FieldPolicyEntry[];
  /** Days to keep a saved conversation before GET /conversations excludes (and best-effort
   * deletes) it; `0` means keep forever. Mirrors server/saved_objects/assistant-settings.ts's
   * `AssistantSettingsAttributes.conversationRetentionDays`. */
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
   * creates it with defaults on first access (server/routes/settings.ts's
   * `getOrCreateAssistantSettings`), so this never 404s. */
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

  /** Pre-flight administrator probe: backs the Settings page's warning callout
   * and Save-button disabling, called once on mount. Never rejects to report "not an admin" — the
   * server always resolves 200 here with `administrator: false` and an actionable `message`
   * instead (server/routes/settings.ts's GET /settings/access); a REJECTED promise here means the
   * probe itself failed, which callers should treat as fail-open (the server still enforces the
   * real gate on PUT).
   *
   * `defaultApiHostId` (client-side session auto-heal): the Manager host id to pass to
   * `session-heal.ts`'s `healManagerSession` when `administrator` is false for token reasons; `null`
   * when the server could not resolve any configured Wazuh manager host. */
  getSettingsAccess(): Promise<{
    administrator: boolean;
    message: string | null;
    defaultApiHostId: string | null;
  }> {
    return this.http.get<{
      administrator: boolean;
      message: string | null;
      defaultApiHostId: string | null;
    }>(API_PATHS.SETTINGS_ACCESS);
  }
}
