import '@testing-library/jest-dom';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { ReadinessCallout } from './readiness-callout';

const analysisd = (status: string) => ({
  ready: false,
  running: true,
  spaces: { standard: { available: false, enabled: true, status } },
});

const blockerRows = () =>
  Array.from(
    document.querySelectorAll('[data-test-subj="server-readiness-blocker"]'),
  ).map(row => row.textContent);

describe('ReadinessCallout', () => {
  it('renders nothing when every daemon is ready', () => {
    const { container } = render(
      <ReadinessCallout
        node={{
          'wazuh-manager-authd': { ready: true, running: true },
          ready: true,
        }}
      />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('says to wait while content is syncing, and warns about delayed findings', () => {
    render(
      <ReadinessCallout
        node={{
          'wazuh-manager-analysisd': analysisd('updating'),
          ready: false,
        }}
      />,
    );
    expect(
      screen.getByText('Syncing, no action needed yet'),
    ).toBeInTheDocument();
    expect(blockerRows()).toEqual([
      'analysisd · Content space "standard"syncing',
    ]);
    expect(screen.getByText(/can take 10 to 15 minutes/)).toBeInTheDocument();
    expect(screen.getByText(/New findings may be delayed/)).toBeInTheDocument();
  });

  it('asks to act when a sync failed or a daemon is stopped', () => {
    render(
      <ReadinessCallout
        node={{
          'wazuh-manager-analysisd': analysisd('failed'),
          'wazuh-manager-remoted': { ready: false, running: false },
          ready: false,
        }}
      />,
    );
    expect(screen.getByText('Action needed')).toBeInTheDocument();
    expect(blockerRows()).toEqual([
      'analysisd · Content space "standard"sync failed',
      'remotednot running',
    ]);
    expect(screen.getByText(/Check the manager logs/)).toBeInTheDocument();
  });

  it('does not mention findings when no content space is pending', () => {
    render(
      <ReadinessCallout
        node={{
          'wazuh-manager-modulesd': {
            ready: false,
            running: true,
            modules: {
              'vulnerability-detector': {
                enabled: true,
                available: false,
                status: 'updating',
              },
            },
          },
          ready: false,
        }}
      />,
    );
    expect(blockerRows()).toEqual(['modulesd · Vulnerability feedsyncing']);
    expect(
      screen.queryByText(/New findings may be delayed/),
    ).not.toBeInTheDocument();
  });
});
