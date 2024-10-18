/*
 * Wazuh app - Prompt component with the user required permissions and/or roles
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
import { EuiEmptyPrompt, EuiSpacer } from '@elastic/eui';
import { TUserPermissions, TUserIsAdministrator } from '../permissions/element';
import { ServerPermissionsFormatted } from './format';

interface IEmptyPromptNoPermissions {
  permissions?: TUserPermissions;
  administrator?: TUserIsAdministrator;
  actions?: React.ReactNode;
}
export const WzEmptyPromptNoPermissions = ({
  permissions,
  administrator,
  actions,
}: IEmptyPromptNoPermissions) => {
  return (
    <EuiEmptyPrompt
      iconType='securityApp'
      title={<h2>You have no permissions</h2>}
      body={
        <>
          {permissions && (
            <div>
              This section requires the{' '}
              {permissions.length > 1 ? 'permissions' : 'permission'}:
              {ServerPermissionsFormatted(permissions)}
            </div>
          )}
          {permissions && administrator && <EuiSpacer />}
          {administrator && (
            <div>
              This section requires administrator privilegies:{' '}
              <strong key={`empty-prompt-no-roles-administrator`}>
                {administrator}
              </strong>
            </div>
          )}
        </>
      }
      actions={actions}
    />
  );
};
