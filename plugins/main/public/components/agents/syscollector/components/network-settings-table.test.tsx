import React from 'react';
import { render } from '@testing-library/react';
import { TableWzAPI } from '../../../common/tables';
import { WzRequest } from '../../../../react-services';
import { NetworkSettingsTable } from './network-settings-table';

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

describe('NetworkSettingsTable', () => {
  it('should render table with correct netaddr endpoint for agent either when changing agent or not', async () => {
    const { rerender } = render(
      <NetworkSettingsTable agent={{ id: AGENT_000 }} />,
    );

    expect(TableWzAPIMock.mock.calls[0][0].endpoint).toContain(
      `/syscollector/${AGENT_000}/netaddr`,
    );

    TableWzAPIMock.mockClear();

    rerender(<NetworkSettingsTable agent={{ id: AGENT_001 }} />);

    expect(TableWzAPIMock.mock.calls[0][0].endpoint).toContain(
      `/syscollector/${AGENT_001}/netaddr`,
    );
  });

  it('should fetch netaddr data for given agent id either when changing agent or not', async () => {
    const { rerender } = render(
      <NetworkSettingsTable agent={{ id: AGENT_000 }} />,
    );

    expect(apiReqMock.mock.calls[0][0]).toEqual('GET');
    expect(apiReqMock.mock.calls[0][1]).toEqual(
      `/syscollector/${AGENT_000}/netaddr`,
    );

    apiReqMock.mockClear();

    rerender(<NetworkSettingsTable agent={{ id: AGENT_001 }} />);

    expect(apiReqMock.mock.calls[0][0]).toEqual('GET');
    expect(apiReqMock.mock.calls[0][1]).toEqual(
      `/syscollector/${AGENT_001}/netaddr`,
    );
  });
});
