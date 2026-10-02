import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { ExpandedTableRow } from './edit-role-table';

jest.mock('../../common/hocs', () => ({
  withErrorBoundary: (Component: React.ComponentType) => Component,
}));
jest.mock('../../../react-services/wz-request', () => ({
  WzRequest: { apiReq: jest.fn() },
}));
jest.mock('../../../react-services/error-handler', () => ({
  ErrorHandler: { info: jest.fn(), handle: jest.fn() },
}));
jest.mock('../../common/permissions/button', () => ({
  WzButtonPermissions: () => null,
}));
jest.mock('../../common/tables', () => ({
  TableBasicManageExpandedItems: () => null,
}));

const renderRow = (policy: object) =>
  render(<ExpandedTableRow item={{ policy }} />);

const listItemsIn = (testSubj: string) => {
  const list = document.querySelector<HTMLElement>(
    `[data-test-subj="${testSubj}"]`,
  );
  if (!list) {
    throw new Error(`No element with data-test-subj="${testSubj}"`);
  }
  return within(list)
    .getAllByRole('listitem')
    .map(item => item.textContent);
};

describe('ExpandedTableRow', () => {
  it('lists each policy action on its own line', () => {
    renderRow({
      actions: ['agent:read', 'agent:delete', 'agent:restart'],
      resources: ['agent:id:*'],
      effect: 'allow',
    });

    expect(listItemsIn('policyDetailsActions')).toEqual([
      'agent:read',
      'agent:delete',
      'agent:restart',
    ]);
  });

  it('lists each policy resource on its own line', () => {
    renderRow({
      actions: ['group:read'],
      resources: ['group:id:*', 'agent:group:default'],
      effect: 'deny',
    });

    expect(listItemsIn('policyDetailsResources')).toEqual([
      'group:id:*',
      'agent:group:default',
    ]);
  });

  it('lists a single value and keeps the effect as text', () => {
    renderRow({
      actions: ['cluster:status'],
      resources: ['*:*:*'],
      effect: 'allow',
    });

    expect(listItemsIn('policyDetailsActions')).toEqual(['cluster:status']);
    expect(listItemsIn('policyDetailsResources')).toEqual(['*:*:*']);
    expect(screen.getByText('allow')).toBeTruthy();
  });
});
