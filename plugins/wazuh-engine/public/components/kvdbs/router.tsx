import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { KVDBTable } from './components/kvdb-overview';
import { getServices } from '../../services';
import { AddDatabase } from './components/forms/addDatabase';

export const KVDBs = props => {
  return (
    <Switch>
      <Route path={`${props.basePath}/new`}>
        <AddDatabase></AddDatabase>
      </Route>
      <Route
        path={`${props.basePath}`}
        render={() => <KVDBTable TableWzAPI={getServices().TableWzAPI} />}
      ></Route>
    </Switch>
  );
};
