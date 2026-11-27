/* eslint-disable camelcase -- the manager API responses are snake_case */
import React from 'react';
import { render } from '@testing-library/react';
import { DaemonReadiness } from './daemon-readiness';

const analysisd = (status: string) => ({
  ready: false,
  running: true,
  spaces: {
    standard: {
      available: false,
      enabled: true,
      status,
      last_successful_update: 0,
    },
  },
});

const rows = (testSubj: string) =>
  Array.from(document.querySelectorAll(`[data-test-subj="${testSubj}"]`)).map(
    row => row.textContent,
  );

describe('DaemonReadiness', () => {
  it('lists every daemon as ready, with no advice, when the node is ready', () => {
    render(
      <DaemonReadiness
        node={{
          'wazuh-manager-remoted': { ready: true, running: true },
          'wazuh-manager-authd': { ready: true, running: true },
          ready: true,
        }}
      />,
    );
    expect(rows('server-readiness-summary')).toEqual(['Ready']);
    expect(rows('server-readiness-daemon')).toEqual([
      'wazuh-manager-authdReady',
      'wazuh-manager-remotedReady',
    ]);
    expect(rows('server-readiness-blocker')).toEqual([]);
    expect(rows('server-readiness-advice')).toEqual([]);
  });

  it('nests what is syncing under its daemon and says to wait', () => {
    render(
      <DaemonReadiness
        node={{
          'wazuh-manager-analysisd': analysisd('updating'),
          ready: false,
        }}
      />,
    );
    expect(rows('server-readiness-summary')).toEqual(['Not ready · syncing']);
    expect(rows('server-readiness-blocker')).toEqual([
      'Content space "standard"Syncing · never synced',
    ]);
    expect(rows('server-readiness-advice')[0]).toContain(
      "New findings may be delayed until the sync completes. If it doesn't finish",
    );
  });

  it('says to act when a sync failed or a daemon stopped', () => {
    render(
      <DaemonReadiness
        node={{
          'wazuh-manager-analysisd': analysisd('failed'),
          'wazuh-manager-remoted': { ready: false, running: false },
          ready: false,
        }}
      />,
    );
    expect(rows('server-readiness-summary')).toEqual([
      'Not ready · needs attention',
    ]);
    expect(rows('server-readiness-daemon')).toEqual([
      'wazuh-manager-analysisdSync failedContent space "standard"Sync failed · never synced',
      'wazuh-manager-remotedNot running',
    ]);
    expect(rows('server-readiness-advice')[0]).toBe(
      'Check the manager logs on this node. New findings may be delayed until the content sync completes.',
    );
  });
});
