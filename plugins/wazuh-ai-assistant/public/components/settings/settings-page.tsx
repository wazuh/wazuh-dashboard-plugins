import React, { useEffect, useState } from 'react';
import './settings-page.scss';
import {
  EuiPage,
  EuiBadge,
  EuiPageBody,
  EuiPageHeader,
  EuiInMemoryTable,
  EuiBasicTableColumn,
  EuiButton,
  EuiButtonIcon,
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
  EuiIconTip,
  EuiHorizontalRule,
  EuiFieldSearch,
  EuiAccordion,
  EuiEmptyPrompt,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { CoreStart } from '../../../../../src/core/public';
import {
  AssistantSettings,
  FieldPolicyAction,
  FieldPolicyEntry,
  SettingsService,
} from '../../services/settings-service';
import { ensureManagerSession } from '../../services/session-heal';
import { ProviderInput, ProviderSummary } from '../../../common/types';
import { useDirtyFormState } from '../../hooks/use-dirty-form-state';
import { ProviderFormFlyout } from './provider-form-flyout';
import {
  ProviderTestOutcome,
  describeHttpError,
  outcomeFromTestError,
  outcomeFromTestResult,
} from './provider-status';

const FIELD_POLICY_ACTIONS: FieldPolicyAction[] = [
  'allow',
  'allow-scan',
  'anonymize',
  'never',
];

const FIELD_POLICY_ACTION_LABELS: Record<FieldPolicyAction, string> = {
  allow: i18n.translate('wazuhAiAssistant.settings.privacy.action.allow', {
    defaultMessage: 'Allow',
  }),
  'allow-scan': i18n.translate(
    'wazuhAiAssistant.settings.privacy.action.allowScan',
    {
      // #8912: value is sent, but scanned first for known identifiers/IPs/hostnames.
      defaultMessage: 'Allow (scanned)',
    },
  ),
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

// The Privacy section's whole save unit: the two on/off switches plus the field policy rows
// below them, all gated behind the same "Save privacy settings" button and the same dirty check.
type PrivacyDraft = Pick<
  AssistantSettings,
  'privacyDefaultOn' | 'userCanOverride'
> & {
  fieldPolicy: Array<FieldPolicyEntry & { _isNew?: true }>;
};

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
 * Middle-truncates a long value (e.g. an endpoint URL) so the tail — usually the most
 * distinguishing part of a URL path — stays visible instead of being clipped by a trailing
 * ellipsis. The full value is still available via the `EuiToolTip` wrapping the caller's render,
 * so nothing is actually lost, only compacted (screen 3 gap: "Endpoints dominate the row").
 */
function middleTruncate(value: string, maxLength = 42): string {
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
          <EuiText size='s' color='subdued'>
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
  const [privacyLoadError, setPrivacyLoadError] = useState<string | null>(null);
  const [privacySaveError, setPrivacySaveError] = useState<string | null>(null);
  const [isSavingPrivacy, setIsSavingPrivacy] = useState(false);
  // Kept alongside the drafts above so "Save" can PUT the full AssistantSettings body (the route
  // requires all four attributes every time, server/routes/settings.ts's PUT validator) without
  // this component needing to separately track `privacyDefaultPerProvider` (untouched by this UI —
  // see the per-provider note in handleSubmit below).
  const [loadedAssistantSettings, setLoadedAssistantSettings] =
    useState<AssistantSettings | null>(null);

  // Conversation history retention: days to keep a saved conversation before GET
  // /conversations excludes (and best-effort deletes) it; `0` means keep forever. Same
  // load-draft-then-explicit-save pattern as Privacy above, PUT via the same
  // `updateAssistantSettings` round-trip. `retention.isDirty` is derived from comparing
  // `retention.value` against the last loaded/saved baseline, rather than a hand-toggled flag.
  const retention = useDirtyFormState<number | null>(null);
  const [retentionSaveError, setRetentionSaveError] = useState<string | null>(
    null,
  );
  const [isSavingRetention, setIsSavingRetention] = useState(false);
  const [fieldPolicyFilter, setFieldPolicyFilter] = useState('');
  const hasEmptyFieldPolicyRow = fieldPolicyDraft.some(
    entry => entry.field.trim() === '',
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

  // Pre-flight administrator probe: a live check (GET /settings/access),
  // not a stored setting — loaded once on mount, independent of the settings save/load cycle above.
  // `canSave` starts `true` (optimistic) so the page never blocks anything until the probe actually
  // comes back `false`; if the probe request itself fails, `.catch` below deliberately leaves
  // `canSave` untouched (fail OPEN on the client — the server still enforces the real
  // gate on every PUT regardless of what this banner shows).
  const [canSave, setCanSave] = useState(true);
  const [accessMessage, setAccessMessage] = useState<string | null>(null);
  // Tri-state, fail-open like `canSave`: `null` = probe pending/failed → no callout and no Save
  // block; only a confirmed server `false` gates the form. The server's 503 gate still refuses
  // plaintext key writes regardless.
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
          fieldPolicy: loaded.fieldPolicy,
        });
        retention.commit(loaded.conversationRetentionDays);
        setPrivacyLoadError(null);
      })
      .catch(() =>
        setPrivacyLoadError(
          i18n.translate('wazuhAiAssistant.settings.privacy.loadError', {
            defaultMessage: 'Could not load privacy settings.',
          }),
        ),
      );
  };

  useEffect(() => {
    reloadPrivacySettings();
    // The probe→heal→re-probe choreography lives in ensureManagerSession now (it shares the
    // execution renderApp already started, so a /settings deep link gets the healed answer on
    // first paint). A `null` result means the probe itself failed: fail OPEN — `canSave` stays at
    // its optimistic default and the server still enforces the real gate on every PUT regardless.
    void ensureManagerSession(core.http).then(access => {
      if (!access) {
        return;
      }
      // `!== false` stays fail-open when older servers omit the field.
      setApiKeyEncryptionEnabled(access.apiKeyEncryptionEnabled !== false);
      setCanSave(access.administrator);
      setAccessMessage(access.administrator ? null : access.message);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSaveRetentionSettings = async () => {
    if (retention.value === null || !loadedAssistantSettings) {
      return;
    }
    setRetentionSaveError(null);
    setIsSavingRetention(true);
    try {
      const saved = await service.updateAssistantSettings(
        buildSettingsPayload(loadedAssistantSettings, {
          conversationRetentionDays: retention.value,
        }),
      );
      setLoadedAssistantSettings(saved);
      retention.commit(saved.conversationRetentionDays);
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
          // Drop any blank rows a user added via "Add field" but never filled in.
          // Strip the internal `_isNew` flag before sending — the server schema rejects unknown keys.
          fieldPolicy: fieldPolicyDraft
            .filter(entry => entry.field.trim().length > 0)
            .map(({ _isNew: _removed, ...entry }) => entry),
        }),
      );
      setLoadedAssistantSettings(saved);
      privacy.commit({
        privacyDefaultOn: saved.privacyDefaultOn,
        userCanOverride: saved.userCanOverride,
        fieldPolicy: saved.fieldPolicy,
      });
      retention.setValue(saved.conversationRetentionDays);
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
          i18n.translate('wazuhAiAssistant.settings.loadError', {
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
          i18n.translate('wazuhAiAssistant.settings.loadError', {
            defaultMessage: 'Could not load providers.',
          }),
        ),
      )
      .finally(() => setProvidersLoaded(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateForm = () => {
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
    if (editingProvider === null) {
      onCreateFormOpenChange?.(false);
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

  // No per-provider privacy toggle in this form, deliberately.
  // `AssistantSettings.privacyDefaultPerProvider` is keyed by provider id and lives in a
  // SEPARATE saved object from `ProviderInput`/`ProviderSummary` (common/types.ts has no field for
  // it, by design — it is not part of a provider's own config). Adding a per-provider toggle to
  // this form would mean: (a) a brand-new provider's id isn't known until AFTER `service.create()`
  // resolves, so the toggle's write has to happen as a second, separate `updateAssistantSettings`
  // call following provider creation; (b) representing "no override for this provider" (key absent
  // from the map) vs. an explicit `true`/`false` needs a tri-state control, since a plain EuiSwitch
  // can't distinguish "inherit the global default" from "explicitly off"; (c) it would need to
  // read/write `loadedAssistantSettings` from inside this unrelated form's submit handler, coupling
  // two independently-loaded pieces of state. That cost is not worth a toggle no one has asked
  // for; the per-provider map stays editable only by ensuring the global
  // Privacy section below never overwrites it (see `handleSavePrivacySettings`'s
  // `privacyDefaultPerProvider: loadedAssistantSettings.privacyDefaultPerProvider` passthrough).
  const handleSubmit = async (input: ProviderInput) => {
    setError(null);
    setIsSubmittingProvider(true);
    try {
      const saved = editingProvider
        ? await service.update(editingProvider.id, input)
        : await service.create(input);
      reload();
      onProvidersChanged();
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
      // The flyout no longer closes itself on a successful save — it stays open to surface the
      // connection-test result (screen 4: "Save & test gains a result panel"). Once
      // `flyoutTestOutcome` is set, the flyout's footer swaps Cancel/Save & test for a single
      // "Done" button; the admin dismisses it explicitly.
      const outcome = await handleTest(saved);
      setFlyoutTestOutcome(outcome);
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
    reload();
    onProvidersChanged();
  };

  const handleSetDefault = async (provider: ProviderSummary) => {
    setError(null);
    try {
      await service.setDefault(provider.id);
      reload();
      onProvidersChanged();
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
  // the whole set below (star 5 + name 15 + type 12 + endpoint 20 + model 15 + API key 9 +
  // status 14 + actions 6 + collapse 4), sized roughly to each column's own typical content.
  const columns: EuiBasicTableColumn<ProviderSummary>[] = [
    {
      field: 'isDefault',
      name: i18n.translate('wazuhAiAssistant.settings.column.default', {
        defaultMessage: 'Default',
      }),
      width: '5%',
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
      width: '15%',
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
        <EuiToolTip content={baseUrl}>
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

  return (
    <EuiPage className='wzSettingsPage'>
      <EuiPageBody>
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

        {!canSave && (
          <>
            <EuiCallOut
              color='warning'
              iconType='alert'
              title={i18n.translate(
                'wazuhAiAssistant.settings.access.warningTitle',
                {
                  defaultMessage: 'You cannot save settings right now',
                },
              )}
            >
              <p>
                {accessMessage ??
                  i18n.translate(
                    'wazuhAiAssistant.settings.access.warningFallback',
                    {
                      defaultMessage:
                        'Administrator privileges are required to change AI Assistant settings.',
                    },
                  )}
              </p>
            </EuiCallOut>
            <EuiSpacer size='l' />
          </>
        )}

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
                title={i18n.translate('wazuhAiAssistant.settings.errorTitle', {
                  defaultMessage: 'Something went wrong',
                })}
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

        <EuiSpacer size='xl' />

        <SectionCard
          pillLabel={i18n.translate('wazuhAiAssistant.settings.privacy.title', {
            defaultMessage: 'Privacy',
          })}
          description={i18n.translate(
            'wazuhAiAssistant.settings.privacy.description',
            {
              defaultMessage:
                'Control whether finding data is anonymized before reaching the configured AI provider. When privacy mode is off, hostnames, IP addresses, usernames, process command lines, and finding/rule text leave the cluster as-is.',
            },
          )}
        >
          {privacyLoadError && (
            <>
              <EuiCallOut
                color='danger'
                iconType='alert'
                title={privacyLoadError}
                size='s'
              />
              <EuiSpacer size='m' />
            </>
          )}

          {!privacyDraft && !privacyLoadError && (
            <>
              <EuiLoadingSpinner
                size='m'
                aria-label={i18n.translate('wazuhAiAssistant.common.loading', {
                  defaultMessage: 'Loading...',
                })}
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
              <EuiSpacer size='s' />
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

              <EuiSpacer size='l' />
              {/* The full explanation lives in the tooltip rather than inline: it is long enough
                  to dominate the section, and it only matters the first time an admin configures
                  a rule (or when one surprises them). */}
              <EuiFlexGroup
                gutterSize='xs'
                alignItems='center'
                responsive={false}
              >
                <EuiFlexItem grow={false}>
                  <EuiText size='s'>
                    <strong>
                      {i18n.translate(
                        'wazuhAiAssistant.settings.privacy.fieldPolicyTitle',
                        {
                          defaultMessage: 'Field policy',
                        },
                      )}
                    </strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiIconTip
                    type='questionInCircle'
                    color='subdued'
                    content={i18n.translate(
                      'wazuhAiAssistant.settings.privacy.fieldPolicyHelp',
                      {
                        defaultMessage:
                          'What the AI provider gets per field: real value (Allow), pseudonym (Anonymize), or nothing (Never send).',
                      },
                    )}
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
              <EuiSpacer size='s' />

              {fieldPolicyDraft.length > 0 && (
                <EuiAccordion
                  id='field-policy-accordion'
                  // Collapsed by default: the rule list is long (the curated defaults alone are
                  // ~25 rows) and it is not what an admin comes to this section for — the two
                  // privacy switches above it are. The button content carries the rule count, so
                  // the section still reports its size without being expanded.
                  buttonContent={i18n.translate(
                    'wazuhAiAssistant.settings.privacy.fieldPolicyAccordion',
                    {
                      defaultMessage: 'Field rules ({count})',
                      values: { count: fieldPolicyDraft.length },
                    },
                  )}
                  paddingSize='s'
                >
                  <EuiFieldSearch
                    compressed
                    placeholder={i18n.translate(
                      'wazuhAiAssistant.settings.privacy.filterFields',
                      { defaultMessage: 'Filter fields' },
                    )}
                    value={fieldPolicyFilter}
                    onChange={e => setFieldPolicyFilter(e.target.value)}
                    isClearable
                  />
                  <EuiSpacer size='s' />
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
                  {fieldPolicyDraft
                    .map((entry, index) => ({ entry, index }))
                    .filter(
                      ({ entry }) =>
                        !fieldPolicyFilter ||
                        entry._isNew ||
                        entry.field
                          .toLowerCase()
                          .includes(fieldPolicyFilter.toLowerCase()),
                    )
                    .map(({ entry, index }) => (
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
                          <EuiFlexItem grow={false} style={{ minWidth: 160 }}>
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
                              value={entry.action}
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
                              onClick={() => handleRemoveFieldPolicyRow(index)}
                            />
                          </EuiFlexItem>
                        </EuiFlexGroup>
                        <EuiSpacer size='xs' />
                      </React.Fragment>
                    ))}
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
                </EuiAccordion>
              )}

              {fieldPolicyDraft.length === 0 && (
                <>
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

              <EuiHorizontalRule margin='m' />
              <EuiToolTip content={!canSave ? accessMessage : undefined}>
                <EuiButton
                  onClick={handleSavePrivacySettings}
                  isLoading={isSavingPrivacy}
                  isDisabled={
                    !canSave || hasEmptyFieldPolicyRow || !privacy.isDirty
                  }
                  fill
                >
                  {i18n.translate('wazuhAiAssistant.settings.privacy.save', {
                    defaultMessage: 'Save privacy settings',
                  })}
                </EuiButton>
              </EuiToolTip>
            </>
          )}
        </SectionCard>

        <EuiSpacer size='xl' />

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
              defaultMessage: 'Control how long saved conversations are kept.',
            },
          )}
        >
          {retention.value === null && !privacyLoadError && (
            <>
              <EuiLoadingSpinner
                size='m'
                aria-label={i18n.translate('wazuhAiAssistant.common.loading', {
                  defaultMessage: 'Loading...',
                })}
              />
              <EuiSpacer size='m' />
            </>
          )}

          {retention.value !== null && (
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

              <EuiFormRow
                label={i18n.translate(
                  'wazuhAiAssistant.settings.retention.daysLabel',
                  {
                    defaultMessage: 'Keep saved conversations for (days)',
                  },
                )}
                helpText={i18n.translate(
                  'wazuhAiAssistant.settings.retention.daysHelp',
                  {
                    defaultMessage:
                      '0 keeps every saved conversation forever. Enforcement happens when the conversation list is loaded. There is no scheduled background cleanup.',
                  },
                )}
              >
                <EuiFieldNumber
                  min={0}
                  value={retention.value}
                  onChange={event => {
                    const parsed = Number(event.target.value);
                    retention.setValue(
                      Number.isNaN(parsed) ? 0 : Math.max(0, parsed),
                    );
                  }}
                />
              </EuiFormRow>

              <EuiHorizontalRule margin='m' />
              <EuiToolTip content={!canSave ? accessMessage : undefined}>
                <EuiButton
                  onClick={handleSaveRetentionSettings}
                  isLoading={isSavingRetention}
                  isDisabled={!canSave || !retention.isDirty}
                  fill
                >
                  {i18n.translate('wazuhAiAssistant.settings.retention.save', {
                    defaultMessage: 'Save conversation history settings',
                  })}
                </EuiButton>
              </EuiToolTip>
            </>
          )}
        </SectionCard>
      </EuiPageBody>
      {isFormOpen && isActive && (
        <ProviderFormFlyout
          editingProvider={editingProvider}
          error={error}
          canSave={canSave}
          accessMessage={accessMessage}
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
