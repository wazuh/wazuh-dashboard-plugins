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
  it('says what the assistant answers and shows the example questions disabled', () => {
    renderPrompt();

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'No AI provider configured',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Ask questions about your agents, findings and vulnerabilities in plain language.',
      ),
    ).toBeInTheDocument();
    for (const question of [
      'Critical findings in the last 24 hours',
      'Which agents are disconnected?',
      'Any brute force attempts today?',
    ]) {
      expect(screen.getByText(question)).toBeInTheDocument();
    }
    expect(document.querySelectorAll('.euiCard-isDisabled')).toHaveLength(3);
  });

  it('says data is sent to the provider and links to the privacy tab', () => {
    const { onOpenPrivacySettings } = renderPrompt();

    expect(
      screen.getByText(
        /the security data read to answer them, are sent to the provider/,
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByText('Privacy & data protection'));
    expect(onOpenPrivacySettings).toHaveBeenCalledTimes(1);
  });

  it('explains provider types in a tooltip', () => {
    renderPrompt();

    expect(screen.getByLabelText('What is a provider?')).toBeInTheDocument();
  });

  it('adds a provider', () => {
    const { onAddProvider } = renderPrompt();
    fireEvent.click(screen.getByRole('button', { name: 'Add a provider' }));
    expect(onAddProvider).toHaveBeenCalledTimes(1);
  });

  it('disables the add button when settings are locked', () => {
    renderPrompt({ headingLevel: 'h2', isAddProviderDisabled: true });
    expect(
      screen.getByRole('button', { name: 'Add a provider' }),
    ).toBeDisabled();
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});
