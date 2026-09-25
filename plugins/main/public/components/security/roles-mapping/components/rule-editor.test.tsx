import React from 'react';
import { render, screen } from '@testing-library/react';
import { RuleEditor } from './rule-editor';

jest.mock('../../../common/permissions/button', () => ({
  WzButtonPermissions: ({ children }: { children?: React.ReactNode }) => (
    <button>{children}</button>
  ),
}));
jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: jest.fn() }),
}));

const renderEditor = (initialRule: object) =>
  render(
    <RuleEditor
      save={jest.fn()}
      initialRule={initialRule}
      isLoading={false}
      isReserved={false}
      internalUsers={[]}
      currentPlatform=''
      onFormChange={jest.fn()}
    />,
  );

describe('RuleEditor logical operator button', () => {
  it('shows "All are true" for an AND rule', () => {
    renderEditor({ AND: [{ FIND: { a: 'b' } }, { FIND: { c: 'd' } }] });

    expect(screen.getByRole('button', { name: 'All are true' })).toBeTruthy();
  });

  it('shows "Any are true" for an OR rule', () => {
    renderEditor({ OR: [{ FIND: { a: 'b' } }, { FIND: { c: 'd' } }] });

    expect(screen.getByRole('button', { name: 'Any are true' })).toBeTruthy();
  });

  it.each(['constructor', 'hasOwnProperty', 'toString', '__proto__'])(
    'does not crash when the custom rules operator is the prototype key %s',
    operator => {
      renderEditor(JSON.parse(`{"AND":[{"OR":[]},{"${operator}":[]}]}`));

      expect(screen.getByRole('button', { name: 'Any are true' })).toBeTruthy();
    },
  );
});
