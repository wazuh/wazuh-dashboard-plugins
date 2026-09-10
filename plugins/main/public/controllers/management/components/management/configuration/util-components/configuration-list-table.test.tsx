import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';

import WzConfigurationListTable from './configuration-list-table';

describe('WzConfigurationListTable', () => {
  const list = {
    id: 'integrity-monitoring.nodiff',
    itemLabel: (item: string) => item,
    itemFields: [{ field: '', label: 'Path' }],
  };

  it('renders the single property as a table column with one row per item', () => {
    const matchingItems = [
      { item: '/etc/passwd', index: 0 },
      { item: '/etc/hosts', index: 1 },
    ];

    render(
      <WzConfigurationListTable list={list} matchingItems={matchingItems} />,
    );

    expect(
      screen.getByRole('columnheader', { name: 'Path' }),
    ).toBeInTheDocument();
    expect(screen.getByText('/etc/passwd')).toBeInTheDocument();
    expect(screen.getByText('/etc/hosts')).toBeInTheDocument();
  });

  it('applies the field render function when provided', () => {
    const renderingList = {
      id: 'policy-monitoring.sca.policies',
      itemLabel: (item: { policy: string }) => item.policy,
      itemFields: [
        {
          field: 'policy',
          label: 'Name',
          render: (v: string) => v.toUpperCase(),
        },
      ],
    };
    const matchingItems = [{ item: { policy: 'cis' }, index: 0 }];

    render(
      <WzConfigurationListTable
        list={renderingList}
        matchingItems={matchingItems}
      />,
    );

    expect(screen.getByText('CIS')).toBeInTheDocument();
  });
});
