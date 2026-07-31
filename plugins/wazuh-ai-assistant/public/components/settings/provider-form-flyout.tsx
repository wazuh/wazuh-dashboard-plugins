import React, { useState } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCode,
  EuiCodeBlock,
  EuiFieldPassword,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFlyout,
  EuiFlyoutBody,
  EuiFlyoutHeader,
  EuiForm,
  EuiFormRow,
  EuiSelect,
  EuiSpacer,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
import { FormattedMessage } from '@osd/i18n/react';
import { ProviderInput, ProviderSummary } from '../../../common/types';
import { PROVIDER_TYPES } from '../../../common/constants';

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

const emptyForm: ProviderInput = {
  name: '',
  type: 'openai_compatible',
  baseUrl: '',
  model: '',
  apiKey: '',
};

function isValidEndpointUrl(value: string): boolean {
  return /^https?:\/\//i.test(value.trim());
}

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
  const [form, setForm] = useState<ProviderInput>(() =>
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

  return (
    <EuiFlyout
      onClose={onClose}
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
            label={i18n.translate('wazuhAiAssistant.settings.form.name', {
              defaultMessage: 'Name',
            })}
          >
            <EuiFieldText
              value={form.name}
              onChange={event => setForm({ ...form, name: event.target.value })}
            />
          </EuiFormRow>
          <EuiFormRow
            id='wz-ai-provider-type'
            label={i18n.translate('wazuhAiAssistant.settings.form.type', {
              defaultMessage: 'Provider type',
            })}
          >
            <EuiSelect
              options={PROVIDER_TYPES.map(type => ({
                value: type,
                text: PROVIDER_TYPE_FORM_LABELS[type],
              }))}
              value={form.type}
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
            label={i18n.translate('wazuhAiAssistant.settings.form.baseUrl', {
              defaultMessage: 'Endpoint URL',
            })}
            isInvalid={Boolean(baseUrlError)}
            error={baseUrlError}
          >
            <EuiFieldText
              value={form.baseUrl}
              placeholder='https://api.openai.com/v1'
              isInvalid={Boolean(baseUrlError)}
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
            label={i18n.translate('wazuhAiAssistant.settings.form.model', {
              defaultMessage: 'Model',
            })}
            helpText={i18n.translate(
              'wazuhAiAssistant.settings.form.modelHelp',
              {
                defaultMessage:
                  'Tool calling needs a model with solid function-calling support. Known ' +
                  'good: GPT-4o or GPT-4o-mini (OpenAI), Claude Sonnet (Anthropic), ' +
                  'llama-3.3-70b-versatile (Groq). Small or base models often fail with ' +
                  'tool errors.',
              },
            )}
          >
            <EuiFieldText
              value={form.model}
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
            helpText={
              editingProvider
                ? i18n.translate('wazuhAiAssistant.settings.form.apiKeyHelp', {
                    defaultMessage: 'Leave empty to keep the current key.',
                  })
                : undefined
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
          <EuiSpacer size='m' />
          <EuiFlexGroup gutterSize='s'>
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
                  {i18n.translate('wazuhAiAssistant.settings.form.save', {
                    defaultMessage: 'Save',
                  })}
                </EuiButton>
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButtonEmpty onClick={onClose}>
                {i18n.translate('wazuhAiAssistant.settings.form.cancel', {
                  defaultMessage: 'Cancel',
                })}
              </EuiButtonEmpty>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiForm>
      </EuiFlyoutBody>
    </EuiFlyout>
  );
};
