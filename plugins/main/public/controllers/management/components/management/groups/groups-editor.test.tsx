import '@testing-library/jest-dom';
import React from 'react';
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { queryDataTestAttr } from '../../../../../../test/public/query-attr';
import { XML_VALIDATION_DELAY_MS } from '../configuration/utils/xml-manager';
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

const mockSendGroupConfiguration = jest.fn();
jest.mock('../../../../../kibana-services', () => ({
  getToasts: () => ({ add: jest.fn() }),
}));
jest.mock('./utils/groups-handler', () => ({
  sendGroupConfiguration: (...args: unknown[]) =>
    mockSendGroupConfiguration(...args),
}));
jest.mock('./utils/valid-configuration', () => jest.fn());
jest.mock('../../../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));
jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: jest.fn(),
}));

const validContent = '<agent_config></agent_config>';
const invalidContent = '<agent_config>\n  <syscheck>\n</agent_config>';
const commandContent = `<agent_config>
  <wodle name="command">
    <command>ss -ltnp</command>
    <interval>1m</interval>
    <tag>nc-check</tag>
  </wodle>
</agent_config>`;

const renderEditor = (content = validContent, isEditable = true) =>
  render(
    <Provider
      store={configureMockStore()({
        groupsReducers: {
          fileContent: {
            name: 'agent.conf',
            content,
            isEditable,
            groupName: 'default',
          },
        },
      })}
    >
      <WzGroupsEditor />
    </Provider>,
  );

const lastEditorProps = () => mockCodeEditorProps.mock.lastCall[0];
const typeContent = (value: string) =>
  fireEvent.change(screen.getByLabelText('Code Editor'), {
    target: { value },
  });

describe('WzGroupsEditor', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('marks the format error line once typing pauses', () => {
    jest.useFakeTimers();
    renderEditor();
    typeContent(invalidContent);

    expect(lastEditorProps().setOptions.useWorker).toBe(false);
    expect(lastEditorProps().annotations).toEqual([]);

    act(() => {
      jest.advanceTimersByTime(XML_VALIDATION_DELAY_MS);
    });
    expect(lastEditorProps().annotations).toEqual([
      expect.objectContaining({ row: 2, type: 'error' }),
    ]);
  });

  it('marks an invalid file as soon as it opens', () => {
    renderEditor(invalidContent);

    expect(lastEditorProps().annotations).toEqual([
      expect.objectContaining({ row: 2, type: 'error' }),
    ]);
  });

  it('does not save invalid content typed before the check runs', () => {
    jest.useFakeTimers();
    renderEditor();
    typeContent(invalidContent);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockSendGroupConfiguration).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'XML format error' }),
    ).toBeDisabled();
  });

  it.each([
    ['with a command', commandContent],
    ['without a command', validContent],
  ])('warns that agents ignore remote commands for a file %s', (_, content) => {
    renderEditor(content);

    const warning = document.querySelector(
      queryDataTestAttr('wzGroupsEditorRemoteCommandsWarning'),
    );
    expect(warning).toBeInTheDocument();
    expect(warning).toHaveTextContent('local_internal_options.conf');
    expect(warning).toHaveTextContent('wazuh_command.remote_commands=1');
    expect(warning).toHaveTextContent('logcollector.remote_commands=1');
    const docsLink = screen.getByRole('link', { name: /Learn more/ });
    expect(docsLink).toHaveAttribute(
      'href',
      'https://docs.example/user-manual/capabilities/command-monitoring/requirements.html#remote-command-execution',
    );
    expect(docsLink).toHaveAttribute('target', '_blank');
    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('saves a file with a command while the warning is shown', async () => {
    renderEditor();
    typeContent(commandContent);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(mockSendGroupConfiguration).toHaveBeenCalledWith(
        'agent.conf',
        'default',
        commandContent,
      ),
    );
  });

  it('does not show the warning for a read-only file', () => {
    renderEditor(commandContent, false);

    expect(
      document.querySelector(
        queryDataTestAttr('wzGroupsEditorRemoteCommandsWarning'),
      ),
    ).not.toBeInTheDocument();
  });

  it('keeps unsaved changes after opening and closing the guide', () => {
    renderEditor();
    const editedContent =
      '<agent_config os="Linux"><syscheck></syscheck></agent_config>';
    typeContent(editedContent);

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
