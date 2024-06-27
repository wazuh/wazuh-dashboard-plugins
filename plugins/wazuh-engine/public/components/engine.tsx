import React, { useState } from 'react';
import { EuiSideNav, EuiPage, EuiPageSideBar, EuiPageBody } from '@elastic/eui';
import { Route, Switch, Redirect } from 'react-router-dom';
import { Decoders } from './decoders';
import { Filters } from './filters';
import { Outputs } from './outputs';
import { Rules } from './rules';
import { Integrations } from './integrations';
import { KVDBs } from './kvdbs';
import { Policies } from './policies';

export const Engine = props => {
  const [isSideNavOpenOnMobile, setisSideNavOpenOnMobile] = useState(false);
  const toggleOpenOnMobile = () => {
    setisSideNavOpenOnMobile(!isSideNavOpenOnMobile);
  };

  const sideNav = [
    {
      name: 'Engine',
      id: 'engine',
      items: [
        {
          name: 'Decoders',
          id: 'decoders',
        },
        {
          name: 'Rules',
          id: 'rules',
        },
        {
          name: 'Outputs',
          id: 'outputs',
        },
        {
          name: 'Filters',
          id: 'filters',
        },
        {
          name: 'Integrations',
          id: 'integrations',
        },
        {
          name: 'Policies',
          id: 'policies',
        },
        {
          name: 'KVDBs',
          id: 'kvdbs',
        },
      ].map(item => ({
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
        <Switch>
          <Route path={'/engine/decoders'} render={Decoders} />
          <Route path={'/engine/filters'} render={Filters} />
          <Route path={'/engine/outputs'} render={Outputs} />
          <Route path={'/engine/rules'} render={Rules} />
          <Route path={'/engine/integrations'} render={Integrations} />
          <Route path={'/engine/kvdbs'} render={KVDBs} />
          <Route path={'/engine/policies'} render={Policies} />
          <Redirect to={'/engine/policies'} />
        </Switch>
      </EuiPageBody>
    </EuiPage>
  );
};
