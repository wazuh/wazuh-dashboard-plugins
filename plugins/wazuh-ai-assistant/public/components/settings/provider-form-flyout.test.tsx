import path from 'path';
import fs from 'fs';
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

/**
 * The "Provider type" EuiButtonGroup renders each option's radio input inside a <label> whose
 * `for` attribute points at the button group's own id — in this test environment every option
 * shares that same generated id, and it belongs to a non-labellable <fieldset>. `getByLabelText`
 * throws on that ("non-labellable element"), even though the option is visibly and correctly
 * labelled on screen. Select the input directly by its stable data-test-subj (the provider type
 * id) instead.
 */
function providerTypeOption(
  type: 'openai_compatible' | 'anthropic',
): HTMLElement {
  const input = document.querySelector(`input[data-test-subj="${type}"]`);
  if (!input) {
    throw new Error(`provider type option not found: ${type}`);
  }
  return input as HTMLElement;
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

    fireEvent.click(providerTypeOption('anthropic'));

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

    expect(screen.getByText(/discard this provider\?/i)).toBeInTheDocument();
    expect(baseProps.onClose).not.toHaveBeenCalled();
  });

  it('names both actions instead of asking a yes/no question', () => {
    // "Yes, do it" / "No, don't do it" under a title of "Unsubmitted changes" left the admin to
    // work out what "it" was, and made the destructive choice the affirmative one.
    render(<ProviderFormFlyout {...baseProps} />);

    dirtyTheForm();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));

    expect(
      screen.getByRole('button', { name: /discard changes/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /keep editing/i }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/yes, do it/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/unsubmitted changes/i)).not.toBeInTheDocument();
  });

  it('discards the changes and closes on "Discard changes"', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    dirtyTheForm();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /discard changes/i }));

    expect(baseProps.onClose).toHaveBeenCalled();
  });

  it('keeps the flyout and the typed values on "Keep editing"', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    dirtyTheForm();
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    fireEvent.click(screen.getByRole('button', { name: /keep editing/i }));

    expect(
      screen.queryByText(/discard this provider\?/i),
    ).not.toBeInTheDocument();
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
    expect(
      screen.queryByText(/discard this provider\?/i),
    ).not.toBeInTheDocument();
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

    expect(screen.getByText(/discard this provider\?/i)).toBeInTheDocument();
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

    fireEvent.click(providerTypeOption('anthropic'));

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

    expect(screen.getByText(/anthropic \(claude\)/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /for hosted services such as openai, gemini or an aws bedrock gateway/i,
      ),
    ).toBeInTheDocument();
  });

  it('prefills the Anthropic base URL when switching type while the field is untouched', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(providerTypeOption('anthropic'));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://api.anthropic.com',
    );
  });

  it('does not overwrite an endpoint URL the admin already typed', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://my-custom-gateway.example.com' },
    });
    fireEvent.click(providerTypeOption('anthropic'));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://my-custom-gateway.example.com',
    );
  });

  it('does not prefill the base URL for an existing provider being edited', () => {
    render(
      <ProviderFormFlyout {...baseProps} editingProvider={editingProvider} />,
    );

    fireEvent.click(providerTypeOption('anthropic'));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://api.openai.com/v1',
    );
  });

  it('shows where to create an Anthropic key and its expected shape under the API key field', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(providerTypeOption('anthropic'));

    expect(
      screen.getByText(/console\.anthropic\.com, under api keys/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/sk-ant-/)).toBeInTheDocument();
  });

  it('shows a non-blocking warning when the key shape does not match the Anthropic type', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(providerTypeOption('anthropic'));
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

    fireEvent.click(providerTypeOption('anthropic'));
    fireEvent.change(screen.getByLabelText(/^api key$/i), {
      target: { value: 'sk-ant-abc123' },
    });

    expect(
      screen.queryByText(/doesn't look like an anthropic key/i),
    ).not.toBeInTheDocument();
  });

  it('never marks the API key field itself as invalid (warning stays non-blocking)', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(providerTypeOption('anthropic'));
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

    fireEvent.click(providerTypeOption('anthropic'));
    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://api.anthropic.com',
    );

    fireEvent.click(providerTypeOption('openai_compatible'));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue('');
  });

  it('keeps an admin-typed Anthropic URL when switching away from anthropic', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(providerTypeOption('anthropic'));
    // A value the admin actually TYPED must survive the switch. Note it must differ from the
    // prefill already in the field: React deduplicates controlled-input change events whose
    // value is identical to the current one, so firing a change with the prefill's own value
    // dispatches nothing at all -- no onChange, no touched flag, no user action to preserve.
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://claude.internal-proxy.example' },
    });

    fireEvent.click(providerTypeOption('openai_compatible'));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://claude.internal-proxy.example',
    );
  });

  // Generalized from the anthropic-only special case (batch 2 item 2): the reset now fires for
  // ANY value that is still just the OLD type's own known default, not only an empty field —
  // including one filled by clicking an "Examples:" chip, which is exactly the kind of "still just
  // a suggestion" value the reset is meant to catch.
  it("resets an endpoint still holding the OLD type's own example when switching type, even though it was filled by clicking a chip", () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(
      screen.getByLabelText('Use endpoint http://localhost:11434/v1'),
    );
    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'http://localhost:11434/v1',
    );

    fireEvent.click(providerTypeOption('anthropic'));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://api.anthropic.com',
    );
  });
});

