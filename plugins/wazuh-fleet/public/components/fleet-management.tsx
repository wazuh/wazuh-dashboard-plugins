import React from 'react';
import {
  EuiPage,
  EuiPageBody,
  EuiPageSideBar,
  EuiSideNav,
  EuiPanel,
} from '@elastic/eui';
import { AgentList } from './agents';
import { GroupList } from './groups/list/list';
import { Route, Switch, Redirect } from 'react-router-dom';
import { getCore } from '../plugin-services';
import { AgentDetails } from './agents/details';
import { CommandsList } from './commands';


const views = [
  {
    name: 'Agents',
    id: 'agents',
    hasDetailsRoute: true,
    render: (props: any) => <AgentList {...props} />,
  },
  {
    name: 'Groups',
    id: 'groups',
    hasDetailsRoute: true,
    render: (props: any) => <GroupList {...props} />,
  },
  {
    name: 'Agents commands',
    id: 'agents-commands',
    render: (props: any) => <CommandsList {...props} />,
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
        isSelected: navigationService
          .getInstance()
          .getLocation()
          .pathname.startsWith(`/fleet-management/${item.id}`),
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
            {views.reduce((acc, item) => {
              return [
                ...acc,
                item.hasDetailsRoute ? (
                  <Route
                    key={`${item.id}-details`}
                    path={`/fleet-management/${item.id}/:id`}
                    render={props => {
                      getCore().chrome.setBreadcrumbs([
                        { text: 'Fleet Management' },
                        {
                          text: item.name,
                          href: getCore().application.getUrlForApp(
                            'fleet-management',
                            {
                              path: `#/fleet-management/${item.id}`,
                            },
                          ),
                        },
                        { text: `ID / ${props.match.params.id}` },
                      ]);

                      if (item.id === 'agents') {
                        return <AgentDetails {...restProps} />;
                      }

                      if (item.id === 'groups') {
                        return <div>Group</div>
                      }

                    }}
                  />
                ) : null,
                <Route
                  key={`${item.id}`}
                  path={`/fleet-management/${item.id}`}
                  render={() => {
                    getCore().chrome.setBreadcrumbs([
                      { text: 'Fleet Management' },
                      { text: item.name },
                    ]);
                    return item.render(restProps);
                  }}
                />,
              ];
            }, [])}
            <Redirect to={`/fleet-management/${views[0].id}`} />
          </Switch>
        </EuiPanel>
      </EuiPageBody>
    </EuiPage>
  );
};
