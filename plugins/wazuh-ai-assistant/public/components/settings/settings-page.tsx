import React, { useEffect, useState } from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageContent,
  EuiPageContentBody,
  EuiBasicTable,
  EuiBasicTableColumn,
  EuiButton,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiFieldText,
  EuiSelect,
  EuiCallOut,
  EuiSpacer,
  EuiHealth,
  EuiText,
  EuiTitle,
  EuiConfirmModal,
  EuiButtonIcon,
  EuiToolTip,
  EuiBadge,
  EuiLoadingSpinner,
  EuiSwitch,
  EuiPanel,
  EuiFieldNumber,
  EuiIcon,
  EuiIconTip,
  EuiHorizontalRule,
  EuiFieldSearch,
  EuiAccordion,
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

const FIELD_POLICY_ACTIONS: FieldPolicyAction[] = [
  'allow',
  'anonymize',
  'never',
];

const FIELD_POLICY_ACTION_LABELS: Record<FieldPolicyAction, string> = {
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

interface SettingsPageProps {
  core: CoreStart;
  /** Lets the top-level app shell refresh its own provider list/selection after a CRUD action. */
  onProvidersChanged: () => void;
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
 * OSD's HttpFetchError puts the server's JSON body on `error.body` (the raw fetch Response is
 * otherwise opaque to callers) — an admin-gated rejection lands here as a bare "Forbidden"
 * `error.message` with no explanation, while the actual reason the server rejected the request is
 * `error.body.message`. Preferring that first (falling back to `error.message`, then to a
 * caller-supplied i18n fallback) is what makes the real server explanation reach the admin instead
 * of a generic callout.
 */
function describeHttpError(error: unknown, fallback: string): string {
  if (error && typeof error === 'object') {
    const body = (error as { body?: unknown }).body;
    if (body && typeof body === 'object') {
      const message = (body as { message?: unknown }).message;
      if (typeof message === 'string' && message.trim().length > 0) {
        return message;
      }
    }
  }
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
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

/** Shared header for each settings section below: a leading icon + title, a one-line subdued
 * description, and an optional right-aligned action (e.g. the providers section's "Add provider"
 * button) — keeps the sections (Providers, Privacy, Conversation history) visually consistent. */
const SectionHeader: React.FC<{
  // Matches EuiIcon's own `type` prop exactly, so only icon names EuiIcon actually accepts compile.
  icon: React.ComponentProps<typeof EuiIcon>['type'];
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ icon, title, description, action }) => (
  <>
    <EuiFlexGroup
      justifyContent='spaceBetween'
      alignItems='flexStart'
      responsive={false}
      gutterSize='s'
    >
      <EuiFlexItem>
        <EuiFlexGroup gutterSize='s' alignItems='center' responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiIcon type={icon} size='m' />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiTitle size='s'>
              <h2>{title}</h2>
            </EuiTitle>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size='xs' />
        <EuiText size='s' color='subdued'>
          <p>{description}</p>
        </EuiText>
      </EuiFlexItem>
      {action && <EuiFlexItem grow={false}>{action}</EuiFlexItem>}
    </EuiFlexGroup>
    <EuiSpacer size='s' />
  </>
);

export const SettingsPage: React.FC<SettingsPageProps> = ({
  core,
  onProvidersChanged,
}) => {
  const [service] = useState(() => new SettingsService(core.http));
  const [providers, setProviders] = useState<ProviderSummary[]>([]);
  // Provider whose values seed the flyout form (null = creating); `isFormOpen` is separate so a
  // create form (no provider) can be open too.
  const [editingProvider, setEditingProvider] =
    useState<ProviderSummary | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<
    Record<string, { success: boolean; latencyMs: number; message?: string }>
  >({});
  const [testingIds, setTestingIds] = useState<Set<string>>(new Set());
  const [dismissedErrorIds, setDismissedErrorIds] = useState<Set<string>>(
    new Set(),
  );
  const [deleteTarget, setDeleteTarget] = useState<ProviderSummary | null>(
    null,
  );

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
  const failedProviders = providers.filter(
    p =>
      testResults[p.id] &&
      !testResults[p.id].success &&
      !dismissedErrorIds.has(p.id),
  );
  const hasEmptyFieldPolicyRow = fieldPolicyDraft.some(
    entry => entry.field.trim() === '',
  );

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

  useEffect(() => {
    service
      .list()
      .then(loaded => {
        setProviders(loaded);
        loaded.forEach(p => handleTest(p));
      })
      .catch(() =>
        setError(
          i18n.translate('wazuhAiAssistant.settings.loadError', {
            defaultMessage: 'Could not load providers.',
          }),
        ),
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCreateForm = () => {
    setEditingProvider(null);
    setError(null);
    setIsFormOpen(true);
  };

  const openEditForm = (provider: ProviderSummary) => {
    setEditingProvider(provider);
    setError(null);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setError(null);
  };

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
    try {
      if (editingProvider) {
        await service.update(editingProvider.id, input);
        clearTestResult(editingProvider.id);
      } else {
        await service.create(input);
      }
      setIsFormOpen(false);
      reload();
      onProvidersChanged();
    } catch (submitError) {
      setError(
        describeHttpError(
          submitError,
          i18n.translate('wazuhAiAssistant.settings.saveError', {
            defaultMessage: 'Could not save the provider.',
          }),
        ),
      );
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

  const handleTest = async (provider: ProviderSummary) => {
    setTestingIds(current => new Set(current).add(provider.id));
    setDismissedErrorIds(current => {
      const next = new Set(current);
      next.delete(provider.id);
      return next;
    });
    try {
      const result = await service.test(provider.id);
      setTestResults(current => ({ ...current, [provider.id]: result }));
    } catch (testError) {
      setTestResults(current => ({
        ...current,
        [provider.id]: {
          success: false,
          latencyMs: 0,
          message: describeHttpError(testError, String(testError)),
        },
      }));
    } finally {
      setTestingIds(current => {
        const next = new Set(current);
        next.delete(provider.id);
        return next;
      });
    }
  };

  const columns: EuiBasicTableColumn<ProviderSummary>[] = [
    {
      field: 'isDefault',
      name: i18n.translate('wazuhAiAssistant.settings.column.default', {
        defaultMessage: 'Default',
      }),
      width: '70px',
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
      width: '15%',
      render: (type: string) => PROVIDER_TYPE_SHORT_LABELS[type] ?? type,
    },
    {
      field: 'baseUrl',
      name: i18n.translate('wazuhAiAssistant.settings.column.baseUrl', {
        defaultMessage: 'Endpoint',
      }),
      width: '25%',
      truncateText: true,
      render: (baseUrl: string) => <span title={baseUrl}>{baseUrl}</span>,
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
      width: '110px',
      render: (hasApiKey: boolean) => (
        <EuiHealth color={hasApiKey ? 'success' : 'subdued'}>
          {hasApiKey
            ? i18n.translate('wazuhAiAssistant.settings.apiKeySet', {
                defaultMessage: 'Configured',
              })
            : i18n.translate('wazuhAiAssistant.settings.apiKeyMissing', {
                defaultMessage: 'Not set',
              })}
        </EuiHealth>
      ),
    },
    {
      field: 'id',
      name: i18n.translate('wazuhAiAssistant.settings.column.status', {
        defaultMessage: 'Status',
      }),
      width: '130px',
      render: (providerId: string) => {
        if (testingIds.has(providerId)) {
          return (
            <EuiFlexGroup
              gutterSize='xs'
              alignItems='center'
              responsive={false}
            >
              <EuiFlexItem grow={false}>
                <EuiLoadingSpinner size='s' />
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiText size='s' color='subdued'>
                  {i18n.translate('wazuhAiAssistant.settings.testing', {
                    defaultMessage: 'Testing...',
                  })}
                </EuiText>
              </EuiFlexItem>
            </EuiFlexGroup>
          );
        }
        const result = testResults[providerId];
        if (!result) {
          return (
            <EuiText size='s' color='subdued'>
              {i18n.translate('wazuhAiAssistant.settings.testNotRun', {
                defaultMessage: 'Not tested',
              })}
            </EuiText>
          );
        }
        if (result.success) {
          return (
            <EuiBadge color='success'>
              {i18n.translate('wazuhAiAssistant.settings.testSuccessBadge', {
                defaultMessage: 'OK ({latency} ms)',
                values: { latency: result.latencyMs },
              })}
            </EuiBadge>
          );
        }
        return (
          <EuiBadge color='danger'>
            {i18n.translate('wazuhAiAssistant.settings.testFailureBadge', {
              defaultMessage: 'Failed',
            })}
          </EuiBadge>
        );
      },
    },
    {
      name: i18n.translate('wazuhAiAssistant.settings.column.actions', {
        defaultMessage: 'Actions',
      }),
      width: '60px',
      actions: [
        {
          name: i18n.translate('wazuhAiAssistant.settings.action.test', {
            defaultMessage: 'Test',
          }),
          description: i18n.translate(
            'wazuhAiAssistant.settings.action.testDescription',
            {
              defaultMessage: 'Test connection',
            },
          ),
          icon: 'play',
          type: 'icon' as const,
          onClick: handleTest,
          enabled: (provider: ProviderSummary) => !testingIds.has(provider.id),
        },
        {
          name: i18n.translate('wazuhAiAssistant.settings.action.edit', {
            defaultMessage: 'Edit',
          }),
          description: i18n.translate(
            'wazuhAiAssistant.settings.action.editDescription',
            {
              defaultMessage: 'Edit provider',
            },
          ),
          icon: 'pencil',
          type: 'icon' as const,
          onClick: openEditForm,
        },
        {
          name: i18n.translate('wazuhAiAssistant.settings.action.delete', {
            defaultMessage: 'Delete',
          }),
          description: i18n.translate(
            'wazuhAiAssistant.settings.action.deleteDescription',
            {
              defaultMessage: 'Delete provider',
            },
          ),
          icon: 'trash',
          color: 'danger' as const,
          type: 'icon' as const,
          onClick: requestDelete,
        },
      ],
    },
  ];

  return (
    <EuiPage restrictWidth={960}>
      <EuiPageBody>
        <EuiPageContent
          hasShadow={false}
          hasBorder={false}
          color='transparent'
          paddingSize='none'
        >
          <EuiPageContentBody>
            <EuiTitle size='l'>
              <h1>
                {i18n.translate('wazuhAiAssistant.settings.pageTitle', {
                  defaultMessage: 'AI Assistant settings',
                })}
              </h1>
            </EuiTitle>
            <EuiSpacer size='xs' />
            <EuiText size='s' color='subdued'>
              <p>
                {i18n.translate('wazuhAiAssistant.settings.pageDescription', {
                  defaultMessage:
                    'Manage AI providers, privacy and conversation history.',
                })}
              </p>
            </EuiText>
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

            <SectionHeader
              icon='gear'
              title={i18n.translate(
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
              action={
                <EuiButton
                  onClick={openCreateForm}
                  iconType='plusInCircle'
                  size='s'
                >
                  {i18n.translate('wazuhAiAssistant.settings.addProvider', {
                    defaultMessage: 'Add provider',
                  })}
                </EuiButton>
              }
            />
            <EuiPanel hasShadow={false} hasBorder paddingSize='m'>
              {error && !isFormOpen && (
                <>
                  <EuiCallOut
                    title={i18n.translate(
                      'wazuhAiAssistant.settings.errorTitle',
                      {
                        defaultMessage: 'Something went wrong',
                      },
                    )}
                    color='danger'
                    iconType='alert'
                  >
                    <p>{error}</p>
                  </EuiCallOut>
                  <EuiSpacer size='m' />
                </>
              )}

              <EuiBasicTable items={providers} columns={columns} itemId='id' />
              {failedProviders.map(p => (
                <React.Fragment key={p.id}>
                  <EuiSpacer size='s' />
                  <EuiCallOut
                    color='danger'
                    iconType='alert'
                    size='s'
                    title={i18n.translate(
                      'wazuhAiAssistant.settings.testFailureCallout',
                      {
                        defaultMessage: '{name}: {message}',
                        values: {
                          name: p.name,
                          message:
                            testResults[p.id].message ??
                            i18n.translate(
                              'wazuhAiAssistant.settings.testFailureUnknown',
                              { defaultMessage: 'Connection failed.' },
                            ),
                        },
                      },
                    )}
                    onDismiss={() =>
                      setDismissedErrorIds(prev => new Set([...prev, p.id]))
                    }
                  />
                </React.Fragment>
              ))}
            </EuiPanel>

            <EuiSpacer size='xl' />

            <SectionHeader
              icon='lock'
              title={i18n.translate('wazuhAiAssistant.settings.privacy.title', {
                defaultMessage: 'Privacy',
              })}
              description={i18n.translate(
                'wazuhAiAssistant.settings.privacy.description',
                {
                  defaultMessage:
                    'Control whether finding data is anonymized before reaching the configured AI provider. When privacy mode is off, hostnames, IP addresses, usernames, process command lines, and finding/rule text leave the cluster as-is.',
                },
              )}
            />

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
              <EuiPanel hasShadow={false} hasBorder paddingSize='m'>
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
                              { defaultMessage: 'Field' },
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
                                onClick={() =>
                                  handleRemoveFieldPolicyRow(index)
                                }
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
                        { defaultMessage: 'Add field' },
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
                        { defaultMessage: 'Add field' },
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
              </EuiPanel>
            )}

            <EuiSpacer size='xl' />

            <SectionHeader
              icon='clock'
              title={i18n.translate(
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
            />

            {retention.value === null && !privacyLoadError && (
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

            {retention.value !== null && (
              <EuiPanel hasShadow={false} hasBorder paddingSize='m'>
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
                        '0 keeps every saved conversation forever. Enforcement happens only when the conversation list is loaded — there is no scheduled background cleanup.',
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
                    {i18n.translate(
                      'wazuhAiAssistant.settings.retention.save',
                      {
                        defaultMessage: 'Save conversation history settings',
                      },
                    )}
                  </EuiButton>
                </EuiToolTip>
              </EuiPanel>
            )}
          </EuiPageContentBody>
        </EuiPageContent>
        {isFormOpen && (
          <ProviderFormFlyout
            editingProvider={editingProvider}
            error={error}
            canSave={canSave}
            accessMessage={accessMessage}
            apiKeyEncryptionEnabled={apiKeyEncryptionEnabled}
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
      </EuiPageBody>
    </EuiPage>
  );
};
