import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

import { ProviderFormFlyout } from './provider-form-flyout';
import { ProviderSummary } from '../../../common/types';

const baseProps = {
  editingProvider: null,
  error: null,
  canSave: true,
  accessMessage: null,
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

  it('clarifies the API key is optional for auth-free endpoints and encrypted at rest', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    expect(
      screen.getByText(
        /optional for endpoints that don't require authentication/i,
      ),
    ).toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText(/^model/i), {
      target: { value: 'llama-3.3-70b-versatile' },
    });
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
    expect(screen.getByLabelText(/^model/i)).toHaveValue('gpt-4o');
    expect(
      screen.getByText(/leave empty to keep the current key/i),
    ).toBeInTheDocument();
  });
});

describe('ProviderFormFlyout — submit error and RBAC', () => {
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

  it('disables Save when the user cannot save', () => {
    render(
      <ProviderFormFlyout
        {...baseProps}
        canSave={false}
        accessMessage='Administrator role required.'
      />,
    );

    expect(screen.getByRole('button', { name: /save & test/i })).toBeDisabled();
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

    fireEvent.change(screen.getByLabelText(/^model/i), {
      target: { value: 'gpt-4.1' },
    });
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

    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'anthropic' },
    });

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
    expect(helpText.textContent).toMatch(/GPT-4o/);
    expect(helpText.textContent).not.toMatch(
      /small or base models often fail/i,
    );
  });

  it('does not offer llama-3.3-70b-versatile as a model example chip', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    expect(
      screen.queryByText(/^llama-3\.3-70b-versatile$/),
    ).not.toBeInTheDocument();
    // Anchored to the CHIP specifically — it renders the bare id in its own <code>.
    const chips = screen
      .getAllByText(/^openai\.gpt-oss-120b$/)
      .filter(node => node.tagName.toLowerCase() === 'code');
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
        .filter(node => node.tagName.toLowerCase() === 'code').length,
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

    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'anthropic' },
    });
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
        .filter(node => node.tagName.toLowerCase() === 'code').length,
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
  it('does not headline Gemini support under the OpenAI-compatible type', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    expect(
      screen.getByRole('option', {
        name: /openai-compatible \(openai, bedrock gateway, ollama, lm studio, vllm\.\.\.\)/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('option', { name: /gemini/i }),
    ).not.toBeInTheDocument();
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
    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'anthropic' },
    });
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.anthropic.com' },
    });

    const chip = screen
      .getAllByText('claude-haiku-4-5')
      .find(node => node.closest('[role="group"]'));
    expect(chip).toBeDefined();
    fireEvent.click(chip as HTMLElement);

    expect(screen.getByLabelText(/^model/i)).toHaveValue('claude-haiku-4-5');
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
