import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UpgradeAgentsModal } from './upgrade-modal';
import { Agent } from '../../../types';

jest.mock('../../../services', () => ({
  getAgentsService: jest.fn(),
  upgradeAgentsService: jest.fn(),
}));

jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: () => {},
  }),
}));

// the jest.mock of @osd/monaco is added due to a problem transcribing the files to run the tests.
// https://github.com/wazuh/wazuh-dashboard-plugins/pull/6921#issuecomment-2298289550

jest.mock('@osd/monaco', () => ({
  monaco: {},
}));

describe('UpgradeAgentsModal component', () => {
  test('should return the component', async () => {
    const { container, getByText, getByRole } = render(
      <UpgradeAgentsModal
        selectedAgents={[
          {
            id: '001',
            name: 'agent1',
          } as Agent,
        ]}
        allAgentsSelected={false}
        filters={{}}
        onClose={() => {}}
        reloadAgents={() => {}}
        setIsUpgradePanelClosed={() => {}}
      />,
    );

    expect(container).toMatchSnapshot();

    const agentCount = getByText('1');
    expect(agentCount).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Upgrade' });
    expect(saveButton).toBeInTheDocument();

    const cancelButton = getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
  });

  test('should click upgrade button', async () => {
    const { container, getByText, getByRole } = render(
      <UpgradeAgentsModal
        selectedAgents={[
          {
            id: '001',
            name: 'agent1',
          } as Agent,
        ]}
        allAgentsSelected={false}
        filters={{}}
        onClose={() => {}}
        reloadAgents={() => {}}
        setIsUpgradePanelClosed={() => {}}
      />,
    );

    const saveButton = getByRole('button', { name: 'Upgrade' });
    expect(saveButton).toBeInTheDocument();

    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() =>
      expect(getByText('Retrieve agents data')).toBeInTheDocument(),
    );
    expect(getByText('Upgrade agent tasks')).toBeInTheDocument();
  });
});
