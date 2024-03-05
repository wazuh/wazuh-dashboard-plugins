import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AgentUpgradesInProgress } from './upgrades-in-progress';
import { useGetUpgradeTasks } from '../../hooks';

jest.mock('../../hooks', () => ({
  useGetUpgradeTasks: jest.fn(),
}));

jest.mock('../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({
    handleError: () => {},
  }),
}));

describe('AgentUpgradesInProgress component', () => {
  test('should return the component', async () => {
    (useGetUpgradeTasks as jest.Mock).mockReturnValue({
      getInProgressIsLoading: false,
      totalInProgressTasks: 5,
      getErrorIsLoading: false,
      totalErrorUpgradeTasks: 2,
    });

    const { container, getByText } = render(
      <AgentUpgradesInProgress reload={0} />,
    );

    expect(container).toMatchSnapshot();

    const inProgressValue = getByText('5');
    expect(inProgressValue).toBeInTheDocument();
    const inProgressText = getByText('Upgrades in progress');
    expect(inProgressText).toBeInTheDocument();

    const failedValue = getByText('2');
    expect(failedValue).toBeInTheDocument();
    const failedText = getByText('Failed upgrades');
    expect(failedText).toBeInTheDocument();
  });

  test('should show upgrade tasks modal', async () => {
    const { getByRole, getByText } = render(
      <AgentUpgradesInProgress reload={0} />,
    );

    const openModalButton = getByRole('button');
    expect(openModalButton).toBeInTheDocument();

    act(() => {
      fireEvent.click(openModalButton);
    });

    await waitFor(() => expect(getByRole('table')).toBeInTheDocument());
  });
});
