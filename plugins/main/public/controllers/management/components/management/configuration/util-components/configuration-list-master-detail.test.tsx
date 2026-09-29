import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

import WzConfigurationListMasterDetail from './configuration-list-master-detail';

describe('WzConfigurationListMasterDetail', () => {
  const list = {
    id: 'commands.command',
    itemLabel: (item: { tag: string }) => item.tag,
    itemFields: [
      { field: 'command', label: 'Command' },
      { field: 'interval', label: 'Interval' },
    ],
  };

  const matchingItems = [
    {
      item: {
        tag: 'restart-service',
        command: 'systemctl restart x',
        interval: '1m',
      },
      index: 0,
    },
    {
      item: { tag: 'clear-cache', command: 'rm -rf /cache', interval: '5m' },
      index: 1,
    },
  ];

  it('lists every entry on the left and shows the first entry on the right by default', () => {
    render(
      <WzConfigurationListMasterDetail
        list={list}
        matchingItems={matchingItems}
      />,
    );

    expect(
      screen.getByRole('button', { name: 'restart-service' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'clear-cache' }),
    ).toBeInTheDocument();
    expect(screen.getByDisplayValue('systemctl restart x')).toBeInTheDocument();
    expect(screen.queryByDisplayValue('rm -rf /cache')).not.toBeInTheDocument();
  });

  it('swaps the detail pane content when a different entry is selected', () => {
    render(
      <WzConfigurationListMasterDetail
        list={list}
        matchingItems={matchingItems}
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'clear-cache' }));

    expect(screen.getByDisplayValue('rm -rf /cache')).toBeInTheDocument();
    expect(
      screen.queryByDisplayValue('systemctl restart x'),
    ).not.toBeInTheDocument();
  });

  /* Regression: several `itemFields` can share the same underlying `field`
  (e.g. every `opts`-derived check on a monitored directory) and only differ
  by their `render` function -- keying each row on `field` alone collapsed
  them to duplicate React keys, corrupting reconciliation across a
  selection change and leaving some rows showing the previous item's
  rendered value. */
  it('fully replaces every rendered value when fields share the same underlying field name', () => {
    const optsList = {
      id: 'integrity-monitoring.directories',
      itemLabel: (item: { dir: string }) => item.dir,
      itemFields: [
        { field: 'dir', label: 'Selected item' },
        {
          field: 'opts',
          label: 'Enable realtime monitoring',
          render: (opts: string[]) =>
            Array.isArray(opts) && opts.includes('realtime') ? 'yes' : 'no',
        },
        {
          field: 'opts',
          label: 'Perform all checksums',
          render: (opts: string[]) =>
            Array.isArray(opts) && opts.includes('check_all') ? 'yes' : 'no',
        },
      ],
    };
    const optsMatchingItems = [
      { item: { dir: '/etc', opts: ['realtime'] }, index: 0 },
      { item: { dir: '/var/log', opts: ['check_all'] }, index: 1 },
    ];

    render(
      <WzConfigurationListMasterDetail
        list={optsList}
        matchingItems={optsMatchingItems}
      />,
    );

    // '/etc' has `realtime` enabled, not `check_all`.
    expect(screen.getByTestId('enable-realtime-monitoring')).toHaveValue('yes');
    expect(screen.getByTestId('perform-all-checksums')).toHaveValue('no');

    fireEvent.click(screen.getByRole('button', { name: '/var/log' }));

    // '/var/log' has `check_all` enabled, not `realtime` -- fully swapped,
    // not a mix of both items' values under a colliding key.
    expect(screen.getByTestId('enable-realtime-monitoring')).toHaveValue('no');
    expect(screen.getByTestId('perform-all-checksums')).toHaveValue('yes');
  });
});