describe('ProviderFormFlyout — endpoint/type mismatch warning', () => {
  it('warns, non-blockingly, when an anthropic-typed provider is not pointed at api.anthropic.com', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(providerTypeOption('anthropic'));
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.openai.com/v1' },
    });

    expect(
      screen.getByText(/doesn't look like an anthropic endpoint/i),
    ).toBeInTheDocument();
    // Non-blocking: Save must stay enabled despite the mismatch warning.
    expect(
      screen.getByRole('button', { name: /^save & test$/i }),
    ).toBeEnabled();
  });

  it('clears the anthropic-host warning once the endpoint matches again', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(providerTypeOption('anthropic'));
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.openai.com/v1' },
    });
    expect(
      screen.getByText(/doesn't look like an anthropic endpoint/i),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.anthropic.com' },
    });

    expect(
      screen.queryByText(/doesn't look like an anthropic endpoint/i),
    ).not.toBeInTheDocument();
  });

  it("warns when an openai_compatible-typed provider points at Anthropic's own host", () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.anthropic.com' },
    });

    expect(
      screen.getByText(/doesn't look like an openai-compatible endpoint/i),
    ).toBeInTheDocument();
  });

  it('shows no mismatch warning for a normal openai_compatible endpoint', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.groq.com/openai/v1' },
    });

    expect(screen.queryByText(/doesn't look like/i)).not.toBeInTheDocument();
  });

  it('shows no mismatch warning while the endpoint field is empty', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(providerTypeOption('anthropic'));
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: '' },
    });

    expect(screen.queryByText(/doesn't look like/i)).not.toBeInTheDocument();
  });
});

describe('ProviderFormFlyout — getting-started onboarding', () => {
  const gettingStartedCallout = () =>
    screen.getByText(/getting started/i).closest('.euiCallOut') as HTMLElement;

  it('shows a numbered getting-started hint for a new provider, not when editing', () => {
    const { rerender } = render(<ProviderFormFlyout {...baseProps} />);
    expect(screen.getByText(/getting started/i)).toBeInTheDocument();

    rerender(
      <ProviderFormFlyout {...baseProps} editingProvider={editingProvider} />,
    );
    expect(screen.queryByText(/getting started/i)).not.toBeInTheDocument();
  });

  it('lays the four steps out as a real ordered list, in order', () => {
    // The steps used to be a single i18n message with the numbering baked into the copy
    // ("1. Pick a provider type. 2. Paste its API key. ...") rendered as ONE inline paragraph, so a
    // sequence neither scanned nor was announced as one. The numbers now come from the <ol>.
    render(<ProviderFormFlyout {...baseProps} />);

    const list = gettingStartedCallout().querySelector('ol');
    expect(list).not.toBeNull();
    expect(
      Array.from((list as HTMLOListElement).querySelectorAll('li')).map(item =>
        item.textContent?.trim(),
      ),
    ).toEqual([
      'Pick a provider type.',
      // The parenthetical is the difference between the two provider types this form offers: a
      // local OpenAI-compatible runtime has no key to paste at all.
      'Paste its API key (if the endpoint needs one).',
      'Pick a model.',
      'Test the connection.',
    ]);
    // The numbering must not be duplicated in the copy now that the list draws it.
    expect(list?.textContent).not.toMatch(/1\.\s*Pick a provider type/);
  });

  it('no longer hedges the connection test before the form is even filled in', () => {
    // Deleted copy (CEO item 2): "A green test confirms connection and key — it does not guarantee
    // every chat request will succeed." True, but a caveat about the outcome of step 4 read as
    // doubt about the whole feature on the surface that most needs to feel simple.
    render(<ProviderFormFlyout {...baseProps} />);

    expect(
      screen.queryByText(/a green test confirms connection and key/i),
    ).toBeNull();
    expect(
      screen.queryByText(/does not guarantee every chat request will succeed/i),
    ).toBeNull();
    expect(gettingStartedCallout().querySelectorAll('p')).toHaveLength(0);
  });
});

describe('ProviderFormFlyout — one type scale for field guidance', () => {
  it('renders the in-slot examples label through EUI help text, not an ad-hoc EuiText size', () => {
    // Three uncoordinated mechanisms used to produce "small text" on this form: EuiText size='s',
    // raw elements in an EuiFormRow helpText slot, and EuiText size='xs'. The xs variant is gone —
    // the "Examples:" label is a plain element inside the helpText slot, so it takes
    // .euiFormHelpText and cannot drift from the API key field's help beside it.
    render(<ProviderFormFlyout {...baseProps} />);

    // ONE label, the endpoint field's: the Model field's own generic examples row was removed
    // (see the Model-field describe below).
    const labels = screen.getAllByText(/^Examples:$/);
    expect(labels).toHaveLength(1);
    for (const label of labels) {
      expect(label.closest('.euiFormHelpText')).not.toBeNull();
      expect(label.closest('.euiText--extraSmall')).toBeNull();
    }
  });

  it('matches the out-of-slot suggestions label to that same help styling', () => {
    // "Suggested models:" cannot live in the helpText slot (EuiFormRow clones its single child), so
    // it carries the class that restates EUI's own .euiFormHelpText values instead of a second
    // EuiText size.
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.openai.com/v1' },
    });

    const label = screen.getByText(/^Suggested models:$/);
    expect(label).toHaveClass('wzProviderFlyout__help');
    expect(label.closest('.euiText--extraSmall')).toBeNull();
  });
});

