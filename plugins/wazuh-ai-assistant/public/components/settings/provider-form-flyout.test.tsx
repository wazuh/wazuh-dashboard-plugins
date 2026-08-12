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

describe('ProviderFormFlyout — Anthropic onboarding clarity', () => {
  it('labels the type options self-explanatorily and describes each one', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    expect(
      screen.getByRole('option', { name: /anthropic \(claude\)/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /choose this for openai, groq, bedrock-mantle, or any other provider/i,
      ),
    ).toBeInTheDocument();
  });

  it('prefills the Anthropic base URL when switching type while the field is untouched', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'anthropic' },
    });

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://api.anthropic.com',
    );
  });

  it('does not overwrite an endpoint URL the admin already typed', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://my-custom-gateway.example.com' },
    });
    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'anthropic' },
    });

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://my-custom-gateway.example.com',
    );
  });

  it('does not prefill the base URL for an existing provider being edited', () => {
    render(
      <ProviderFormFlyout {...baseProps} editingProvider={editingProvider} />,
    );

    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'anthropic' },
    });

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://api.openai.com/v1',
    );
  });

  it('shows where to create an Anthropic key and its expected shape under the API key field', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'anthropic' },
    });

    expect(
      screen.getByText(/console\.anthropic\.com -> api keys/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/sk-ant-/)).toBeInTheDocument();
  });

  it('shows a non-blocking warning when the key shape does not match the Anthropic type', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'anthropic' },
    });
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

    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'anthropic' },
    });
    fireEvent.change(screen.getByLabelText(/^api key$/i), {
      target: { value: 'sk-ant-abc123' },
    });

    expect(
      screen.queryByText(/doesn't look like an anthropic key/i),
    ).not.toBeInTheDocument();
  });

  it('never marks the API key field itself as invalid (warning stays non-blocking)', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'anthropic' },
    });
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

    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'anthropic' },
    });
    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://api.anthropic.com',
    );

    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'openai_compatible' },
    });

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue('');
  });

  it('keeps an admin-typed Anthropic URL when switching away from anthropic', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'anthropic' },
    });
    // A value the admin actually TYPED must survive the switch. Note it must differ from the
    // prefill already in the field: React deduplicates controlled-input change events whose
    // value is identical to the current one, so firing a change with the prefill's own value
    // dispatches nothing at all -- no onChange, no touched flag, no user action to preserve.
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://claude.internal-proxy.example' },
    });

    fireEvent.change(screen.getByLabelText(/provider type/i), {
      target: { value: 'openai_compatible' },
    });

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://claude.internal-proxy.example',
    );
  });

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
      .getAllByText(/^openai\/gpt-oss-120b$/)
      .filter(node => node.tagName.toLowerCase() === 'code');
    expect(chips.length).toBeGreaterThan(0);
  });
});

describe('ProviderFormFlyout — Model field guidance', () => {
  it('shows OpenAI-compatible model examples and one docs link per covered service by default', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

    // Anchored to the example CHIP's own <code>: the updated model help text (issue 09) also names
    // GPT-4o-mini in its prose, so an unanchored getByText now matches two nodes and throws. This
    // test is about the example chips, not the help paragraph.
    expect(
      screen
        .getAllByText(/^gpt-4o-mini$/i)
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

    expect(screen.getByText(/claude-sonnet-4-5/i)).toBeInTheDocument();

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
