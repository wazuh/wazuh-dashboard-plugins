import React, { useState } from 'react';
import {
  EuiSideNav,
  EuiPage,
  EuiPageSideBar,
  EuiPageBody,
  EuiPanel,
} from '@elastic/eui';
import { Route, Switch, Redirect } from 'react-router-dom';
import { Decoders } from './decoders';
import { Filters } from './filters';
import { Outputs } from './outputs';
import { Rules } from './rules';
import { Integrations } from './integrations';
import { KVDBs } from './kvdbs';
import { Policies } from './policies';
import { EngineLayout } from './engine-layout';
import { getServices, setServices } from '../services';

const views = [
  {
    name: 'Decoders',
    id: 'decoders',
    render: Decoders,
  },
  {
    name: 'Rules',
    id: 'rules',
    render: Rules,
  },
  {
    name: 'Outputs',
    id: 'outputs',
    render: Outputs,
  },
  {
    name: 'Filters',
    id: 'filters',
    render: Filters,
  },
  {
    name: 'Policies',
    id: 'policies',
    render: Policies,
  },
  {
    name: 'Integrations',
    id: 'integrations',
    render: Integrations,
  },
  {
    name: 'KVDBs',
    id: 'kvdbs',
    render: KVDBs,
  },
];

export const Engine = props => {
  const [isSideNavOpenOnMobile, setisSideNavOpenOnMobile] = useState(false);
  const toggleOpenOnMobile = () => {
    setisSideNavOpenOnMobile(!isSideNavOpenOnMobile);
  };

  try {
    !getServices();
  } catch (error) {
    setServices(props);
  }

  const sideNav = [
    {
      name: 'Security policies',
      id: 'engine',
      items: views.map(({ render, ...item }) => ({
        ...item,
        onClick: () => {
          props.navigationService.getInstance().navigate(`/engine/${item.id}`);
        },
        isSelected: props.location.pathname === `/engine/${item.id}`,
      })),
    },
  ];

  return (
    <EuiPage>
      <EuiPageSideBar>
        <EuiSideNav
          aria-label='Engine'
          mobileTitle=''
          //  toggleOpenOnMobile={() => toggleOpenOnMobile()}
          //isOpenOnMobile={isSideNavOpenOnMobile}
          //TODO: Width mustn't be hardcoded
          style={{ width: 192 }}
          items={sideNav}
        />
      </EuiPageSideBar>
      <EuiPageBody>
        <EuiPanel>
          <Switch>
            {views.map(item => (
              <Route
                path={`/engine/${item.id}`}
                key={item.id}
                render={() => {
                  return (
                    <EngineLayout title={item.name}>
                      {item.render({
                        ...props,
                        title: item.name,
                        basePath: `/engine/${item.id}`,
                      })}
                    </EngineLayout>
                  );
                }}
              />
            ))}
            <Redirect to={`/engine/${views[0].id}`} />
          </Switch>
        </EuiPanel>
      </EuiPageBody>
    </EuiPage>
  );
};
