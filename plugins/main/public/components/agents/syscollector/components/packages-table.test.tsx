import React from 'react';
import { render } from '@testing-library/react';
import { TableWzAPI } from '../../../common/tables';
import { WzRequest } from '../../../../react-services';
import { PackagesTable } from './packages-table';

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

jest.mock('./with-so-platform-guard', () => ({
  withSOPlatformGuard: jest.fn(Component => Component),
}));

describe('PackagesTable', () => {
  it('should render table with correct hotfixes endpoint for agent either when changing agent or not', async () => {
    const { rerender } = render(<PackagesTable agent={{ id: AGENT_000 }} />);

    expect(TableWzAPIMock.mock.calls[0][0].endpoint).toContain(
      `/syscollector/${AGENT_000}/packages`,
    );

    TableWzAPIMock.mockClear();

    rerender(<PackagesTable agent={{ id: AGENT_001 }} />);

    expect(TableWzAPIMock.mock.calls[0][0].endpoint).toContain(
      `/syscollector/${AGENT_001}/packages`,
    );
  });

  it('should fetch syscollector data for given agent id either when changing agent or not', async () => {
    const { rerender } = render(<PackagesTable agent={{ id: AGENT_000 }} />);

    expect(apiReqMock.mock.calls[0][0]).toEqual('GET');
    expect(apiReqMock.mock.calls[0][1]).toEqual(
      `/syscollector/${AGENT_000}/packages`,
    );

    apiReqMock.mockClear();

    rerender(<PackagesTable agent={{ id: AGENT_001 }} />);

    expect(apiReqMock.mock.calls[0][0]).toEqual('GET');
    expect(apiReqMock.mock.calls[0][1]).toEqual(
      `/syscollector/${AGENT_001}/packages`,
    );
  });
});
