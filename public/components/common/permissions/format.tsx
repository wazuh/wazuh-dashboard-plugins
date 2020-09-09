/*
 * Wazuh app - React component for render user permissions requirements
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React from 'react';
import { EuiSpacer } from '@elastic/eui';

export const WzPermissionsFormatted = permissions => {
  return (
    <div>
      {permissions.map(permission => {
        if(Array.isArray(permission)){
          return (<div>
                    <div>- One of: {permission.map(p => PermissionFormatter(p)).reduce((prev, cur) => [prev, ', ', cur])}</div>
                    <EuiSpacer size='s'/>
                  </div>)
        }else{
          return <div>- {PermissionFormatter(permission)}</div>
        }
      })}
    </div>
  )
}

const PermissionFormatter = permission => typeof permission === 'object' ? (
  <>
    <strong>{permission.action}</strong> (<span style={{textDecoration: 'underline'}}>{permission.resource}</span>)
  </>
) : (<strong>{permission.action}</strong>);
