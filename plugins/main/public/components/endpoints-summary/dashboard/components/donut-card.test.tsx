import React from 'react';
import { render, act, fireEvent } from '@testing-library/react';
import DonutCard from './donut-card';
import '@testing-library/jest-dom/extend-expect';

/* It is necessary to mock the ResizeObserver class because it is used in the useChartDimensions hook in one of the DonutChart subcomponents */
class ResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = ResizeObserver;

jest.mock('../../../common/hooks/use-service', () => ({
  __esModule: true,
  useService: jest.fn(),
}));

describe('DonutCard', () => {
  const mockLoading = false;
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
  const useServiceMock = jest.fn(() => ({data: mockData, isLoading: mockLoading}));
  const mockGetInfoNoData = jest.fn().mockResolvedValue([]);
  const useServiceMockNoData = jest.fn(() => ({data: [], isLoading: mockLoading}));
  
  it('renders with data', async () => {
    require('../../../common/hooks/use-service').useService = useServiceMock;
    
    await act(async () => {
      const { getByText } = render(
        <DonutCard title='Component title example' description='Component description example' betaBadgeLabel='Component betaBadgeLabel example' getInfo={mockGetInfo} />,
      );

      expect(getByText('Component title example')).toBeInTheDocument();
      expect(getByText('Component description example')).toBeInTheDocument();
      expect(getByText('Component betaBadgeLabel example')).toBeInTheDocument();
      mockData.forEach(element => {
        expect(getByText(`${element.label} (${element.value})`)).toBeInTheDocument();  
      });
    });
  });

  it('handles click on data', async () => {
    require('../../../common/hooks/use-service').useService = useServiceMock;
    
    const handleClick = jest.fn();
    const firstMockData = mockData[0];
   
    await act(async () => {
      const { getByText } = render(
        <DonutCard title="Component title example" getInfo={mockGetInfo} onClickLabel={handleClick} />
      );
      
      fireEvent.click(getByText(`${firstMockData.label} (${firstMockData.value})`));

      expect(handleClick).toHaveBeenCalledTimes(1);

      expect(handleClick).toHaveBeenCalledWith(firstMockData);
    });
  });

  it('show noDataTitle and noDataMessage when no data', async () => {
    require('../../../common/hooks/use-service').useService = useServiceMockNoData;
    
    await act(async () => {
      const { getByText } = render(
        <DonutCard getInfo={mockGetInfoNoData} noDataTitle='Component no data title example message' noDataMessage='Component no data example message' />
      );

      expect(getByText('Component no data title example message')).toBeInTheDocument();
      expect(getByText('Component no data example message')).toBeInTheDocument();
    });
  });
});
