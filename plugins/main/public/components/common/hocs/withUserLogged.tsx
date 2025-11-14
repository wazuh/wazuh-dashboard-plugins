/*
 * Wazuh app - React HOC to manage if the user is logged in
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { EuiProgress, EuiText, EuiSpacer } from '@elastic/eui';

export const withUserLogged = WrappedComponent => props => {
  const withUserLogged = useSelector(
    state => state.appStateReducers.withUserLogged,
  );

  return withUserLogged ? (
    <WrappedComponent {...props} />
  ) : (
    <div className='withUserLogged'>
      <EuiText className='subdued-color'>Loading ...</EuiText>
      <EuiSpacer size='s' />
      <EuiProgress
        className='withUserLogged-loader'
        size='xs'
        color='primary'
      />
    </div>
  );
};
