import React from 'react';
import { render, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UpgradeAgentModal } from './upgrade-agent-modal';

jest.mock('../../services', () => ({
  upgradeAgentService: jest.fn(),
}));

jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: () => {},
  }),
}));

describe('UpgradeAgentModal component', () => {
  test('should return the component', async () => {
    const { container, getByText, getByRole } = render(
      <UpgradeAgentModal
        agent={{
          id: '001',
          name: 'agent1',
          group: ['default'],
        }}
        onClose={() => {}}
        reloadAgents={() => {}}
        setIsUpgradePanelClosed={() => {}}
      />,
    );

    expect(container).toMatchSnapshot();

    const agentName = getByText('Upgrade agent agent1?');
    expect(agentName).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Upgrade' });
    expect(saveButton).toBeInTheDocument();

    const cancelButton = getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
  });

  test('should send to upgrade', async () => {
    const { getByRole } = render(
      <UpgradeAgentModal
        agent={{
          id: '001',
          name: 'agent1',
          group: ['default'],
        }}
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
  });
});
