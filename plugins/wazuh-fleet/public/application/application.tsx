import React from 'react';
import { Router, Route, Switch, Redirect } from 'react-router-dom';
import { History } from 'history';
import { RegisterAgent } from './pages/register-agent';

export function Application({ history }: { history: History }) {
  return (
    <Router history={history}>
      <Switch>
        <Route path={'/enrollment/agent'} exact render={RegisterAgent}></Route>
        <Redirect to='/enrollment/agent' />
      </Switch>
    </Router>
  );
}
