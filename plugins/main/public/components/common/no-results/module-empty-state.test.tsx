import '@testing-library/jest-dom';
import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { createStore } from 'redux';
import { PinnedAgentManager } from '../../wz-agent-selector/wz-agent-selector-service';
import { getWzCurrentAppID } from '../../../kibana-services';
import { ModuleEmptyState } from './module-empty-state';

jest.mock('../../../../common/services/web_documentation', () => ({
  webDocumentationLink: (path: string) => `https://docs.example/${path}`,
}));
jest.mock('../../../kibana-services', () => ({
  ...jest.requireActual('../../../kibana-services'),
  getWzCurrentAppID: jest.fn(),
}));
jest.mock('../../wz-agent-selector/wz-agent-selector-service', () => ({
  PinnedAgentManager: jest.fn(),
}));

describe('ModuleEmptyState', () => {
  it('renders the title, the explanation and the test id of the module', () => {
    render(
      <ModuleEmptyState testSubj='Some' title='Nothing here'>
        <p>Why it is empty.</p>
      </ModuleEmptyState>,
    );

    expect(screen.getByRole('heading', { name: 'Nothing here' })).toBeVisible();
    expect(screen.getByText('Why it is empty.')).toBeVisible();
    expect(
      document.querySelector('[data-test-subj="wzSomeEmptyState"]'),
    ).toBeInTheDocument();
  });

  it('offers to unpin the agent only when asked, before the module actions', () => {
    const onUnpinAgent = jest.fn();
    render(
      <ModuleEmptyState
        testSubj='Some'
        title='Nothing here'
        onUnpinAgent={onUnpinAgent}
        actions={[<button key='a'>Module action</button>]}
      />,
    );

    const buttons = screen.getAllByRole('button').map(b => b.textContent);
    expect(buttons).toEqual(['Unpin agent', 'Module action']);
    fireEvent.click(screen.getByRole('button', { name: 'Unpin agent' }));
    expect(onUnpinAgent).toHaveBeenCalledTimes(1);
    expect(
      document.querySelector('[data-test-subj="wzSomeEmptyStateUnpin"]'),
    ).toBeInTheDocument();
  });

  it('has no buttons without an agent or actions', () => {
    render(<ModuleEmptyState testSubj='Some' title='Nothing here' />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('links the documentation page as the last link', () => {
    render(
      <ModuleEmptyState
        testSubj='Some'
        title='Nothing here'
        docs={{
          path: 'some/page.html',
          label: 'Learn more',
          testSubj: 'guide',
        }}
      />,
    );

    expect(screen.getByRole('link', { name: /Learn more/ })).toHaveAttribute(
      'href',
      'https://docs.example/some/page.html',
    );
    expect(
      document.querySelector('[data-test-subj="guide"]'),
    ).toBeInTheDocument();
  });

  describe('with a pinned agent in the store', () => {
    const renderWithStore = (currentAgentData: { id?: string }) =>
      render(
        <Provider
          store={createStore(() => ({
            appStateReducers: { currentAgentData },
          }))}
        >
          <ModuleEmptyState testSubj='Some' title='Nothing here' />
        </Provider>,
      );

    it('offers to unpin it and unpins it on click', () => {
      const unPinAgent = jest.fn();
      (PinnedAgentManager as jest.Mock).mockImplementation(() => ({
        unPinAgent,
      }));
      renderWithStore({ id: '001' });

      fireEvent.click(screen.getByRole('button', { name: 'Unpin agent' }));

      expect(unPinAgent).toHaveBeenCalledTimes(1);
    });

    it('does not offer it when allowUnpinAgent is false', () => {
      render(
        <Provider
          store={createStore(() => ({
            appStateReducers: { currentAgentData: { id: '001' } },
          }))}
        >
          <ModuleEmptyState
            testSubj='Some'
            title='Nothing here'
            allowUnpinAgent={false}
            onUnpinAgent={jest.fn()}
          />
        </Provider>,
      );

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('does not offer it when no agent is pinned', () => {
      renderWithStore({});

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  it('links the documentation of the current module by default', () => {
    (getWzCurrentAppID as jest.Mock).mockReturnValue(
      'file-integrity-monitoring',
    );
    render(<ModuleEmptyState testSubj='Some' title='Nothing here' />);

    const link = screen.getByRole('link', { name: /in the documentation/ });
    expect(link).toHaveAttribute(
      'href',
      expect.stringContaining('file-integrity'),
    );
    expect(link).toHaveAttribute('data-test-subj', 'wzSomeEmptyStateDocs');
  });

  it('has no docs link outside a module', () => {
    (getWzCurrentAppID as jest.Mock).mockReturnValue(undefined);
    render(<ModuleEmptyState testSubj='Some' title='Nothing here' />);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });
});