describe('ProviderFormFlyout — example value chips', () => {
  const exampleChips = () =>
    Array.from(
      document.querySelectorAll<HTMLElement>('.wzProviderFlyout__exampleChip'),
    );

  it('renders every fillable example through the one shared chip, set in the code face', () => {
    // Four inline EuiBadge repeats collapsed into a single ExampleChip. Each chip puts its value in
    // its own <code>: the values are URLs and model ids, and they must read as values you can click
    // into the field rather than as labels describing one.
    render(<ProviderFormFlyout {...baseProps} />);

    const chips = exampleChips();
    // The four endpoint examples for the default openai_compatible type, and nothing else: the
    // Model field's generic per-type examples are gone, and no vendor suggestions have appeared yet
    // because the endpoint URL is still empty.
    expect(chips).toHaveLength(4);
    for (const chip of chips) {
      expect(chip.querySelector('code')).not.toBeNull();
    }
    expect(chips.map(chip => chip.querySelector('code')?.textContent)).toEqual(
      expect.arrayContaining(['https://api.openai.com/v1']),
    );
  });

  it('still fills the endpoint URL field when an example chip is clicked', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    const chip = screen
      .getAllByText('http://localhost:11434/v1')
      .find(node => node.closest('.wzProviderFlyout__exampleChip'));
    expect(chip).toBeDefined();
    fireEvent.click(chip as HTMLElement);

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'http://localhost:11434/v1',
    );
  });

  it('still fills the model field when a suggestion chip is clicked', () => {
    // The Model field's chips are now exclusively the endpoint's own vendor suggestions (the generic
    // per-type "Examples:" row was removed), so this goes through the endpoint to reach them.
    render(<ProviderFormFlyout {...baseProps} />);
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.openai.com/v1' },
    });

    const chip = screen
      .getAllByText('gpt-4o-mini')
      .find(node => node.closest('.wzProviderFlyout__exampleChip'));
    expect(chip).toBeDefined();
    fireEvent.click(chip as HTMLElement);

    expect(selectedModel()).toBe('gpt-4o-mini');
  });

  it('offers no generic per-type model example chips under the Model field', () => {
    // Decided with Miguel alongside the CSS audit: the two ids that row offered
    // (openai.gpt-oss-120b, mistral.mistral-large-3-675b-instruct) are Bedrock-gateway model names
    // shown on EVERY openai_compatible endpoint — including endpoints whose own curated suggestions
    // were listed 20px below under a second heading. Everything keyed to the admin's actual
    // endpoint stays: the combo box options, the "Suggested models:" chips and the docs link.
    render(<ProviderFormFlyout {...baseProps} />);

    // The row's own label element is gone with it, which is the cheapest structural proof.
    expect(
      document.getElementById('wz-ai-provider-model-examples-label'),
    ).toBeNull();
    expect(screen.queryByLabelText('Use model openai.gpt-oss-120b')).toBeNull();
    expect(
      screen.queryByLabelText(
        'Use model mistral.mistral-large-3-675b-instruct',
      ),
    ).toBeNull();
    expect(
      screen.getByRole('button', { name: /^see available models$/i }),
    ).toBeInTheDocument();
  });

  it('keeps a click aria-label on every chip (EUI requires one for a clickable badge)', () => {
    // Queried by label rather than by role so the assertion survives whichever element EuiBadge
    // chooses for a clickable badge — what matters is that the value-only chip still announces the
    // action it performs.
    render(<ProviderFormFlyout {...baseProps} />);

    expect(
      screen.getByLabelText('Use endpoint https://api.openai.com/v1'),
    ).toBeInTheDocument();

    // The model-side chips are the endpoint's vendor suggestions now, so they need an endpoint.
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.openai.com/v1' },
    });
    expect(screen.getByLabelText('Use model gpt-4o-mini')).toBeInTheDocument();
  });

  it('names the tool-calling example as plain inline code, not as a fillable chip', () => {
    // That model id is illustrative prose ("a model like this one") and the very same id is already
    // offered as a real fill-on-click chip under the Model field, so a chip here advertised an
    // action mid-sentence inside a warning callout.
    render(<ProviderFormFlyout {...baseProps} />);

    const callout = screen
      .getByText(/tool calling needs a model/i)
      .closest('.euiCallOut') as HTMLElement;
    const value = callout.querySelector('code') as HTMLElement;
    expect(value).toHaveTextContent('openai.gpt-oss-120b');
    expect(value).toHaveClass('wzProviderFlyout__inlineValue');
    expect(callout.querySelector('.wzProviderFlyout__exampleChip')).toBeNull();
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

  it('does not offer llama-3.3-70b-versatile anywhere on the form', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    expect(
      screen.queryByText(/^llama-3\.3-70b-versatile$/),
    ).not.toBeInTheDocument();
    // The per-type example the tool-calling callout NAMES is still the type's own first curated
    // model — that list did not go away, only its chip row under the Model field did, so this is
    // now the one place the id appears and it is prose rather than a fillable chip.
    const named = screen.getAllByText(/^openai\.gpt-oss-120b$/);
    expect(named).toHaveLength(1);
    expect(named[0].closest('.euiCallOut')).not.toBeNull();
    expect(named[0].closest('[role="group"]')).toBeNull();
  });
});

