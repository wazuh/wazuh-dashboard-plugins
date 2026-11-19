import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { I18nProvider } from '@osd/i18n/react';
import { NoProviderPrompt } from './no-provider-prompt';

const renderPrompt = (
  overrides: Partial<React.ComponentProps<typeof NoProviderPrompt>> = {},
) => {
  const props = {
    headingLevel: 'h1' as const,
    onAddProvider: jest.fn(),
    onOpenPrivacySettings: jest.fn(),
    ...overrides,
  };
  render(
    <I18nProvider>
      <NoProviderPrompt {...props} />
    </I18nProvider>,
  );
  return props;
};

describe('NoProviderPrompt', () => {
  it('says what the assistant answers and shows the example questions as previews', () => {
    renderPrompt();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Connect an AI provider',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ask about your agents, findings and vulnerabilities in plain language.',
      ),
    ).toBeInTheDocument();
    for (const question of [
      'Critical findings in the last 24 hours',
      'Which agents are disconnected?',
      'Any brute force attempts today?',
    ]) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Examples of what you can ask',
      }),
    ).toBeInTheDocument();
    expect(document.querySelectorAll('.euiCard-isDisabled')).toHaveLength(0);
  });

  it('says data is sent to the provider and links to the privacy tab', () => {
    const { onOpenPrivacySettings } = renderPrompt();

    expect(
      screen.getByText(
        /the security data used to answer them are sent to the provider/,
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Privacy & data protection'));
    expect(onOpenPrivacySettings).toHaveBeenCalledTimes(1);
  });

  it('explains provider types in a click-to-open popover', async () => {
    renderPrompt();

    const button = screen.getByRole('button', { name: 'What is a provider?' });
    expect(button).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(
      await screen.findByText(
        /A provider is the AI service that writes the answers/,
      ),
    ).toBeInTheDocument();
  });

  it('adds a provider', () => {
    const { onAddProvider } = renderPrompt();
    fireEvent.click(screen.getByRole('button', { name: 'Add provider' }));
    expect(onAddProvider).toHaveBeenCalledTimes(1);
  });

  it('hides the example questions when asked', () => {
    renderPrompt({ showExamples: false });

    expect(
      screen.queryByText('Which agents are disconnected?'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Examples of what you can ask'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText(/agents, findings and vulnerabilities/),
    ).toBeInTheDocument();
  });

  it('omits the add button when no add handler is given (Settings)', () => {
    renderPrompt({ headingLevel: 'h2', onAddProvider: undefined });
    expect(
      screen.queryByRole('button', { name: 'Add provider' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 2, name: 'Connect an AI provider' }),
    ).toBeInTheDocument();
  });
});
