import React from 'react';
import { render } from '@testing-library/react';
import '@testing-library/jest-dom';
import { agentsTableColumns } from './columns';
import { Agent } from '../types';

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
