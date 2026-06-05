import React from 'react';
import { ToolDevTools } from './devtools/devtools-old';
import { withRouteResolvers } from '../common/hocs';
import { compose } from 'redux';
import { nestedResolve } from '../../services/resolves';
import { Route, Switch } from '../router-search';

export const ToolsRouter = compose(withRouteResolvers({ nestedResolve }))(
  () => (
    <Switch>
      <Route path='?tab=devTools'>
        <ToolDevTools />
      </Route>
    </Switch>
  ),
);
