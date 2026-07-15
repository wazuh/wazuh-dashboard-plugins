import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentUpgradesInProgress } from './upgrades-in-progress';
import { useGetUpgradeTasks } from '../../hooks';

jest.mock('../../hooks', () => ({
  useGetUpgradeTasks: jest.fn(),
}));

const mockHandleError = jest.fn();

jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: (...args: any[]) => mockHandleError(...args),
  }),
}));

describe('AgentUpgradesInProgress component', () => {
  beforeEach(() => {
    mockHandleError.mockClear();
  });

  test('should return the component', async () => {
    (useGetUpgradeTasks as jest.Mock).mockReturnValue({
      getInProgressIsLoading: false,
      totalInProgressTasks: 5,
      getErrorIsLoading: false,
      totalErrorUpgradeTasks: 2,
    });

    const { container, getByText } = render(
      <AgentUpgradesInProgress
        reload={0}
        setIsModalVisible={() => {}}
        isPanelClosed={false}
        setIsPanelClosed={() => {}}
      />,
    );

    expect(container).toMatchSnapshot();

    const inProgressValue = getByText('5');
    expect(inProgressValue).toBeInTheDocument();
    const inProgressText = getByText('In progress');
    expect(inProgressText).toBeInTheDocument();

    const failedValue = getByText('2');
    expect(failedValue).toBeInTheDocument();
    const failedText = getByText('Failed');
    expect(failedText).toBeInTheDocument();
  });

  test('should show upgrade tasks modal', async () => {
    const { getByRole } = render(
      <AgentUpgradesInProgress
        reload={0}
        setIsModalVisible={() => {}}
        isPanelClosed={false}
        setIsPanelClosed={() => {}}
      />,
    );

    const openModalButton = getByRole('button', { name: 'Task details' });
    expect(openModalButton).toBeInTheDocument();

    act(() => {
      fireEvent.click(openModalButton);
    });
  });

  test('should show a single permission toast when the user lacks task:status', async () => {
    const permissionError = new Error(
      'API error: ERR_BAD_REQUEST - Permission denied: Resource type: *:*',
    );

    (useGetUpgradeTasks as jest.Mock).mockReturnValue({
      totalInProgressTasks: 0,
      getInProgressError: permissionError,
      getSuccessError: permissionError,
      getErrorTasksError: permissionError,
      getTimeoutError: permissionError,
    });

    render(
      <AgentUpgradesInProgress
        reload={0}
        setIsModalVisible={() => {}}
        isPanelClosed={false}
        setIsPanelClosed={() => {}}
      />,
    );

    await waitFor(() => {
      expect(mockHandleError).toHaveBeenCalledTimes(1);
    });

    const [options] = mockHandleError.mock.calls[0];
    expect(options.severity).toBe('BUSINESS');
    expect(options.level).toBe('WARNING');
    expect(options.error.title).toBe('No permissions to view upgrade tasks');
    expect(typeof options.error.error).toBe('string');
    expect(options.error.message).not.toContain('Permission denied');
    expect(options.error.message).toContain('task:status');
  });

  test('should call handleError once for a genuine non-permission error', async () => {
    const genericError = new Error('Internal Server Error');

    (useGetUpgradeTasks as jest.Mock).mockReturnValue({
      totalInProgressTasks: 0,
      getInProgressError: genericError,
    });

    render(
      <AgentUpgradesInProgress
        reload={0}
        setIsModalVisible={() => {}}
        isPanelClosed={false}
        setIsPanelClosed={() => {}}
      />,
    );

    await waitFor(() => {
      expect(mockHandleError).toHaveBeenCalledTimes(1);
    });

    const [options] = mockHandleError.mock.calls[0];
    expect(options.severity).toBe('BUSINESS');
  });
});
