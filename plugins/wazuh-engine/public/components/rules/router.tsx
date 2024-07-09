import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { RulesList } from './pages/list';
import { CreateRule } from './pages/new';

export const Rules = props => {
  return (
    <Switch>
      <Route path={`${props.basePath}/new`}>
        <CreateRule {...props} />
      </Route>
      <Route
        path={`${props.basePath}`}
        render={routeProps => <RulesList {...props} {...routeProps} />}
      ></Route>
    </Switch>
  );
};
