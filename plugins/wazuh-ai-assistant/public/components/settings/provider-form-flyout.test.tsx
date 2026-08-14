import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ProviderFormFlyout } from './provider-form-flyout';
import { ProviderSummary } from '../../../common/types';

/**
 * The model field is an `EuiComboBox`, so the CURRENT selection is not the input's `value` — with
 * `singleSelection={{ asPlainText: true }}` EUI renders it as a plain-text pill beside the search
 * input, which keeps its own (usually empty) value. Reading the input would therefore report "no
 * model" for a provider that plainly shows one, so these assertions read the selection where it
 * actually lives.
 */
function selectedModel(): string {
  const input = document.querySelector('[data-test-subj="comboBoxInput"]');
  return input?.textContent?.trim() ?? '';
}

const baseProps = {
  editingProvider: null,
  error: null,
  apiKeyEncryptionEnabled: true,
  onSubmit: jest.fn().mockResolvedValue(undefined),
  onClose: jest.fn(),
};

const editingProvider: ProviderSummary = {
  id: 'p1',
  name: 'My OpenAI',
  type: 'openai_compatible',
  baseUrl: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  hasApiKey: true,
  isDefault: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('ProviderFormFlyout — create mode', () => {
  it('shows the Add provider title and empty fields', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    expect(
      screen.getByRole('heading', { name: /add provider/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toHaveValue('');
  });

  it('states the key requirement for the SELECTED provider type, not one line for both', () => {
    // One shared line used to serve both types, so an admin adding a Claude provider was told the
    // key was "optional for endpoints that don't require authentication (e.g. a local Ollama
    // server without auth)": three claims, none of them true of Anthropic, on the very form the
    // CEO already found confusing to sign an Anthropic key up on.
    render(<ProviderFormFlyout {...baseProps} />);

    // openai_compatible is the default selection: optional, and Ollama is a real example here.
    expect(screen.getByText(/^Optional\./)).toBeInTheDocument();
    expect(screen.getByText(/stored encrypted at rest/i)).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));

    expect(screen.getByText(/^Required\./)).toBeInTheDocument();
    expect(screen.queryByText(/^Optional\./)).toBeNull();
    // Matched on a phrase unique to the requirement line: a bare /Ollama/ would also hit the
    // openai_compatible TYPE CARD's own label, which stays on screen in both selections.
    expect(screen.queryByText(/such as Ollama, needs no key/i)).toBeNull();
    expect(screen.getByText(/stored encrypted at rest/i)).toBeInTheDocument();
  });

  it('blocks submit and shows an error when the endpoint URL is invalid', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'not-a-url' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

    expect(
      await screen.findByText(/valid URL starting with http/i),
    ).toBeInTheDocument();
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it('submits trimmed values', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/^name/i), {
      target: { value: '  Groq  ' },
    });
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: ' https://api.groq.com/openai/v1 ' },
    });
    const modelField = screen.getByLabelText(/^model/i);
    fireEvent.change(modelField, {
      target: { value: 'llama-3.3-70b-versatile' },
    });
    // The Model field is now an EuiComboBox (customOptionText): typing a value not in the
    // suggestion list needs Enter to commit it as a custom option, same as any combobox.
    fireEvent.keyDown(modelField, { key: 'Enter', code: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

    await waitFor(() => {
      expect(baseProps.onSubmit).toHaveBeenCalledWith({
        name: 'Groq',
        type: 'openai_compatible',
        baseUrl: 'https://api.groq.com/openai/v1',
        model: 'llama-3.3-70b-versatile',
        apiKey: '',
      });
    });
  });

  it('calls onClose when Cancel is clicked', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(baseProps.onClose).toHaveBeenCalled();
  });
});

describe('ProviderFormFlyout — edit mode', () => {
  it('shows the Edit provider title, prefills fields and keeps the API key empty', () => {
    render(
      <ProviderFormFlyout {...baseProps} editingProvider={editingProvider} />,
    );

    expect(
      screen.getByRole('heading', { name: /edit provider/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^name/i)).toHaveValue('My OpenAI');
    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://api.openai.com/v1',
    );
    expect(selectedModel()).toBe('gpt-4o');
    expect(
      screen.getByText(/leave empty to keep the current key/i),
    ).toBeInTheDocument();
  });
});

