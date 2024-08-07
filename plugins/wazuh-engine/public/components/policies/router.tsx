import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { PoliciesTable } from './components/policies-overview/policies-overview';

export const Policies = props => {
  return (
    <Switch>
      <Route path={`${props.basePath}/new`}></Route>
      <Route
        path={`${props.basePath}`}
        render={() => <PoliciesTable />}
      ></Route>
    </Switch>
  );
};
