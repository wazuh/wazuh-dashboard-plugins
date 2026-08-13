import React, { useState } from 'react';
import './provider-form-flyout.scss';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCheckableCard,
  EuiCode,
  EuiCodeBlock,
  EuiConfirmModal,
  EuiFieldPassword,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiBadge,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutFooter,
  EuiFlyoutHeader,
  EuiForm,
  EuiFormFieldset,
  EuiFormRow,
  EuiLink,
  EuiPopover,
  EuiPopoverTitle,
  EuiSpacer,
  EuiText,
  EuiTextColor,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { ProviderInput, ProviderSummary } from '../../../common/types';
import { PROVIDER_TYPES } from '../../../common/constants';
import { useDirtyFormState } from '../../hooks/use-dirty-form-state';
import { ProviderTestOutcome } from './provider-status';

const PROVIDER_TYPE_FORM_LABELS: Record<string, string> = {
  openai_compatible: i18n.translate(
    'wazuhAiAssistant.settings.type.openaiCompatible',
    {
      defaultMessage:
        'OpenAI-compatible (OpenAI, Bedrock gateway, Ollama, LM Studio, vLLM...)',
    },
  ),
  anthropic: i18n.translate('wazuhAiAssistant.settings.type.anthropic', {
    defaultMessage: 'Anthropic (Claude)',
  }),
};

/** One-line description shown under the provider type selector so the choice is self-explanatory
 * without opening either form label's parenthetical — CEO feedback was specifically that signing
 * up an Anthropic key was confusing, and part of that was not knowing which type to pick. */
const PROVIDER_TYPE_DESCRIPTIONS: Record<ProviderInput['type'], string> = {
  anthropic: i18n.translate(
    'wazuhAiAssistant.settings.type.anthropicDescription',
    {
      defaultMessage: "Anthropic's own API (Claude models).",
    },
  ),
  openai_compatible: i18n.translate(
    'wazuhAiAssistant.settings.type.openaiCompatibleDescription',
    {
      defaultMessage:
        'Choose this for OpenAI, Groq, Bedrock-Mantle, or any other provider that exposes ' +
        'a /chat/completions endpoint.',
    },
  ),
};

/**
 * Per-type API key guidance shown under the API key field: where to create a key and what its
 * shape looks like, so a mismatched key gets caught before the admin clicks Save and hits an
 * opaque "Test connection" failure. `keyPattern` backs a non-blocking shape warning only — the
 * server is the real validator, this is just an early, cheap hint.
 *
 * `keyPattern` is deliberately OPTIONAL: it is only well-defined for `anthropic` (Anthropic keys
 * always start with `sk-ant-`). `openai_compatible` covers OpenAI, Groq (`gsk_...`),
 * Bedrock-Mantle/gateway tokens (arbitrary shapes), and auth-free Ollama (no key at all) — there
 * is no single shape to check there, so warning against `/^sk-/` for that type would falsely flag
 * perfectly valid keys for the exact providers this type's own description advertises.
 */
const PROVIDER_API_KEY_GUIDANCE: Record<
  ProviderInput['type'],
  { help: string; keyPattern?: RegExp; shapeWarning?: string }
> = {
  anthropic: {
    help: i18n.translate('wazuhAiAssistant.settings.form.apiKeyHelpAnthropic', {
      defaultMessage:
        'Create a key at console.anthropic.com -> API Keys. Anthropic keys start with sk-ant-.',
    }),
    keyPattern: /^sk-ant-/,
    shapeWarning: i18n.translate(
      'wazuhAiAssistant.settings.form.apiKeyShapeWarningAnthropic',
      {
        defaultMessage:
          "This doesn't look like an Anthropic key (it should start with sk-ant-). " +
          'Double-check it was copied from console.anthropic.com -> API Keys.',
      },
    ),
  },
  openai_compatible: {
    help: i18n.translate(
      'wazuhAiAssistant.settings.form.apiKeyHelpOpenaiCompatible',
      {
        defaultMessage:
          "Create a key in your provider's console (e.g. OpenAI, Groq). OpenAI keys start " +
          'with sk-, Groq keys with gsk_ — other gateways (e.g. Bedrock-Mantle) use their own ' +
          'format.',
      },
    ),
    // No shape check for this type — see the doc comment above.
  },
};

interface ProviderUrlDoc {
  label: string;
  url: string;
}

/** Note shown under the docs links for openai_compatible: that type's label (see
 * PROVIDER_TYPE_FORM_LABELS above) advertises more services (Bedrock gateway, LM Studio,
 * vLLM...) than this file has room to keep a maintained doc link for — pointing the admin at
 * their own provider's docs is more reliable than us trying to enumerate every compatible
 * gateway. */
const OTHER_OPENAI_COMPATIBLE_PROVIDERS_NOTE = i18n.translate(
  'wazuhAiAssistant.settings.form.otherProvidersNote',
  {
    defaultMessage:
      'Using another OpenAI-compatible provider or gateway (e.g. Gemini, LM Studio, vLLM)? ' +
      'Check its own documentation for the correct values.',
  },
);

