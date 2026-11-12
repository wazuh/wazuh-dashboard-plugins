import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { RuleEditor } from './rule-editor';

const mockCodeEditorProps = jest.fn();
jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  EuiCodeEditor: (props: object) => {
    mockCodeEditorProps(props);
    return null;
  },
}));

jest.mock('../../../common/permissions/button', () => ({
  WzButtonPermissions: ({
    children,
    onClick,
  }: {
    children?: React.ReactNode;
    onClick?: () => void;
  }) => <button onClick={onClick}>{children}</button>,
}));
jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: jest.fn() }),
}));

const renderEditor = (initialRule: object, save = jest.fn()) =>
  render(
    <RuleEditor
      save={save}
      initialRule={initialRule}
      isLoading={false}
      isReserved={false}
      internalUsers={[]}
      currentPlatform='OpenSearch Dashboards Security'
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

describe('RuleEditor JSON editor', () => {
  it('does not start the editor validation worker', () => {
    renderEditor({ AND: [{ FIND: { a: 'b' } }] });
    fireEvent.click(
      screen.getByRole('button', { name: 'Switch to JSON editor' }),
    );

    const props = mockCodeEditorProps.mock.lastCall[0];
    expect(props.setOptions.useWorker).toBe(false);
  });
});

describe('RuleEditor new rules', () => {
  const addRule = () =>
    fireEvent.click(screen.getByRole('button', { name: 'Add new rule' }));

  it('starts a new rule empty', () => {
    renderEditor({});
    addRule();

    expect(screen.queryByText('user_name')).toBeNull();
    expect(screen.queryByDisplayValue('wazuh')).toBeNull();
    expect(
      (screen.getByPlaceholderText('Value to match') as HTMLInputElement).value,
    ).toBe('');
  });

  it('does not save a rule without user field', () => {
    const save = jest.fn();
    renderEditor({}, save);
    addRule();
    fireEvent.click(screen.getByRole('button', { name: 'Save role mapping' }));

    expect(save).not.toHaveBeenCalled();
    expect(screen.getByText('Select or type a user field.')).toBeTruthy();
  });

  it('asks for confirmation before saving an unknown user field', () => {
    const save = jest.fn();
    renderEditor({ FIND: { user_namebackend_roles: 'x' } }, save);
    fireEvent.click(screen.getByRole('button', { name: 'Save role mapping' }));

    expect(save).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        /These fields are not known user fields.*user_namebackend_roles/,
      ),
    ).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'Save anyway' }));
    expect(save).toHaveBeenCalledWith({
      FIND: { user_namebackend_roles: 'x' },
    });
  });

  it('saves a known user field without confirmation', () => {
    const save = jest.fn();
    renderEditor({ FIND: { backend_roles: 'x' } }, save);
    fireEvent.click(screen.getByRole('button', { name: 'Save role mapping' }));

    expect(save).toHaveBeenCalledWith({ FIND: { backend_roles: 'x' } });
  });
});
