import React, { useState } from 'react';
import './provider-form-flyout.scss';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCallOut,
  EuiCheckableCard,
  EuiCode,
  EuiCodeBlock,
  EuiComboBox,
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

/**
 * Provider names in this file are a support claim, not decoration: naming a service here sends an
 * admin off to configure it. Groq and "Bedrock-Mantle" used to appear in the card's description —
 * Groq was measured failing with a 413 across its whole tier, and Bedrock-Mantle is an internal
 * gateway name that does not belong in a product string. The enumeration now lives in the
 * description below (which has room for it) rather than in this label, which was wrapping to two
 * lines inside the card.
 */
const PROVIDER_TYPE_FORM_LABELS: Record<string, string> = {
  openai_compatible: i18n.translate(
    'wazuhAiAssistant.settings.type.openaiCompatible',
    {
      defaultMessage: 'OpenAI-compatible',
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
        'For hosted services such as OpenAI, Gemini or an AWS Bedrock gateway, and for local ' +
        'runtimes such as Ollama, LM Studio or vLLM. Any endpoint that exposes ' +
        '/chat/completions works.',
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
  {
    requirement: string;
    help: string;
    keyPattern?: RegExp;
    shapeWarning?: string;
  }
> = {
  anthropic: {
    requirement: i18n.translate(
      'wazuhAiAssistant.settings.form.apiKeyRequirementAnthropic',
      {
        defaultMessage:
          'Required. Stored encrypted at rest if an encryption key is configured.',
      },
    ),
    help: i18n.translate('wazuhAiAssistant.settings.form.apiKeyHelpAnthropic', {
      defaultMessage:
        'Create a key at console.anthropic.com, under API Keys. Anthropic keys start with sk-ant-.',
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
    requirement: i18n.translate(
      'wazuhAiAssistant.settings.form.apiKeyRequirementOpenaiCompatible',
      {
        defaultMessage:
          'Optional. A local endpoint without authentication, such as Ollama, needs no key. ' +
          'Stored encrypted at rest if an encryption key is configured.',
      },
    ),
    help: i18n.translate(
      'wazuhAiAssistant.settings.form.apiKeyHelpOpenaiCompatible',
      {
        defaultMessage:
          'Create a key in your provider console. OpenAI keys start with sk-, Groq keys with ' +
          'gsk_. Other gateways use their own format.',
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
    /**
     * One example per service the description names, each taken verbatim from that vendor's own
     * documentation rather than written from memory:
     *
     * - OpenAI      https://platform.openai.com/docs/api-reference
     * - Gemini      https://ai.google.dev/gemini-api/docs/openai (documented WITH a trailing
     *               slash; omitted here because `chatStream` calls `trimTrailingSlash(baseUrl)`
     *               before appending its own path, so the two are identical and the list stays
     *               visually consistent)
     * - Bedrock     https://docs.aws.amazon.com/bedrock/latest/userguide/inference-chat-completions-mantle.html
     *               (`bedrock-mantle` is AWS's own recommended endpoint; `{region}` is theirs to
     *               substitute, so a real region is shown rather than a placeholder token an
     *               admin might paste literally)
     * - Ollama      default port 11434 with its OpenAI-compatibility layer at /v1
     *
     * Groq's endpoint is deliberately NOT an example any more. Its documentation link below stays:
     * a link is reference for someone who has already chosen Groq, whereas an example is a
     * suggestion, and Groq was measured returning 413 across its whole tier.
     */
    examples: [
      'https://api.openai.com/v1',
      'https://generativelanguage.googleapis.com/v1beta/openai',
      'https://bedrock-mantle.us-east-1.api.aws/v1',
      'http://localhost:11434/v1',
    ],
    // One link per actual service this type covers — a single "OpenAI API reference" link would be
    // misleading for a Gemini/Bedrock/Ollama endpoint.
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
          'wazuhAiAssistant.settings.form.baseUrlDocsGemini',
          {
            defaultMessage: 'Gemini OpenAI compatibility',
          },
        ),
        url: 'https://ai.google.dev/gemini-api/docs/openai',
      },
      {
        label: i18n.translate(
          'wazuhAiAssistant.settings.form.baseUrlDocsBedrock',
          {
            defaultMessage: 'Amazon Bedrock Chat Completions',
          },
        ),
        url: 'https://docs.aws.amazon.com/bedrock/latest/userguide/inference-chat-completions-mantle.html',
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

/**
 * The four steps of the getting-started callout: one i18n message per step, so each is
 * translatable on its own and the numbering comes from the `<ol>` rather than from the copy. They
 * used to be a single message with "1. … 2. … 3. … 4. …" run together in one inline paragraph,
 * which is the shape a sequence should never take — it neither scans nor is announced as a list.
 */
const GETTING_STARTED_STEPS: string[] = [
  i18n.translate('wazuhAiAssistant.settings.form.gettingStartedStepType', {
    defaultMessage: 'Pick a provider type.',
  }),
  i18n.translate('wazuhAiAssistant.settings.form.gettingStartedStepKey', {
    defaultMessage: 'Paste its API key.',
  }),
  i18n.translate('wazuhAiAssistant.settings.form.gettingStartedStepModel', {
    defaultMessage: 'Pick a model.',
  }),
  i18n.translate('wazuhAiAssistant.settings.form.gettingStartedStepTest', {
    defaultMessage: 'Test the connection.',
  }),
];

/**
 * The form's ONE example-value chip. Four inline `EuiBadge` copies used to render this same idiom
 * across the form, which is how they drifted apart in the first place; TWO render sites are left
 * (the endpoint field's examples and the per-vendor model suggestions) now that the Model field's
 * generic per-type examples row is gone.
 *
 * Every value it ever shows is a URL or a model id, so it is set in the code face: the chip has to
 * read as a value you can click into the field, not as a label describing one. Clicking fills the
 * field (validated for non-secret values — credentials are never chipped anywhere in this form).
 * `onClickAriaLabel` is EUI's requirement for a clickable badge, so each caller passes the sentence
 * that fits its own field.
 */
const ExampleChip: React.FC<{
  value: string;
  onClickAriaLabel: string;
  onSelect: (value: string) => void;
}> = ({ value, onClickAriaLabel, onSelect }) => (
  <EuiBadge
    className='wzProviderFlyout__exampleChip'
    color='hollow'
    onClick={() => onSelect(value)}
    onClickAriaLabel={onClickAriaLabel}
  >
    <code>{value}</code>
  </EuiBadge>
);

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
          {/* Help-sized, like every other piece of guidance in this form — see
              `.wzProviderFlyout__help`, which restates EUI's own `.euiFormHelpText` values for the
              guidance blocks that sit outside an `EuiFormRow`'s `helpText` slot and therefore do
              not inherit it. Deliberately not a second `EuiText size` on this form. */}
          <div className='wzProviderFlyout__help'>{note}</div>
        </>
      )}
    </EuiPopover>
  );
};

interface ProviderFormFlyoutProps {
  editingProvider: ProviderSummary | null;
  error: string | null;
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
  // The model the tool-calling callout offers as its clickable example. Falls back only if a type
  // ever ships with no examples at all; every current type has some.
  const toolCallingExampleModel = modelGuidance.examples[0] ?? 'gpt-4o';
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
  // Feeds both the "Suggested models:" chips and the Model EuiComboBox's dropdown `options`.
  //
  // No deduplication any more: this list used to be filtered against `modelGuidance.examples`,
  // because an id curated in BOTH tables (Anthropic's claude-opus-4-8 is in each) rendered as two
  // identical chips under two different headings. With the generic "Examples:" row gone (see the
  // Model field below) there is nothing left to collide with — and keeping the filter would now do
  // real damage, silently hiding the vendor's own primary model from the only list that still
  // offers it.
  const modelOptions = vendorModelSuggestions.map(model => ({ label: model }));
  const selectedModelOption = form.model ? [{ label: form.model }] : [];

  const fillBaseUrl = (value: string) => {
    setForm({ ...form, baseUrl: value });
    setBaseUrlTouched(true);
    if (baseUrlError) {
      setBaseUrlError(null);
    }
  };

  const fillModel = (value: string) => setForm({ ...form, model: value });

  const handleModelChange = (selected: Array<{ label: string }>) => {
    fillModel(selected[0]?.label ?? '');
  };

  // Any model id must remain typeable even when it is not (or no longer) in the suggestion
  // lists above — vendors retire/rename models faster than a curated list can track. Returning
  // `false` for a blank search rejects the create (nothing to commit); any other return lets
  // EuiComboBox commit the typed value, which `fillModel` reflects back as the field's value.
  const handleModelCreateOption = (searchValue: string): boolean | void => {
    const trimmed = searchValue.trim();
    if (!trimmed) {
      return false;
    }
    fillModel(trimmed);
  };

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
        // 640px on top of `size='m'` (audit §5.1). `m` resolved to 960px in this build while the
        // form inside it was 400 wide — EUI caps a form control at 400px — so the flyout's right
        // half was 500px of nothing, on the one surface the audit called genuinely too empty. The
        // column below is now a single tight stack and everything in it terminates on the same
        // edge; `size` stays as the smaller-viewport behaviour (`maxWidth` is a cap, not a width).
        maxWidth={640}
        className='wzProviderFlyoutPanel'
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
                {/* A real ordered list, not four sentences run together in one paragraph: the
                    numbers come from the `<ol>`, so they stay correct under translation and the
                    steps scan as a sequence. `EuiCallOut` already wraps its children in `EuiText`,
                    which is what supplies the list styling. The caveat sentence that used to close
                    this callout ("a green test confirms connection and key…") is gone: hedging the
                    Test button before the admin has filled anything in was noise on the one
                    surface that has to feel simple. */}
                <ol className='wzProviderFlyout__steps'>
                  {GETTING_STARTED_STEPS.map(step => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
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
                    >
                      {/* The type's description lives INSIDE its own card (audit §5.6) and is
                          rendered on BOTH cards, not only the selected one: a selected-only
                          description made the pair visibly unequal (design review: "trataría de
                          que cada caja ocupe lo mismo") — the selected card grew around its text
                          while the other stayed short, because EuiFlexGroup stretches its flex
                          ITEMS but EuiCheckableCard does not fill its item. Symmetric content
                          plus the card's own height rule (scss) keeps the two boxes level no
                          matter which is selected (rulebook D21). */}
                      <EuiText size='s' color='subdued'>
                        <p>{PROVIDER_TYPE_DESCRIPTIONS[type]}</p>
                      </EuiText>
                    </EuiCheckableCard>
                  </EuiFlexItem>
                ))}
              </EuiFlexGroup>
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
              {/* One COLUMN, not two (audit §5.1): the API key field follows Name in the flow
                  instead of sitting beside it. Side by side, each field was half of a control EUI
                  already caps at 400px, and the API key's two-paragraph help text sat level with
                  the Name field's blank space — the shape that produced a 960px flyout holding a
                  400px form. `direction='column'` rather than unwrapping the group entirely so the
                  two rows keep one owner for the gap between them. */}
              <EuiFlexGroup
                direction='column'
                gutterSize='m'
                responsive={false}
              >
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
                        {/* Editing shares one line across both types (the only thing that matters
                            then is that an empty field keeps the stored key); creating takes the
                            per-type line, because "optional" is true for openai_compatible and
                            false for anthropic, and the old shared copy told an admin adding a
                            Claude provider that the key was optional and cited Ollama at them. */}
                        <p>
                          {editingProvider
                            ? i18n.translate(
                                'wazuhAiAssistant.settings.form.apiKeyHelpEditing',
                                {
                                  defaultMessage:
                                    'Leave empty to keep the current key. Stored encrypted at ' +
                                    'rest if an encryption key is configured.',
                                },
                              )
                            : apiKeyGuidance.requirement}
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
                    {/* A plain element, so it takes the `helpText` slot's own
                        `.euiFormHelpText` size and color. It used to be an `EuiText size='xs'`,
                        which produced the same visual size by a second, independent mechanism —
                        the kind of near-miss that made this form read as sloppy. */}
                    <div id='wz-ai-provider-baseurl-examples-label'>
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
                    </div>
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
                          <ExampleChip
                            value={example}
                            onSelect={fillBaseUrl}
                            onClickAriaLabel={i18n.translate(
                              'wazuhAiAssistant.settings.form.baseUrlExampleAriaLabel',
                              {
                                defaultMessage: 'Use endpoint {example}',
                                values: { example },
                              },
                            )}
                          />
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
                // No generic "Examples:" chip row here any more (Miguel + UX decision, recorded in
                // the audit's own "additional decided items"): the two ids it offered were
                // Bedrock-gateway model names, i.e. valid for exactly one of the many services this
                // provider type covers, and they were shown on every endpoint — including one whose
                // own vendor suggestions were listed 20px below under a second heading. What
                // remains is everything that is actually keyed to the admin's endpoint: the combo
                // box's own suggestions, the "Suggested models:" chips, and the vendor's model list
                // behind the link below. The endpoint field keeps its examples, because there an
                // example is the fastest way to recognise the shape of the value being asked for.
                helpText={
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
                }
              >
                <EuiComboBox
                  placeholder={i18n.translate(
                    'wazuhAiAssistant.settings.form.modelPlaceholder',
                    {
                      defaultMessage: 'Pick a suggestion or type any model id',
                    },
                  )}
                  // `asPlainText` keeps this looking and behaving like the free-text field it
                  // replaces (no removable "pill" for the single selected value) — the model id
                  // must stay directly editable, since vendor suggestion lists go stale as models
                  // are retired (screen 4 EUI mapping: "EuiComboBox singleSelection
                  // customOptionText").
                  singleSelection={{ asPlainText: true }}
                  options={modelOptions}
                  selectedOptions={selectedModelOption}
                  onChange={handleModelChange}
                  onCreateOption={handleModelCreateOption}
                  customOptionText={i18n.translate(
                    'wazuhAiAssistant.settings.form.modelCustomOptionText',
                    {
                      // The literal "{searchValue}" token has to survive i18n and reach
                      // EuiComboBox, which does its own plain-string substitution of it. ICU
                      // apostrophe-escaping does NOT achieve that here — @osd/i18n's formatter
                      // parses '{searchValue}' as a real placeholder and throws "context variable
                      // not provided", which crashes the whole flyout. Passing the token as a
                      // VALUE is the portable way: i18n substitutes {token}, and what lands in the
                      // output is the brace form EUI expects.
                      defaultMessage: 'Add {token} as a custom model',
                      values: { token: '{searchValue}' },
                    },
                  )}
                />
              </EuiFormRow>
              {/* Curated per-vendor suggestions, shown once the endpoint URL matches a known
                  vendor — clicking a chip fills the model (still freely re-typeable in the
                  EuiComboBox above). Kept outside the EuiFormRow above for the same reason as the
                  API key shape warning: EuiFormRow clones its single child to inject a11y props,
                  so it cannot take a sibling. These are now the field's ONLY chips (the generic
                  per-type "Examples:" row is gone), so the list is used raw — see
                  `modelOptions` above for why the dedupe went with it. */}
              {vendorModelSuggestions.length > 0 && (
                <>
                  <EuiSpacer size='xs' />
                  {/* This block sits OUTSIDE the EuiFormRow above (see the comment there), so it
                      cannot inherit the `helpText` slot's styling — `.wzProviderFlyout__help`
                      restates EUI's own `.euiFormHelpText` values so it matches the examples label
                      one field up pixel for pixel. */}
                  <div
                    className='wzProviderFlyout__help'
                    id='wz-ai-provider-model-suggestions-label'
                  >
                    {i18n.translate(
                      'wazuhAiAssistant.settings.form.modelSuggestionsLabel',
                      { defaultMessage: 'Suggested models:' },
                    )}
                  </div>
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
                        <ExampleChip
                          value={suggestedModel}
                          onSelect={fillModel}
                          onClickAriaLabel={i18n.translate(
                            'wazuhAiAssistant.settings.form.modelSuggestionAriaLabel',
                            {
                              defaultMessage: 'Use model {suggestedModel}',
                              values: { suggestedModel },
                            },
                          )}
                        />
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
                    // The example follows the SELECTED provider type. It used to be a hardcoded
                    // `gpt-4o`, so an admin configuring Claude was shown a GPT model as the
                    // tool-calling example and one click filled the Model field with a value that
                    // provider cannot serve. `modelGuidance.examples` is the same per-type list
                    // the Examples chips two fields above already use.
                    //
                    // Rendered as plain inline code, NOT as an `ExampleChip`: this one is
                    // illustrative prose ("a model like this one"), and the very same id is already
                    // offered as a real fill-on-click chip under the Model field. A chip here looked
                    // identical to those but sat mid-sentence inside a warning, so it advertised an
                    // action where the surrounding text was only naming an example.
                    model: (
                      <code className='wzProviderFlyout__inlineValue'>
                        {toolCallingExampleModel}
                      </code>
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
                  {/* Success needs no body: the title already carries the latency, which is the
                      whole result. Only a failure has something more to say. */}
                  {testOutcome.status !== 'ok' && <p>{testOutcome.message}</p>}
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
                    apiKeyBlockedByEncryption
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
                    isDisabled={apiKeyBlockedByEncryption || isSaving}
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
