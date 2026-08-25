import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useHistory, useLocation } from 'react-router-dom';
import './settings-page.scss';
import {
  EuiPage,
  EuiBadge,
  EuiBottomBar,
  EuiPageBody,
  EuiPageHeader,
  EuiTabs,
  EuiTab,
  EuiInMemoryTable,
  EuiBasicTableColumn,
  EuiButton,
  EuiButtonIcon,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiFieldText,
  EuiSelect,
  EuiCallOut,
  EuiSpacer,
  EuiText,
  EuiTextColor,
  EuiConfirmModal,
  EuiToolTip,
  EuiLoadingSpinner,
  EuiSwitch,
  EuiPanel,
  EuiPopover,
  EuiContextMenuPanel,
  EuiContextMenuItem,
  EuiFieldNumber,
  EuiHorizontalRule,
  EuiFieldSearch,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from '../../../../../src/core/public';
import {
  ASSISTANT_SETTINGS_CHANGED_EVENT,
  AssistantSettings,
  FieldPolicyAction,
  FieldPolicyEntry,
  PROVIDERS_CHANGED_EVENT,
  SettingsService,
} from '../../services/settings-service';
import { ProviderInput, ProviderSummary } from '../../../common/types';
import { useDirtyFormState } from '../../hooks/use-dirty-form-state';
import { ProviderFormFlyout } from './provider-form-flyout';
import {
  ProviderTestOutcome,
  describeHttpError,
  isEndpointBlockedError,
  outcomeFromTestError,
  outcomeFromTestResult,
} from './provider-status';

// Exactly three selectable options (symmetry pass, iteration-4 batch 2 item 5) — `allow-scan`
// (#8912) is deliberately excluded here even though it stays a valid STORED action:
// `server/tools/privacy.ts` keeps `allow-scan` in the server-side `FieldPolicyAction` type so
// existing/default fields configured with it keep working and keep their server-side injection
// scan; this select just no longer offers picking it. See `toSelectableFieldPolicyAction` below
// for how an `allow-scan` row still displays (and round-trips) correctly.
type SelectableFieldPolicyAction = Exclude<FieldPolicyAction, 'allow-scan'>;

const FIELD_POLICY_ACTIONS: SelectableFieldPolicyAction[] = [
  'allow',
  'anonymize',
  'never',
];

const FIELD_POLICY_ACTION_LABELS: Record<SelectableFieldPolicyAction, string> =
  {
    allow: i18n.translate('wazuhAiAssistant.settings.privacy.action.allow', {
      defaultMessage: 'Allow',
    }),
    anonymize: i18n.translate(
      'wazuhAiAssistant.settings.privacy.action.anonymize',
      {
        defaultMessage: 'Anonymize',
      },
    ),
    never: i18n.translate('wazuhAiAssistant.settings.privacy.action.never', {
      defaultMessage: 'Never send',
    }),
  };

/**
 * Maps a STORED action (including the no-longer-selectable `allow-scan`) to what this dropdown
 * displays/selects. `allow-scan` reads as plain "Allow" — the word "scanned" never appears here —
 * while the underlying draft value is left completely alone by this function; it is a display-only
 * mapping fed to the `<EuiSelect>`'s `value`, never written back into `fieldPolicyDraft`. A row
 * this maps is only ever actually rewritten to a new value when the admin explicitly changes it
 * (the select's own `onChange` below), so an untouched `allow-scan` row keeps that exact stored
 * value and round-trips unchanged on save.
 */
function toSelectableFieldPolicyAction(
  action: FieldPolicyAction,
): SelectableFieldPolicyAction {
  return action === 'allow-scan' ? 'allow' : action;
}

interface SettingsPageProps {
  core: CoreStart;
  /** Lets the top-level app shell refresh its own provider list/selection after a CRUD action. */
  onProvidersChanged: () => void;
  /**
   * False while the Chat tab is the visible one. This page stays MOUNTED behind `display: none`
   * (application.tsx) so it keeps its state across tab switches — but an `EuiFlyout` renders through
   * a PORTAL attached to document.body, which no ancestor's `display: none` can hide. Without this,
   * opening the provider flyout and switching to Chat left the flyout floating over the chat
   * surface. Defaults to true so every other call site is unaffected.
   */
  isActive?: boolean;
  /** True while the URL carries `?addProvider=true`: opens the create-provider flyout. */
  autoOpenCreateForm?: boolean;
  onCreateFormOpenChange?: (open: boolean) => void;
}

/** Announces a saved assistant-settings document to every mounted ChatPage (including the header
 * flyout's independent one), so an admin's privacy policy change applies without a page reload.
 * See `ASSISTANT_SETTINGS_CHANGED_EVENT` for why this is a window event, not a prop callback.
 *
 * The document the PUT returned rides along as `detail` so listeners never have to re-GET it: a
 * read issued right after the write can still see the PRE-save document (the indexer write is not
 * synchronously visible), which would silently reinstate the policy just changed. */
function notifyAssistantSettingsChanged(saved: AssistantSettings): void {
  window.dispatchEvent(
    new CustomEvent(ASSISTANT_SETTINGS_CHANGED_EVENT, { detail: saved }),
  );
}

/** Announces a provider create/update/delete/default change to every `useProviders` consumer.
 * Complements the `onProvidersChanged` prop, which only reaches the in-app chat view. */
function notifyProvidersChanged(): void {
  window.dispatchEvent(new Event(PROVIDERS_CHANGED_EVENT));
}

// Short labels shown in the providers table; the add/edit flyout uses its own long labels
// (provider-form-flyout.tsx), where the full parenthetical fits.
const PROVIDER_TYPE_SHORT_LABELS: Record<string, string> = {
  openai_compatible: i18n.translate(
    'wazuhAiAssistant.settings.type.short.openaiCompatible',
    {
      defaultMessage: 'OpenAI-compatible',
    },
  ),
  anthropic: i18n.translate('wazuhAiAssistant.settings.type.short.anthropic', {
    defaultMessage: 'Anthropic',
  }),
};

/**
 * The three landmarks this page organizes its (currently three, one-per-tab) SectionCards under
 * (UX iteration 4 item 2). Deliberately not open-ended: a future settings section earns its own
 * id here when it actually ships, rather than a placeholder tab sitting empty in the meantime.
 */
type SettingsTabId = 'providers' | 'privacy' | 'retention';
const SETTINGS_TAB_IDS: SettingsTabId[] = ['providers', 'privacy', 'retention'];
const DEFAULT_SETTINGS_TAB: SettingsTabId = 'providers';
/** `?tab=<id>` on `#/settings`, the same query-param deep-link idiom `?addProvider=true`
 * (application.tsx) already establishes for this page. */
const TAB_PARAM = 'tab';
/** Mirrors `ADD_PROVIDER_PARAM` in `../../application.tsx` (not imported from there — that module
 * imports `SettingsPage`, so importing back from it would be circular). `closeForm` below needs
 * this name to strip the param from the URL in the SAME history write that restores the tab
 * (item 1a): deleting it via a separate push let the still-stale `location.search` closure put it
 * right back. */
const ADD_PROVIDER_PARAM = 'addProvider';

/** Reads the active tab off the URL, following the same precedent `?addProvider=true` set: an
 * unknown/stale/missing value falls back to the Providers tab rather than rendering nothing. */
function tabFromSearch(search: string): SettingsTabId {
  const raw = new URLSearchParams(search).get(TAB_PARAM);
  return (SETTINGS_TAB_IDS as string[]).includes(raw ?? '')
    ? (raw as SettingsTabId)
    : DEFAULT_SETTINGS_TAB;
}

// The Privacy section's whole save unit: the two on/off switches plus the field policy rows
// below them, all gated behind the same "Save privacy settings" button and the same dirty check.
type PrivacyDraft = Pick<
  AssistantSettings,
  'privacyDefaultOn' | 'userCanOverride' | 'privacyDefaultPerProvider'
> & {
  fieldPolicy: Array<FieldPolicyEntry & { _isNew?: true }>;
};

/** The per-provider override control's three states (UX iteration 4 item 3): `'inherit'` means
 * the provider's id is simply ABSENT from `privacyDefaultPerProvider` (the wire shape has no
 * dedicated "inherit" value — see `AssistantSettings.privacyDefaultPerProvider`, a plain
 * `Record<string, boolean>`), while `'on'`/`'off'` are an explicit `true`/`false` entry. A plain
 * `EuiSwitch` can only express two of these three states, which is why this reaches for a select
 * instead. */
type ProviderPrivacyOverride = 'inherit' | 'on' | 'off';

function providerPrivacyOverride(
  perProvider: Record<string, boolean>,
  providerId: string,
): ProviderPrivacyOverride {
  if (!(providerId in perProvider)) {
    return 'inherit';
  }
  return perProvider[providerId] ? 'on' : 'off';
}

/** Applies one row's new override to the draft map, removing the KEY entirely for `'inherit'`
 * rather than storing some sentinel — the wire shape's only way to say "no override" is for the
 * provider's id to be absent (see `ProviderPrivacyOverride` above). */
function withProviderPrivacyOverride(
  perProvider: Record<string, boolean>,
  providerId: string,
  next: ProviderPrivacyOverride,
): Record<string, boolean> {
  if (next === 'inherit') {
    const { [providerId]: _removed, ...rest } = perProvider;
    return rest;
  }
  return { ...perProvider, [providerId]: next === 'on' };
}

/**
 * Full PUT /settings payload from the last successful load plus the one slice a section's Save
 * button owns (the route requires the WHOLE settings shape on every PUT — see the doc comment on
 * the assistant-settings load effect below). One shared base means a future settings field gets
 * added here once instead of remembered per section handler (forgetting one would silently reset
 * that field on save).
 */
function buildSettingsPayload(
  base: AssistantSettings,
  overrides: Partial<AssistantSettings>,
): AssistantSettings {
  return {
    privacyDefaultOn: base.privacyDefaultOn,
    privacyDefaultPerProvider: base.privacyDefaultPerProvider,
    userCanOverride: base.userCanOverride,
    fieldPolicy: base.fieldPolicy,
    conversationRetentionDays: base.conversationRetentionDays,
    ...overrides,
  };
}

/**
 * The retention field's parse-and-validate step, kept as a pure function so both the field's own
 * blur check and the save handler ask the same question. Returns the day count, or `null` for
 * anything that is not a whole, non-negative number of days — including an EMPTY field, which is
 * allowed to exist transiently while editing but is never a value that can be saved.
 *
 * Deliberately not `Number()` alone: `Number('')` is `0`, and the field's old `onChange` fed that
 * straight back as the field's value, so clearing the box to type "14" reset it to "0" first and
 * left the admin looking at "014" — and, worse, a garbage entry was silently CLAMPED to 0, which is
 * the one value that means "keep every conversation forever". A rejected input must be reported,
 * never quietly reinterpreted as the most permissive setting.
 */
export function parseRetentionDays(raw: string): number | null {
  const trimmed = raw.trim();
  // Digits only: rejects '', '-1', '1.5', '1e3' and 'abc' — all of which `Number()` would either
  // accept or turn into a number nobody typed.
  if (!/^\d+$/.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

/**
 * Whether the retention field's TEXT differs from the number last loaded/saved. Compared as text on
 * purpose: an entry the parser refuses (see `parseRetentionDays`) has no number to compare, so a
 * numeric check would call the section clean, the Save button would go dead, and nothing on screen
 * would say why. Text keeps the button live for a changed-but-invalid entry, and clicking it
 * produces the field error instead of silence.
 *
 * Shared by the Save button's own enabled state and by the Privacy save's decision about whether it
 * may overwrite this section's draft.
 */
function isRetentionDirty(
  input: string | null,
  baseline: number | undefined,
): boolean {
  return (
    input !== null &&
    baseline !== undefined &&
    input.trim() !== String(baseline)
  );
}

/** Shown under the retention field for anything `parseRetentionDays` refuses, and on the save
 * attempt it blocks — one string for both, so the two can never disagree about what is wrong. */
const RETENTION_INVALID_MESSAGE = i18n.translate(
  'wazuhAiAssistant.settings.retention.daysInvalid',
  {
    defaultMessage: 'Retention must be 0 or a positive number of days.',
  },
);

/** Stable hook for moving focus to the retention field when a save is rejected. `EuiFieldNumber`
 * forwards unknown props to the `<input>` itself, so this attribute lands on the element to
 * focus. */
const RETENTION_DAYS_TEST_SUBJ = 'wzRetentionDays';

/**
 * Middle-truncates a long value (e.g. an endpoint URL) so the tail — usually the most
 * distinguishing part of a URL path — stays visible instead of being clipped by a trailing
 * ellipsis. The full value is still available via the `EuiToolTip` wrapping the caller's render,
 * so nothing is actually lost, only compacted (screen 3 gap: "Endpoints dominate the row").
 */
function middleTruncate(value: string, maxLength = 28): string {
  if (value.length <= maxLength) {
    return value;
  }
  const keep = maxLength - 1; // reserve one character for the ellipsis
  const headLength = Math.ceil(keep * 0.6);
  const tailLength = keep - headLength;
  return `${value.slice(0, headLength)}…${value.slice(
    value.length - tailLength,
  )}`;
}

/** Renders every column of a section's own centred pill title over a bordered, shadowless panel
 * — the Home overview idiom (screen 3 gap: "Sections are headings, not cards"). `pillLabel` is
 * displayed uppercase via CSS only (`settings-page.scss`), so the underlying translated string
 * itself is never altered. */
const SectionCard: React.FC<{
  pillLabel: string;
  description?: string;
  children: React.ReactNode;
}> = ({ pillLabel, description, children }) => (
  <div className='wzSettingsCard'>
    <div className='wzSettingsCard__pillRow'>
      <EuiBadge className='wzSettingsCard__pill' color='hollow'>
        {pillLabel}
      </EuiBadge>
    </div>
    <EuiPanel
      hasShadow={false}
      hasBorder
      paddingSize='none'
      className='wzSettingsCard__panel'
    >
      {description && (
        <>
          {/* `.wzSettingsCard__description` caps the sentence at the prose measure. Without it the
              description inherited the card's full 1150px (audit §4.3): the page measure exists for
              the providers table, and a line of prose inside that page is not entitled to it. */}
          <EuiText
            size='s'
            color='subdued'
            className='wzSettingsCard__description'
          >
            <p>{description}</p>
          </EuiText>
          <EuiSpacer size='m' />
        </>
      )}
      {children}
    </EuiPanel>
  </div>
);

const STATUS_CHIP_TINT_CLASS: Record<
  'ok' | 'failed' | 'testing' | 'could-not-verify' | 'pending',
  string
> = {
  ok: 'wzStatusChip--ok',
  failed: 'wzStatusChip--failed',
  testing: 'wzStatusChip--testing',
  'could-not-verify': 'wzStatusChip--could-not-verify',
  pending: 'wzStatusChip--pending',
};

/** One status chip, four states (screen 3, variation 3a): same shape and position regardless of
 * outcome, colour alone carries the state. `provider-status.ts` already models these states (PR
 * #8936) — this only restyles their presentation. A hover/detail `reason` is optional: `ok` and
 * `pending` never have one. */
const ProviderStatusChip: React.FC<{
  status: 'ok' | 'failed' | 'testing' | 'could-not-verify' | 'pending';
  label: string;
  reason?: string;
}> = ({ status, label, reason }) => {
  const chip = (
    <EuiBadge
      color='hollow'
      className={`wzStatusChip ${STATUS_CHIP_TINT_CLASS[status]}`}
    >
      {status === 'testing' && (
        <EuiLoadingSpinner size='s' className='wzStatusChip__spinner' />
      )}
      {label}
    </EuiBadge>
  );
  return reason ? (
    <EuiToolTip content={reason}>
      <span>{chip}</span>
    </EuiToolTip>
  ) : (
    chip
  );
};

/** Expandable row detail (screen 3, variation 3a: "reason on hover and in the expandable row
 * detail"): the untruncated endpoint plus, when a test has run, the full outcome message —
 * latency on success, the failure/could-not-verify reason otherwise. */
const ProviderRowDetail: React.FC<{
  provider: ProviderSummary;
  outcome?: ProviderTestOutcome;
}> = ({ provider, outcome }) => (
  <EuiFlexGroup direction='column' gutterSize='s' responsive={false}>
    <EuiFlexItem>
      <EuiText size='s'>
        <strong>
          {i18n.translate('wazuhAiAssistant.settings.rowDetail.endpoint', {
            defaultMessage: 'Endpoint',
          })}
          :
        </strong>{' '}
        {provider.baseUrl}
      </EuiText>
    </EuiFlexItem>
    {outcome && outcome.status === 'ok' && (
      <EuiFlexItem>
        <EuiText size='s'>
          {i18n.translate('wazuhAiAssistant.settings.rowDetail.latency', {
            defaultMessage: 'Last test responded in {latencyMs} ms.',
            values: { latencyMs: outcome.latencyMs },
          })}
        </EuiText>
      </EuiFlexItem>
    )}
    {outcome && outcome.status !== 'ok' && (
      <EuiFlexItem>
        <EuiText size='s' color='danger'>
          <strong>
            {i18n.translate('wazuhAiAssistant.settings.rowDetail.reason', {
              defaultMessage: 'Reason',
            })}
            :
          </strong>{' '}
          {outcome.message}
        </EuiText>
      </EuiFlexItem>
    )}
    {!outcome && (
      <EuiFlexItem>
        <EuiText size='s' color='subdued'>
          {i18n.translate('wazuhAiAssistant.settings.rowDetail.noResult', {
            defaultMessage: 'This provider has not been tested yet.',
          })}
        </EuiText>
      </EuiFlexItem>
    )}
  </EuiFlexGroup>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({
  core,
  onProvidersChanged,
  isActive = true,
  autoOpenCreateForm,
  onCreateFormOpenChange,
}) => {
  // This page is always rendered as a descendant of the app's own <Router> (application.tsx), so
  // these hooks latch onto that ambient context without this component needing a `history`/
  // `location` prop threaded down from there.
  const location = useLocation();
  const history = useHistory();
  const [activeTabId, setActiveTabId] = useState<SettingsTabId>(() =>
    autoOpenCreateForm ? 'providers' : tabFromSearch(location.search),
  );
  // Tracks the PREVIOUS `autoOpenCreateForm` value so the effect below can tell an ARRIVAL
  // (false → true, e.g. the `?addProvider=true` deep link firing, or the header's "Add provider"
  // button flipping it) from the flag merely still being true on some later, unrelated URL change.
  // Seeded to `false` so a component that first MOUNTS with the flag already true (the deep-link
  // case) is itself treated as an arrival, matching this component's own initial `activeTabId`
  // state above.
  const previousAutoOpenCreateFormRef = useRef(false);
  // Keeps the active tab in sync with the URL: a bookmarked/shared `?tab=privacy` link and the
  // browser's back/forward buttons funnel through here rather than through the click handler
  // below (which only covers the admin actually clicking a tab) — as does the ARRIVAL of the
  // `?addProvider=true` deep link, which always means Providers, since that is the only tab the
  // create-provider flyout belongs to.
  //
  // Deliberately NOT "force Providers whenever `autoOpenCreateForm` is still true": `addProvider`
  // can legitimately still be sitting in the URL (e.g. while the create flyout is open) on a
  // search change that has nothing to do with arriving there — most notably `closeForm` below,
  // whose own history push races this effect. Re-forcing Providers on every one of those changes
  // silently overrode every OTHER tab click for as long as `addProvider` lingered (item 1b).
  useEffect(() => {
    const isArrival =
      autoOpenCreateForm && !previousAutoOpenCreateFormRef.current;
    previousAutoOpenCreateFormRef.current = Boolean(autoOpenCreateForm);
    setActiveTabId(isArrival ? 'providers' : tabFromSearch(location.search));
  }, [location.search, autoOpenCreateForm]);

  const switchTab = (tabId: SettingsTabId) => {
    // No-op on the already-active tab: this used to still push a new history entry (and, before
    // the fix below, still stomp any OTHER query params) for a click that changes nothing on
    // screen, which made "back" after clicking the current tab a no-op the admin didn't expect.
    if (tabId === activeTabId) {
      return;
    }
    setActiveTabId(tabId);
    // Preserve any OTHER query params the URL is carrying (`?addProvider=true` in particular) —
    // this used to rebuild `search` from scratch with only `?tab=`, silently dropping them.
    const params = new URLSearchParams(location.search);
    if (tabId === DEFAULT_SETTINGS_TAB) {
      params.delete(TAB_PARAM);
    } else {
      params.set(TAB_PARAM, tabId);
    }
    history.push({
      pathname: location.pathname,
      search: params.toString() ? `?${params.toString()}` : '',
    });
  };

  const [service] = useState(() => new SettingsService(core.http));
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  // Raw text typed into the Providers card's "Filter providers" search box, mirrored out of
  // EuiInMemoryTable's own (uncontrolled) search box via `search.onChange` below — kept only so
  // "Test all" can compute which rows are CURRENTLY visible (screen 3 gap: "Test all tests the
  // wrong set"); the table itself keeps filtering on its own regardless of this state.
  const [providersFilterText, setProvidersFilterText] = useState('');
  // "Test all" busy state: disables/spins the button for the duration of its own throttled run
  // (see `handleTestAll` below), instead of letting a second click pile on more concurrent runs.
  const [isTestingAll, setIsTestingAll] = useState(false);
  // Provider whose values seed the flyout form (null = creating); `isFormOpen` is separate so a
  // create form (no provider) can be open too.
  const [editingProvider, setEditingProvider] =
    useState<ProviderSummary | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, ProviderTestOutcome>
  >({});
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set());
  const [deleteTarget, setDeleteTarget] = useState<ProviderSummary | null>(
    null,
  );
  const [providersLoaded, setProvidersLoaded] = useState(false);
  // Which row's ⋯ actions popover is open — at most one at a time (screen 3: "Row actions become
  // EuiPopover + EuiContextMenu").
  const [openMenuRowId, setOpenMenuRowId] = useState<string | null>(null);
  // Which rows are expanded (screen 3: "expandable row detail").
  const [expandedRowIds, setExpandedRowIds] = useState<Set<string>>(new Set());
  // Result of the connection test the flyout's own "Save & test" kicked off, surfaced back INSIDE
  // the flyout (screen 4: "Save & test gains a result panel") rather than only in the table once
  // it has already closed. `null` while no save has completed yet in this flyout session.
  const [flyoutTestOutcome, setFlyoutTestOutcome] =
    useState<ProviderTestOutcome | null>(null);
  const [isSubmittingProvider, setIsSubmittingProvider] = useState(false);

  // Privacy settings: loaded once on mount; edited locally and only written back on an explicit
  // "Save privacy settings" click, mirroring the provider form's own edit-then-save pattern
  // above rather than saving on every keystroke. `privacy.isDirty` is derived from comparing
  // `privacy.value` — the switches AND the field policy rows below, one combined save unit —
  // against the last loaded/saved baseline, rather than a hand-toggled flag.
  const privacy = useDirtyFormState<PrivacyDraft | null>(null);
  // Plain `const` aliases so the rest of this section reads (and narrows) exactly as it did
  // before this was backed by the hook: TypeScript narrows a `const` through the nested field
  // policy row closures below far more reliably than repeated `privacy.value` member accesses.
  const privacyDraft = privacy.value;
  const fieldPolicyDraft = privacyDraft?.fieldPolicy ?? [];
  // Shared between the Privacy and Conversation history sections below — both are populated by
  // the same `getAssistantSettings()` round-trip in `reloadPrivacySettings`, so a single failure
  // there means neither section has data to show.
  const [settingsLoadError, setSettingsLoadError] = useState<string | null>(
    null,
  );
  const [privacySaveError, setPrivacySaveError] = useState<string | null>(null);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  // Portal target for the privacy bottom bar (indexer-settings/index.tsx's own pattern), so it
  // renders fixed to the viewport rather than at this component's own place in the DOM.
  const [bottomBarHost, setBottomBarHost] = useState<HTMLElement | null>(null);
  useLayoutEffect(() => {
    setBottomBarHost(document.getElementById('app-wrapper') ?? document.body);
  }, []);
  // Kept alongside the drafts above so "Save" can PUT the full AssistantSettings body (the route
  // requires all four attributes every time, server/routes/settings.ts's PUT validator) without
  // this component needing to separately track `privacyDefaultPerProvider` (untouched by this UI —
  // see the per-provider note in handleSubmit below).
  const [loadedAssistantSettings, setLoadedAssistantSettings] =
    useState<AssistantSettings | null>(null);

  // Conversation history retention: days to keep a saved conversation before GET
  // /conversations excludes (and best-effort deletes) it; `0` means keep forever. Same
  // load-draft-then-explicit-save pattern as Privacy above, PUT via the same
  // `updateAssistantSettings` round-trip — but this section holds its draft as the field's RAW
  // TEXT, not as a number, so the box can be transiently empty (or mid-typing) without the page
  // reinterpreting it on every keystroke (see `parseRetentionDays`). `null` means "not loaded yet".
  //
  // That is also why this section does NOT use `useDirtyFormState` the way Privacy above does: the
  // baseline it compares against is `loadedAssistantSettings.conversationRetentionDays` — the
  // number last loaded or saved — while the draft is text, so dirtiness is `isRetentionDirty`
  // below rather than a hook whose two sides must be the same type.
  const [retentionInput, setRetentionInput] = useState<string | null>(null);
  const [retentionValidationError, setRetentionValidationError] = useState<
    string | null
  >(null);
  const [retentionSaveError, setRetentionSaveError] = useState<string | null>(
    null,
  );
  const [isSavingRetention, setIsSavingRetention] = useState(false);
  const [fieldPolicyFilter, setFieldPolicyFilter] = useState('');
  const [fieldPolicyVisibleCount, setFieldPolicyVisibleCount] = useState(5);
  // Computed once and reused for the "N found" count and the visible list below, instead of
  // running the same `.map().filter()` chain twice.
  const fieldPolicyMatches = fieldPolicyDraft
    .map((entry, index) => ({ entry, index }))
    .filter(
      ({ entry }) =>
        !fieldPolicyFilter ||
        entry._isNew ||
        entry.field.toLowerCase().includes(fieldPolicyFilter.toLowerCase()),
    );
  // A row added THIS session (`_isNew`) always renders, cap or no cap — same rule the filter
  // above already gives it against a search term. That's what lets "Add field" stay a plain
  // append with no `fieldPolicyVisibleCount` bookkeeping: the new row is never the one hidden
  // behind "Show more", so clicking Add never needs to reveal the rest of the list to reach it.
  const fieldPolicyExistingMatches = fieldPolicyMatches.filter(
    ({ entry }) => !entry._isNew,
  );
  const fieldPolicyNewMatches = fieldPolicyMatches.filter(
    ({ entry }) => entry._isNew,
  );
  const fieldPolicyVisibleMatches = [
    ...fieldPolicyExistingMatches.slice(0, fieldPolicyVisibleCount),
    ...fieldPolicyNewMatches,
  ];
  const hasEmptyFieldPolicyRow = fieldPolicyDraft.some(
    entry => entry.field.trim() === '',
  );
  // Named once because the Save button now reads it TWICE — for `isDisabled` and for `fill`, which
  // it drops while disabled (audit §4.4). Two copies of the same expression on one element is how
  // the two would drift into disagreeing about which state the button is in.
  const privacySaveDisabled = hasEmptyFieldPolicyRow || !privacy.isDirty;
  const retentionDirty = isRetentionDirty(
    retentionInput,
    loadedAssistantSettings?.conversationRetentionDays,
  );
  // Approximates EuiInMemoryTable's own (uncontrolled) default search — a case-insensitive
  // substring match against every column's own text — closely enough to know which rows "Test
  // all" should act on. Only used for that; the table keeps filtering itself independently.
  const visibleProviders = (() => {
    const query = providersFilterText.trim().toLowerCase();
    if (!query) {
      return providers;
    }
    return providers.filter(provider =>
      [provider.name, provider.type, provider.baseUrl, provider.model].some(
        field => field.toLowerCase().includes(query),
      ),
    );
  })();

  // Tri-state: `null` = probe pending/failed → no callout, no block. The server's 503 gate still
  // refuses plaintext key writes regardless of what this warns about.
  const [apiKeyEncryptionEnabled, setApiKeyEncryptionEnabled] = useState<
    boolean | null
  >(null);
  const reloadPrivacySettings = () => {
    service
      .getAssistantSettings()
      .then(loaded => {
        setLoadedAssistantSettings(loaded);
        privacy.commit({
          privacyDefaultOn: loaded.privacyDefaultOn,
          userCanOverride: loaded.userCanOverride,
          privacyDefaultPerProvider: loaded.privacyDefaultPerProvider,
          fieldPolicy: loaded.fieldPolicy,
        });
        setRetentionInput(String(loaded.conversationRetentionDays));
        setRetentionValidationError(null);
        setSettingsLoadError(null);
      })
      .catch(() =>
        setSettingsLoadError(
          i18n.translate('wazuhAiAssistant.settings.loadError', {
            defaultMessage: 'Could not load settings.',
          }),
        ),
      );
  };

  useEffect(() => {
    reloadPrivacySettings();
    // Capability probe only (encryption-at-rest availability) — settings/providers are authorized
    // by the Wazuh indexer's own RBAC on the calling user, not by anything this page checks, so a
    // failed probe just leaves `apiKeyEncryptionEnabled` at its fail-open `null` default.
    void service
      .getSettingsAccess()
      .then(access => {
        // `!== false` stays fail-open when older servers omit the field.
        setApiKeyEncryptionEnabled(access.apiKeyEncryptionEnabled !== false);
      })
      .catch(() => {
        // Fail open: leave `apiKeyEncryptionEnabled` at its `null` default.
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveRetentionSettings = async () => {
    if (retentionInput === null || !loadedAssistantSettings) {
      return;
    }
    // Reject rather than clamp (see `parseRetentionDays`): an unparseable entry gets a field-level
    // error and focus, and nothing is written. The button stays enabled for a changed-but-invalid
    // entry precisely so this path can explain itself, instead of the admin facing a dead button
    // with no stated reason.
    const parsedRetention = parseRetentionDays(retentionInput);
    if (parsedRetention === null) {
      setRetentionValidationError(RETENTION_INVALID_MESSAGE);
      document
        .querySelector<HTMLInputElement>(
          `[data-test-subj="${RETENTION_DAYS_TEST_SUBJ}"]`,
        )
        ?.focus();
      return;
    }
    setRetentionValidationError(null);
    setRetentionSaveError(null);
    setIsSavingRetention(true);
    try {
      const saved = await service.updateAssistantSettings(
        buildSettingsPayload(loadedAssistantSettings, {
          conversationRetentionDays: parsedRetention,
        }),
      );
      setLoadedAssistantSettings(saved);
      notifyAssistantSettingsChanged(saved);
      setRetentionInput(String(saved.conversationRetentionDays));
      core.notifications.toasts.addSuccess(
        i18n.translate('wazuhAiAssistant.settings.retention.saveSuccess', {
          defaultMessage: 'Conversation history settings saved.',
        }),
      );
    } catch (saveError) {
      setRetentionSaveError(
        describeHttpError(
          saveError,
          i18n.translate('wazuhAiAssistant.settings.retention.saveError', {
            defaultMessage: 'Could not save conversation history settings.',
          }),
        ),
      );
    } finally {
      setIsSavingRetention(false);
    }
  };

  const handleFieldPolicyChange = (
    index: number,
    patch: Partial<FieldPolicyEntry>,
  ) => {
    privacy.setValue(
      current =>
        current && {
          ...current,
          fieldPolicy: current.fieldPolicy.map((entry, entryIndex) =>
            entryIndex === index ? { ...entry, ...patch } : entry,
          ),
        },
    );
  };

  // Per-provider privacy override (UX iteration 4 item 3): part of the same Privacy save unit as
  // the switches and field policy above, gated behind the same "Save privacy settings" button and
  // the same dirty check — it edits `privacy.value.privacyDefaultPerProvider` the same way
  // `handleFieldPolicyChange` above edits `fieldPolicy`.
  const handleProviderPrivacyOverrideChange = (
    providerId: string,
    next: ProviderPrivacyOverride,
  ) => {
    privacy.setValue(
      current =>
        current && {
          ...current,
          privacyDefaultPerProvider: withProviderPrivacyOverride(
            current.privacyDefaultPerProvider ?? {},
            providerId,
            next,
          ),
        },
    );
  };

  const handleAddFieldPolicyRow = () => {
    privacy.setValue(
      current =>
        current && {
          ...current,
          fieldPolicy: [
            ...current.fieldPolicy,
            { field: '', action: 'anonymize', _isNew: true },
          ],
        },
    );
  };

  const handleRemoveFieldPolicyRow = (index: number) => {
    privacy.setValue(
      current =>
        current && {
          ...current,
          fieldPolicy: current.fieldPolicy.filter(
            (_entry, entryIndex) => entryIndex !== index,
          ),
        },
    );
  };

  const handleSavePrivacySettings = async () => {
    if (!privacyDraft || !loadedAssistantSettings) {
      return;
    }
    setPrivacySaveError(null);
    setIsSavingPrivacy(true);
    try {
      const saved = await service.updateAssistantSettings(
        buildSettingsPayload(loadedAssistantSettings, {
          privacyDefaultOn: privacyDraft.privacyDefaultOn,
          userCanOverride: privacyDraft.userCanOverride,
          privacyDefaultPerProvider:
            privacyDraft.privacyDefaultPerProvider ?? {},
          // Drop any blank rows a user added via "Add field" but never filled in.
          // Strip the internal `_isNew` flag before sending — the server schema rejects unknown keys.
          fieldPolicy: fieldPolicyDraft
            .filter(entry => entry.field.trim().length > 0)
            .map(({ _isNew: _removed, ...entry }) => entry),
        }),
      );
      setLoadedAssistantSettings(saved);
      notifyAssistantSettingsChanged(saved);
      privacy.commit({
        privacyDefaultOn: saved.privacyDefaultOn,
        userCanOverride: saved.userCanOverride,
        privacyDefaultPerProvider: saved.privacyDefaultPerProvider,
        fieldPolicy: saved.fieldPolicy,
      });
      // Keep the retention field's own text in step with the number the save echoed back — the two
      // are the same document, and a stale text draft here would leave the retention section
      // reading as dirty against a baseline that had just moved.
      //
      // Guarded, though: only a CLEAN retention field is resynced. Both tabs stay mounted, so an
      // admin can type a new retention value, switch to Privacy, save that, and come back — and
      // an unguarded resync would silently throw the unsaved retention edit away and leave the
      // saved number in its place. A dirty draft is the admin's, and this save was not about it.
      //
      // The decision is made INSIDE the updater, against `current`, not against the `retentionInput`
      // this closure captured before the await: the admin can perfectly well type into the
      // retention field while the privacy request is in flight, and a pre-await read would not see
      // that edit and would overwrite it.
      setRetentionInput(current =>
        isRetentionDirty(current, saved.conversationRetentionDays)
          ? current
          : String(saved.conversationRetentionDays),
      );
      // No `setRetentionValidationError(null)` to go with it: a value the parser refuses always
      // differs from the saved number, so an invalid field is by definition dirty and keeps both
      // its text and its error here, while a clean field never had an error to clear.
      core.notifications.toasts.addSuccess(
        i18n.translate('wazuhAiAssistant.settings.privacy.saveSuccess', {
          defaultMessage: 'Privacy settings saved.',
        }),
      );
    } catch (saveError) {
      setPrivacySaveError(
        describeHttpError(
          saveError,
          i18n.translate('wazuhAiAssistant.settings.privacy.saveError', {
            defaultMessage: 'Could not save privacy settings.',
          }),
        ),
      );
    } finally {
      setIsSavingPrivacy(false);
    }
  };

  const clearTestResult = (providerId: string) => {
    setTestResults(current => {
      if (!(providerId in current)) {
        return current;
      }
      const next = { ...current };
      delete next[providerId];
      return next;
    });
  };

  const reload = () => {
    service
      .list()
      .then(setProviders)
      .catch(() =>
        setError(
          i18n.translate('wazuhAiAssistant.settings.providers.loadError', {
            defaultMessage: 'Could not load providers.',
          }),
        ),
      );
  };

  // Returns the outcome (not just void) so `handleSubmit` below can feed it straight into the
  // flyout's result panel without re-reading state that may not have flushed yet.
  const handleTest = async (
    provider: ProviderSummary,
  ): Promise<ProviderTestOutcome> => {
    setTestingIds(current => new Set(current).add(provider.id));
    let outcome: ProviderTestOutcome;
    try {
      const result = await service.test(provider.id);
      outcome = outcomeFromTestResult(result);
    } catch (testError) {
      outcome = outcomeFromTestError(testError);
    }
    setTestResults(current => ({
      ...current,
      [provider.id]: outcome,
    }));
    setTestingIds(current => {
      const next = new Set(current);
      next.delete(provider.id);
      return next;
    });
    return outcome;
  };

  useEffect(() => {
    service
      .list()
      .then(loaded => {
        setProviders(loaded);
        // Silent auto-probe: populates the per-row status cell so the table itself shows
        // green/red at a glance on every visit, without any user action.
        loaded.forEach(p => handleTest(p));
      })
      .catch(() =>
        setError(
          i18n.translate('wazuhAiAssistant.settings.providers.loadError', {
            defaultMessage: 'Could not load providers.',
          }),
        ),
      )
      .finally(() => setProvidersLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Remembers which tab the admin was actually on when the header's "Add provider" button (it is
  // visible on every tab, not just Providers) sent them to the Providers tab to see the form —
  // so closing the flyout can put them back where they were instead of stranding them on
  // Providers. Only the header button's create flow goes through this: it stays `null` for the
  // per-row "Edit" action (already on the Providers tab by construction) and for the
  // `?addProvider=true` deep link (nothing to "return" to — Providers is the arrival tab).
  const [tabBeforeCreateForm, setTabBeforeCreateForm] =
    useState<SettingsTabId | null>(null);

  const openCreateForm = () => {
    if (activeTabId !== 'providers') {
      setTabBeforeCreateForm(activeTabId);
      switchTab('providers');
    }
    setEditingProvider(null);
    setError(null);
    setFlyoutTestOutcome(null);
    setIsFormOpen(true);
    onCreateFormOpenChange?.(true);
  };

  const openEditForm = (provider: ProviderSummary) => {
    setEditingProvider(provider);
    setError(null);
    setFlyoutTestOutcome(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    // Only the create flow owns `?addProvider=true` — an edit close must not touch it (and
    // `editingProvider` here still reflects which flow was open, since this runs before either
    // state setter below takes effect).
    //
    // `onCreateFormOpenChange?.(false)` (application.tsx) reacts by pushing its OWN history entry
    // (dropping every query param, including `?tab=`) — synchronously, before this component
    // re-renders. The tab restore below therefore must not go through the generic `switchTab`
    // helper: that rebuilds `search` from THIS closure's still-stale `location.search` (which
    // still carries `addProvider=true`) and would push it right back, undoing the callback above
    // and reproducing item 1a. Building the target tab AND dropping `addProvider` in one push
    // here — issued AFTER the callback above, so it wins as the last history write — restores
    // both correctly in a single step instead of two races.
    if (editingProvider === null) {
      onCreateFormOpenChange?.(false);
    }
    if (tabBeforeCreateForm !== null) {
      const targetTab = tabBeforeCreateForm;
      setActiveTabId(targetTab);
      const params = new URLSearchParams(location.search);
      params.delete(ADD_PROVIDER_PARAM);
      if (targetTab === DEFAULT_SETTINGS_TAB) {
        params.delete(TAB_PARAM);
      } else {
        params.set(TAB_PARAM, targetTab);
      }
      history.push({
        pathname: location.pathname,
        search: params.toString() ? `?${params.toString()}` : '',
      });
      setTabBeforeCreateForm(null);
    }
    setIsFormOpen(false);
    setError(null);
  };

  // The page stays mounted (hidden), so this fires on every flag flip. Re-running it while the
  // flag is still true (e.g. a re-render with no actual change) just re-applies the same open
  // state, which is harmless — nothing here needs a "handled already" guard.
  useEffect(() => {
    if (autoOpenCreateForm) {
      openCreateForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoOpenCreateForm]);

  // Still no per-provider privacy toggle in THIS form, deliberately (UX iteration 4 item 3 added
  // the toggle itself, but not here). `AssistantSettings.privacyDefaultPerProvider` is keyed by
  // provider id and lives in a SEPARATE document from `ProviderInput`/`ProviderSummary`
  // (common/types.ts has no field for it, by design — it is not part of a provider's own config).
  // A brand-new provider's id isn't known until AFTER `service.create()` resolves, so a toggle in
  // THIS form would need a second, separate `updateAssistantSettings` call following provider
  // creation. The Privacy tab's own per-provider override table (below, in the render) sidesteps
  // that entirely: it lists already-created providers (real ids) and saves through the same
  // `updateAssistantSettings` round-trip the rest of that tab already uses.
  const handleSubmit = async (input: ProviderInput) => {
    setError(null);
    setIsSubmittingProvider(true);
    try {
      const saved = editingProvider
        ? await service.update(editingProvider.id, input)
        : await service.create(input);
      // From here on, a retry (after a failed test) must UPDATE this same provider rather than
      // create a duplicate — the save itself already succeeded, only the test result is pending.
      setEditingProvider(saved);
      reload();
      onProvidersChanged();
      notifyProvidersChanged();
      core.notifications.toasts.addSuccess(
        editingProvider
          ? i18n.translate('wazuhAiAssistant.settings.updateSuccess', {
              defaultMessage: 'Provider "{name}" updated.',
              values: { name: saved.name },
            })
          : i18n.translate('wazuhAiAssistant.settings.createSuccess', {
              defaultMessage: 'Provider "{name}" added.',
              values: { name: saved.name },
            }),
      );
      const outcome = await handleTest(saved);
      if (outcome.status === 'ok') {
        // A passing test needs no further confirmation from the admin — close the flyout.
        closeForm();
      } else {
        // Keep the flyout open with the result panel so the admin can fix the config and retry.
        setFlyoutTestOutcome(outcome);
      }
    } catch (submitError) {
      setError(
        describeHttpError(
          submitError,
          i18n.translate('wazuhAiAssistant.settings.saveError', {
            defaultMessage: 'Could not save the provider.',
          }),
        ),
      );
    } finally {
      setIsSubmittingProvider(false);
    }
  };

  const requestDelete = (provider: ProviderSummary) => {
    setDeleteTarget(provider);
  };

  const cancelDelete = () => {
    setDeleteTarget(null);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) {
      return;
    }
    const providerId = deleteTarget.id;
    // Captured before the modal state is cleared below, so the confirmation toast can name the
    // provider that is no longer in the list.
    const providerName = deleteTarget.name;
    setError(null);
    try {
      await service.remove(providerId);
    } catch (removeError) {
      // Same handling as every other mutation on this page: report and keep the modal open. A
      // non-administrator gets a 403 here, and without this the rejection would be unhandled, the
      // confirmation modal would stay open with no explanation, and the row would still be listed.
      setError(
        describeHttpError(
          removeError,
          i18n.translate('wazuhAiAssistant.settings.deleteError', {
            defaultMessage: 'Could not delete the provider.',
          }),
        ),
      );
      setDeleteTarget(null);
      return;
    }
    clearTestResult(providerId);
    setDeleteTarget(null);
    // Every other mutation on this page confirms itself with a toast (create, update, set default,
    // both settings saves); delete was the one that just made a row vanish, which reads the same as
    // a failure that closed the modal without saying anything.
    core.notifications.toasts.addSuccess(
      i18n.translate('wazuhAiAssistant.settings.deleteSuccess', {
        defaultMessage: 'Provider "{name}" deleted.',
        values: { name: providerName },
      }),
    );
    // Prune any per-provider privacy override tied to the JUST-DELETED provider (S3): the wire
    // shape has no FK relating `privacyDefaultPerProvider`'s keys back to real providers, so a
    // stale entry otherwise stayed there forever — primed to reappear as a phantom on/off
    // override if the deleted id were ever reused, and in the meantime making the Privacy tab's
    // per-provider list (which only ever renders CURRENT providers) silently out of sync with
    // what is actually stored server-side. Updates the baseline (`loadedAssistantSettings`) and
    // the draft TOGETHER via `privacy.commit` rather than `privacy.setValue`, so this prune does
    // not itself flip the Privacy tab's dirty flag — the tradeoff, deliberately accepted, is that
    // any OTHER unsaved privacy edit sitting in the draft at delete time is folded into the new
    // baseline here too, same as it would be by any other `commit` call on this page.
    if (loadedAssistantSettings) {
      const prunedPerProvider = withProviderPrivacyOverride(
        loadedAssistantSettings.privacyDefaultPerProvider ?? {},
        providerId,
        'inherit',
      );
      setLoadedAssistantSettings({
        ...loadedAssistantSettings,
        privacyDefaultPerProvider: prunedPerProvider,
      });
      if (privacyDraft) {
        privacy.commit({
          ...privacyDraft,
          privacyDefaultPerProvider: prunedPerProvider,
        });
      }
    }
    reload();
    onProvidersChanged();
    notifyProvidersChanged();
  };

  const handleSetDefault = async (provider: ProviderSummary) => {
    setError(null);
    try {
      await service.setDefault(provider.id);
      reload();
      onProvidersChanged();
      notifyProvidersChanged();
      core.notifications.toasts.addSuccess(
        i18n.translate('wazuhAiAssistant.settings.setDefaultSuccess', {
          defaultMessage: '"{name}" is now the default provider.',
          values: { name: provider.name },
        }),
      );
    } catch (setDefaultError) {
      setError(
        describeHttpError(
          setDefaultError,
          i18n.translate('wazuhAiAssistant.settings.setDefaultError', {
            defaultMessage: 'Could not set the default provider.',
          }),
        ),
      );
    }
  };

  // Row action wrapper: kept as its own named function so call sites (row "Test" action, the
  // header's "Test all" below) read as an explicit user-triggered test, even though it is
  // currently a plain alias for `handleTest`.
  const handleManualTest = (provider: ProviderSummary) => handleTest(provider);

  // How many "Test all" probes run at once (screen 3 gap: "No filter or bulk test" fix — the
  // previous version fired every provider's test unthrottled). Small and fixed rather than
  // provider-count-scaled: this is an admin-triggered connectivity check against third-party
  // APIs, not a bulk data operation, so a handful of concurrent requests is plenty to feel fast
  // without hammering rate-limited providers (e.g. free-tier keys) all at once.
  const TEST_ALL_CONCURRENCY = 3;

  // Providers card header action (screen 3: "Test all"): re-tests only the providers the
  // "Filter providers" search box is currently showing (`visibleProviders` above), not the full
  // loaded list, and throttles the run to `TEST_ALL_CONCURRENCY` in flight rather than firing
  // every request at once.
  const handleTestAll = async () => {
    if (isTestingAll) {
      return;
    }
    setIsTestingAll(true);
    try {
      const queue = [...visibleProviders];
      // Each worker drains the shared queue one item at a time — sequential WITHIN a worker is
      // the point (it is what keeps at most `TEST_ALL_CONCURRENCY` requests in flight); the
      // concurrency comes from running several workers at once via Promise.all below.
      const worker = async () => {
        for (;;) {
          const next = queue.shift();
          if (!next) {
            return;
          }
          // eslint-disable-next-line no-await-in-loop -- deliberately serial within one worker
          await handleManualTest(next);
        }
      };
      await Promise.all(
        Array.from(
          { length: Math.min(TEST_ALL_CONCURRENCY, queue.length) },
          worker,
        ),
      );
    } finally {
      setIsTestingAll(false);
    }
  };

  const toggleRowExpanded = (providerId: string) => {
    setExpandedRowIds(current => {
      const next = new Set(current);
      if (next.has(providerId)) {
        next.delete(providerId);
      } else {
        next.add(providerId);
      }
      return next;
    });
  };

  // Proportional (%) column widths, not fixed px, so no column carries a hard pixel floor that
  // could force a horizontal scrollbar between 1024 and 2560px of window width (layout contract
  // acceptance check; screen 3 gap: "Fixed pixel column widths"). Percentages sum to 100 across
  // the whole set below (star 7 + name 13 + type 12 + endpoint 20 + model 15 + API key 9 +
  // status 14 + actions 6 + collapse 4), sized roughly to each column's own typical content.
  const columns: EuiBasicTableColumn<ProviderSummary>[] = [
    {
      field: 'isDefault',
      name: i18n.translate('wazuhAiAssistant.settings.column.default', {
        defaultMessage: 'Default',
      }),
      // 7%, up from 5%: at 5% of the page's own 1200px cap this header rendered as "Defa…" — a
      // truncated column heading, which is the one string in a table that cannot afford to be
      // guessed at (audit §4.5). The two points come from Name below, the only other column with
      // both a tooltip and truncation already in place.
      width: '7%',
      align: 'center' as const,
      render: (isDefault: boolean, provider: ProviderSummary) => (
        <EuiButtonIcon
          iconType={isDefault ? 'starFilled' : 'starEmpty'}
          color={isDefault ? 'warning' : 'text'}
          aria-label={
            isDefault
              ? i18n.translate(
                  'wazuhAiAssistant.settings.defaultProviderLabel',
                  {
                    defaultMessage: 'Default provider',
                  },
                )
              : i18n.translate('wazuhAiAssistant.settings.setDefaultAction', {
                  defaultMessage: 'Set as default provider',
                })
          }
          onClick={isDefault ? undefined : () => handleSetDefault(provider)}
          disabled={isDefault}
        />
      ),
    },
    {
      field: 'name',
      name: i18n.translate('wazuhAiAssistant.settings.column.name', {
        defaultMessage: 'Name',
      }),
      // 13%: the two points the Default column above needed. This column already truncates with a
      // `title` tooltip, so it is the one that can give them up without losing information.
      width: '13%',
      truncateText: true,
      render: (name: string) => <span title={name}>{name}</span>,
    },
    {
      field: 'type',
      name: i18n.translate('wazuhAiAssistant.settings.column.type', {
        defaultMessage: 'Type',
      }),
      width: '12%',
      render: (type: string) => PROVIDER_TYPE_SHORT_LABELS[type] ?? type,
    },
    {
      field: 'baseUrl',
      name: i18n.translate('wazuhAiAssistant.settings.column.baseUrl', {
        defaultMessage: 'Endpoint',
      }),
      width: '20%',
      // Endpoints middle-truncate with a tooltip carrying the full URL (screen 3 gap: "Endpoints
      // dominate the row") — `truncateText` is deliberately left off: EUI's own end-truncation
      // would hide the path/host tail, which is usually the part that tells two endpoints apart.
      render: (baseUrl: string) => (
        // `anchorClassName` bounds EuiToolTip's own wrapper span. Without it the anchor is an
        // auto-width inline-block the fixed-layout cell cannot clip, so a truncated string that
        // is still longer than the column paints straight over the Model column — which is what
        // happened once the page gained its 1200px cap and this column narrowed to ~220px.
        <EuiToolTip
          content={baseUrl}
          anchorClassName='wzSettingsEndpointAnchor'
        >
          <span className='wzSettingsEndpointCell'>
            {middleTruncate(baseUrl)}
          </span>
        </EuiToolTip>
      ),
    },
    {
      field: 'model',
      name: i18n.translate('wazuhAiAssistant.settings.column.model', {
        defaultMessage: 'Model',
      }),
      width: '15%',
      truncateText: true,
      render: (model: string) => <span title={model}>{model}</span>,
    },
    {
      field: 'hasApiKey',
      name: i18n.translate('wazuhAiAssistant.settings.column.apiKey', {
        defaultMessage: 'API key',
      }),
      width: '9%',
      render: (hasApiKey: boolean) => (
        <EuiText size='s' color={hasApiKey ? 'default' : 'subdued'}>
          {hasApiKey
            ? i18n.translate('wazuhAiAssistant.settings.apiKeySet', {
                defaultMessage: 'Configured',
              })
            : i18n.translate('wazuhAiAssistant.settings.apiKeyMissing', {
                defaultMessage: 'Not set',
              })}
        </EuiText>
      ),
    },
    {
      field: 'id',
      name: i18n.translate('wazuhAiAssistant.settings.column.status', {
        defaultMessage: 'Status',
      }),
      width: '14%',
      render: (providerId: string) => {
        if (testingIds.has(providerId)) {
          return (
            <ProviderStatusChip
              status='testing'
              label={i18n.translate('wazuhAiAssistant.settings.testing', {
                defaultMessage: 'Testing...',
              })}
            />
          );
        }
        const result = testResults[providerId];
        if (!result) {
          return (
            <ProviderStatusChip
              status='pending'
              label={i18n.translate('wazuhAiAssistant.settings.testNotRun', {
                defaultMessage: 'Not tested',
              })}
            />
          );
        }
        if (result.status === 'ok') {
          return (
            <ProviderStatusChip
              status='ok'
              label={i18n.translate(
                'wazuhAiAssistant.settings.testSuccessBadge',
                {
                  defaultMessage: 'OK ({latency} ms)',
                  values: { latency: result.latencyMs },
                },
              )}
            />
          );
        }
        const isCouldNotVerify = result.status === 'could-not-verify';
        const failureMessage =
          result.message ??
          i18n.translate('wazuhAiAssistant.settings.testFailureUnknown', {
            defaultMessage: 'Connection failed.',
          });
        return (
          <ProviderStatusChip
            status={isCouldNotVerify ? 'could-not-verify' : 'failed'}
            label={
              isCouldNotVerify
                ? i18n.translate(
                    'wazuhAiAssistant.settings.testCouldNotVerifyBadge',
                    {
                      defaultMessage: 'Could not verify',
                    },
                  )
                : i18n.translate('wazuhAiAssistant.settings.testFailureBadge', {
                    defaultMessage: 'Failed',
                  })
            }
            reason={failureMessage}
          />
        );
      },
    },
    {
      name: i18n.translate('wazuhAiAssistant.settings.column.actions', {
        defaultMessage: 'Actions',
      }),
      width: '6%',
      align: 'center' as const,
      render: (provider: ProviderSummary) => (
        <EuiPopover
          button={
            <EuiButtonIcon
              iconType='boxesHorizontal'
              color='text'
              aria-label={i18n.translate(
                'wazuhAiAssistant.settings.action.rowMenu',
                {
                  defaultMessage: 'Actions for {name}',
                  values: { name: provider.name },
                },
              )}
              onClick={() =>
                setOpenMenuRowId(current =>
                  current === provider.id ? null : provider.id,
                )
              }
            />
          }
          isOpen={openMenuRowId === provider.id}
          closePopover={() => setOpenMenuRowId(null)}
          panelPaddingSize='none'
          anchorPosition='downRight'
        >
          <EuiContextMenuPanel size='s'>
            <EuiContextMenuItem
              key='test'
              icon='play'
              disabled={testingIds.has(provider.id)}
              onClick={() => {
                setOpenMenuRowId(null);
                handleManualTest(provider);
              }}
            >
              {i18n.translate('wazuhAiAssistant.settings.action.test', {
                defaultMessage: 'Test',
              })}
            </EuiContextMenuItem>
            <EuiContextMenuItem
              key='edit'
              icon='pencil'
              onClick={() => {
                setOpenMenuRowId(null);
                openEditForm(provider);
              }}
            >
              {i18n.translate('wazuhAiAssistant.settings.action.edit', {
                defaultMessage: 'Edit',
              })}
            </EuiContextMenuItem>
            <EuiContextMenuItem
              key='delete'
              icon='trash'
              onClick={() => {
                setOpenMenuRowId(null);
                requestDelete(provider);
              }}
            >
              <EuiTextColor color='danger'>
                {i18n.translate('wazuhAiAssistant.settings.action.delete', {
                  defaultMessage: 'Delete',
                })}
              </EuiTextColor>
            </EuiContextMenuItem>
          </EuiContextMenuPanel>
        </EuiPopover>
      ),
    },
    {
      align: 'right' as const,
      width: '4%',
      isExpander: true,
      name: '',
      render: (provider: ProviderSummary) => (
        <EuiButtonIcon
          onClick={() => toggleRowExpanded(provider.id)}
          aria-label={
            expandedRowIds.has(provider.id)
              ? i18n.translate('wazuhAiAssistant.settings.rowDetail.collapse', {
                  defaultMessage: 'Collapse row',
                })
              : i18n.translate('wazuhAiAssistant.settings.rowDetail.expand', {
                  defaultMessage: 'Expand row',
                })
          }
          iconType={expandedRowIds.has(provider.id) ? 'arrowUp' : 'arrowDown'}
        />
      ),
    },
  ];

  const itemIdToExpandedRowMap = Object.fromEntries(
    providers
      .filter(provider => expandedRowIds.has(provider.id))
      .map(provider => [
        provider.id,
        <ProviderRowDetail
          key={provider.id}
          provider={provider}
          outcome={testResults[provider.id]}
        />,
      ]),
  );

  const providersSearch = {
    box: {
      incremental: true,
      placeholder: i18n.translate(
        'wazuhAiAssistant.settings.providers.filterPlaceholder',
        { defaultMessage: 'Filter providers' },
      ),
    },
    // Purely a notification: without a controlled `query` prop alongside it, this does not
    // override EuiInMemoryTable's own filtering — it only mirrors the current search text out to
    // `providersFilterText` so "Test all" (visibleProviders, above) knows which rows are shown.
    onChange: ({ queryText }: { queryText: string }) => {
      setProvidersFilterText(queryText ?? '');
      return true;
    },
    toolsRight: [
      <EuiButton
        key='test-all'
        size='s'
        iconType='play'
        onClick={handleTestAll}
        isLoading={isTestingAll}
        isDisabled={visibleProviders.length === 0 || isTestingAll}
      >
        {i18n.translate('wazuhAiAssistant.settings.providers.testAll', {
          defaultMessage: 'Test all',
        })}
      </EuiButton>,
    ],
  };

  // Same fixed bottom bar the Indexer Settings page uses
  // (indexer-settings/index.tsx) instead of a save button sitting inline in
  // a card — appears only once there's something to save, and only while
  // the Privacy tab (the one it saves) is the one on screen.
  const privacyBottomBar =
    activeTabId === 'privacy' && privacy.isDirty ? (
      <EuiBottomBar
        data-test-subj='privacySettings-bottomBar'
        position='sticky'
      >
        <EuiFlexGroup
          justifyContent='flexStart'
          alignItems='center'
          responsive={false}
          gutterSize='s'
        >
          <EuiFlexItem grow={false}>
            <p>
              {i18n.translate('wazuhAiAssistant.settings.privacy.unsaved', {
                defaultMessage: 'You have unsaved changes',
              })}
            </p>
          </EuiFlexItem>
          <EuiFlexItem />
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty
              color='ghost'
              size='s'
              iconType='cross'
              onClick={() => privacy.reset()}
            >
              {i18n.translate('wazuhAiAssistant.settings.privacy.cancel', {
                defaultMessage: 'Cancel changes',
              })}
            </EuiButtonEmpty>
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiButton
              color='secondary'
              fill
              size='s'
              iconType='check'
              onClick={handleSavePrivacySettings}
              isLoading={isSavingPrivacy}
              disabled={privacySaveDisabled}
            >
              {i18n.translate('wazuhAiAssistant.settings.privacy.save', {
                defaultMessage: 'Save changes',
              })}
            </EuiButton>
          </EuiFlexItem>
        </EuiFlexGroup>
      </EuiBottomBar>
    ) : null;

  return (
    <EuiPage className='wzSettingsPage'>
      <EuiPageBody>
        {/* Page-title scale, decided (audit §6): this H1 keeps EuiPageHeader's own 28px. It is a
            real page header with three sections under it, so it is the surface that needs the
            largest step; the chat greeting deliberately stays at 24 as a hero on an otherwise
            empty canvas rather than being pulled up to match (see chat-page.tsx's own note where
            that greeting is defined). Two surfaces, two jobs, one deliberate difference — not the
            drift the audit flagged. */}
        <EuiPageHeader
          pageTitle={i18n.translate('wazuhAiAssistant.settings.pageTitle', {
            defaultMessage: 'AI Assistant settings',
          })}
          description={i18n.translate(
            'wazuhAiAssistant.settings.pageDescription',
            {
              defaultMessage:
                'Manage AI providers, privacy and conversation history.',
            },
          )}
          rightSideItems={[
            <EuiButton
              key='add-provider'
              onClick={openCreateForm}
              iconType='plusInCircle'
              fill
            >
              {i18n.translate('wazuhAiAssistant.settings.addProvider', {
                defaultMessage: 'Add provider',
              })}
            </EuiButton>,
          ]}
        />
        <EuiSpacer size='l' />

        {/* Landmarks before more settings land (UX iteration 4 item 2): one tab per existing
            SectionCard, deep-linkable via `?tab=`. Not a full router switch — all three cards stay
            MOUNTED at all times (below, each wrapped in a plain `display: none` div rather than an
            `activeTabId === 'x' && (...)` conditional), the same way application.tsx's outer
            Chat/Settings tabs already hide rather than unmount. Unmounting the non-active card was
            the actual behavior here until this comment caught up with it: EuiInMemoryTable owns its
            own (uncontrolled) search box internally, so unmounting the Providers card on a tab
            switch reset that search box's text on remount — while `providersFilterText` above
            (mirrored out via `search.onChange`) is page-level state that survived the switch, so
            "Test all" kept computing against a filter the visible table no longer had applied. */}
        <EuiTabs>
          <EuiTab
            isSelected={activeTabId === 'providers'}
            onClick={() => switchTab('providers')}
          >
            {i18n.translate('wazuhAiAssistant.settings.tabs.providers', {
              defaultMessage: 'Providers',
            })}
          </EuiTab>
          <EuiTab
            isSelected={activeTabId === 'privacy'}
            onClick={() => switchTab('privacy')}
          >
            {i18n.translate('wazuhAiAssistant.settings.tabs.privacy', {
              defaultMessage: 'Privacy & data protection',
            })}
          </EuiTab>
          <EuiTab
            isSelected={activeTabId === 'retention'}
            onClick={() => switchTab('retention')}
          >
            {i18n.translate('wazuhAiAssistant.settings.tabs.retention', {
              defaultMessage: 'Conversation history',
            })}
          </EuiTab>
        </EuiTabs>
        <EuiSpacer size='l' />

        <div
          style={{ display: activeTabId === 'providers' ? undefined : 'none' }}
        >
          <SectionCard
            pillLabel={i18n.translate(
              'wazuhAiAssistant.settings.providers.title',
              {
                defaultMessage: 'Providers',
              },
            )}
            description={i18n.translate(
              'wazuhAiAssistant.settings.providers.description',
              {
                defaultMessage:
                  'Connect and manage the AI providers available to the chat.',
              },
            )}
          >
            {error && !isFormOpen && (
              <>
                <EuiCallOut
                  // Same split as the flyout's own error callout: a URL the SSRF/URL policy refused
                  // is titled for what it is, since the reason line below already says which rule
                  // it hit and no amount of retrying will change the answer.
                  title={
                    isEndpointBlockedError(error)
                      ? i18n.translate(
                          'wazuhAiAssistant.settings.endpointBlockedTitle',
                          { defaultMessage: 'Endpoint blocked' },
                        )
                      : i18n.translate('wazuhAiAssistant.settings.errorTitle', {
                          defaultMessage: 'Something went wrong',
                        })
                  }
                  color='danger'
                  iconType='alert'
                >
                  <p>{error}</p>
                </EuiCallOut>
                <EuiSpacer size='m' />
              </>
            )}

            {providersLoaded && providers.length === 0 ? (
              <EuiEmptyPrompt
                iconType='machineLearningApp'
                title={
                  <h2>
                    {i18n.translate(
                      'wazuhAiAssistant.settings.providers.emptyTitle',
                      {
                        defaultMessage: 'No AI provider configured',
                      },
                    )}
                  </h2>
                }
                body={
                  <p>
                    {i18n.translate(
                      'wazuhAiAssistant.settings.providers.emptyBody',
                      {
                        defaultMessage:
                          'The AI Assistant needs at least one connected provider ' +
                          '(OpenAI-compatible or Anthropic) before it can answer questions. ' +
                          'Add one to get started.',
                      },
                    )}
                  </p>
                }
                actions={
                  <EuiButton color='primary' fill onClick={openCreateForm}>
                    {i18n.translate(
                      'wazuhAiAssistant.settings.providers.emptyAction',
                      {
                        defaultMessage: 'Add a provider',
                      },
                    )}
                  </EuiButton>
                }
              />
            ) : (
              <EuiInMemoryTable
                items={providers}
                columns={columns}
                itemId='id'
                search={providersSearch}
                itemIdToExpandedRowMap={itemIdToExpandedRowMap}
                // Enforces the proportional column widths above as real caps (screen 3 gap: "Fixed
                // pixel column widths") — without it, auto table layout lets a column's content grow
                // the whole table past its container, which is exactly the horizontal-scroll failure
                // those percentages exist to prevent.
                tableLayout='fixed'
              />
            )}
          </SectionCard>
        </div>

        {/* No `xxl` spacer between the cards any more (it existed to separate two ADJACENT
            cards — see the comment that used to sit here) — each card now owns a whole tab, so
            there is never a second card directly below it to separate from. */}
        <div
          style={{ display: activeTabId === 'privacy' ? undefined : 'none' }}
        >
          <SectionCard
            pillLabel={i18n.translate(
              'wazuhAiAssistant.settings.privacy.globalSettingsTitle',
              {
                defaultMessage: 'Global settings',
              },
            )}
            description={i18n.translate(
              'wazuhAiAssistant.settings.privacy.description',
              {
                // NF-1 UX fix: scoped explicitly to Wazuh finding data (the field-policy pipeline
                // this control governs) — the previous wording didn't say whose data it covered,
                // which read as also covering whatever the user types into chat. See chat-page.tsx's
                // matching `chat.privacy.explainOn`/`explainOff` comment for the full rationale;
                // wording intentionally stays in sync between the two.
                // F9: "Text typed into chat is not automatically covered by this setting" was a
                // flat denial that under-promised and contradicted the pipeline (typed IPs/dotted
                // FQDNs are scanned, and NF-1 additionally scans for identifiers already seen this
                // session) — replaced with an accurate, equally short statement of what is and is
                // not covered, in the same impersonal register as the rest of this description.
                // Adversarial round 2: narrowed "hostnames" to "domain names" in the second
                // sentence — a fresh bare hostname is not unconditionally scanned, only a dotted
                // domain name/FQDN is; the bare case is covered separately by "identifiers already
                // seen in the session".
                defaultMessage:
                  'Control whether Wazuh finding data is anonymized before reaching the configured AI provider. When privacy mode is off, hostnames, IP addresses, usernames, process command lines, and finding/rule text leave the cluster as-is. Text typed into chat is scanned for IP addresses, domain names, and identifiers already seen in the session; other identifiers typed into chat may still reach the provider unmasked.',
              },
            )}
          >
            {settingsLoadError && (
              <>
                <EuiCallOut
                  color='danger'
                  iconType='alert'
                  title={settingsLoadError}
                  size='s'
                />
                <EuiSpacer size='m' />
              </>
            )}

            {!privacyDraft && !settingsLoadError && (
              <>
                <EuiLoadingSpinner
                  size='m'
                  aria-label={i18n.translate(
                    'wazuhAiAssistant.common.loading',
                    {
                      defaultMessage: 'Loading...',
                    },
                  )}
                />
                <EuiSpacer size='m' />
              </>
            )}

            {privacyDraft && (
              <>
                {privacySaveError && (
                  <>
                    <EuiCallOut
                      color='danger'
                      iconType='alert'
                      title={privacySaveError}
                      size='s'
                    />
                    <EuiSpacer size='m' />
                  </>
                )}

                <EuiFlexGroup
                  justifyContent='spaceBetween'
                  alignItems='center'
                  responsive={false}
                >
                  <EuiFlexItem grow={false}>
                    <EuiFormRow>
                      <EuiSwitch
                        label={i18n.translate(
                          'wazuhAiAssistant.settings.privacy.defaultOnLabel',
                          {
                            defaultMessage: 'Enable privacy mode by default',
                          },
                        )}
                        checked={privacyDraft.privacyDefaultOn}
                        onChange={event => {
                          privacy.setValue({
                            ...privacyDraft,
                            privacyDefaultOn: event.target.checked,
                          });
                        }}
                      />
                    </EuiFormRow>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiFormRow>
                      <EuiSwitch
                        label={i18n.translate(
                          'wazuhAiAssistant.settings.privacy.userCanOverrideLabel',
                          {
                            defaultMessage:
                              'Allow users to override privacy mode from the chat page',
                          },
                        )}
                        checked={privacyDraft.userCanOverride}
                        onChange={event => {
                          privacy.setValue({
                            ...privacyDraft,
                            userCanOverride: event.target.checked,
                          });
                        }}
                      />
                    </EuiFormRow>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </>
            )}
          </SectionCard>

          {privacyDraft && (
            <>
              <EuiSpacer size='l' />
              <SectionCard
                pillLabel={i18n.translate(
                  'wazuhAiAssistant.settings.privacy.fieldPolicyTitle',
                  {
                    defaultMessage: 'Field policy',
                  },
                )}
                description={i18n.translate(
                  'wazuhAiAssistant.settings.privacy.fieldPolicyHelp',
                  {
                    // "Allow" deliberately no longer promises the "real value": with privacy mode
                    // on, an allowed prose field still has known identifiers pseudonymized by the
                    // server-side scrub, so the old wording promised byte-verbatim delivery this
                    // product does not give.
                    defaultMessage:
                      'What the AI provider gets per field: the value (Allow — in privacy mode, known identifiers in it are still pseudonymized), a pseudonym (Anonymize), or nothing (Never send).',
                  },
                )}
              >
                {fieldPolicyDraft.length > 0 && (
                  <>
                    <EuiFlexGroup
                      gutterSize='s'
                      alignItems='center'
                      responsive={false}
                    >
                      <EuiFlexItem>
                        <EuiFieldSearch
                          compressed
                          fullWidth
                          placeholder={i18n.translate(
                            'wazuhAiAssistant.settings.privacy.filterFields',
                            { defaultMessage: 'Filter fields' },
                          )}
                          value={fieldPolicyFilter}
                          onChange={e => setFieldPolicyFilter(e.target.value)}
                          isClearable
                        />
                      </EuiFlexItem>
                      <EuiFlexItem grow={false}>
                        {/* Live match count next to the search box, not just a filtered list — an
                          admin typing a narrow term with zero hits otherwise has no signal that the
                          search worked at all versus the field simply not existing. */}
                        <EuiText size='xs' color='subdued'>
                          {i18n.translate(
                            'wazuhAiAssistant.settings.privacy.fieldPolicyFoundCount',
                            {
                              defaultMessage: '{count} found',
                              values: { count: fieldPolicyMatches.length },
                            },
                          )}
                        </EuiText>
                      </EuiFlexItem>
                    </EuiFlexGroup>
                    <EuiSpacer size='s' />
                    {fieldPolicyMatches.length === 0 ? (
                      <>
                        {/* Distinct from the `fieldPolicyDraft.length === 0` empty state below:
                          this one means rows EXIST but the filter matched none of them, so the
                          message names the term rather than telling the admin to add a field. */}
                        <EuiText size='s' color='subdued'>
                          {i18n.translate(
                            'wazuhAiAssistant.settings.privacy.fieldPolicyNoMatches',
                            {
                              defaultMessage: 'No fields match “{filter}”.',
                              values: { filter: fieldPolicyFilter },
                            },
                          )}
                        </EuiText>
                        <EuiSpacer size='s' />
                      </>
                    ) : (
                      <>
                        <EuiFlexGroup
                          gutterSize='s'
                          alignItems='center'
                          responsive={false}
                        >
                          <EuiFlexItem>
                            <EuiText size='xs' color='subdued'>
                              <strong>
                                {i18n.translate(
                                  'wazuhAiAssistant.settings.privacy.fieldColumnHeader',
                                  {
                                    defaultMessage: 'Field',
                                  },
                                )}
                              </strong>
                            </EuiText>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false} style={{ minWidth: 160 }}>
                            <EuiText size='xs' color='subdued'>
                              <strong>
                                {i18n.translate(
                                  'wazuhAiAssistant.settings.privacy.actionColumnHeader',
                                  { defaultMessage: 'Action' },
                                )}
                              </strong>
                            </EuiText>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false} style={{ width: 24 }} />
                        </EuiFlexGroup>
                        <EuiSpacer size='xs' />
                        {fieldPolicyVisibleMatches.map(({ entry, index }) => (
                          <React.Fragment key={index}>
                            <EuiFlexGroup
                              gutterSize='s'
                              alignItems='center'
                              responsive={false}
                            >
                              <EuiFlexItem>
                                <EuiFieldText
                                  fullWidth
                                  compressed
                                  placeholder={i18n.translate(
                                    'wazuhAiAssistant.settings.privacy.fieldPlaceholder',
                                    { defaultMessage: 'e.g. agent.name' },
                                  )}
                                  aria-label={i18n.translate(
                                    'wazuhAiAssistant.settings.privacy.fieldColumnLabel',
                                    { defaultMessage: 'Field' },
                                  )}
                                  value={entry.field}
                                  onChange={event =>
                                    handleFieldPolicyChange(index, {
                                      field: event.target.value,
                                    })
                                  }
                                />
                              </EuiFlexItem>
                              <EuiFlexItem
                                grow={false}
                                style={{ minWidth: 160 }}
                              >
                                <EuiSelect
                                  compressed
                                  aria-label={i18n.translate(
                                    'wazuhAiAssistant.settings.privacy.actionColumnLabel',
                                    { defaultMessage: 'Action' },
                                  )}
                                  options={FIELD_POLICY_ACTIONS.map(action => ({
                                    value: action,
                                    text: FIELD_POLICY_ACTION_LABELS[action],
                                  }))}
                                  value={toSelectableFieldPolicyAction(
                                    entry.action,
                                  )}
                                  onChange={event =>
                                    handleFieldPolicyChange(index, {
                                      action: event.target
                                        .value as FieldPolicyAction,
                                    })
                                  }
                                />
                              </EuiFlexItem>
                              <EuiFlexItem grow={false}>
                                <EuiButtonIcon
                                  iconType='trash'
                                  color='danger'
                                  aria-label={i18n.translate(
                                    'wazuhAiAssistant.settings.privacy.removeField',
                                    { defaultMessage: 'Remove field' },
                                  )}
                                  onClick={() =>
                                    handleRemoveFieldPolicyRow(index)
                                  }
                                />
                              </EuiFlexItem>
                            </EuiFlexGroup>
                            <EuiSpacer size='xs' />
                          </React.Fragment>
                        ))}
                        <EuiFlexGroup gutterSize='s' responsive={false}>
                          {fieldPolicyExistingMatches.length >
                            fieldPolicyVisibleCount && (
                            <EuiFlexItem grow={false}>
                              <EuiButtonEmpty
                                size='s'
                                iconType='arrowDown'
                                onClick={() =>
                                  setFieldPolicyVisibleCount(
                                    fieldPolicyExistingMatches.length,
                                  )
                                }
                              >
                                {i18n.translate(
                                  'wazuhAiAssistant.settings.privacy.fieldPolicyShowMore',
                                  {
                                    defaultMessage: 'Show {count} more',
                                    values: {
                                      count:
                                        fieldPolicyExistingMatches.length -
                                        fieldPolicyVisibleCount,
                                    },
                                  },
                                )}
                              </EuiButtonEmpty>
                            </EuiFlexItem>
                          )}
                          {fieldPolicyVisibleCount > 5 && (
                            <EuiFlexItem grow={false}>
                              <EuiButtonEmpty
                                size='s'
                                iconType='arrowUp'
                                onClick={() => setFieldPolicyVisibleCount(5)}
                              >
                                {i18n.translate(
                                  'wazuhAiAssistant.settings.privacy.fieldPolicyShowLess',
                                  { defaultMessage: 'Show less' },
                                )}
                              </EuiButtonEmpty>
                            </EuiFlexItem>
                          )}
                        </EuiFlexGroup>
                        <EuiSpacer size='s' />
                      </>
                    )}
                    <EuiButton
                      size='s'
                      iconType='plusInCircle'
                      onClick={handleAddFieldPolicyRow}
                    >
                      {i18n.translate(
                        'wazuhAiAssistant.settings.privacy.addField',
                        {
                          defaultMessage: 'Add field',
                        },
                      )}
                    </EuiButton>
                  </>
                )}

                {fieldPolicyDraft.length === 0 && (
                  <>
                    <EuiText size='s' color='subdued'>
                      {i18n.translate(
                        'wazuhAiAssistant.settings.privacy.fieldPolicyEmpty',
                        { defaultMessage: 'No fields configured yet.' },
                      )}
                    </EuiText>
                    <EuiSpacer size='s' />
                    <EuiButton
                      size='s'
                      iconType='plusInCircle'
                      onClick={handleAddFieldPolicyRow}
                    >
                      {i18n.translate(
                        'wazuhAiAssistant.settings.privacy.addField',
                        {
                          defaultMessage: 'Add field',
                        },
                      )}
                    </EuiButton>
                  </>
                )}
              </SectionCard>

              <EuiSpacer size='l' />
              <SectionCard
                pillLabel={i18n.translate(
                  'wazuhAiAssistant.settings.privacy.perProviderTitle',
                  { defaultMessage: 'Per-provider override' },
                )}
                description={i18n.translate(
                  'wazuhAiAssistant.settings.privacy.perProviderHelp',
                  {
                    defaultMessage:
                      "Anonymize data sent to providers you don't control (hosted APIs) while " +
                      "sending raw data to a local model. Providers on 'Use global default' " +
                      'follow the switch above.',
                  },
                )}
              >
                {/* Guarded on `providersLoaded`, not a bare `providers.length === 0` — the load is
                  async (see the effect that sets `providersLoaded`), so the empty-length check on
                  its own was also true WHILE loading and after a FAILED list load, both of which
                  showed "No providers configured yet." for a provider list that might still be on
                  its way (or that failed to load at all, with the actual error surfaced elsewhere
                  on the Providers tab). */}
                {/* Stable hook for tests: the mounted-tabs design (B1) keeps the Providers table's
                  own rows (also named after the provider) in the DOM at the same time as this
                  list, so an unscoped query for a provider's name is ambiguous between the two —
                  scope to this container. */}
                <div data-test-subj='wzPerProviderPrivacyList'>
                  {!providersLoaded ? null : providers.length === 0 ? (
                    <EuiText size='s' color='subdued'>
                      {i18n.translate(
                        'wazuhAiAssistant.settings.privacy.perProviderEmpty',
                        { defaultMessage: 'No providers configured yet.' },
                      )}
                    </EuiText>
                  ) : (
                    providers.map(provider => (
                      <React.Fragment key={provider.id}>
                        <EuiFlexGroup
                          gutterSize='s'
                          alignItems='center'
                          responsive={false}
                          className='wzSettingsCard__perProviderRow'
                        >
                          <EuiFlexItem
                            grow={false}
                            style={{ flexBasis: 300, maxWidth: 300 }}
                          >
                            <EuiText size='s' title={provider.name}>
                              {provider.name}
                            </EuiText>
                          </EuiFlexItem>
                          <EuiFlexItem grow={false} style={{ minWidth: 200 }}>
                            <EuiSelect
                              compressed
                              aria-label={i18n.translate(
                                'wazuhAiAssistant.settings.privacy.perProviderSelectAriaLabel',
                                {
                                  defaultMessage: 'Privacy override for {name}',
                                  values: { name: provider.name },
                                },
                              )}
                              options={[
                                {
                                  value: 'inherit',
                                  text: i18n.translate(
                                    'wazuhAiAssistant.settings.privacy.perProviderInherit',
                                    { defaultMessage: 'Use global default' },
                                  ),
                                },
                                {
                                  value: 'on',
                                  text: i18n.translate(
                                    'wazuhAiAssistant.settings.privacy.perProviderOn',
                                    { defaultMessage: 'On' },
                                  ),
                                },
                                {
                                  value: 'off',
                                  text: i18n.translate(
                                    'wazuhAiAssistant.settings.privacy.perProviderOff',
                                    { defaultMessage: 'Off' },
                                  ),
                                },
                              ]}
                              value={providerPrivacyOverride(
                                // Defensive fallback: `privacyDefaultPerProvider` should always be
                                // present on a loaded/saved AssistantSettings, but a falsy value
                                // here must never crash the render — it just reads as "every
                                // provider inherits", the same as an explicitly empty map.
                                privacyDraft.privacyDefaultPerProvider ?? {},
                                provider.id,
                              )}
                              onChange={event =>
                                handleProviderPrivacyOverrideChange(
                                  provider.id,
                                  event.target.value as ProviderPrivacyOverride,
                                )
                              }
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                        <EuiSpacer size='xs' />
                      </React.Fragment>
                    ))
                  )}
                </div>
              </SectionCard>
            </>
          )}
        </div>

        {/* No `xxl` spacer here either, for the same reason noted above the Privacy tab. */}
        <div
          style={{ display: activeTabId === 'retention' ? undefined : 'none' }}
        >
          <SectionCard
            pillLabel={i18n.translate(
              'wazuhAiAssistant.settings.retention.title',
              {
                defaultMessage: 'Conversation history',
              },
            )}
            description={i18n.translate(
              'wazuhAiAssistant.settings.retention.description',
              {
                defaultMessage:
                  'Control how long saved conversations are kept.',
              },
            )}
          >
            {settingsLoadError && (
              <>
                <EuiCallOut
                  color='danger'
                  iconType='alert'
                  title={settingsLoadError}
                  size='s'
                />
                <EuiSpacer size='m' />
              </>
            )}

            {retentionInput === null && !settingsLoadError && (
              <>
                <EuiLoadingSpinner
                  size='m'
                  aria-label={i18n.translate(
                    'wazuhAiAssistant.common.loading',
                    {
                      defaultMessage: 'Loading...',
                    },
                  )}
                />
                <EuiSpacer size='m' />
              </>
            )}

            {retentionInput !== null && (
              <>
                {retentionSaveError && (
                  <>
                    <EuiCallOut
                      color='danger'
                      iconType='alert'
                      title={retentionSaveError}
                      size='s'
                    />
                    <EuiSpacer size='m' />
                  </>
                )}

                {/* Input left, its explanation right (audit's §4 layout
                  recommendation). A 327px number field alone in a 1150px row was
                  the clearest case of the void having moved INSIDE the cards once
                  the page took its 1200px cap, and the help text is the natural
                  occupant: it is what the admin reads while deciding the number.
                  Moved out of the row's `helpText` slot for that reason — in the
                  slot it can only ever render under the field. EUI's responsive
                  default stacks the two on a narrow window, help below input,
                  which is the same reading order. */}
                <EuiFlexGroup gutterSize='xl'>
                  <EuiFlexItem>
                    <EuiFormRow
                      label={i18n.translate(
                        'wazuhAiAssistant.settings.retention.daysLabel',
                        {
                          defaultMessage: 'Keep saved conversations for (days)',
                        },
                      )}
                      isInvalid={Boolean(retentionValidationError)}
                      error={retentionValidationError}
                    >
                      <EuiFieldNumber
                        min={0}
                        data-test-subj={RETENTION_DAYS_TEST_SUBJ}
                        isInvalid={Boolean(retentionValidationError)}
                        // The raw text, so an empty field stays empty while the admin retypes
                        // instead of snapping back to 0 (which is what produced "014").
                        value={retentionInput}
                        onChange={event => {
                          const raw = event.target.value;
                          setRetentionInput(raw);
                          // Stay quiet while editing when the value is unusable — blur and save are
                          // where that gets reported (below, and in
                          // `handleSaveRetentionSettings`) — but clear a shown error the moment the
                          // value becomes valid again.
                          if (parseRetentionDays(raw) !== null) {
                            setRetentionValidationError(null);
                          }
                        }}
                        onBlur={() =>
                          setRetentionValidationError(
                            parseRetentionDays(retentionInput) === null
                              ? RETENTION_INVALID_MESSAGE
                              : null,
                          )
                        }
                      />
                    </EuiFormRow>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    {/* Not a third text scale: `.wzSettingsCard__fieldHelp`
                      (settings-page.scss) restates EUI's own `.euiFormHelpText`
                      values, exactly as `.wzProviderFlyout__help` does in the
                      flyout — so a sentence that left the `helpText` slot keeps
                      the typography that slot gave it. */}
                    <div className='wzSettingsCard__fieldHelp'>
                      {i18n.translate(
                        'wazuhAiAssistant.settings.retention.daysHelp',
                        {
                          defaultMessage:
                            '0 keeps every saved conversation forever. Enforcement runs on its own schedule, via an ISM policy on the underlying data stream.',
                        },
                      )}
                    </div>
                  </EuiFlexItem>
                </EuiFlexGroup>

                {/* Same two fixes as the Privacy card's own footer above (audit §4.4):
                  the rule stops at the content measure, and `fill` comes off
                  while the button is disabled. */}
                <EuiHorizontalRule
                  margin='m'
                  className='wzSettingsCard__actionsRule'
                />
                <EuiButton
                  onClick={handleSaveRetentionSettings}
                  isLoading={isSavingRetention}
                  isDisabled={!retentionDirty}
                  fill={retentionDirty}
                >
                  {i18n.translate('wazuhAiAssistant.settings.retention.save', {
                    defaultMessage: 'Save conversation history settings',
                  })}
                </EuiButton>
              </>
            )}
          </SectionCard>
        </div>
        {privacyBottomBar && bottomBarHost
          ? createPortal(privacyBottomBar, bottomBarHost)
          : null}
      </EuiPageBody>
      {isFormOpen && isActive && (
        <ProviderFormFlyout
          editingProvider={editingProvider}
          error={error}
          existingProviders={providers}
          apiKeyEncryptionEnabled={apiKeyEncryptionEnabled}
          isSaving={isSubmittingProvider}
          testOutcome={flyoutTestOutcome}
          onSubmit={handleSubmit}
          onClose={closeForm}
        />
      )}
      {deleteTarget && (
        <EuiConfirmModal
          title={i18n.translate(
            'wazuhAiAssistant.settings.deleteConfirm.title',
            {
              defaultMessage: 'Delete provider',
            },
          )}
          onCancel={cancelDelete}
          onConfirm={confirmDelete}
          cancelButtonText={i18n.translate(
            'wazuhAiAssistant.settings.deleteConfirm.cancel',
            {
              defaultMessage: 'Cancel',
            },
          )}
          confirmButtonText={i18n.translate(
            'wazuhAiAssistant.settings.deleteConfirm.confirm',
            {
              defaultMessage: 'Delete',
            },
          )}
          buttonColor='danger'
        >
          <p>
            {i18n.translate('wazuhAiAssistant.settings.deleteConfirm.body', {
              defaultMessage:
                'This will permanently delete the provider "{name}". This action cannot be undone.',
              values: { name: deleteTarget.name },
            })}
          </p>
        </EuiConfirmModal>
      )}
    </EuiPage>
  );
};