/**
 * Per-type endpoint URL guidance shown under the field: the adapters append their own path to
 * `baseUrl` (`/chat/completions` for openai_compatible, `/v1/messages` for anthropic — see
 * server/providers/openai-compatible.ts and anthropic.ts), so the placeholder/examples must be
 * the API ROOT, not a full request URL, or a user copying the example verbatim would get a
 * doubled path once the adapter appends its own suffix.
 */
const PROVIDER_URL_GUIDANCE: Record<
  ProviderInput['type'],
  {
    placeholder: string;
    examples: string[];
    docs: ProviderUrlDoc[];
    note?: string;
  }
> = {
  openai_compatible: {
    placeholder: 'https://api.openai.com/v1',
    examples: [
      'https://api.openai.com/v1',
      'https://api.groq.com/openai/v1',
      'http://localhost:11434/v1',
    ],
    // One link per actual service this type covers (see PROVIDER_TYPE_FORM_LABELS above) — a
    // single "OpenAI API reference" link would be misleading for a Groq/Ollama/etc endpoint.
    docs: [
      {
        label: i18n.translate(
          'wazuhAiAssistant.settings.form.baseUrlDocsOpenai',
          {
            defaultMessage: 'OpenAI API reference',
          },
        ),
        url: 'https://platform.openai.com/docs/api-reference',
      },
      {
        label: i18n.translate(
          'wazuhAiAssistant.settings.form.baseUrlDocsGroq',
          {
            defaultMessage: 'Groq API reference',
          },
        ),
        url: 'https://console.groq.com/docs/api-reference',
      },
      {
        label: i18n.translate(
          'wazuhAiAssistant.settings.form.baseUrlDocsOllama',
          {
            defaultMessage: 'Ollama API reference',
          },
        ),
        url: 'https://github.com/ollama/ollama/blob/main/docs/api.md',
      },
    ],
    note: OTHER_OPENAI_COMPATIBLE_PROVIDERS_NOTE,
  },
  anthropic: {
    placeholder: 'https://api.anthropic.com',
    examples: ['https://api.anthropic.com'],
    docs: [
      {
        label: i18n.translate(
          'wazuhAiAssistant.settings.form.baseUrlDocsAnthropic',
          {
            defaultMessage: 'Anthropic API reference',
          },
        ),
        url: 'https://docs.anthropic.com/en/api/overview',
      },
    ],
  },
};

/**
 * Per-type MODEL guidance: the model field is free text (no enum — providers add models faster
 * than this form could track), so it gets the same examples-plus-docs treatment as the endpoint
 * URL field, pointing at each provider's own model list instead of us mirroring it (which would
 * always be stale).
 */
const PROVIDER_MODEL_GUIDANCE: Record<
  ProviderInput['type'],
  { examples: string[]; docs: ProviderUrlDoc[]; note?: string }
> = {
  openai_compatible: {
    examples: ['openai.gpt-oss-120b', 'mistral.mistral-large-3-675b-instruct'],
    docs: [
      {
        label: i18n.translate(
          'wazuhAiAssistant.settings.form.modelDocsOpenai',
          {
            defaultMessage: 'OpenAI model list',
          },
        ),
        url: 'https://platform.openai.com/docs/models',
      },
      {
        label: i18n.translate('wazuhAiAssistant.settings.form.modelDocsGroq', {
          defaultMessage: 'Groq model list',
        }),
        url: 'https://console.groq.com/docs/models',
      },
      {
        label: i18n.translate(
          'wazuhAiAssistant.settings.form.modelDocsOllama',
          {
            defaultMessage: 'Ollama model library',
          },
        ),
        url: 'https://ollama.com/library',
      },
    ],
    note: OTHER_OPENAI_COMPATIBLE_PROVIDERS_NOTE,
  },
  anthropic: {
    examples: ['claude-opus-4-8', 'claude-haiku-4-5'],
    docs: [
      {
        label: i18n.translate(
          'wazuhAiAssistant.settings.form.modelDocsAnthropic',
          {
            defaultMessage: 'Anthropic model list',
          },
        ),
        url: 'https://docs.anthropic.com/en/docs/about-claude/models/overview',
      },
    ],
  },
};

/**
 * Curated model suggestions keyed by a substring of the endpoint URL — shown as clickable chips
 * under the Model field so the admin can pick a known-good model without leaving the form, while
 * the field itself stays free text (providers add models faster than this list could track).
 * Order matters: the first substring match wins.
 *
 * `forType` gates the entry to the provider type it actually works with: api.anthropic.com only
 * makes sense for the `anthropic` type (an `openai_compatible` provider pointed at that URL would
 * be a guaranteed-broken config), and every other entry is an OpenAI-compatible-only
 * gateway/service, so it is gated to `openai_compatible`.
 */
