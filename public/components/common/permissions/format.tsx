/*
 * Wazuh app - React component for render user permissions requirements
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { Fragment } from 'react';
import { EuiSpacer } from '@elastic/eui';

export const WzPermissionsFormatted = permissions => {
  return (
    <div>
      {permissions.map(permission => {
        if(Array.isArray(permission)){
          return (<div key={`no-permissions-${getPermissionComponentKey(permission)}`}>
                    <div>- One of: {permission.map(p => PermissionFormatter(p, `no-permissions-${getPermissionComponentKey(permission)}-${getPermissionComponentKey(p)}`)).reduce((prev, cur) => [prev, ', ', cur])}</div>
                    <EuiSpacer size='s'/>
                  </div>)
        }else{
          return <div key={`no-permissions-${getPermissionComponentKey(permission)}`}>- {PermissionFormatter(permission)}</div>
        }
      })}
    </div>
  )
}

const PermissionFormatter = (permission, key?: string) => typeof permission === 'object' ? (
  <Fragment {...(key ? {key}: {})}>
    <strong>{permission.action}</strong> (<span style={{textDecoration: 'underline'}}>{permission.resource}</span>)
  </Fragment>
) : (<strong {...(key ? {key}: {})}>{permission}</strong>);

const getPermissionComponentKey = permission => 
  Array.isArray(permission) ? permission.map(p => getPermissionComponentKey(p)).join('-')
  : typeof permission === 'object' ? permission.action
  : permission;