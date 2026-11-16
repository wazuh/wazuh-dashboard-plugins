import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { agentsTableColumns } from './columns';
import { Agent } from '../types';

jest.mock('../../../react-services/time-service', () => ({
  formatUIDate: () => 'Jan 1, 2026 @ 10:00:00.000',
}));

const getColumn = (field: string, pendingUpgradeAgentIds?: Set<string>) => {
  const columns = agentsTableColumns(
    () => {},
    () => {},
    () => {},
    () => {},
    '5.0.0',
    {
      setIsRemoveModalVisible: () => {},
      setIsScanVulnerabilitiesModalVisible: () => {},
      pendingUpgradeAgentIds,
    },
  );
  return columns.find((column: any) => column.field === field) as any;
};

describe('agentsTableColumns version column', () => {
  it('shows only the version when up to date', () => {
    const column = getColumn('version');
    const { getByText, queryByText } = render(
      <>{column.render('5.0.0', { id: '001' } as Agent)}</>,
    );

    expect(getByText('5.0.0')).toBeInTheDocument();
    expect(queryByText('Upgrading')).not.toBeInTheDocument();
  });

  it('shows the outdated indicator when the version is lower than the API version', () => {
    const column = getColumn('version');
    const { getByText } = render(
      <>{column.render('4.5.0', { id: '001' } as Agent)}</>,
    );

    expect(getByText('4.5.0')).toBeInTheDocument();
  });
});

describe('agentsTableColumns status column', () => {
  it('does not show an "Upgrading" badge for agents outside the pending set', () => {
    const column = getColumn('status', new Set(['002']));
    const { queryByText } = render(
      <>{column.render('active', { id: '001' } as Agent)}</>,
    );

    expect(queryByText('Upgrading')).not.toBeInTheDocument();
  });

  it('shows an "Upgrading" badge for a pending agent', () => {
    const column = getColumn('status', new Set(['001']));
    const { getByText } = render(
      <>{column.render('active', { id: '001' } as Agent)}</>,
    );

    expect(getByText('Upgrading')).toBeInTheDocument();
  });
});

describe('agentsTableColumns date columns', () => {
  it('shows the last keep alive column by default', () => {
    expect(getColumn('lastKeepAlive').show).toBe(true);
  });

  it('keeps the registration date column hidden by default', () => {
    expect(getColumn('dateAdd').show).toBe(false);
  });

  it.each(['lastKeepAlive', 'dateAdd'])(
    'uses an info icon for the not searchable note of %s',
    field => {
      const { container } = render(getColumn(field).name);

      expect(
        container.querySelector('[data-euiicon-type="iInCircle"]'),
      ).not.toBeNull();
      expect(container.querySelector('[data-euiicon-type="alert"]')).toBeNull();
    },
  );

  it('renders the last keep alive in relative time with the date in a tooltip', async () => {
    const lastKeepAlive = new Date(Date.now() - 12 * 60 * 1000).toISOString();
    const { getByText } = render(
      <>{getColumn('lastKeepAlive').render(lastKeepAlive, {} as Agent)}</>,
    );

    fireEvent.mouseOver(getByText('12 minutes ago'));
    expect(
      await screen.findByText('Jan 1, 2026 @ 10:00:00.000'),
    ).toBeInTheDocument();
  });

  it('renders a dash when there is no last keep alive', () => {
    const { getByText } = render(
      <>{getColumn('lastKeepAlive').render(undefined, {} as Agent)}</>,
    );

    expect(getByText('-')).toBeInTheDocument();
  });
});
