import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import DevToolsRequestStatusIndicator from './dev-tools-request-status-indicator';

// Mock EUI components to avoid EuiInnerText MutationObserver side-effects in tests
jest.mock('@elastic/eui', () => {
  const React = require('react');
  return {
    EuiBadge: ({ children, color }: any) => (
      <span data-test-subj='euiBadge' data-color={color || 'default'}>
        {children}
      </span>
    ),
    EuiFlexGroup: ({ children }: any) => (
      <div data-test-subj='euiFlexGroup'>{children}</div>
    ),
    EuiLoadingSpinner: () => <span data-test-subj='euiLoadingSpinner' />,
  };
});

describe('DevToolsRequestStatusIndicator', () => {
  it('shows spinner when loading', () => {
    render(<DevToolsRequestStatusIndicator loading show />);
    expect(screen.getByText(/Request in progress/i)).toBeInTheDocument();
  });

  it('renders nothing when not show and not loading', () => {
    const { container } = render(
      <DevToolsRequestStatusIndicator loading={false} show={false} />,
    );
    expect(container.textContent).not.toMatch(/OK|ERROR|Request in progress/i);
  });

  it('renders OK when ok=true and no status code', () => {
    render(<DevToolsRequestStatusIndicator loading={false} show ok />);
    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders ERROR when ok=false and no status code', () => {
    render(<DevToolsRequestStatusIndicator loading={false} show ok={false} />);
    expect(screen.getByText('ERROR')).toBeInTheDocument();
  });

  it('renders status and text when provided', () => {
    render(
      <DevToolsRequestStatusIndicator
        loading={false}
        show
        ok={false}
        status={404}
        statusText='Not Found'
      />,
    );
    expect(screen.getByText(/404\s-\sNot Found/i)).toBeInTheDocument();
  });

  it('renders rounded non-negative duration in ms', () => {
    const { rerender } = render(
      <DevToolsRequestStatusIndicator
        loading={false}
        show
        ok
        durationMs={12.5}
      />,
    );
    expect(screen.getByText('13 ms')).toBeInTheDocument();

    rerender(
      <DevToolsRequestStatusIndicator
        loading={false}
        show
        ok
        durationMs={-10}
      />,
    );
    expect(screen.getByText('0 ms')).toBeInTheDocument();
  });

  it('renders basic success meta as text', () => {
    render(
      <DevToolsRequestStatusIndicator
        loading={false}
        show
        ok
        status={200}
        statusText='OK'
        durationMs={123}
      />,
    );
    expect(screen.getByText('200 - OK')).toBeInTheDocument();
    expect(screen.getByText('123 ms')).toBeInTheDocument();
  });
});
