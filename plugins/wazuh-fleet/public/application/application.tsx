import React from 'react';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { RegisterAgent } from './pages/register-agent';

export function Application({ history }) {
  return (
    <Router history={history}>
      <Switch>
        <Route path={'/enrollment/agent'} exact render={RegisterAgent}></Route>
        <Redirect to='/enrollment/agent' />
      </Switch>
    </Router>
  );
}
