import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { queryDataTestAttr } from '../../../../../../test/public/query-attr';
import WzGroupsEditor from './groups-editor';

const mockCodeEditorProps = jest.fn();
jest.mock('@elastic/eui', () => ({
  ...jest.requireActual('@elastic/eui'),
  EuiCodeEditor: (props: {
    value: string;
    onChange: (value: string) => void;
  }) => {
    mockCodeEditorProps(props);
    return (
      <textarea
        aria-label='Code Editor'
        value={props.value}
        onChange={event => props.onChange(event.target.value)}
      />
    );
  },
}));

jest.mock('../../../../../components/common/permissions/button', () => ({
  WzButtonPermissions: ({
    children,
    isDisabled,
    onClick,
  }: {
    children: React.ReactNode;
    isDisabled: boolean;
    onClick: () => void;
  }) => (
    <button disabled={isDisabled} onClick={onClick}>
      {children}
    </button>
  ),
}));

jest.mock('../../../../../kibana-services', () => ({
  getToasts: () => ({ add: jest.fn() }),
}));
jest.mock('./utils/groups-handler', () => ({}));
jest.mock('./utils/valid-configuration', () => jest.fn());
jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: jest.fn(),
}));

const initialContent = '<agent_config></agent_config>';
const store = configureMockStore()({
  groupsReducers: {
    fileContent: {
      name: 'agent.conf',
      content: initialContent,
      isEditable: true,
      groupName: 'default',
    },
  },
});

const renderEditor = () =>
  render(
    <Provider store={store}>
      <WzGroupsEditor />
    </Provider>,
  );

describe('WzGroupsEditor', () => {
  it('marks the format error line without the editor worker', () => {
    renderEditor();
    fireEvent.change(screen.getByLabelText('Code Editor'), {
      target: { value: '<agent_config>\n  <syscheck>\n</agent_config>' },
    });

    const props = mockCodeEditorProps.mock.lastCall[0];
    expect(props.setOptions.useWorker).toBe(false);
    expect(props.annotations).toEqual([
      expect.objectContaining({ row: 2, type: 'error' }),
    ]);
  });

  it('keeps unsaved changes after opening and closing the guide', () => {
    renderEditor();
    const editedContent =
      '<agent_config os="Linux"><syscheck></syscheck></agent_config>';
    fireEvent.change(screen.getByLabelText('Code Editor'), {
      target: { value: editedContent },
    });

    fireEvent.click(
      screen.getByRole('button', { name: 'About centralized configuration' }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(
      document.querySelector(queryDataTestAttr('euiFlyoutCloseButton'))!,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Code Editor')).toHaveValue(editedContent);
  });
});
