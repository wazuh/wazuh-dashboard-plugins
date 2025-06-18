import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { UpgradeAgentsModalResult, RESULT_TYPE } from './result';

describe('UpgradeAgentsModalResult component', () => {
  const mockAgents = [
    {
      id: '001',
      name: 'agent1',
      version: '4.3.0',
    },
    {
      id: '002',
      name: 'agent2',
      version: '4.3.0',
    },
  ];
  const mockSuccessAgents = [
    {
      _id: {
        agentIds: [
          'zqg105UB8ES5HJJedpSO',
          'zqg105UB8ES5HJJedZOm',
          'zqg105UB8ES5HJJedZKi',
        ],
        version: 'v4.12.0',
      },
      _source: {
        agent: {
          name: 'agent',
        },
        task_id: '1234',
      },
    },
  ];
  const mockErrorAgents = [
    {
      _id: {
        agentIds: ['zqg105UB8ES5HJJedpSO'],
        version: 'v4.12.0',
      },
      error: {
        code: 8804,
        message: 'Upgrade error',
        remedation: 'Retry',
      },
    },
  ];

  test('should render loading state correctly', () => {
    const { getByText } = render(
      <UpgradeAgentsModalResult
        finalAgents={[]}
        getAgentsStatus='loading'
        saveChangesStatus='loading'
      />,
    );

    // Check step titles
    expect(getByText('Retrieve agents data')).toBeInTheDocument();
    expect(getByText('Upgrade agent tasks')).toBeInTheDocument();

    // In loading state, no agent data should be shown
    expect(screen.queryByText('Agents details')).not.toBeInTheDocument();
  });

  test('should render error state for agent retrieval', () => {
    const mockError = new Error('Failed to get agents');
    const { getByText } = render(
      <UpgradeAgentsModalResult
        finalAgents={[]}
        getAgentsStatus='danger'
        getAgentsError={mockError}
        saveChangesStatus='disabled'
      />,
    );

    // Check error message
    expect(getByText('Could not get agents data')).toBeInTheDocument();
    expect(getByText('Failed to get agents')).toBeInTheDocument();
  });

  test('should render agents accordion when agents are loaded', () => {
    const { getByText } = render(
      <UpgradeAgentsModalResult
        finalAgents={mockAgents}
        getAgentsStatus='complete'
        saveChangesStatus='loading'
      />,
    );

    // Check agents accordion
    expect(getByText('Agents details (2)')).toBeInTheDocument();

    // In loading state for save changes, should show loading message
    expect(getByText('Creating upgrade agent tasks')).toBeInTheDocument();
  });

  test('should render success state for upgrade tasks', () => {
    const { getByText } = render(
      <UpgradeAgentsModalResult
        finalAgents={mockAgents}
        getAgentsStatus='complete'
        saveChangesStatus='complete'
        result={{
          successAgents: mockSuccessAgents,
          errorAgents: [],
          totalErrorAgents: 0,
        }}
      />,
    );

    // Check success message
    expect(getByText('Upgrade agent tasks created (1)')).toBeInTheDocument();
  });

  test('should render error state for upgrade tasks', () => {
    const { getByText } = render(
      <UpgradeAgentsModalResult
        finalAgents={mockAgents}
        getAgentsStatus='complete'
        saveChangesStatus='danger'
        result={{
          successAgents: [],
          errorAgents: mockErrorAgents,
          totalErrorAgents: 1,
        }}
      />,
    );

    // Check error message
    expect(
      getByText('Upgrade agent tasks not created (1)'),
    ).toBeInTheDocument();
  });

  test('should render mixed success and error state', () => {
    const { getByText } = render(
      <UpgradeAgentsModalResult
        finalAgents={mockAgents}
        getAgentsStatus='complete'
        saveChangesStatus='complete'
        result={{
          successAgents: mockSuccessAgents,
          errorAgents: mockErrorAgents,
          totalErrorAgents: 1,
        }}
      />,
    );

    // Check both success and error messages
    expect(getByText('Upgrade agent tasks created (1)')).toBeInTheDocument();
    expect(
      getByText('Upgrade agent tasks not created (1)'),
    ).toBeInTheDocument();
  });

  test('should not render upgrade tasks when agent retrieval fails', () => {
    const mockError = new Error('Failed to get agents');
    const { queryByText } = render(
      <UpgradeAgentsModalResult
        finalAgents={[]}
        getAgentsStatus='danger'
        getAgentsError={mockError}
        saveChangesStatus='complete'
        result={{
          successAgents: mockSuccessAgents,
          errorAgents: [],
          totalErrorAgents: 0,
        }}
      />,
    );

    // No upgrade tasks should be shown
    expect(queryByText('Upgrade agent tasks created')).not.toBeInTheDocument();
  });

  test('should render empty state when no results are provided', () => {
    const { getByText, queryByText } = render(
      <UpgradeAgentsModalResult
        finalAgents={mockAgents}
        getAgentsStatus='complete'
        saveChangesStatus='complete'
        result={{}}
      />,
    );

    // Agents accordion should be shown
    expect(getByText('Agents details (2)')).toBeInTheDocument();

    // No success or error messages should be shown
    expect(queryByText('Upgrade agent tasks created')).not.toBeInTheDocument();
    expect(
      queryByText('Upgrade agent tasks not created'),
    ).not.toBeInTheDocument();
  });
});
