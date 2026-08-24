import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ScanVulnerabilitiesAgentsModal } from './scan-vulnerabilities-modal';
import { Agent } from '../../../types';
import { scanAgentsVulnerabilitiesService } from '../../../services';

jest.mock('../../../services', () => ({
  getAgentsService: jest.fn(),
  scanAgentsVulnerabilitiesService: jest.fn(),
}));

jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: () => {},
  }),
}));

const selectedAgents = [
  { id: '001', name: 'agent1' } as Agent,
  { id: '002', name: 'agent2' } as Agent,
];

describe('ScanVulnerabilitiesAgentsModal component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should return the component', () => {
    const { container, getByText, getByRole } = render(
      <ScanVulnerabilitiesAgentsModal
        selectedAgents={selectedAgents}
        allAgentsSelected={false}
        filters={{}}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    expect(container).toMatchSnapshot();

    expect(getByText('2')).toBeInTheDocument();
    expect(getByRole('button', { name: 'Scan' })).toBeInTheDocument();
    expect(getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  test('should show the steps when the scan is requested', async () => {
    (scanAgentsVulnerabilitiesService as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: ['001', '002'],
          failed_items: [],
          total_affected_items: 2,
          total_failed_items: 0,
        },
        message: 'Scan was requested for all selected agents',
      },
    });

    const { getByRole, getByText } = render(
      <ScanVulnerabilitiesAgentsModal
        selectedAgents={selectedAgents}
        allAgentsSelected={false}
        filters={{}}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    act(() => {
      fireEvent.click(getByRole('button', { name: 'Scan' }));
    });

    await waitFor(() =>
      expect(getByText('Retrieve agents data')).toBeInTheDocument(),
    );
    expect(getByText('Scan status')).toBeInTheDocument();
    expect(
      getByText('Agents queued for vulnerabilities scan (2)'),
    ).toBeInTheDocument();
  });

  test('should show the partial success reported by the manager', async () => {
    (scanAgentsVulnerabilitiesService as jest.Mock).mockResolvedValue({
      data: {
        data: {
          affected_items: ['001'],
          failed_items: [
            { error: { code: 5000, message: 'queue_full' }, id: ['002'] },
          ],
          total_affected_items: 1,
          total_failed_items: 1,
        },
        message: 'Scan was requested for some agents',
      },
    });

    const { getByRole, getByText } = render(
      <ScanVulnerabilitiesAgentsModal
        selectedAgents={selectedAgents}
        allAgentsSelected={false}
        filters={{}}
        onClose={() => {}}
        reloadAgents={() => {}}
      />,
    );

    act(() => {
      fireEvent.click(getByRole('button', { name: 'Scan' }));
    });

    await waitFor(() =>
      expect(
        getByText('Agents queued for vulnerabilities scan (1)'),
      ).toBeInTheDocument(),
    );
    expect(
      getByText('Agents not queued for vulnerabilities scan (1)'),
    ).toBeInTheDocument();

    fireEvent.click(
      getByText('Agents not queued for vulnerabilities scan (1)'),
    );
    expect(getByText('queue_full')).toBeInTheDocument();
  });
});