describe('ProviderFormFlyout — Model field guidance', () => {
  it('shows one model docs link per covered service by default', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

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

  it('switches to Anthropic model suggestions and docs link when the provider type changes', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(providerTypeOption('anthropic'));
    // No auto-prefill of the endpoint URL on type switch here -- type the Anthropic endpoint
    // explicitly so the curated model-suggestion chips (keyed off the base URL) surface below.
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.anthropic.com' },
    });

    // Anchored to the CHIP's own <code>: an unanchored getByText would match both the chip and the
    // plain-text model example the tool-calling callout names. The chip is a vendor suggestion now
    // (the generic per-type examples row is gone) — and claude-sonnet-5 reaching it at all is the
    // point: it is in BOTH curated lists, and the dedupe that used to hide it here went with the
    // row it was deduplicating against.
    expect(
      screen
        .getAllByText(/^claude-sonnet-5$/i)
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

    const label = screen.getByText(/openai-compatible/i);
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

    fireEvent.click(providerTypeOption('anthropic'));

    const anthropicCallout = screen
      .getByText(/tool calling needs a model/i)
      .closest('.euiCallOut') as HTMLElement;
    expect(anthropicCallout).toHaveTextContent('claude-sonnet-5');
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
});

describe('ProviderFormFlyout — curated per-vendor model suggestions', () => {
  it('shows no suggestion chips for an unrecognized endpoint URL', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://my-custom-gateway.example.com' },
    });

    expect(screen.queryByText('claude-sonnet-5')).not.toBeInTheDocument();
  });

  it('suggests Anthropic models for api.anthropic.com on the anthropic type and fills the model field on click', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    // Suggestions are gated by provider type: api.anthropic.com only makes sense for the
    // `anthropic` type (an openai_compatible provider pointed at it is a guaranteed-broken
    // config), so switch type and type the endpoint explicitly.
    fireEvent.click(providerTypeOption('anthropic'));
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

  it('lists each suggested model once, including the ids the old dedupe used to hide', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(providerTypeOption('anthropic'));
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.anthropic.com' },
    });

    // claude-sonnet-5 is listed in both PROVIDER_MODEL_GUIDANCE and VENDOR_MODEL_SUGGESTIONS, and
    // it used to be filtered OUT of the suggestions because the Model field also showed a generic
    // examples row carrying it. That row is gone, so the filter is gone with it — dropping the
    // vendor's own primary model from the only list still offering it would have been the real
    // regression. The tool-calling callout names the same id in prose and is excluded here: the
    // invariant is about the LIST, not about the string appearing once on the form.
    const inTheList = screen
      .getAllByText('claude-sonnet-5')
      .filter(node => !node.closest('.euiCallOut'));
    expect(inTheList).toHaveLength(1);
    // ...and an id only the vendor list carries is still there beside it.
    expect(screen.getByText('claude-opus-5')).toBeInTheDocument();
  });
});

/**
 * The live CSS audit (AI/ux-iter3/css-audit-full.md §5) called this flyout "the ONE genuinely
 * too-empty surface in the build": a 960px panel holding a 400px form, i.e. 500px of nothing beside
 * every field. These pin the shape that replaced it, plus the two idioms the audit found competing
 * inside it.
 */