describe('ProviderFormFlyout — submit error', () => {
  it('renders the parent-reported error inside the flyout', () => {
    render(
      <ProviderFormFlyout
        {...baseProps}
        error='Could not save the provider.'
      />,
    );

    expect(
      screen.getByText('Could not save the provider.'),
    ).toBeInTheDocument();
  });
});

describe('ProviderFormFlyout — unsaved changes confirmation', () => {
  const dirtyTheForm = () => {
    fireEvent.change(screen.getByLabelText(/^name/i), {
      target: { value: 'Draft name' },
    });
  };

  it('asks for confirmation instead of closing when a field was modified', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    dirtyTheForm();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.getByText(/unsubmitted changes/i)).toBeInTheDocument();
    expect(baseProps.onClose).not.toHaveBeenCalled();
  });

  it('discards the changes and closes on an explicit "Yes, do it"', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    dirtyTheForm();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, do it/i }));

    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('keeps the flyout and the typed values on "No, don\'t do it"', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    dirtyTheForm();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /no, don't do it/i }));

    expect(screen.queryByText(/unsubmitted changes/i)).not.toBeInTheDocument();
    expect(baseProps.onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText(/^name/i)).toHaveValue('Draft name');
  });

  it('closes directly again once edits are reverted to the initial values', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    dirtyTheForm();
    fireEvent.change(screen.getByLabelText(/^name/i), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(baseProps.onClose).toHaveBeenCalled();
    expect(screen.queryByText(/unsubmitted changes/i)).not.toBeInTheDocument();
  });

  it('guards the flyout close button (X) too, in edit mode', () => {
    render(
      <ProviderFormFlyout {...baseProps} editingProvider={editingProvider} />,
    );

    const modelField = screen.getByLabelText(/^model/i);
    fireEvent.change(modelField, {
      target: { value: 'gpt-4.1' },
    });
    // The Model field is now an EuiComboBox (customOptionText): typing a value not in the
    // suggestion list needs Enter to commit it as a custom option, same as any combobox.
    fireEvent.keyDown(modelField, { key: 'Enter', code: 'Enter' });
    fireEvent.click(
      document.querySelector(
        '[data-test-subj="euiFlyoutCloseButton"]',
      ) as Element,
    );

    expect(screen.getByText(/unsubmitted changes/i)).toBeInTheDocument();
    expect(baseProps.onClose).not.toHaveBeenCalled();
  });
});

describe('ProviderFormFlyout — API key encryption gate', () => {
  it('shows the encryption-required callout when encryption is disabled', () => {
    render(
      <ProviderFormFlyout {...baseProps} apiKeyEncryptionEnabled={false} />,
    );

    expect(
      screen.getByText(/an encryption key is required to save api keys/i),
    ).toBeInTheDocument();
  });

  it('disables Save only while an API key is typed without encryption', () => {
    render(
      <ProviderFormFlyout {...baseProps} apiKeyEncryptionEnabled={false} />,
    );

    const saveButton = screen.getByRole('button', { name: /save & test/i });
    expect(saveButton).toBeEnabled();

    fireEvent.change(screen.getByLabelText(/^api key$/i), {
      target: { value: 'sk-secret' },
    });
    expect(saveButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^api key$/i), {
      target: { value: '' },
    });
    expect(saveButton).toBeEnabled();
  });

  it('does not gate Save while the probe is pending (null)', () => {
    render(
      <ProviderFormFlyout {...baseProps} apiKeyEncryptionEnabled={null} />,
    );

    fireEvent.change(screen.getByLabelText(/^api key$/i), {
      target: { value: 'sk-secret' },
    });
    expect(screen.getByRole('button', { name: /save & test/i })).toBeEnabled();
  });
});

