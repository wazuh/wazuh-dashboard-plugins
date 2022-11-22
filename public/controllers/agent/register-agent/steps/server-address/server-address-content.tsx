import React, { Fragment } from 'react';
import ServerAddress from './server-address';

/**
 * 
 * @param title 
 * @param state 
 * @param onChange 
 */
export const getServerAddressStepContent = (
    title: string,
    state: any,
    onChange: (field: string, value: string) => void,
  ) => {
    return (
      <Fragment>
        <ServerAddress
          defaultValue={state.serverAddress || ''}
          onChange={value => onChange('serverAddress', value)}
        />
      </Fragment>
    );
  };