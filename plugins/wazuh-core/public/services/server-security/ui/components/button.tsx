/*
 * Wazuh app - Button with Wazuh API permissions and/or roles required to be useful
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
import {
  EuiSwitch,
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiLink,
} from '@elastic/eui';
import {
  ServerElementPermissionsProps,
  ServerElementPermissions,
} from './element';

enum SERVER_BUTTON_PERMISSIONS_TYPES {
  DEFAULT = 'default',
  EMPTY = 'empty',
  ICON = 'icon',
  LINK = 'link',
  SWITCH = 'switch',
}

interface IServerButtonPermissionsProps
  extends Omit<
    ServerElementPermissionsProps,
    'children' | 'additionalPropsFunction'
  > {
  buttonType?: SERVER_BUTTON_PERMISSIONS_TYPES;
  rest: any;
}

const ButtonsMap = {
  [SERVER_BUTTON_PERMISSIONS_TYPES.DEFAULT]: EuiButton,
  [SERVER_BUTTON_PERMISSIONS_TYPES.EMPTY]: EuiButtonEmpty,
  [SERVER_BUTTON_PERMISSIONS_TYPES.ICON]: EuiButtonIcon,
  [SERVER_BUTTON_PERMISSIONS_TYPES.LINK]: EuiLink,
  [SERVER_BUTTON_PERMISSIONS_TYPES.SWITCH]: EuiSwitch,
};

export const ServerButtonPermissions = ({
  buttonType = SERVER_BUTTON_PERMISSIONS_TYPES.DEFAULT,
  permissions,
  administrator,
  tooltip,
  ...rest
}: IServerButtonPermissionsProps) => {
  const Button = ButtonsMap[buttonType] || ButtonsMap['default'];

  return (
    <ServerElementPermissions
      permissions={permissions}
      administrator={administrator}
      tooltip={tooltip}
      getAdditionalProps={disabled => {
        const additionalProps = {
          ...([
            SERVER_BUTTON_PERMISSIONS_TYPES.LINK,
            SERVER_BUTTON_PERMISSIONS_TYPES.SWITCH,
          ].includes(buttonType)
            ? { disabled }
            : { isDisabled: disabled }),
          onClick: disabled || !rest.onClick ? undefined : rest.onClick,
          onChange:
            !disabled ||
            rest.onChange ||
            buttonType === SERVER_BUTTON_PERMISSIONS_TYPES.SWITCH
              ? rest.onChange
              : undefined,
        };

        if (buttonType === SERVER_BUTTON_PERMISSIONS_TYPES.SWITCH) {
          delete additionalProps.onClick;
        }

        return additionalProps;
      }}
      {...rest}
    >
      <Button {...rest} />
    </ServerElementPermissions>
  );
};