describe('ProviderFormFlyout — endpoint URL guidance', () => {
  it('shows an OpenAI placeholder/example, with one docs link per covered service behind the documentation popover, by default (openai_compatible)', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

    expect(screen.getByLabelText(/endpoint url/i)).toHaveAttribute(
      'placeholder',
      'https://api.openai.com/v1',
    );
    expect(
      screen.queryByRole('link', { name: /openai api reference/i }),
    ).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: /^api documentation$/i }),
    );

    expect(
      await screen.findByRole('link', { name: /openai api reference/i }),
    ).toHaveAttribute('href', 'https://platform.openai.com/docs/api-reference');
    expect(
      screen.getByRole('link', { name: /groq api reference/i }),
    ).toHaveAttribute('href', 'https://console.groq.com/docs/api-reference');
    expect(
      screen.getByRole('link', { name: /ollama api reference/i }),
    ).toHaveAttribute(
      'href',
      'https://github.com/ollama/ollama/blob/main/docs/api.md',
    );
    expect(
      screen.getByText(/using another openai-compatible provider or gateway/i),
    ).toBeInTheDocument();
  });

  it('switches to the Anthropic placeholder/example and docs link when the provider type changes', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveAttribute(
      'placeholder',
      'https://api.anthropic.com',
    );

    fireEvent.click(
      screen.getByRole('button', { name: /^api documentation$/i }),
    );

    expect(
      await screen.findByRole('link', { name: /anthropic api reference/i }),
    ).toHaveAttribute('href', 'https://docs.anthropic.com/en/api/overview');
    expect(
      screen.queryByRole('link', { name: /groq api reference/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        /using another openai-compatible provider or gateway/i,
      ),
    ).not.toBeInTheDocument();
  });
});

describe('ProviderFormFlyout — Anthropic onboarding clarity', () => {
  it('labels the type options self-explanatorily and describes each one', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    expect(screen.getByLabelText(/anthropic \(claude\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /for hosted services such as openai, gemini or an aws bedrock gateway/i,
      ),
    ).toBeInTheDocument();
  });

  it('prefills the Anthropic base URL when switching type while the field is untouched', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://api.anthropic.com',
    );
  });

  it('does not overwrite an endpoint URL the admin already typed', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://my-custom-gateway.example.com' },
    });
    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://my-custom-gateway.example.com',
    );
  });

  it('does not prefill the base URL for an existing provider being edited', () => {
    render(
      <ProviderFormFlyout {...baseProps} editingProvider={editingProvider} />,
    );

    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://api.openai.com/v1',
    );
  });

  it('shows where to create an Anthropic key and its expected shape under the API key field', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));

    expect(
      screen.getByText(/console\.anthropic\.com, under api keys/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/sk-ant-/)).toBeInTheDocument();
  });

  it('shows a non-blocking warning when the key shape does not match the Anthropic type', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));
    fireEvent.change(screen.getByLabelText(/^api key$/i), {
      target: { value: 'sk-not-anthropic-shaped' },
    });

    expect(
      screen.getByText(/doesn't look like an anthropic key/i),
    ).toBeInTheDocument();
    // Non-blocking: Save must stay enabled despite the shape warning.
    expect(
      screen.getByRole('button', { name: /^save & test$/i }),
    ).toBeEnabled();
  });

  it('shows no shape warning for a well-formed Anthropic key', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));
    fireEvent.change(screen.getByLabelText(/^api key$/i), {
      target: { value: 'sk-ant-abc123' },
    });

    expect(
      screen.queryByText(/doesn't look like an anthropic key/i),
    ).not.toBeInTheDocument();
  });

  it('never marks the API key field itself as invalid (warning stays non-blocking)', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));
    fireEvent.change(screen.getByLabelText(/^api key$/i), {
      target: { value: 'not-anthropic-shaped-at-all' },
    });

    // A shape mismatch must surface only as the warning EuiCallOut above, never as a red-invalid
    // field — that would read as a blocking error to an admin even though Save stays enabled.
    expect(screen.getByLabelText(/^api key$/i)).not.toHaveAttribute(
      'aria-invalid',
      'true',
    );
  });

  it('does not warn on a Groq-shaped key for the openai_compatible type', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    // openai_compatible covers OpenAI, Groq, Bedrock-Mantle and auth-free Ollama — there is no
    // single key shape to check, so a Groq key (gsk_...) must never trigger the warning meant
    // for Anthropic's sk-ant- shape.
    fireEvent.change(screen.getByLabelText(/^api key$/i), {
      target: { value: 'gsk_totally-valid-groq-key' },
    });

    expect(screen.queryByText(/doesn't look like/i)).not.toBeInTheDocument();
  });

  it('clears an untouched Anthropic prefill when switching to another type', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));
    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://api.anthropic.com',
    );

    fireEvent.click(screen.getByLabelText(/openai-compatible/i));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue('');
  });

  it('keeps an admin-typed Anthropic URL when switching away from anthropic', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));
    // A value the admin actually TYPED must survive the switch. Note it must differ from the
    // prefill already in the field: React deduplicates controlled-input change events whose
    // value is identical to the current one, so firing a change with the prefill's own value
    // dispatches nothing at all -- no onChange, no touched flag, no user action to preserve.
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://claude.internal-proxy.example' },
    });

    fireEvent.click(screen.getByLabelText(/openai-compatible/i));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://claude.internal-proxy.example',
    );
  });
});

