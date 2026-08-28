import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScanVulnerabilitiesAgentModal } from './scan-vulnerabilities-agent-modal';
import { scanAgentsVulnerabilitiesService } from '../../services';
import { Agent } from '../../types';

jest.mock('../../services', () => ({
  scanAgentsVulnerabilitiesService: jest.fn(),
}));

const mockAddToast = jest.fn();

jest.mock('../../../../kibana-services', () => ({
  ...(jest.requireActual('../../../../kibana-services') as object),
  getToasts: () => ({
    add: mockAddToast,
  }),
}));

jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: () => {},
  }),
}));

const agent = {
  id: '001',
  name: 'agent1',
} as Agent;

describe('ScanVulnerabilitiesAgentModal component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return the component', () => {
    const { baseElement, getByText, getByRole } = render(
      <ScanVulnerabilitiesAgentModal
        agent={agent}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    expect(baseElement).toMatchSnapshot();

    expect(getByText('001')).toBeInTheDocument();
    expect(getByText('agent1')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Scan' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('should show a success toast when the scan is queued', async () => {
    (scanAgentsVulnerabilitiesService as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: ['001'],
          failed_items: [],
          total_affected_items: 1,
          total_failed_items: 0,
        },
        error: 0,
        message: 'Scan was requested for all selected agents',
      },
    });

    const reloadAgents = jest.fn();
    const { getByRole } = render(
      <ScanVulnerabilitiesAgentModal
        agent={agent}
        onClose={() => {}}
        reloadAgents={reloadAgents}
      />,
    );

    act(() => {
      fireEvent.click(getByRole('button', { name: 'Scan' }));
    });

    await waitFor(() => {
      expect(scanAgentsVulnerabilitiesService).toHaveBeenCalledWith({
        agentIds: ['001'],
      });
      expect(mockAddToast).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'success' }),
      );
      expect(reloadAgents).toHaveBeenCalled();
    });
  });

  test('should not show a success toast when the scan is rejected', async () => {
    (scanAgentsVulnerabilitiesService as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: [],
          failed_items: [
            { error: { code: 5000, message: 'queue_full' }, id: ['001'] },
          ],
          total_affected_items: 0,
          total_failed_items: 1,
        },
        error: 1,
        message: 'Scan was not requested for any agent',
      },
    });

    const { getByRole } = render(
      <ScanVulnerabilitiesAgentModal
        agent={agent}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    act(() => {
      fireEvent.click(getByRole('button', { name: 'Scan' }));
    });

    await waitFor(() => {
      expect(scanAgentsVulnerabilitiesService).toHaveBeenCalledWith({
        agentIds: ['001'],
      });
    });
    expect(mockAddToast).not.toHaveBeenCalled();
  });
});