const VENDOR_MODEL_SUGGESTIONS: Array<{
  match: string;
  forType: ProviderInput['type'];
  models: string[];
}> = [
  {
    match: 'api.anthropic.com',
    forType: 'anthropic',
    models: ['claude-opus-4-8', 'claude-haiku-4-5', 'claude-sonnet-5'],
  },
  {
    match: 'api.openai.com',
    forType: 'openai_compatible',
    models: ['gpt-4o', 'gpt-4o-mini'],
  },
  {
    match: 'bedrock-mantle',
    forType: 'openai_compatible',
    models: [
      'openai.gpt-oss-120b',
      'mistral.mistral-large-3-675b-instruct',
      'qwen.qwen3-32b',
      'deepseek.v3.2',
    ],
  },
  {
    match: 'openrouter.ai',
    forType: 'openai_compatible',
    models: ['openai/gpt-oss-20b:free'],
  },
  {
    match: 'generativelanguage',
    forType: 'openai_compatible',
    models: ['gemini-flash-latest', 'gemini-3-flash-preview'],
  },
  {
    match: 'localhost:11434',
    forType: 'openai_compatible',
    models: ['llama3.3', 'qwen3', 'mistral'],
  },
  {
    match: '127.0.0.1:11434',
    forType: 'openai_compatible',
    models: ['llama3.3', 'qwen3', 'mistral'],
  },
];

function getVendorModelSuggestions(
  baseUrl: string,
  type: ProviderInput['type'],
): string[] {
  const normalized = baseUrl.trim().toLowerCase();
  if (!normalized) {
    return [];
  }
  const vendor = VENDOR_MODEL_SUGGESTIONS.find(
    ({ match, forType }) => forType === type && normalized.includes(match),
  );
  return vendor?.models ?? [];
}

const RequiredLabel: React.FC<{ label: string }> = ({ label }) => (
  <>
    {label}{' '}
    <EuiTextColor color='danger' component='span' aria-hidden='true'>
      *
    </EuiTextColor>
  </>
);

const emptyForm: ProviderInput = {
  name: '',
  type: 'openai_compatible',
  baseUrl: '',
  model: '',
  apiKey: '',
};

function isValidEndpointUrl(value: string): boolean {
  return /^https?:\/\/.+/i.test(value.trim());
}

/** Collapses the (potentially multi-service, for openai_compatible) docs links behind a single
 * trigger rather than inlining them all in the help text — inlining every link for every provider
 * type change would make the field's help text noisy and reflow the form on each type switch.
 * Reused for both the endpoint URL and the Model field, with their own trigger label/title/note. */
