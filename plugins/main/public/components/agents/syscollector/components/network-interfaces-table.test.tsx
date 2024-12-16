import React from 'react';
import { TableWzAPI } from '../../../common/tables';
import { WzRequest } from '../../../../react-services';
import { NetworkInterfacesTable } from './network-interfaces-table';
import {
  shouldFetchDataForGivenAgentId,
  shouldRenderTableWithCorrectEndpointForAgent,
} from './check-endpoint-for-given-agent-id';

let TableWzAPIMock = TableWzAPI as unknown as jest.Mock;
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
  it('should render table with correct netiface endpoint for agent either when changing agent or not', () => {
    shouldRenderTableWithCorrectEndpointForAgent(
      TableWzAPIMock,
      NetworkInterfacesTable,
      'netiface',
    );
  });

  it('should fetch netiface data for given agent id either when changing agent or not', () => {
    shouldFetchDataForGivenAgentId(
      apiReqMock,
      NetworkInterfacesTable,
      'netiface',
    );
  });
});
