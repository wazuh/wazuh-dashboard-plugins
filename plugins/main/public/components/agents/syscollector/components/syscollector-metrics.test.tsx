import React from 'react';
import { render } from '@testing-library/react';
import { InventoryMetrics } from './syscollector-metrics';
import { queryDataTestAttr } from '../../../../../test/public/query-attr';
import { CSS } from '../../../../../test/utils/CSS';
import { useGenericRequest } from '../../../common/hooks/useGenericRequest';

const AGENT_000 = '000';
const AGENT_001 = '001';

let useGenericRequestMock = useGenericRequest as jest.Mock;

jest.mock('../../../../react-services/time-service', () => ({
  formatUIDate: jest.fn().mockReturnValue('2022-06-27T16:09:49+00:00'),
}));

jest.mock('../../../common/hooks/useGenericRequest', () => ({
  useGenericRequest: jest.fn().mockReturnValue({
    isLoading: false,
    data: {
      hardware: {
        cpu: {
          name: 'Intel(R) Core(TM) i7-10710U CPU @ 1.10GHz',
          cores: 4,
          threads: 8,
        },
        ram: {
          total: '16.0 GB',
        },
      },
      os: {
        platform: 'windows',
        version: '10.0.19045',
      },
    },
    error: '',
  }),
}));

describe('Syscollector metrics', () => {
  it('should render inventory metrics', () => {
    const { container } = render(
      // @ts-expect-error
      <InventoryMetrics agent={{ id: AGENT_000 }} />,
    );

    const inventoryMetrics = container.querySelector(
      queryDataTestAttr('syscollector-metrics'),
    );

    expect(inventoryMetrics).toBeTruthy();
  });

  it('should render syscollector ribbon items', () => {
    const { container } = render(
      // @ts-expect-error
      <InventoryMetrics agent={{ id: AGENT_000 }} />,
    );

    expect(
      container.querySelector(queryDataTestAttr('ribbon-item-cores')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('ribbon-item-memory')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('ribbon-item-arch')),
    ).toBeTruthy();

    expect(
      container.querySelector(
        queryDataTestAttr('ribbon-item-operating-system'),
      ),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('ribbon-item-cpu')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('ribbon-item-hostname')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('ribbon-item-board-serial')),
    ).toBeTruthy();

    expect(
      container.querySelector(queryDataTestAttr('ribbon-item-last-scan')),
    ).toBeTruthy();

    expect(
      container.querySelectorAll(
        queryDataTestAttr('ribbon-item-', CSS.Attribute.Substring),
      ),
    ).toHaveLength(8);
  });
});