const DocsPopover: React.FC<{
  triggerLabel: string;
  title: string;
  docs: ProviderUrlDoc[];
  note?: string;
}> = ({ triggerLabel, title, docs, note }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <EuiPopover
      button={
        <EuiLink onClick={() => setIsOpen(open => !open)}>
          {triggerLabel}
        </EuiLink>
      }
      isOpen={isOpen}
      closePopover={() => setIsOpen(false)}
      panelPaddingSize='s'
      anchorPosition='downLeft'
      // Without an explicit cap the panel sizes to its widest unwrapped line — the note sentence
      // in particular — stretching the popover (and its trigger link) far past what the list of
      // short doc links actually needs. Capping the width forces the note to wrap instead.
      panelStyle={{ maxWidth: 280 }}
    >
      <EuiPopoverTitle>{title}</EuiPopoverTitle>
      <EuiFlexGroup direction='column' gutterSize='s' responsive={false}>
        {docs.map(doc => (
          <EuiFlexItem key={doc.url} grow={false}>
            <EuiLink href={doc.url} target='_blank'>
              {doc.label}
            </EuiLink>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
      {note && (
        <>
          <EuiSpacer size='s' />
          <EuiText size='xs' color='subdued'>
            {note}
          </EuiText>
        </>
      )}
    </EuiPopover>
  );
};

interface ProviderFormFlyoutProps {
  editingProvider: ProviderSummary | null;
  error: string | null;
  canSave: boolean;
  accessMessage: string | null;
  apiKeyEncryptionEnabled: boolean | null;
  /** True while a save (+ the connection test it triggers) is in flight. Optional/absent behaves
   * exactly as before this prop existed: the Save button is never shown as loading. */
  isSaving?: boolean;
  /** Result of the connection test the LAST "Save & test" click kicked off, or `null` before one
   * has completed (screen 4: "Save & test gains a result panel"). Optional/absent — and `null` —
   * both mean "no result panel", which is how every pre-existing caller/test behaves. */
  testOutcome?: ProviderTestOutcome | null;
  onSubmit: (input: ProviderInput) => Promise<void>;
  onClose: () => void;
}

export const ProviderFormFlyout: React.FC<ProviderFormFlyoutProps> = ({
  editingProvider,
  error,
  canSave,
  accessMessage,
  apiKeyEncryptionEnabled,
  isSaving = false,
  testOutcome = null,
  onSubmit,
  onClose,
}) => {
  const {
    value: form,
    setValue: setForm,
    isDirty,
  } = useDirtyFormState<ProviderInput>(
    editingProvider
      ? {
          name: editingProvider.name,
          type: editingProvider.type,
          baseUrl: editingProvider.baseUrl,
          model: editingProvider.model,
          apiKey: '',
        }
      : emptyForm,
  );
  const [baseUrlError, setBaseUrlError] = useState<string | null>(null);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  // Tracks whether the admin has typed into the endpoint URL field themselves, so switching
  // provider type to anthropic only prefills its base URL while the field is still
  // empty/untouched — never overwriting a value the admin already entered. An existing
  // provider being edited already has a real baseUrl, so it starts "touched".
  const [baseUrlTouched, setBaseUrlTouched] = useState(
    Boolean(editingProvider),
  );
  // Falling back rather than indexing straight in: these three records are keyed by the CURRENT
  // `ProviderInput['type']` union, but `form.type` can arrive from a stored provider written by an
  // older build (or a hand-edited saved object) whose type is no longer in that union — and every
  // consumer below reads `.examples` / `.keyPattern` off the result, so a miss white-screens the
  // whole flyout on the one path an admin uses to FIX such a provider. settings-page.tsx already
  // guards its own label lookup the same way.
  const urlGuidance =
    PROVIDER_URL_GUIDANCE[form.type] ?? PROVIDER_URL_GUIDANCE.openai_compatible;
  const modelGuidance =
    PROVIDER_MODEL_GUIDANCE[form.type] ??
    PROVIDER_MODEL_GUIDANCE.openai_compatible;
  const apiKeyGuidance =
    PROVIDER_API_KEY_GUIDANCE[form.type] ??
    PROVIDER_API_KEY_GUIDANCE.openai_compatible;
  const apiKeyShapeMismatch = Boolean(
    apiKeyGuidance.keyPattern &&
      form.apiKey?.trim() &&
      !apiKeyGuidance.keyPattern.test(form.apiKey.trim()),
  );
  const vendorModelSuggestions = getVendorModelSuggestions(
    form.baseUrl,
    form.type,
  );

  const fillBaseUrl = (value: string) => {
    setForm({ ...form, baseUrl: value });
    setBaseUrlTouched(true);
    if (baseUrlError) {
      setBaseUrlError(null);
    }
  };

  const fillModel = (value: string) => setForm({ ...form, model: value });

  // Group 1 (Provider type) onChange: same prefill/clear logic the old EuiSelect's onChange had,
  // just taking the next type directly instead of reading it off a native <select> change event.
  const handleTypeChange = (nextType: ProviderInput['type']) => {
    setForm(current => {
      // Prefill Anthropic's base URL the first time the admin switches to that type, but only
      // while the endpoint field is still empty/untouched — see `baseUrlTouched` above.
      const shouldPrefillAnthropicBaseUrl =
        nextType === 'anthropic' &&
        !baseUrlTouched &&
        current.baseUrl.trim() === '';
      // Mirror image of the prefill above: leaving anthropic for another type while the field is
      // still untouched and still holds exactly the value this form prefilled clears it again, so
      // a wrong-type URL can't be saved unnoticed. A value the admin typed themselves
      // (`baseUrlTouched`) is never touched here.
      const shouldClearAnthropicPrefill =
        current.type === 'anthropic' &&
        nextType !== 'anthropic' &&
        !baseUrlTouched &&
        current.baseUrl === PROVIDER_URL_GUIDANCE.anthropic.placeholder;
      return {
        ...current,
        type: nextType,
        baseUrl: shouldPrefillAnthropicBaseUrl
          ? PROVIDER_URL_GUIDANCE.anthropic.placeholder
          : shouldClearAnthropicPrefill
          ? ''
          : current.baseUrl,
      };
    });
  };

  const handleSave = async () => {
    const trimmedForm: ProviderInput = {
      ...form,
      name: form.name.trim(),
      baseUrl: form.baseUrl.trim(),
      model: form.model.trim(),
      apiKey: form.apiKey?.trim() ?? '',
    };

    if (!isValidEndpointUrl(trimmedForm.baseUrl)) {
      setBaseUrlError(
        i18n.translate('wazuhAiAssistant.settings.form.baseUrlInvalid', {
          defaultMessage: 'Enter a valid URL starting with http:// or https://',
        }),
      );
      return;
    }
    setBaseUrlError(null);
    await onSubmit(trimmedForm);
  };

  const apiKeyBlockedByEncryption =
    apiKeyEncryptionEnabled === false && Boolean(form.apiKey?.trim());

  const requestClose = () => {
    // Once a save has produced a test result, there is nothing left to discard — the provider is
    // already persisted — so the close button (and the X in the header) close directly instead of
    // asking about unsaved changes.
    if (isDirty && !testOutcome) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const keepEditing = () => setShowCloseConfirm(false);

  const discardChanges = (
    event?: React.SyntheticEvent | React.KeyboardEvent,
  ) => {
    const isExplicitYes = Boolean(
      (event?.target as HTMLElement | undefined)?.closest?.(
        '[data-test-subj="confirmModalCancelButton"]',
      ),
    );
    setShowCloseConfirm(false);
    if (isExplicitYes) {
      onClose();
    }
  };

  return (
    <>
      <EuiFlyout
        onClose={requestClose}
        size='m'
        aria-labelledby='wz-ai-provider-flyout-title'
      >
        <EuiFlyoutHeader hasBorder>
          <EuiTitle size='m'>
            <h2 id='wz-ai-provider-flyout-title'>
              {editingProvider
                ? i18n.translate('wazuhAiAssistant.settings.form.editTitle', {
                    defaultMessage: 'Edit provider',
                  })
                : i18n.translate('wazuhAiAssistant.settings.form.addTitle', {
                    defaultMessage: 'Add provider',
                  })}
            </h2>
          </EuiTitle>
        </EuiFlyoutHeader>
        <EuiFlyoutBody>
          {apiKeyEncryptionEnabled === false && (
            <>
              <EuiCallOut
                color='warning'
                iconType='alert'
                title={i18n.translate(
                  'wazuhAiAssistant.settings.form.encryptionRequiredTitle',
                  {
                    defaultMessage:
                      'An encryption key is required to save API keys',
                  },
                )}
              >
                <p>
                  {i18n.translate(
                    'wazuhAiAssistant.settings.form.encryptionRequiredBody',
                    {
                      defaultMessage:
                        'Encryption at rest is not configured. Providers that do not need ' +
                        'an API key can still be saved.',
                    },
                  )}
                </p>
                <p>
                  <FormattedMessage
                    id='wazuhAiAssistant.settings.form.encryptionRequiredHow'
                    defaultMessage={
                      'To enable saving keys, generate a base64-encoded ' +
                      '32-byte key and store it as {settingName} in the ' +
                      'keystore (recommended — the ' +
                      'key never sits in a readable config file) or in ' +
                      '{configFile}, then restart the dashboard service:'
                    }
                    values={{
                      settingName: (
                        <EuiCode>wazuh_ai_assistant.encryptionKey</EuiCode>
                      ),
                      configFile: <EuiCode>opensearch_dashboards.yml</EuiCode>,
                    }}
                  />
                </p>
                <EuiCodeBlock
                  language='bash'
                  paddingSize='s'
                  fontSize='s'
                  isCopyable
                >
                  {'openssl rand -base64 32\n' +
                    'opensearch-dashboards-keystore add wazuh_ai_assistant.encryptionKey'}
                </EuiCodeBlock>
              </EuiCallOut>
              <EuiSpacer size='m' />
            </>
          )}
          {!canSave && (
            <>
              <EuiCallOut
                color='warning'
                iconType='alert'
                title={i18n.translate(
                  'wazuhAiAssistant.settings.form.accessWarningTitle',
                  {
                    defaultMessage: 'You cannot save this provider right now',
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
              <EuiSpacer size='m' />
            </>
          )}
          {error && (
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
          {/* Only shown for a brand-new provider — an admin editing an existing one already
              knows how to fill this form in. CEO feedback was specifically that signing up an
              Anthropic key was confusing; this is the shortest possible map of the four steps. */}
          {!editingProvider && (
            <>
              <EuiCallOut
                size='s'
                iconType='iInCircle'
                title={i18n.translate(
                  'wazuhAiAssistant.settings.form.gettingStartedTitle',
                  { defaultMessage: 'Getting started' },
                )}
              >
                <p>
                  {i18n.translate(
                    'wazuhAiAssistant.settings.form.gettingStartedSteps',
                    {
                      defaultMessage:
                        '1. Pick a provider type. 2. Paste its API key. 3. Pick a model. ' +
                        '4. Test the connection.',
                    },
                  )}
                </p>
                <p>
                  {i18n.translate(
                    'wazuhAiAssistant.settings.form.gettingStartedTestCaveat',
                    {
                      defaultMessage:
                        'A green test confirms connection and key — it does not guarantee ' +
                        'every chat request will succeed.',
                    },
                  )}
                </p>
              </EuiCallOut>
              <EuiSpacer size='m' />
            </>
          )}
          <EuiForm component='div' className='wzProviderFlyout'>
            <EuiFormFieldset
              className='wzProviderFlyout__group'
              legend={{
                children: i18n.translate(
                  'wazuhAiAssistant.settings.form.providerTypeGroupLegend',
                  { defaultMessage: '1 Provider type' },
                ),
              }}
            >
              <EuiFlexGroup gutterSize='m' responsive={false}>
                {PROVIDER_TYPES.map(type => (
                  <EuiFlexItem key={type}>
                    <EuiCheckableCard
                      id={`wz-ai-provider-type-${type}`}
                      label={PROVIDER_TYPE_FORM_LABELS[type]}
                      name='wz-ai-provider-type'
                      value={type}
                      checkableType='radio'
                      checked={form.type === type}
                      onChange={() => handleTypeChange(type)}
                    />
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
              <EuiSpacer size='s' />
              <EuiText size='s' color='subdued'>
                <p>{PROVIDER_TYPE_DESCRIPTIONS[form.type]}</p>
              </EuiText>
            </EuiFormFieldset>

            <EuiFormFieldset
              className='wzProviderFlyout__group'
              legend={{
                children: i18n.translate(
                  'wazuhAiAssistant.settings.form.connectionGroupLegend',
                  { defaultMessage: '2 Connection' },
                ),
              }}
            >
              <EuiFlexGroup gutterSize='m' responsive={false}>
                <EuiFlexItem>
                  <EuiFormRow
                    id='wz-ai-provider-name'
                    label={
                      <RequiredLabel
                        label={i18n.translate(
                          'wazuhAiAssistant.settings.form.name',
                          { defaultMessage: 'Name' },
                        )}
                      />
                    }
                  >
                    <EuiFieldText
                      value={form.name}
                      aria-required='true'
                      onChange={event =>
                        setForm({ ...form, name: event.target.value })
                      }
                    />
                  </EuiFormRow>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiFormRow
                    id='wz-ai-provider-api-key'
                    label={i18n.translate(
                      'wazuhAiAssistant.settings.form.apiKey',
                      { defaultMessage: 'API key' },
                    )}
                    labelAppend={
                      editingProvider?.hasApiKey ? (
                        <EuiBadge color='hollow'>
                          {i18n.translate(
                            'wazuhAiAssistant.settings.form.apiKeyStoredBadge',
                            { defaultMessage: 'Key stored' },
                          )}
                        </EuiBadge>
                      ) : undefined
                    }
                    helpText={
                      <>
                        <p>
                          {editingProvider
                            ? i18n.translate(
                                'wazuhAiAssistant.settings.form.apiKeyHelpEditing',
                                {
                                  defaultMessage:
                                    'Leave empty to keep the current key. Optional for endpoints ' +
                                    "that don't require authentication (e.g. a local Ollama " +
                                    'server without auth) — stored encrypted at rest when an ' +
                                    'encryption key is configured.',
                                },
                              )
                            : i18n.translate(
                                'wazuhAiAssistant.settings.form.apiKeyHelpCreate',
                                {
                                  defaultMessage:
                                    "Optional for endpoints that don't require authentication " +
                                    '(e.g. a local Ollama server without auth) — stored encrypted ' +
                                    'at rest when an encryption key is configured.',
                                },
                              )}
                        </p>
                        <p>{apiKeyGuidance.help}</p>
                      </>
                    }
                  >
                    {/* Deliberately no `isInvalid` here: a shape mismatch is a non-blocking
                        warning (below), not a form error — a red-invalid field would read as
                        blocking even though Save stays enabled. */}
                    <EuiFieldPassword
                      type='dual'
                      value={form.apiKey}
                      onChange={event =>
                        setForm({ ...form, apiKey: event.target.value })
                      }
                    />
                  </EuiFormRow>
                </EuiFlexItem>
              </EuiFlexGroup>
              {/* Non-blocking: a shape mismatch never stops Save, it only flags a likely
                  copy/paste mistake before the admin hits an opaque "Test connection" failure.
                  `apiKeyShapeMismatch` is only ever true for a type with both a `keyPattern` and a
                  `shapeWarning` (currently just anthropic — see PROVIDER_API_KEY_GUIDANCE above),
                  so `shapeWarning` is guaranteed defined here. */}
              {apiKeyShapeMismatch && apiKeyGuidance.shapeWarning && (
                <>
                  <EuiSpacer size='xs' />
                  <EuiCallOut
                    size='s'
                    color='warning'
                    iconType='alert'
                    title={apiKeyGuidance.shapeWarning}
                  />
                </>
              )}
              <EuiSpacer size='m' />
              <EuiFormRow
                id='wz-ai-provider-base-url'
                label={
                  <RequiredLabel
                    label={i18n.translate(
                      'wazuhAiAssistant.settings.form.baseUrl',
                      { defaultMessage: 'Endpoint URL' },
                    )}
                  />
                }
                isInvalid={Boolean(baseUrlError)}
                error={baseUrlError}
                helpText={
                  <>
                    <EuiText
                      size='xs'
                      color='subdued'
                      id='wz-ai-provider-baseurl-examples-label'
                    >
                      <FormattedMessage
                        id='wazuhAiAssistant.settings.form.baseUrlExample'
                        defaultMessage='{header}:'
                        values={{
                          header:
                            urlGuidance.examples.length > 1
                              ? 'Examples'
                              : 'Example',
                        }}
                      />
                    </EuiText>
                    <EuiSpacer size='xs' />
                    <EuiFlexGroup
                      wrap
                      gutterSize='xs'
                      responsive={false}
                      role='group'
                      aria-labelledby='wz-ai-provider-baseurl-examples-label'
                    >
                      {urlGuidance.examples.map(example => (
                        <EuiFlexItem grow={false} key={example}>
                          <EuiBadge
                            color='hollow'
                            onClick={() => fillBaseUrl(example)}
                            onClickAriaLabel={i18n.translate(
                              'wazuhAiAssistant.settings.form.baseUrlExampleAriaLabel',
                              {
                                defaultMessage: 'Use endpoint {example}',
                                values: { example },
                              },
                            )}
                          >
                            {example}
                          </EuiBadge>
                        </EuiFlexItem>
                      ))}
                    </EuiFlexGroup>
                    <EuiSpacer size='xs' />
                    <DocsPopover
                      triggerLabel={i18n.translate(
                        'wazuhAiAssistant.settings.form.baseUrlDocsButton',
                        { defaultMessage: 'API documentation' },
                      )}
                      title={i18n.translate(
                        'wazuhAiAssistant.settings.form.baseUrlDocsTitle',
                        {
                          defaultMessage: 'API documentation',
                        },
                      )}
                      docs={urlGuidance.docs}
                      note={urlGuidance.note}
                    />
                  </>
                }
              >
                <EuiFieldText
                  value={form.baseUrl}
                  placeholder={urlGuidance.placeholder}
                  isInvalid={Boolean(baseUrlError)}
                  aria-required='true'
                  onChange={event => {
                    setForm({ ...form, baseUrl: event.target.value });
                    setBaseUrlTouched(true);
                    if (baseUrlError) {
                      setBaseUrlError(null);
                    }
                  }}
                />
              </EuiFormRow>
            </EuiFormFieldset>

            <EuiFormFieldset
              className='wzProviderFlyout__group'
              legend={{
                children: i18n.translate(
                  'wazuhAiAssistant.settings.form.modelGroupLegend',
                  { defaultMessage: '3 Model' },
                ),
              }}
            >
              <EuiFormRow
                id='wz-ai-provider-model'
                label={
                  <RequiredLabel
                    label={i18n.translate(
                      'wazuhAiAssistant.settings.form.model',
                      { defaultMessage: 'Model' },
                    )}
                  />
                }
                helpText={
                  <>
                    <EuiText
                      size='xs'
                      color='subdued'
                      id='wz-ai-provider-model-examples-label'
                    >
                      <FormattedMessage
                        id='wazuhAiAssistant.settings.form.modelExample'
                        defaultMessage='{header}:'
                        values={{
                          header:
                            modelGuidance.examples.length > 1
                              ? 'Examples'
                              : 'Example',
                        }}
                      />
                    </EuiText>
                    <EuiSpacer size='xs' />
                    <EuiFlexGroup
                      wrap
                      gutterSize='xs'
                      responsive={false}
                      role='group'
                      aria-labelledby='wz-ai-provider-model-examples-label'
                    >
                      {modelGuidance.examples.map(example => (
                        <EuiFlexItem grow={false} key={example}>
                          <EuiBadge
                            color='hollow'
                            onClick={() => fillModel(example)}
                            onClickAriaLabel={i18n.translate(
                              'wazuhAiAssistant.settings.form.modelExampleAriaLabel',
                              {
                                defaultMessage: 'Use model {example}',
                                values: { example },
                              },
                            )}
                          >
                            {example}
                          </EuiBadge>
                        </EuiFlexItem>
                      ))}
                    </EuiFlexGroup>
                    <EuiSpacer size='xs' />
                    <DocsPopover
                      triggerLabel={i18n.translate(
                        'wazuhAiAssistant.settings.form.modelDocsButton',
                        {
                          defaultMessage: 'See available models',
                        },
                      )}
                      title={i18n.translate(
                        'wazuhAiAssistant.settings.form.modelDocsTitle',
                        {
                          defaultMessage: 'Model documentation',
                        },
                      )}
                      docs={modelGuidance.docs}
                      note={modelGuidance.note}
                    />
                  </>
                }
              >
                <EuiFieldText
                  value={form.model}
                  aria-required='true'
                  onChange={event =>
                    setForm({ ...form, model: event.target.value })
                  }
                />
              </EuiFormRow>
              {/* Curated per-vendor suggestions, shown once the endpoint URL matches a known
                  vendor — clicking a chip fills the (still free-text) Model field. Kept outside
                  the EuiFormRow above for the same reason as the API key shape warning: EuiFormRow
                  clones its single child to inject a11y props, so it cannot take a sibling. */}
              {vendorModelSuggestions.length > 0 && (
                <>
                  <EuiSpacer size='xs' />
                  <EuiText
                    size='xs'
                    color='subdued'
                    id='wz-ai-provider-model-suggestions-label'
                  >
                    {i18n.translate(
                      'wazuhAiAssistant.settings.form.modelSuggestionsLabel',
                      { defaultMessage: 'Suggested models:' },
                    )}
                  </EuiText>
                  <EuiSpacer size='xs' />
                  <EuiFlexGroup
                    gutterSize='xs'
                    wrap
                    responsive={false}
                    role='group'
                    aria-labelledby='wz-ai-provider-model-suggestions-label'
                  >
                    {vendorModelSuggestions.map(suggestedModel => (
                      <EuiFlexItem key={suggestedModel} grow={false}>
                        <EuiBadge
                          color='hollow'
                          onClick={() => fillModel(suggestedModel)}
                          onClickAriaLabel={i18n.translate(
                            'wazuhAiAssistant.settings.form.modelSuggestionAriaLabel',
                            {
                              defaultMessage: 'Use model {suggestedModel}',
                              values: { suggestedModel },
                            },
                          )}
                        >
                          {suggestedModel}
                        </EuiBadge>
                      </EuiFlexItem>
                    ))}
                  </EuiFlexGroup>
                </>
              )}
            </EuiFormFieldset>

            <EuiSpacer size='m' />
            {/* The five-line tool-calling paragraph, moved verbatim (screen 4: "Guidance is a
                five-line paragraph") into its own warning callout so it reads as a caution rather
                than ordinary field help. The model name inside it is a clickable chip; the
                wording around it is untouched. */}
            <EuiCallOut
              size='s'
              color='warning'
              iconType='alert'
              title={i18n.translate(
                'wazuhAiAssistant.settings.form.toolCallingWarningTitle',
                { defaultMessage: 'Tool calling requirement' },
              )}
            >
              <p>
                <FormattedMessage
                  id='wazuhAiAssistant.settings.form.modelHelp'
                  defaultMessage={
                    'Tool calling needs a model with solid function-calling support ' +
                    '(e.g. {model}). The model must support tool (function) calling. ' +
                    'Models without tool support may fabricate answers instead of ' +
                    "failing visibly. Check your provider's model list for current " +
                    'availability, as models are periodically retired. A free-tier API ' +
                    "key with a low rate limit may fail regardless of the model's " +
                    'capability.'
                  }
                  values={{
                    model: (
                      <EuiBadge
                        color='hollow'
                        onClick={() => fillModel('gpt-4o')}
                        onClickAriaLabel={i18n.translate(
                          'wazuhAiAssistant.settings.form.toolCallingModelChipAriaLabel',
                          { defaultMessage: 'Use model gpt-4o' },
                        )}
                      >
                        GPT-4o
                      </EuiBadge>
                    ),
                  }}
                />
              </p>
            </EuiCallOut>

            {testOutcome && (
              <>
                <EuiSpacer size='m' />
                <EuiCallOut
                  size='s'
                  color={
                    testOutcome.status === 'ok'
                      ? 'success'
                      : testOutcome.status === 'failed'
                      ? 'danger'
                      : 'warning'
                  }
                  iconType={testOutcome.status === 'ok' ? 'check' : 'alert'}
                  title={
                    testOutcome.status === 'ok'
                      ? i18n.translate(
                          'wazuhAiAssistant.settings.form.testResultSuccessTitle',
                          {
                            defaultMessage:
                              'Connection test succeeded ({latencyMs} ms)',
                            values: { latencyMs: testOutcome.latencyMs },
                          },
                        )
                      : testOutcome.status === 'failed'
                      ? i18n.translate(
                          'wazuhAiAssistant.settings.form.testResultFailureTitle',
                          { defaultMessage: 'Connection test failed' },
                        )
                      : i18n.translate(
                          'wazuhAiAssistant.settings.form.testResultCouldNotVerifyTitle',
                          {
                            defaultMessage: 'Could not verify the connection',
                          },
                        )
                  }
                >
                  {testOutcome.status === 'ok' ? (
                    <p>
                      {i18n.translate(
                        'wazuhAiAssistant.settings.form.gettingStartedTestCaveat',
                        {
                          defaultMessage:
                            'A green test confirms connection and key — it does not guarantee ' +
                            'every chat request will succeed.',
                        },
                      )}
                    </p>
                  ) : (
                    <p>{testOutcome.message}</p>
                  )}
                </EuiCallOut>
              </>
            )}
          </EuiForm>
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          {testOutcome ? (
            // A result is already showing: the save happened, so there is nothing left to
            // Cancel — a single "Done" replaces the Cancel/Save & test pair.
            <EuiFlexGroup justifyContent='flexEnd' responsive={false}>
              <EuiFlexItem grow={false}>
                <EuiButton onClick={onClose} fill>
                  {i18n.translate('wazuhAiAssistant.settings.form.done', {
                    defaultMessage: 'Done',
                  })}
                </EuiButton>
              </EuiFlexItem>
            </EuiFlexGroup>
          ) : (
            <EuiFlexGroup justifyContent='spaceBetween'>
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty onClick={requestClose} flush='left'>
                  {i18n.translate('wazuhAiAssistant.settings.form.cancel', {
                    defaultMessage: 'Cancel',
                  })}
                </EuiButtonEmpty>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <EuiToolTip
                  content={
                    !canSave
                      ? accessMessage
                      : apiKeyBlockedByEncryption
                      ? i18n.translate(
                          'wazuhAiAssistant.settings.form.encryptionRequiredTooltip',
                          {
                            defaultMessage:
                              'An encryption key must be configured before an API key can be saved.',
                          },
                        )
                      : undefined
                  }
                >
                  <EuiButton
                    onClick={handleSave}
                    isDisabled={
                      !canSave || apiKeyBlockedByEncryption || isSaving
                    }
                    isLoading={isSaving}
                    fill
                  >
                    {i18n.translate(
                      'wazuhAiAssistant.settings.form.saveAndTest',
                      {
                        defaultMessage: 'Save & test',
                      },
                    )}
                  </EuiButton>
                </EuiToolTip>
              </EuiFlexItem>
            </EuiFlexGroup>
          )}
        </EuiFlyoutFooter>
      </EuiFlyout>
      {showCloseConfirm && (
        <EuiConfirmModal
          title={i18n.translate(
            'wazuhAiAssistant.settings.form.closeConfirmTitle',
            {
              defaultMessage: 'Unsubmitted changes',
            },
          )}
          onConfirm={keepEditing}
          onCancel={discardChanges}
          cancelButtonText={i18n.translate(
            'wazuhAiAssistant.settings.form.closeConfirmDiscard',
            {
              defaultMessage: 'Yes, do it',
            },
          )}
          confirmButtonText={i18n.translate(
            'wazuhAiAssistant.settings.form.closeConfirmKeep',
            {
              defaultMessage: "No, don't do it",
            },
          )}
        >
          <p style={{ textAlign: 'center' }}>
            {i18n.translate('wazuhAiAssistant.settings.form.closeConfirmBody', {
              defaultMessage:
                'There are unsaved changes. Are you sure you want to proceed?',
            })}
          </p>
        </EuiConfirmModal>
      )}
    </>
  );
};
