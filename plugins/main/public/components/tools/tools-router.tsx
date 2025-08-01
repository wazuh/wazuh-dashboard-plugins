import React from 'react';
import { LogtestWithBreadCrumb } from '../../directives/wz-logtest/components/logtest';
import { ToolDevTools } from './devtools/devtools-old';
import { withRouteResolvers } from '../common/hocs';
import { compose } from 'redux';
import { nestedResolve } from '../../services/resolves';
import { Redirect, Route, Switch } from '../router-search';

export const ToolsRouter = compose(withRouteResolvers({ nestedResolve }))(
  () => (
    <Switch>
      <Route path='?tab=devTools'>
        <ToolDevTools />
      </Route>
      <Route path='?tab=logtest'>
        <LogtestWithBreadCrumb />
      </Route>
    </Switch>
  ),
);
