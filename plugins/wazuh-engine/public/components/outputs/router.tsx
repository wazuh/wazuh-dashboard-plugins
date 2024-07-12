import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { List } from './pages/list';
import { Create } from './pages/create';
import { Edit } from './pages/edit';

export const Outputs = props => {
  return (
    <Switch>
      <Route path={`${props.basePath}/create`}>
        <Create {...props} />
      </Route>
      <Route
        path={`${props.basePath}/edit`}
        render={routeProps => {
          return <Edit {...props} {...routeProps} />;
        }}
      ></Route>
      <Route
        path={`${props.basePath}`}
        render={routeProps => <List {...props} {...routeProps} />}
      ></Route>
    </Switch>
  );
};
