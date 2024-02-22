import React from 'react';
import { render, waitFor, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import DonutCard from './donut-card';

describe('DonutCard', () => {
  const mockData = [
    {
      status: 'active',
      label: 'Active',
      value: 1,
      color: '#007871',
    },
    {
      status: 'disconnected',
      label: 'Disconnected',
      value: 0,
      color: '#BD271E',
    },
    {
      status: 'pending',
      label: 'Pending',
      value: 0,
      color: '#FEC514',
    },
    {
      status: 'never_connected',
      label: 'Never connected',
      value: 0,
      color: '#646A77',
    },
  ];

  const mockGetInfo = jest.fn().mockResolvedValue(mockData);
  jest.mock('../../../common/hooks/useApiService', () => ({
    useApiService: jest.fn().mockReturnValue([false, mockData]),
  }));

  it('renders with data', async () => {
    await act(async () => {
      const { getByText } = render(
        <DonutCard title='Test Title' getInfo={mockGetInfo} />,
      );

      expect(getByText('Test Title')).toBeInTheDocument();
    });
  });
});
