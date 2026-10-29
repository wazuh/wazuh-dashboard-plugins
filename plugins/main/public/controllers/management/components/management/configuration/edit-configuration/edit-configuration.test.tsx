import '@testing-library/jest-dom';
import React from 'react';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import { XML_VALIDATION_DELAY_MS } from '../utils/xml-manager';
import WzEditConfiguration from './edit-configuration';

const validXml = '<ossec_config><global></global></ossec_config>';
const invalidXml = '<ossec_config>\n  <global>\n</ossec_config>';

const mockSaveFileCluster = jest.fn();
jest.mock('../utils/wz-fetch', () => ({
  fetchFile: () => Promise.resolve(validXml),
  saveFileCluster: (...args: unknown[]) => mockSaveFileCluster(...args),
  restartNodeSelected: jest.fn(),
  clusterNodes: jest.fn(),
}));

const mockCodeEditorProps = jest.fn();
jest.mock(
  '../util-components/code-editor',
  () =>
    function MockCodeEditor(props: {
      value: string;
      onChange: (value: string) => void;
    }) {
      mockCodeEditorProps(props);
      return (
        <textarea
          aria-label='Code Editor'
          value={props.value}
          onChange={event => props.onChange(event.target.value)}
        />
      );
    },
);
jest.mock(
  '../util-components/configuration-path',
  () =>
    function MockConfigurationPath({
      children,
    }: {
      children: React.ReactNode;
    }) {
      return <div>{children}</div>;
    },
);
jest.mock('../util-components/refresh-cluster-info-button', () => () => null);
jest.mock('../../../../../../components/common/permissions/button', () => ({
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
jest.mock('../../../../../../kibana-services', () => ({
  getToasts: () => ({ add: jest.fn() }),
}));
jest.mock('../../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: jest.fn() }),
}));

const store = configureMockStore()({
  appStateReducers: { wazuhNotReadyYet: '' },
  configurationReducers: {
    clusterNodes: [{ name: 'master-node', type: 'master' }],
    clusterNodeSelected: 'master-node',
    refreshTime: 0,
  },
});

const typeContent = (value: string) =>
  fireEvent.change(screen.getByLabelText('Code Editor'), {
    target: { value },
  });

describe('WzEditConfiguration', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('checks the XML once typing pauses and never saves invalid XML', async () => {
    render(
      <Provider store={store}>
        <WzEditConfiguration updateConfigurationSection={jest.fn()} />
      </Provider>,
    );
    await screen.findByLabelText('Code Editor');
    jest.useFakeTimers();

    typeContent(invalidXml);
    expect(mockCodeEditorProps.mock.lastCall[0].annotations).toEqual([]);

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(mockSaveFileCluster).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'XML format error' }),
    ).toBeDisabled();

    typeContent(validXml);
    act(() => {
      jest.advanceTimersByTime(XML_VALIDATION_DELAY_MS);
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    expect(mockSaveFileCluster).toHaveBeenCalledWith(validXml, 'master-node');
  });
});
