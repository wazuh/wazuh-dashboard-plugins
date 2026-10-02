import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureMockStore from 'redux-mock-store';
import WzGroupAgentsTable from './group-agents-table';

const mockNavigateToApp = jest.fn();
interface TableColumn {
  name: string;
  render?: (item: { id: string; group: string[] }) => React.ReactElement;
}

let mockTableColumns: TableColumn[] = [];

jest.mock('../../../../../react-services/navigation-service', () => ({
  getInstance: () => ({ navigateToApp: mockNavigateToApp }),
}));

jest.mock('../../../../../kibana-services', () => ({
  getToasts: () => ({ add: jest.fn() }),
}));

jest.mock('./utils/groups-handler', () => ({}));

jest.mock('../../../../../react-services', () => ({
  getAgentOSType: () => 'linux',
  WzRequest: { apiReq: jest.fn() },
}));

jest.mock('../../../../../react-services/common-services', () => ({
  getErrorOrchestrator: () => ({ handleError: jest.fn() }),
}));

jest.mock('../../../../../components/common/tables', () => ({
  TableWzAPI: ({ tableColumns }: { tableColumns: TableColumn[] }) => {
    mockTableColumns = tableColumns;
    return null;
  },
}));

jest.mock('../../../../../components/common/permissions/button', () => ({
  WzButtonPermissions: ({
    onClick,
    'aria-label': ariaLabel,
  }: {
    onClick: () => void;
    'aria-label': string;
  }) => <button aria-label={ariaLabel} onClick={onClick} />,
}));

jest.mock('../../../../../components/common/buttons', () => ({
  WzButtonPermissionsModalConfirm: () => null,
}));

const store = configureMockStore()({
  groupsReducers: { itemDetail: { name: 'default' } },
});

describe('WzGroupAgentsTable', () => {
  it('navigates to the agent view with the agent pinned when clicking "Go to the agent"', () => {
    render(
      <Provider store={store}>
        <WzGroupAgentsTable />
      </Provider>,
    );

    const actionsColumn = mockTableColumns.find(
      ({ name }) => name === 'Actions',
    );
    const { getByLabelText } = render(
      actionsColumn!.render!({ id: '001', group: ['default'] }),
    );

    fireEvent.click(getByLabelText('Go to the agent'));

    expect(mockNavigateToApp).toHaveBeenCalledWith('endpoints-summary', {
      path: '#/agents?tab=welcome&agent=001',
    });
  });
});
