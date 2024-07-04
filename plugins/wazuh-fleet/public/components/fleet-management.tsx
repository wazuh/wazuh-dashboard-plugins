import React from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageSideBar,
  EuiSideNav,
  EuiPanel,
} from '@elastic/eui';
import { AgentList } from './agents';
import { GroupList } from './groups';
import { Route, Switch, Redirect } from 'react-router-dom';
import { getCore } from '../plugin-services';

const views = [
  {
    name: 'Agents',
    id: 'agents',
    render: (props: any) => <AgentList {...props} />,
  },
  {
    name: 'Groups',
    id: 'groups',
    render: (props: any) => <GroupList {...props} />,
  },
  {
    name: 'Agents commands',
    id: 'agents-commands',
    render: () => <div>Agents commands</div>,
  },
  {
    name: 'Comms configurations',
    id: 'comms-configurations',
    render: () => <div>Comms configurations</div>,
  },
];

export interface FleetManagementProps {
  navigationService: any;
  FleetDataSource: any;
  FleetDataSourceRepository: any;
  TableIndexer: any;
}

export const FleetManagement = ({
  navigationService,
  ...restProps
}: FleetManagementProps) => {
  const sideNav = [
    {
      name: 'Fleet Management',
      id: 'fleet-management',
      items: views.map(({ render, ...item }) => ({
        ...item,
        onClick: () => {
          navigationService
            .getInstance()
            .navigate(`/fleet-management/${item.id}`);
        },
        isSelected:
          navigationService.getInstance().getLocation().pathname ===
          `/fleet-management/${item.id}`,
      })),
    },
  ];

  return (
    <EuiPage>
      <EuiPageSideBar>
        <EuiSideNav aria-label='Fleet' items={sideNav} />
      </EuiPageSideBar>
      <EuiPageBody>
        <EuiPanel paddingSize='l'>
          <Switch>
            {views.map(item => (
              <Route
                path={`/fleet-management/${item.id}`}
                key={item.id}
                render={() => {
                  getCore().chrome.setBreadcrumbs([{ text: 'Fleet Management' }, { text: item.name }]);
                  return item.render(restProps);
                }}
              />
            ))}
            <Redirect to={`/fleet-management/${views[0].id}`} />
          </Switch>
        </EuiPanel>
      </EuiPageBody>
    </EuiPage>
  );
};