describe('ProviderFormFlyout — getting-started onboarding', () => {
  it('shows a numbered getting-started hint for a new provider, not when editing', () => {
    const { rerender } = render(<ProviderFormFlyout {...baseProps} />);
    expect(screen.getByText(/getting started/i)).toBeInTheDocument();

    rerender(
      <ProviderFormFlyout {...baseProps} editingProvider={editingProvider} />,
    );
    expect(screen.queryByText(/getting started/i)).not.toBeInTheDocument();
  });
});

describe('ProviderFormFlyout — model help text does not recommend retiring models', () => {
  it('does not recommend llama-3.3-70b-versatile or llama-3.1-8b-instant', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    const helpText = screen.getByText(
      /tool calling needs a model with solid function-calling support/i,
    );

    expect(helpText.textContent).not.toMatch(/llama-3\.3-70b-versatile/);
    expect(helpText.textContent).not.toMatch(/llama-3\.1-8b-instant/);
    // The example follows the selected provider type rather than being a fixed GPT-4o, which is
    // what this line used to assert — see the per-type example test above.
    expect(helpText.textContent).toMatch(/openai\.gpt-oss-120b/);
    expect(helpText.textContent).not.toMatch(
      /small or base models often fail/i,
    );
  });

  it('does not offer llama-3.3-70b-versatile as a model example chip', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    expect(
      screen.queryByText(/^llama-3\.3-70b-versatile$/),
    ).not.toBeInTheDocument();
    // Anchored to the CHIP specifically — it renders inside the examples' own role="group" row.
    const chips = screen
      .getAllByText(/^openai\.gpt-oss-120b$/)
      .filter(node => node.closest('[role="group"]'));
    expect(chips.length).toBeGreaterThan(0);
  });
});

describe('ProviderFormFlyout — Model field guidance', () => {
  it('shows OpenAI-compatible model examples and one docs link per covered service by default', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

    // Anchored to the example CHIP's own <code>.
    expect(
      screen
        .getAllByText(/^mistral\.mistral-large-3-675b-instruct$/i)
        .filter(node => node.closest('[role="group"]')).length,
    ).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole('button', { name: /^see available models$/i }),
    );

    expect(
      await screen.findByRole('link', { name: /openai model list/i }),
    ).toHaveAttribute('href', 'https://platform.openai.com/docs/models');
    expect(
      screen.getByRole('link', { name: /groq model list/i }),
    ).toHaveAttribute('href', 'https://console.groq.com/docs/models');
    expect(
      screen.getByRole('link', { name: /ollama model library/i }),
    ).toHaveAttribute('href', 'https://ollama.com/library');
    expect(
      screen.getByText(/using another openai-compatible provider or gateway/i),
    ).toBeInTheDocument();
  });

  it('switches to Anthropic model examples and docs link when the provider type changes', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));
    // No auto-prefill of the endpoint URL on type switch here -- type the Anthropic endpoint
    // explicitly so the curated model-suggestion chips (keyed off the base URL) surface below.
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.anthropic.com' },
    });

    // Anchored to the example CHIP's own <code>: an unanchored getByText would match both the
    // chip and the plain-text model example rendered elsewhere on the form.
    expect(
      screen
        .getAllByText(/^claude-opus-4-8$/i)
        .filter(node => node.closest('[role="group"]')).length,
    ).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole('button', { name: /^see available models$/i }),
    );

    expect(
      await screen.findByRole('link', { name: /anthropic model list/i }),
    ).toHaveAttribute(
      'href',
      'https://docs.anthropic.com/en/docs/about-claude/models/overview',
    );
    expect(
      screen.queryByRole('link', { name: /groq model list/i }),
    ).not.toBeInTheDocument();
  });
});