describe('ProviderFormFlyout — one tight column (audit §5)', () => {
  it('caps the panel at a reading-width column', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    // No DOM assertion is possible for this one: the test-env's EuiFlyout is a STUB that
    // drops every prop except role/children/the close button (see
    // @elastic/eui/test-env/eui_components/flyout/flyout.js) -- className and maxWidth never
    // reach jsdom no matter what the product passes. The cap is therefore pinned at its two
    // sources: the TSX must hand the panel class to EuiFlyout, and the stylesheet must cap
    // that class at 640px (the rule that guarantees the cap even if a bundled EUI ignores
    // the maxWidth prop).
    const tsx = fs.readFileSync(
      path.join(__dirname, 'provider-form-flyout.tsx'),
      'utf8',
    );
    expect(tsx).toMatch(/<EuiFlyout[^>]*className='wzProviderFlyoutPanel'/s);

    const scss = fs.readFileSync(
      path.join(__dirname, 'provider-form-flyout.scss'),
      'utf8',
    );
    expect(scss).toMatch(/\.wzProviderFlyoutPanel\s*\{[^}]*max-width:\s*640px/);
  });

  it('stacks Name and API key in one column instead of two', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    const nameGroup = screen
      .getByLabelText(/^name/i)
      .closest('.euiFlexGroup') as HTMLElement;
    const keyGroup = screen
      .getByLabelText(/^api key$/i)
      .closest('.euiFlexGroup') as HTMLElement;
    // Same group, and that group runs down the page: the API key field follows Name in the flow, so
    // each field is read together with its own help text instead of level with the other's.
    expect(nameGroup).toBe(keyGroup);
    expect(nameGroup.className).toMatch(/directionColumn/i);
  });

  it('is a segmented control (button group), not a pair of huge cards', () => {
    // UX iteration 4 item 1: the binary provider-type choice used to be two ~282x211px
    // EuiCheckableCards. It is now an EuiButtonGroup — still exposed as two radios (EUI wires a
    // hidden native radio input per option for a `type="single"` group), so the count-based
    // assertion from before still holds, but there is no `.euiCheckableCard` on the page any more.
    render(<ProviderFormFlyout {...baseProps} />);

    expect(screen.getAllByRole('radio')).toHaveLength(2);
    expect(document.querySelector('.euiCheckableCard')).toBeNull();
  });

  it('describes only the SELECTED provider type, not both at once', () => {
    // The old layout rendered both types' descriptions on screen simultaneously (one per card),
    // which the audit flagged as confusing on the exact surface CEO feedback already called out
    // as hard to get right (audit finding: description placement). The description now lives in
    // the button group's own EuiFormRow `helpText`, so only the current selection is described.
    render(<ProviderFormFlyout {...baseProps} />);

    // openai_compatible is the default selection.
    expect(screen.getByText(/any endpoint that exposes/i)).toBeInTheDocument();
    expect(screen.queryByText(/Anthropic's own API/i)).not.toBeInTheDocument();

    fireEvent.click(providerTypeOption('anthropic'));

    expect(screen.getByText(/Anthropic's own API/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/any endpoint that exposes/i),
    ).not.toBeInTheDocument();
  });

  it('keeps the getting-started callout, restyled rather than deleted', () => {
    // The audit recommended DELETING this block (it restates the numbered group legends 20px
    // below); the CEO's instruction is that it stays, so §5.3 lands as presentation only. The copy
    // is unchanged — see the getting-started describe above for the list itself.
    render(<ProviderFormFlyout {...baseProps} />);
    expect(screen.getByText(/getting started/i)).toBeInTheDocument();

    const scss = fs.readFileSync(
      path.join(__dirname, 'provider-form-flyout.scss'),
      'utf8',
    );
    // Callouts get the small radius and a 12/16 inset instead of EUI's square, 8px-padded banner,
    // qualified through the flyout's own class so bundle order cannot decide it (§5.7).
    expect(scss).toMatch(
      /\.wzProviderFlyoutPanel \.euiCallOut \{[^}]*border-radius: 4px;[^}]*padding: 12px 16px/,
    );
    // The steps list is aligned with the callout's TITLE, not with its icon (§5.3).
    expect(scss).toMatch(
      /\.wzProviderFlyout__steps \{[^}]*margin-inline-start: \$euiSize \+ \$euiSizeS/,
    );
    expect(scss).toMatch(
      /\.wzProviderFlyout__steps \{[^}]*list-style-position: inside/,
    );
  });

  it('sets the group legends in the section idiom, not the field-label spec', () => {
    // §5.2: legends rendered at 12px/500 in the full text color, which is EXACTLY a field label —
    // so a group heading was indistinguishable from the labels inside the group it heads.
    const scss = fs.readFileSync(
      path.join(__dirname, 'provider-form-flyout.scss'),
      'utf8',
    );
    expect(scss).toMatch(
      /\.wzProviderFlyout__group legend \{[^}]*@include wzMicroLabel/,
    );
  });

  it('bounds an example chip to its own column', () => {
    // §5.4: the widest endpoint example measured 396px inside a 400px column and overflowed it.
    const scss = fs.readFileSync(
      path.join(__dirname, 'provider-form-flyout.scss'),
      'utf8',
    );
    expect(scss).toMatch(
      /\.wzProviderFlyout__exampleChip \{[^}]*max-width: 100%;[^}]*text-overflow: ellipsis/,
    );
  });

  it('clears the body scroll gutter for the header and lands the footer CTA on the shared edge', () => {
    // §5.5: the CTA broke the form's right edge by the scrollbar's own 10px, because header and
    // footer sit outside the scrolling body and never carried that gutter. The re-audit (§1.2)
    // then showed compensating the footer's direct child was not enough: that child is EUI's
    // EuiFlexGroup, whose ITEMS carry their own 12px margins, so the visible button still sat
    // 12px inside the edge. The compensation therefore lives on the last flex item — the element
    // that actually paints the edge — as EUI's item margin plus the gutter.
    const scss = fs.readFileSync(
      path.join(__dirname, 'provider-form-flyout.scss'),
      'utf8',
    );
    expect(scss).toMatch(
      /\.wzProviderFlyoutPanel \.euiFlyoutHeader > \* \{[^}]*margin-inline-end: \$wzScrollGutter/,
    );
    // Prettier wraps this long selector across several lines, so match the
    // combinators tolerant of any whitespace rather than a single space.
    expect(scss).toMatch(
      /\.euiFlyoutFooter\s*>\s*\.euiFlexGroup\s*>\s*\.euiFlexItem:last-child \{[^}]*margin-inline-end: calc\(#\{\$euiSizeM\} \+ #\{\$wzScrollGutter\}\)/,
    );
  });
});

