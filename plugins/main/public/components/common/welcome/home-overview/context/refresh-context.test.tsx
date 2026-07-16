import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { RefreshProvider, useRefresh } from './refresh-context';

function Probe() {
  const { refreshToken, refresh } = useRefresh();
  return (
    <div>
      <span data-testid='token'>{refreshToken}</span>
      <button onClick={refresh}>refresh</button>
    </div>
  );
}

describe('RefreshContext', () => {
  it('starts at token 0 and increments on refresh', () => {
    render(
      <RefreshProvider>
        <Probe />
      </RefreshProvider>,
    );
    expect(screen.getByTestId('token').textContent).toBe('0');

    fireEvent.click(screen.getByText('refresh'));
    expect(screen.getByTestId('token').textContent).toBe('1');

    fireEvent.click(screen.getByText('refresh'));
    expect(screen.getByTestId('token').textContent).toBe('2');
  });

  it('provides a safe default outside a provider', () => {
    render(<Probe />);
    expect(screen.getByTestId('token').textContent).toBe('0');
    // refresh is a no-op default; clicking must not throw.
    fireEvent.click(screen.getByText('refresh'));
    expect(screen.getByTestId('token').textContent).toBe('0');
  });
});