describe('ProviderFormFlyout — type label and tool-support copy corrections', () => {
  it('names only providers this build actually supports, and separates hosted from local', () => {
    // Naming a service here is a support claim: it sends an admin off to configure it.
    //
    // This assertion previously required that Gemini NOT be named, from a time when Gemini's
    // OpenAI-compatible endpoint 400'd on every tool round-trip ("Function call is missing a
    // thought_signature"). That adapter fix has since landed — `vendorExtras` round-trips in
    // server/providers/openai-compatible.ts, common/types.ts and both route schemas — so the
    // reason for excluding it is gone and it is named again.
    //
    // Groq goes the other way: it was named as a recommended example and was measured returning
    // 413 across its whole tier, so the UI was sending admins to a provider we knew failed.
    // "Bedrock-Mantle" is an internal gateway name that should never have shipped in a product
    // string.
    render(<ProviderFormFlyout {...baseProps} />);

    const label = screen.getByLabelText(/openai-compatible/i);
    expect(label).toBeInTheDocument();

    const description = screen.getByText(/any endpoint that exposes/i);
    expect(description).toHaveTextContent(/OpenAI/);
    expect(description).toHaveTextContent(/Gemini/);
    expect(description).toHaveTextContent(/AWS Bedrock gateway/);
    // Hosted services and local runtimes are called out as different things, rather than run
    // together in one comma list where "Ollama" reads like a service you sign up for.
    expect(description).toHaveTextContent(/local runtimes/i);
    expect(description).toHaveTextContent(/Ollama/);

    // Scoped to the RECOMMENDATION, not the whole form. Groq is still named in the key-shape hint
    // ("Groq keys with gsk_") and in two documentation links, and that is deliberate: those are
    // reference for someone who has already chosen Groq, not an invitation to choose it. The 413
    // finding was measured on one tier with tool-heavy prompts, which is enough to stop leading
    // with it and not enough to erase it.
    expect(description).not.toHaveTextContent(/Groq/);
    expect(description).not.toHaveTextContent(/Bedrock-Mantle/);
    expect(screen.queryByText(/Bedrock-Mantle/)).toBeNull();
  });

  it('offers a tool-calling example model the SELECTED provider can actually serve', () => {
    // The callout's example was a hardcoded `gpt-4o` chip, shown on every provider type — so an
    // admin configuring Claude was told GPT-4o was the kind of model to use, and one click filled
    // the Model field with a value Anthropic cannot serve. The per-type example list two fields
    // above already had the right answer.
    render(<ProviderFormFlyout {...baseProps} />);
    const callout = screen
      .getByText(/tool calling needs a model/i)
      .closest('.euiCallOut') as HTMLElement;
    expect(callout).toHaveTextContent('openai.gpt-oss-120b');

    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));

    const anthropicCallout = screen
      .getByText(/tool calling needs a model/i)
      .closest('.euiCallOut') as HTMLElement;
    expect(anthropicCallout).toHaveTextContent('claude-opus-4-8');
    expect(anthropicCallout).not.toHaveTextContent(/gpt-4o/i);
  });

  it('requires tool-calling support and warns about fabricated answers, without naming Claude Sonnet', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    expect(
      screen.getByText(/the model must support tool \(function\) calling/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /models without tool support may fabricate answers instead of failing visibly/i,
      ),
    ).toBeInTheDocument();

    const helpText = screen.getByText(
      /tool calling needs a model with solid function-calling support/i,
    );
    expect(helpText.textContent).not.toMatch(/claude sonnet/i);
  });

  it('caveats that a green test does not guarantee every chat request will succeed', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    expect(
      screen.getByText(
        /a green test confirms connection and key — it does not guarantee every chat request will succeed/i,
      ),
    ).toBeInTheDocument();
  });
});

