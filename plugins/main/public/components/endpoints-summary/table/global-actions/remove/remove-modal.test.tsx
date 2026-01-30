import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RemoveAgentsModal } from './remove-modal';
import { Agent } from '../../../types';

jest.mock('../../../services', () => ({
  getAgentsService: jest.fn(),
  removeAgentsService: jest.fn(),
}));

jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: () => { },
  }),
}));

describe('RemoveAgentsModal component', () => {
  test('should return the component', async () => {
    const { container, getByText, getByRole } = render(
      <RemoveAgentsModal
        selectedAgents={[
          {
            id: '001',
            name: 'agent1',
          } as Agent,
        ]}
        allAgentsSelected={false}
        filters={{}}
        onClose={() => { }}
        reloadAgents={() => { }}
      />,
    );

    expect(container).toMatchSnapshot();

    const agentCount = getByText('1');
    expect(agentCount).toBeInTheDocument();

    const saveButton = getByRole('button', { name: 'Remove' });
    expect(saveButton).toBeInTheDocument();

    const cancelButton = getByRole('button', { name: 'Cancel' });
    expect(cancelButton).toBeInTheDocument();
  });

  test('should click remove button', async () => {
    const { container, getByText, getByRole } = render(
      <RemoveAgentsModal
        selectedAgents={[
          {
            id: '001',
            name: 'agent1',
          } as Agent,
        ]}
        allAgentsSelected={false}
        filters={{}}
        onClose={() => { }}
        reloadAgents={() => { }}
      />,
    );

    const saveButton = getByRole('button', { name: 'Remove' });
    expect(saveButton).toBeInTheDocument();

    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() =>
      expect(getByText('Retrieve agents data')).toBeInTheDocument(),
    );
    expect(getByText('Apply agents removal')).toBeInTheDocument();
  });
});
