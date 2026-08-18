import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ProviderPicker } from './provider-picker';
import { ProviderSummary } from '../../../common/types';

function provider(overrides: Partial<ProviderSummary> = {}): ProviderSummary {
  return {
    id: 'p1',
    name: 'OpenAI production',
    type: 'openai_compatible',
    baseUrl: 'https://api.openai.com',
    model: 'gpt-4o',
    hasApiKey: true,
    isDefault: false,
    ...overrides,
  };
}

describe('ProviderPicker (iteration-4 item 2)', () => {
  it('shows the selected provider name as the trigger, not a raw <select>', () => {
    render(
      <ProviderPicker
        providers={[provider()]}
        selectedProviderId='p1'
        onProviderChange={jest.fn()}
        onManageProviders={jest.fn()}
      />,
    );
    expect(screen.queryByRole('combobox')).toBeNull();
    expect(
      screen.getByRole('button', { name: /OpenAI production/i }),
    ).toBeInTheDocument();
  });

  it('opens a popover listing every provider with its model underneath', () => {
    render(
      <ProviderPicker
        providers={[
          provider({ id: 'p1', name: 'OpenAI production', model: 'gpt-4o' }),
          provider({
            id: 'p2',
            name: 'Anthropic staging',
            model: 'claude-3-5-sonnet',
            isDefault: true,
          }),
        ]}
        selectedProviderId='p1'
        onProviderChange={jest.fn()}
        onManageProviders={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /OpenAI production/i }));

    expect(screen.getByText('OpenAI production')).toBeInTheDocument();
    expect(screen.getByText('gpt-4o')).toBeInTheDocument();
    expect(screen.getByText('Anthropic staging')).toBeInTheDocument();
    expect(screen.getByText('claude-3-5-sonnet')).toBeInTheDocument();
    // The non-selected provider's own default flag still surfaces as a badge.
    expect(screen.getByText('Default')).toBeInTheDocument();
  });

  it('fires the same onProviderChange handler the old select used when an item is clicked', () => {
    const onProviderChange = jest.fn();
    render(
      <ProviderPicker
        providers={[
          provider({ id: 'p1', name: 'OpenAI production' }),
          provider({ id: 'p2', name: 'Anthropic staging' }),
        ]}
        selectedProviderId='p1'
        onProviderChange={onProviderChange}
        onManageProviders={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /OpenAI production/i }));
    fireEvent.click(screen.getByText('Anthropic staging'));

    expect(onProviderChange).toHaveBeenCalledWith('p2');
  });

  it('offers a "Manage providers" item that navigates away instead of changing selection', () => {
    const onProviderChange = jest.fn();
    const onManageProviders = jest.fn();
    render(
      <ProviderPicker
        providers={[provider()]}
        selectedProviderId='p1'
        onProviderChange={onProviderChange}
        onManageProviders={onManageProviders}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /OpenAI production/i }));
    fireEvent.click(screen.getByText('Manage providers'));

    expect(onManageProviders).toHaveBeenCalledTimes(1);
    expect(onProviderChange).not.toHaveBeenCalled();
  });
});
