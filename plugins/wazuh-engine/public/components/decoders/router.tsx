import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { DecodersTable } from './components/decoders-overview';
import { AddDatabase } from './components/forms/addDatabase';

export const Decoders = props => {
  return (
    <Switch>
      <Route path={`${props.basePath}/new`}>
        <AddDatabase></AddDatabase>
      </Route>
      <Route
        path={`${props.basePath}`}
        render={() => <DecodersTable />}
      ></Route>
    </Switch>
  );
};
