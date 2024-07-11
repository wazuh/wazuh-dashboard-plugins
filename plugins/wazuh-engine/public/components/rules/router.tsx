import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { RulesList } from './pages/list';
import { CreateRule } from './pages/create';
import { EditRule } from './pages/edit';

export const Rules = props => {
  return (
    <Switch>
      <Route path={`${props.basePath}/create`}>
        <CreateRule {...props} />
      </Route>
      <Route
        path={`${props.basePath}/edit`}
        render={routeProps => {
          return <EditRule {...props} {...routeProps} />;
        }}
      ></Route>
      <Route
        path={`${props.basePath}`}
        render={routeProps => <RulesList {...props} {...routeProps} />}
      ></Route>
    </Switch>
  );
};
