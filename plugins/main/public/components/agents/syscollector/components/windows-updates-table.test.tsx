import React from 'react';
import { render } from '@testing-library/react';
import { WindowsUpdatesTable } from './windows-updates-table';
import { TableWzAPI } from '../../../common/tables';

const AGENT_000 = '000';
const AGENT_001 = '001';

let TableWzAPIMock = TableWzAPI as jest.Mock;

jest.mock('../../../common/tables', () => ({
  TableWzAPI: jest.fn(() => <></>),
}));

jest.mock('../../../../react-services', () => ({
  WzRequest: {
    apiReq: jest.fn().mockResolvedValue({
      data: {
        data: {
          affected_items: [],
        },
      },
    }),
  },
}));

describe('WindowsUpdatesTable', () => {
  it('should render table with correct hotfixes endpoint for agent either when changing agent or not', async () => {
    const { rerender } = render(
      <WindowsUpdatesTable agent={{ id: AGENT_000 }} />,
    );

    expect(TableWzAPIMock.mock.calls[0][0].endpoint).toContain(
      `/syscollector/${AGENT_000}/hotfixes`,
    );

    TableWzAPIMock.mockClear();

    rerender(<WindowsUpdatesTable agent={{ id: AGENT_001 }} />);

    expect(TableWzAPIMock.mock.calls[0][0].endpoint).toContain(
      `/syscollector/${AGENT_001}/hotfixes`,
    );
  });
});
