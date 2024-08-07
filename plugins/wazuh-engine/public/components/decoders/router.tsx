import React from 'react';
import { Route, Switch } from 'react-router-dom';
import { DecodersTable } from './components/decoders-overview';
import { AddDecoder } from './components/forms/addDecoder';
import { DecodersFile } from './components/decoders-files/files-info';

export const Decoders = props => {
  return (
    <Switch>
      <Route path={`${props.basePath}/new`}>
        <AddDecoder />
      </Route>
      <Route
        path={`${props.basePath}/file/:type/:name/:version`}
        render={fetchParams => {
          return (
            <DecodersFile
              type={fetchParams.match.params.type}
              name={fetchParams.match.params.name}
              version={fetchParams.match.params.version}
            />
          );
        }}
      ></Route>
      <Route path={props.basePath}>
        <DecodersTable />
      </Route>
    </Switch>
  );
};