describe('ProviderFormFlyout — curated per-vendor model suggestions', () => {
  it('shows no suggestion chips for an unrecognized endpoint URL', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://my-custom-gateway.example.com' },
    });

    expect(screen.queryByText('claude-opus-4-8')).not.toBeInTheDocument();
  });

  it('suggests Anthropic models for api.anthropic.com on the anthropic type and fills the model field on click', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    // Suggestions are gated by provider type: api.anthropic.com only makes sense for the
    // `anthropic` type (an openai_compatible provider pointed at it is a guaranteed-broken
    // config), so switch type and type the endpoint explicitly.
    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.anthropic.com' },
    });

    const chip = screen
      .getAllByText('claude-haiku-4-5')
      .find(node => node.closest('[role="group"]'));
    expect(chip).toBeDefined();
    fireEvent.click(chip as HTMLElement);

    expect(selectedModel()).toBe('claude-haiku-4-5');
  });

  it('does not suggest Anthropic models when api.anthropic.com is used with the openai_compatible type', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.anthropic.com' },
    });

    expect(screen.queryByText('claude-haiku-4-5')).not.toBeInTheDocument();
  });

  it('suggests OpenAI models for api.openai.com', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.openai.com/v1' },
    });

    expect(screen.getByText('gpt-4o-mini')).toBeInTheDocument();
  });

  it('suggests Bedrock-gateway models for a bedrock-mantle endpoint', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://bedrock-mantle.internal.example.com' },
    });

    expect(screen.getByText('qwen.qwen3-32b')).toBeInTheDocument();
    expect(screen.getByText('deepseek.v3.2')).toBeInTheDocument();
  });

  it('suggests a free OpenRouter model for an openrouter.ai endpoint', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://openrouter.ai/api/v1' },
    });

    expect(screen.getByText('openai/gpt-oss-20b:free')).toBeInTheDocument();
  });

  it('suggests Gemini models for a generativelanguage endpoint', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://generativelanguage.googleapis.com/v1beta' },
    });

    expect(screen.getByText('gemini-flash-latest')).toBeInTheDocument();
    expect(screen.getByText('gemini-3-flash-preview')).toBeInTheDocument();
  });

  it('suggests local Ollama models for a localhost:11434 endpoint', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'http://localhost:11434/v1' },
    });

    expect(screen.getByText('llama3.3')).toBeInTheDocument();
    expect(screen.getByText('qwen3')).toBeInTheDocument();
    expect(screen.getByText('mistral')).toBeInTheDocument();
  });
});

describe('ProviderFormFlyout — Model field is an editable EuiComboBox', () => {
  it('accepts a typed model id that is in neither list, via Enter (customOptionText)', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    const modelField = screen.getByLabelText(/^model/i);
    fireEvent.change(modelField, { target: { value: 'my-custom-fine-tune' } });
    fireEvent.keyDown(modelField, { key: 'Enter', code: 'Enter' });

    expect(selectedModel()).toBe('my-custom-fine-tune');
  });

  it('does not render the same model id under both "Examples:" and "Suggested models:"', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByLabelText(/anthropic \(claude\)/i));
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.anthropic.com' },
    });

    // claude-opus-4-8 is listed in both PROVIDER_MODEL_GUIDANCE (examples) and
    // VENDOR_MODEL_SUGGESTIONS (suggested models) for this endpoint — it must render once across
    // the two LISTS. The tool-calling callout names the same model as its inline example and is
    // excluded deliberately: the invariant here is "the two lists do not repeat each other", not
    // "this string appears once on the form". Prose naming a model a list also offers is normal.
    const inTheLists = screen
      .getAllByText('claude-opus-4-8')
      .filter(node => !node.closest('.euiCallOut'));
    expect(inTheLists).toHaveLength(1);
    // claude-sonnet-5 only exists in the vendor suggestion list — the dedupe must not drop it.
    expect(screen.getByText('claude-sonnet-5')).toBeInTheDocument();
  });
});