describe('ProviderFormFlyout — duplicate provider names', () => {
  const existingProviders: ProviderSummary[] = [
    editingProvider,
    {
      id: 'p2',
      name: 'Claude staging',
      type: 'anthropic',
      baseUrl: 'https://api.anthropic.com',
      model: 'claude-opus-4-8',
      hasApiKey: true,
      isDefault: true,
    },
  ];

  /** Fills the three required fields with a valid endpoint and model, so the ONLY thing that can
   * block Save in these cases is the name check under test. */
  const fillValidForm = (name: string) => {
    fireEvent.change(screen.getByLabelText(/^name/i), {
      target: { value: name },
    });
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.openai.com/v1' },
    });
    const modelField = screen.getByLabelText(/^model/i);
    fireEvent.change(modelField, { target: { value: 'gpt-4o' } });
    fireEvent.keyDown(modelField, { key: 'Enter', code: 'Enter' });
  };

  it('blocks submit and shows an inline error for a name another provider already uses', async () => {
    render(
      <ProviderFormFlyout
        {...baseProps}
        existingProviders={existingProviders}
      />,
    );

    fillValidForm('Claude staging');
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it('matches the taken name regardless of casing and surrounding whitespace', async () => {
    render(
      <ProviderFormFlyout
        {...baseProps}
        existingProviders={existingProviders}
      />,
    );

    fillValidForm('  claude STAGING  ');
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it('clears the duplicate-name error as soon as the name is edited', async () => {
    render(
      <ProviderFormFlyout
        {...baseProps}
        existingProviders={existingProviders}
      />,
    );

    fillValidForm('Claude staging');
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));
    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/^name/i), {
      target: { value: 'Claude staging 2' },
    });

    expect(screen.queryByText(/already exists/i)).toBeNull();
  });

  it('accepts a name no other provider uses', async () => {
    render(
      <ProviderFormFlyout
        {...baseProps}
        existingProviders={existingProviders}
      />,
    );

    fillValidForm('Gemini lab');
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

    await waitFor(() => {
      expect(baseProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Gemini lab' }),
      );
    });
  });

  it('lets an edited provider keep its OWN name — no self-collision', async () => {
    render(
      <ProviderFormFlyout
        {...baseProps}
        editingProvider={editingProvider}
        existingProviders={existingProviders}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

    await waitFor(() => {
      expect(baseProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My OpenAI' }),
      );
    });
    expect(screen.queryByText(/already exists/i)).toBeNull();
  });

  it('still blocks an edited provider renamed onto ANOTHER provider name', async () => {
    render(
      <ProviderFormFlyout
        {...baseProps}
        editingProvider={editingProvider}
        existingProviders={existingProviders}
      />,
    );

    fireEvent.change(screen.getByLabelText(/^name/i), {
      target: { value: 'Claude staging' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it('performs no duplicate check when no provider list is supplied', async () => {
    // Absent `existingProviders` must behave exactly as before the prop existed.
    render(<ProviderFormFlyout {...baseProps} />);

    fillValidForm('Claude staging');
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

    await waitFor(() => {
      expect(baseProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Claude staging' }),
      );
    });
  });

  it('surfaces a duplicate name AND a bad URL on the same click', async () => {
    // L10: validating sequentially made a form with both problems take two clicks to reveal two
    // errors, which reads as though fixing the first broke something new.
    render(
      <ProviderFormFlyout
        {...baseProps}
        existingProviders={existingProviders}
      />,
    );

    fireEvent.change(screen.getByLabelText(/^name/i), {
      target: { value: 'Claude staging' },
    });
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'not-a-url' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

    expect(await screen.findByText(/already exists/i)).toBeInTheDocument();
    expect(
      screen.getByText(/valid URL starting with http/i),
    ).toBeInTheDocument();
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it('surfaces a server-side 409 through the existing error callout', () => {
    // A race (another admin created the same name while this flyout was open) comes back as the
    // 409 message on the `error` prop; the flyout must show it, not swallow it.
    render(
      <ProviderFormFlyout
        {...baseProps}
        existingProviders={existingProviders}
        error='A provider named "Claude staging" already exists.'
      />,
    );

    expect(
      screen.getByText('A provider named "Claude staging" already exists.'),
    ).toBeInTheDocument();
  });
});

/** The combo box's search input: the Model field's real focus target, and the element that carries
 * the field's `aria-required`. Reached through the combo box's own `data-test-subj` because
 * `EuiFormRow`'s label association resolves to the combo box, not to this input. */
function modelSearchInput(): HTMLInputElement {
  const input = document.querySelector(
    '[data-test-subj="wzProviderModelCombo"] input',
  );
  if (!input) {
    throw new Error('model combo box search input not found');
  }
  return input as HTMLInputElement;
}

/**
 * UX wave 2, PR A: every required field is validated on Save & test, not just the endpoint URL.
 * Before this, an empty Name or Model produced a server round-trip and a generic red callout at the
 * top of the flyout, leaving the admin to work out which field the 400 was about.
 */
describe('ProviderFormFlyout — required-field validation', () => {
  it('shows an inline error under EVERY empty required field on one click', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

    expect(
      await screen.findByText(/enter a name for this provider/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/enter the endpoint url for this provider/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /pick a suggestion, or type a model id and press enter\./i,
      ),
    ).toBeInTheDocument();
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it("moves focus to the first invalid field, in the form's own order", () => {
    render(<ProviderFormFlyout {...baseProps} />);

    // Nothing filled in: Name is the topmost problem.
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));
    expect(document.activeElement).toBe(screen.getByLabelText(/^name/i));

    // Name fixed, endpoint still wrong: focus moves down to the endpoint.
    fireEvent.change(screen.getByLabelText(/^name/i), {
      target: { value: 'Gemini lab' },
    });
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'not-a-url' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));
    expect(document.activeElement).toBe(screen.getByLabelText(/endpoint url/i));

    // Only the model left: focus lands on the combo box's search input.
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.openai.com/v1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));
    expect(document.activeElement).toBe(modelSearchInput());
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it('validates the same way when EDITING an existing provider', async () => {
    // The edit flow reaches submit with values already in the fields, so emptying them is the only
    // way to reach the required-field checks there — and it is a real path: an admin clearing a
    // field to retype it and clicking Save & test too early.
    render(
      <ProviderFormFlyout {...baseProps} editingProvider={editingProvider} />,
    );

    fireEvent.change(screen.getByLabelText(/^name/i), {
      target: { value: '  ' },
    });
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: '' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

    expect(
      await screen.findByText(/enter a name for this provider/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/enter the endpoint url for this provider/i),
    ).toBeInTheDocument();
    expect(document.activeElement).toBe(screen.getByLabelText(/^name/i));
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it('marks the model combo box as required for assistive technology', () => {
    // The red asterisk on the label is `aria-hidden` decoration, so without this the one required
    // field that is not a plain input was never announced as required.
    render(<ProviderFormFlyout {...baseProps} />);

    expect(modelSearchInput()).toHaveAttribute('aria-required', 'true');
  });

  it('puts the model error on the input submit moves focus to', async () => {
    // EuiFormRow clones its a11y props onto the combo box WRAPPER and EuiComboBox does not forward
    // them to the search input, so without wiring these by hand the field that just received focus
    // would announce nothing about why it was rejected.
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));
    await screen.findByText(/enter a name for this provider/i);

    const input = modelSearchInput();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    const describedBy = input.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)?.textContent).toMatch(
      /pick a suggestion, or type a model id and press enter\./i,
    );

    // And they come off again once the field is satisfied.
    fireEvent.change(input, { target: { value: 'gpt-4o' } });
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });
    expect(modelSearchInput()).not.toHaveAttribute('aria-invalid');
    expect(modelSearchInput()).not.toHaveAttribute('aria-describedby');
  });

  it('blocks Save while the model combo box holds uncommitted search text', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/^name/i), {
      target: { value: 'Gemini lab' },
    });
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'https://api.openai.com/v1' },
    });
    // Typed, never committed with Enter — the field LOOKS filled in on screen.
    fireEvent.change(modelSearchInput(), { target: { value: 'gpt-4o' } });
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

    expect(
      await screen.findByText(/press enter to use "gpt-4o" as the model/i),
    ).toBeInTheDocument();
    expect(baseProps.onSubmit).not.toHaveBeenCalled();

    // Committing it clears the error and lets the same click through.
    fireEvent.keyDown(modelSearchInput(), { key: 'Enter', code: 'Enter' });
    expect(
      screen.queryByText(/press enter to use "gpt-4o" as the model/i),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));
    await waitFor(() =>
      expect(baseProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4o' }),
      ),
    );
  });

  it('offers an explicit custom-option row for text that matches no suggestion', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.focus(modelSearchInput());
    fireEvent.change(modelSearchInput(), {
      target: { value: 'my-private-model' },
    });

    // EUI splits `customOptionText` around the {searchValue} token, so read the row's full text.
    const customOptionRow = screen.getByText(/as a custom model/i);
    expect(customOptionRow.textContent).toContain('my-private-model');
  });

  it("tells the admin what to do with typed text in the field's own placeholder", () => {
    // EuiComboBox paints its placeholder as its own element rather than as the search input's
    // `placeholder` attribute, so this reads it where EUI actually renders it.
    render(<ProviderFormFlyout {...baseProps} />);

    // Class prefix matched loosely: the platform ships OUI's fork of EUI, whose class names carry
    // the `oui` prefix.
    expect(
      document.querySelector('[class*="ComboBoxPlaceholder"]')?.textContent,
    ).toBe('Pick a suggestion, or type a model id and press Enter');
  });
});

