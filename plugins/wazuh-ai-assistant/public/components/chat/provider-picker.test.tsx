import React from 'react';
import {
  render,
  screen,
  fireEvent,
  within,
  waitFor,
} from '@testing-library/react';
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

    // Scoped to the popover: "OpenAI production" also names the trigger button itself, so an
    // unscoped getByText matches both and throws.
    const menu = within(screen.getByRole('dialog'));
    expect(menu.getByText('OpenAI production')).toBeInTheDocument();
    expect(menu.getByText('gpt-4o')).toBeInTheDocument();
    expect(menu.getByText('Anthropic staging')).toBeInTheDocument();
    expect(menu.getByText('claude-3-5-sonnet')).toBeInTheDocument();
    // The non-selected provider's own default flag still surfaces as a badge. Asserted as a
    // count rather than a single getByText: it is only accidentally singular here (one of two
    // providers is marked default) and a second default item must not silently make this throw.
    expect(menu.queryAllByText('Default')).toHaveLength(1);
  });

  it('closes the popover after a provider is selected', async () => {
    render(
      <ProviderPicker
        providers={[
          provider({ id: 'p1', name: 'OpenAI production' }),
          provider({ id: 'p2', name: 'Anthropic staging' }),
        ]}
        selectedProviderId='p1'
        onProviderChange={jest.fn()}
        onManageProviders={jest.fn()}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: /OpenAI production/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Anthropic staging'));

    // `closePopover` sets `isOpen={false}` synchronously, but the underlying EuiPopover keeps the
    // panel mounted for its own 250ms exit-transition timeout (real component behavior, not a test
    // artifact — see eui_components/popover/popover.js's `componentDidUpdate`) before actually
    // removing it from the DOM. An immediate synchronous assertion here raced that timeout and
    // always found the still-mounted dialog; `waitFor` gives the transition time to finish.
    await waitFor(() =>
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
    );
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

  it('exposes the trigger and the selected item to assistive tech via ARIA, not just an icon', () => {
    render(
      <ProviderPicker
        providers={[
          provider({ id: 'p1', name: 'OpenAI production' }),
          provider({ id: 'p2', name: 'Anthropic staging' }),
        ]}
        selectedProviderId='p1'
        onProviderChange={jest.fn()}
        onManageProviders={jest.fn()}
      />,
    );

    const trigger = screen.getByRole('button', { name: /OpenAI production/i });
    expect(trigger).toHaveAttribute('aria-haspopup', 'true');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    const items = screen.getAllByRole('menuitemradio');
    // The two provider items come first (in list order), the "Manage providers" footer action
    // isn't part of the radio group and so isn't in this list at all.
    expect(items).toHaveLength(2);
    expect(items[0]).toHaveAttribute('aria-checked', 'true');
    expect(items[1]).toHaveAttribute('aria-checked', 'false');
  });
});
