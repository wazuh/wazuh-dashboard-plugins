import React from 'react';
import { ToolDevTools } from './devtools/devtools-old';
import { withRouteResolvers } from '../common/hocs';
import { compose } from 'redux';
import { nestedResolve } from '../../services/resolves';
import { Redirect, Route, Switch } from '../router-search';

// TODO: this router only ever renders a single view (ToolDevTools), so the
// Switch/Route/Redirect query-param routing is unnecessary indirection.
// Replace with ToolDevTools rendered directly and drop the ../router-search
// usage entirely.
export const ToolsRouter = compose(withRouteResolvers({ nestedResolve }))(
  () => (
    <Switch>
      <Route path='?tab=devTools'>
        <ToolDevTools />
      </Route>
      <Redirect to='?tab=devTools'></Redirect>
    </Switch>
  ),
);
