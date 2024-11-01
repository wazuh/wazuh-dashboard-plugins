import React from 'react';
import { render } from '@testing-library/react';
import { TableWzAPI } from '../../../common/tables';
import { WzRequest } from '../../../../react-services';
import { NetworkInterfacesTable } from './network-interfaces-table';

const AGENT_000 = '000';
const AGENT_001 = '001';

let TableWzAPIMock = TableWzAPI as jest.Mock;
let apiReqMock = WzRequest.apiReq as jest.Mock;

jest.mock('../../../common/tables', () => ({
  TableWzAPI: jest.fn(({ searchBarWQL }) => {
    searchBarWQL.suggestions.value(undefined, { field: 'hotfix' });
    return <></>;
  }),
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

describe('NetworkInterfacesTable', () => {
  it('should render table with correct netiface endpoint for agent either when changing agent or not', async () => {
    const { rerender } = render(
      <NetworkInterfacesTable agent={{ id: AGENT_000 }} />,
    );

    expect(TableWzAPIMock.mock.calls[0][0].endpoint).toContain(
      `/syscollector/${AGENT_000}/netiface`,
    );

    TableWzAPIMock.mockClear();

    rerender(<NetworkInterfacesTable agent={{ id: AGENT_001 }} />);

    expect(TableWzAPIMock.mock.calls[0][0].endpoint).toContain(
      `/syscollector/${AGENT_001}/netiface`,
    );
  });

  it('should fetch netiface data for given agent id either when changing agent or not', async () => {
    const { rerender } = render(
      <NetworkInterfacesTable agent={{ id: AGENT_000 }} />,
    );

    expect(apiReqMock.mock.calls[0][0]).toEqual('GET');
    expect(apiReqMock.mock.calls[0][1]).toEqual(
      `/syscollector/${AGENT_000}/netiface`,
    );

    apiReqMock.mockClear();

    rerender(<NetworkInterfacesTable agent={{ id: AGENT_001 }} />);

    expect(apiReqMock.mock.calls[0][0]).toEqual('GET');
    expect(apiReqMock.mock.calls[0][1]).toEqual(
      `/syscollector/${AGENT_001}/netiface`,
    );
  });
});
