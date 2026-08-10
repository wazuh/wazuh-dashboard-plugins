import React, { useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
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
  EuiFormRow,
  EuiLink,
  EuiPopover,
  EuiPopoverTitle,
  EuiSelect,
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

const PROVIDER_TYPE_FORM_LABELS: Record<string, string> = {
  openai_compatible: i18n.translate(
    'wazuhAiAssistant.settings.type.openaiCompatible',
    {
      defaultMessage:
        'OpenAI-compatible (OpenAI, Gemini, Ollama, LM Studio, vLLM...)',
    },
  ),
  anthropic: i18n.translate('wazuhAiAssistant.settings.type.anthropic', {
    defaultMessage: 'Anthropic',
  }),
};

interface ProviderUrlDoc {
  label: string;
  url: string;
}

/** Note shown under the docs links for openai_compatible: that type's label (see
 * PROVIDER_TYPE_FORM_LABELS above) advertises more services (Gemini, LM Studio, vLLM...) than this
 * file has room to keep a maintained doc link for — pointing the admin at their own provider's
 * docs is more reliable than us trying to enumerate every compatible gateway. */
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
    examples: ['gpt-4o', 'gpt-4o-mini', 'openai/gpt-oss-120b'],
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
    examples: ['claude-sonnet-4-5', 'claude-opus-4-1'],
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
 * Server-required fields (Name, Provider type, Endpoint URL, Model — see the create/update
 * validators in server/routes/settings.ts) carried no visual or accessible "required" marker
 * (issue #8854, "Also noticed"), so only the one OPTIONAL field (API key) explained itself. A
 * plain trailing asterisk mirrors how the rest of this repo's forms already flag required
 * fields — no new visual language introduced.
 */
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

// Requires at least one character after the scheme so a bare `https://` (which the server
// round-trip would reject anyway) is caught here instead of only after a save attempt.
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
  onSubmit: (input: ProviderInput) => Promise<void>;
  onClose: () => void;
}

export const ProviderFormFlyout: React.FC<ProviderFormFlyoutProps> = ({
  editingProvider,
  error,
  canSave,
  accessMessage,
  apiKeyEncryptionEnabled,
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
  const urlGuidance = PROVIDER_URL_GUIDANCE[form.type];
  const modelGuidance = PROVIDER_MODEL_GUIDANCE[form.type];

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
    if (isDirty) {
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
        size='s'
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
            // Issue #8854, point 5: the disabled Save button's own EuiToolTip below carries the
            // same message, but a tooltip only reaches a mouse user who happens to hover the
            // greyed-out button — an admin who fills in the whole form and then wonders why Save
            // won't respond should not have to go looking for it. This callout is the
            // always-visible copy of that same explanation, inside the form the admin is actually
            // looking at (the page-level warning in settings-page.tsx sits behind this flyout
            // once it's open).
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
          <EuiForm component='div'>
            <EuiFormRow
              id='wz-ai-provider-name'
              label={
                <RequiredLabel
                  label={i18n.translate('wazuhAiAssistant.settings.form.name', {
                    defaultMessage: 'Name',
                  })}
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
            <EuiFormRow
              id='wz-ai-provider-type'
              label={
                <RequiredLabel
                  label={i18n.translate('wazuhAiAssistant.settings.form.type', {
                    defaultMessage: 'Provider type',
                  })}
                />
              }
            >
              <EuiSelect
                options={PROVIDER_TYPES.map(type => ({
                  value: type,
                  text: PROVIDER_TYPE_FORM_LABELS[type],
                }))}
                value={form.type}
                aria-required='true'
                onChange={event =>
                  setForm({
                    ...form,
                    type: event.target.value as ProviderInput['type'],
                  })
                }
              />
            </EuiFormRow>
            <EuiFormRow
              id='wz-ai-provider-base-url'
              label={
                <RequiredLabel
                  label={i18n.translate(
                    'wazuhAiAssistant.settings.form.baseUrl',
                    {
                      defaultMessage: 'Endpoint URL',
                    },
                  )}
                />
              }
              isInvalid={Boolean(baseUrlError)}
              error={baseUrlError}
              helpText={
                <>
                  <FormattedMessage
                    id='wazuhAiAssistant.settings.form.baseUrlExample'
                    defaultMessage='{header}: {example}'
                    values={{
                      header:
                        urlGuidance.examples.length > 1
                          ? 'Examples'
                          : 'Example',
                      example: <EuiCode>{urlGuidance.examples[0]}</EuiCode>,
                    }}
                  />
                  {urlGuidance.examples.slice(1).map(example => (
                    <React.Fragment key={example}>
                      {', '}
                      <EuiCode>{example}</EuiCode>
                    </React.Fragment>
                  ))}
                  {'. '}
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
                  if (baseUrlError) {
                    setBaseUrlError(null);
                  }
                }}
              />
            </EuiFormRow>
            <EuiFormRow
              id='wz-ai-provider-model'
              label={
                <RequiredLabel
                  label={i18n.translate(
                    'wazuhAiAssistant.settings.form.model',
                    {
                      defaultMessage: 'Model',
                    },
                  )}
                />
              }
              helpText={
                <>
                  {i18n.translate('wazuhAiAssistant.settings.form.modelHelp', {
                    defaultMessage:
                      'Tool calling needs a model with solid function-calling support ' +
                      '(e.g. GPT-4o, Claude Sonnet) — small or lightweight models often ' +
                      "fail. Check your provider's model list for current availability, " +
                      'as models are periodically retired. A free-tier API key with a ' +
                      "low rate limit may fail regardless of the model's capability.",
                  })}{' '}
                  <FormattedMessage
                    id='wazuhAiAssistant.settings.form.modelExample'
                    defaultMessage='{header}: {example}'
                    values={{
                      header:
                        modelGuidance.examples.length > 1
                          ? 'Examples'
                          : 'Example',
                      example: <EuiCode>{modelGuidance.examples[0]}</EuiCode>,
                    }}
                  />
                  {modelGuidance.examples.slice(1).map(example => (
                    <React.Fragment key={example}>
                      {', '}
                      <EuiCode>{example}</EuiCode>
                    </React.Fragment>
                  ))}
                  {'. '}
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
            <EuiFormRow
              id='wz-ai-provider-api-key'
              label={i18n.translate('wazuhAiAssistant.settings.form.apiKey', {
                defaultMessage: 'API key',
              })}
              // Issue #8854, point 4: the field itself is always blank on edit (the key is never
              // sent back to the browser — ProviderSummary redacts it to `hasApiKey`), which used
              // to read as "the key got deleted." The providers TABLE already shows "Configured"
              // for this same provider; this badge is that same fact, moved to where an admin who
              // opened the edit form would actually see it. Neutral (not success/warning) per the
              // linked Kibana precedent (elastic/kibana#80657) choosing plain text over an alarm
              // color after design review — this is informational, not a state to react to.
              labelAppend={
                editingProvider?.hasApiKey ? (
                  <EuiBadge color='hollow'>
                    {i18n.translate(
                      'wazuhAiAssistant.settings.form.apiKeyStoredBadge',
                      {
                        defaultMessage: 'Key stored',
                      },
                    )}
                  </EuiBadge>
                ) : undefined
              }
              helpText={
                <>
                  {editingProvider && (
                    <p>
                      {i18n.translate(
                        'wazuhAiAssistant.settings.form.apiKeyHelpLeaveBlank',
                        {
                          defaultMessage:
                            'Leave empty to keep the current key.',
                        },
                      )}
                    </p>
                  )}
                  <p>
                    {i18n.translate(
                      'wazuhAiAssistant.settings.form.apiKeyHelpOptional',
                      {
                        defaultMessage:
                          "Optional for endpoints that don't require authentication (e.g. a " +
                          'local Ollama server without auth) — stored encrypted at rest when ' +
                          'an encryption key is configured.',
                      },
                    )}
                  </p>
                </>
              }
            >
              <EuiFieldPassword
                type='dual'
                value={form.apiKey}
                onChange={event =>
                  setForm({ ...form, apiKey: event.target.value })
                }
              />
            </EuiFormRow>
          </EuiForm>
        </EuiFlyoutBody>
        <EuiFlyoutFooter>
          {/* Cancel-left/Save-right (issue #8854, "Also noticed": the two were reversed before)
              plus a dedicated EuiFlyoutFooter — previously Save/Cancel sat inline at the end of
              the form's own scrolling area, so on a tall form (the encryption callout, five
              fields, three doc popovers) both could scroll out of view entirely; the footer is
              pinned outside that scroll region. */}
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
                  isDisabled={!canSave || apiKeyBlockedByEncryption}
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