/**
 * UX wave 2, PR A: the endpoint URL is validated on blur as well as on submit, its error survives
 * the first keystroke, a doubled scheme is caught, and a still-suggested value is selected on focus
 * so the first keystroke replaces it.
 */
describe('ProviderFormFlyout — endpoint URL validation', () => {
  it('validates on blur, not only on submit', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

    const field = screen.getByLabelText(/endpoint url/i);
    fireEvent.change(field, { target: { value: 'api.openai.com' } });
    fireEvent.blur(field);

    expect(
      await screen.findByText(/valid URL starting with http/i),
    ).toBeInTheDocument();
  });

  it('leaves an untouched empty field unmarked on blur', () => {
    // Required-ness is submit's business; nagging on a tab-through is not.
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.blur(screen.getByLabelText(/endpoint url/i));

    expect(screen.queryByText(/valid URL starting with http/i)).toBeNull();
    expect(
      screen.queryByText(/enter the endpoint url for this provider/i),
    ).toBeNull();
  });

  it('keeps the error visible while the value is still invalid', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

    const field = screen.getByLabelText(/endpoint url/i);
    fireEvent.change(field, { target: { value: 'not-a-url' } });
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));
    expect(
      await screen.findByText(/valid URL starting with http/i),
    ).toBeInTheDocument();

    // One keystroke used to clear the error, which reads as "fixed" while nothing was fixed.
    fireEvent.change(field, { target: { value: 'not-a-urlh' } });
    expect(
      screen.getByText(/valid URL starting with http/i),
    ).toBeInTheDocument();

    // It clears only once the value is actually valid.
    fireEvent.change(field, { target: { value: 'https://api.openai.com/v1' } });
    expect(screen.queryByText(/valid URL starting with http/i)).toBeNull();
  });

  it('catches a repeated scheme, which the plain URL check accepts', async () => {
    // What typing on top of the type-prefilled default produces.
    render(<ProviderFormFlyout {...baseProps} />);

    const field = screen.getByLabelText(/endpoint url/i);
    fireEvent.change(field, {
      target: { value: 'https://api.anthropic.comhttps://my-gateway/v1' },
    });
    fireEvent.blur(field);

    expect(
      await screen.findByText(
        /contains http:\/\/ or https:\/\/ more than once/i,
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));
    expect(baseProps.onSubmit).not.toHaveBeenCalled();
  });

  it('accepts a gateway URL that legitimately carries a scheme in its query', async () => {
    // A passthrough/gateway endpoint names its upstream in its own path or query, and the server's
    // url-guard accepts exactly that. A "second scheme anywhere" rule would refuse such a provider
    // outright — and, since every save runs this check, would also make an already-stored one
    // impossible to re-save.
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.change(screen.getByLabelText(/^name/i), {
      target: { value: 'Corp gateway' },
    });
    const field = screen.getByLabelText(/endpoint url/i);
    fireEvent.change(field, {
      target: {
        value: 'https://gw.internal/proxy?upstream=https://api.openai.com',
      },
    });
    fireEvent.blur(field);
    expect(
      screen.queryByText(/contains http:\/\/ or https:\/\/ more than once/i),
    ).toBeNull();

    fireEvent.change(modelSearchInput(), { target: { value: 'gpt-4o' } });
    fireEvent.keyDown(modelSearchInput(), { key: 'Enter', code: 'Enter' });
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));

    await waitFor(() =>
      expect(baseProps.onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          baseUrl: 'https://gw.internal/proxy?upstream=https://api.openai.com',
        }),
      ),
    );
  });

  it('keeps a submit-raised required error through a click into the empty field', async () => {
    // Blur must not erase what submit reported: the ternary this replaced hit its null arm for any
    // empty value, so tabbing through the field cleared the very error that stopped the save.
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));
    const error = await screen.findByText(
      /enter the endpoint url for this provider/i,
    );

    const field = screen.getByLabelText(/endpoint url/i);
    fireEvent.focus(field);
    fireEvent.blur(field);

    expect(error).toBeInTheDocument();
  });

  it('clears a stale endpoint error when a type switch rewrites the value', async () => {
    // The error belongs to the value that produced it. A type switch only rewrites a field the
    // admin has not typed into (empty here, after a submit raised the required error), and
    // switching to Anthropic prefills its one real endpoint — leaving the old error on that marked
    // a perfectly good field as invalid while Save would then have found nothing wrong.
    render(<ProviderFormFlyout {...baseProps} />);

    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));
    expect(
      await screen.findByText(/enter the endpoint url for this provider/i),
    ).toBeInTheDocument();

    fireEvent.click(providerTypeOption('anthropic'));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue(
      'https://api.anthropic.com',
    );
    expect(
      screen.queryByText(/enter the endpoint url for this provider/i),
    ).toBeNull();
  });

  it('leaves the error alone when a type switch does NOT rewrite the value', async () => {
    render(<ProviderFormFlyout {...baseProps} />);

    // Typing marks the field as the admin's, so a type switch must not touch it.
    fireEvent.change(screen.getByLabelText(/endpoint url/i), {
      target: { value: 'not-a-url' },
    });
    fireEvent.click(screen.getByRole('button', { name: /save & test/i }));
    await screen.findByText(/valid URL starting with http/i);

    fireEvent.click(providerTypeOption('anthropic'));

    expect(screen.getByLabelText(/endpoint url/i)).toHaveValue('not-a-url');
    expect(
      screen.getByText(/valid URL starting with http/i),
    ).toBeInTheDocument();
  });

  /**
   * What these cases can and cannot prove: jsdom does not model the caret or a text selection, so
   * the half of this fix that matters most for a MOUSE user — the mouseup completing the click
   * collapsing the selection `select()` just made, which is why the field calls `preventDefault()`
   * on that one mouseup — is not observable here. These assert the decision (is this value
   * selected at all, and is exactly one mouseup suppressed); the caret behaviour itself is a
   * live-browser check.
   */
  it('selects a still-suggested prefilled endpoint on focus, so typing replaces it', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    // Switching to Anthropic prefills its single real endpoint.
    fireEvent.click(providerTypeOption('anthropic'));
    const field = screen.getByLabelText(/endpoint url/i) as HTMLInputElement;
    expect(field).toHaveValue('https://api.anthropic.com');

    const select = jest.spyOn(field, 'select');
    fireEvent.focus(field);
    expect(select).toHaveBeenCalled();
    select.mockRestore();

    // `fireEvent` returns false when a handler called preventDefault. The mouseup completing THAT
    // click is suppressed, so it cannot collapse the selection...
    expect(fireEvent.mouseUp(field)).toBe(false);
    // ...but only that one — a later click must still be able to place a caret.
    expect(fireEvent.mouseUp(field)).toBe(true);
  });

  it('does not select a value the admin typed themselves', () => {
    render(<ProviderFormFlyout {...baseProps} />);

    const field = screen.getByLabelText(/endpoint url/i) as HTMLInputElement;
    fireEvent.change(field, { target: { value: 'https://my-gateway/v1' } });

    const select = jest.spyOn(field, 'select');
    fireEvent.focus(field);
    expect(select).not.toHaveBeenCalled();
    expect(fireEvent.mouseUp(field)).toBe(true);
    select.mockRestore();
  });

  it('never selects the endpoint of an existing provider being edited', () => {
    // The data-loss case: a STORED endpoint that happens to read exactly like today's placeholder
    // must not be selected-and-replaced by the first keystroke of an admin who clicked in only to
    // inspect it. `baseUrlTouched` starting true for an edit is what keeps this off.
    render(
      <ProviderFormFlyout
        {...baseProps}
        editingProvider={{
          ...editingProvider,
          type: 'anthropic',
          baseUrl: 'https://api.anthropic.com',
        }}
      />,
    );

    const field = screen.getByLabelText(/endpoint url/i) as HTMLInputElement;
    const select = jest.spyOn(field, 'select');
    fireEvent.focus(field);
    expect(select).not.toHaveBeenCalled();
    expect(fireEvent.mouseUp(field)).toBe(true);
    select.mockRestore();
  });
});

describe('ProviderFormFlyout — endpoint blocked by policy', () => {
  it('titles an SSRF/URL-policy rejection for what it is', () => {
    // The server's own reason sentence is precise and permanent; "Something went wrong" made it
    // read as a transient glitch worth retrying.
    render(
      <ProviderFormFlyout
        {...baseProps}
        error='Provider request rejected: this host is a blocked cloud-metadata endpoint.'
      />,
    );

    expect(screen.getByText('Endpoint blocked')).toBeInTheDocument();
    expect(
      screen.getByText(/blocked cloud-metadata endpoint/i),
    ).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).toBeNull();
  });

  it('keeps the generic title for any other save failure', () => {
    render(
      <ProviderFormFlyout
        {...baseProps}
        error='Could not save the provider.'
      />,
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.queryByText('Endpoint blocked')).toBeNull();
  });
});
