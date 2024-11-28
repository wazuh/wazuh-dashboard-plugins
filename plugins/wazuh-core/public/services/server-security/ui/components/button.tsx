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

enum ServerButtonPermissionsTypes{
  default = 'default',
  empty = 'empty',
  icon = 'icon',
  link = 'link',
  switch = 'switch'
}

interface IServerButtonPermissionsProps
  extends Omit<
    ServerElementPermissionsProps,
    'children' | 'additionalPropsFunction'
  > {
  buttonType?: ServerButtonPermissionsTypes;
  rest: any;
}

const ButtonsMap = {
  [ServerButtonPermissionsTypes.default]: EuiButton,
  [ServerButtonPermissionsTypes.empty]: EuiButtonEmpty,
  [ServerButtonPermissionsTypes.icon]: EuiButtonIcon,
  [ServerButtonPermissionsTypes.link]: EuiLink,
  [ServerButtonPermissionsTypes.switch]: EuiSwitch,
}

export const ServerButtonPermissions = ({
  buttonType = ServerButtonPermissionsTypes.default,
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
          ...(![ServerButtonPermissionsTypes.link, ServerButtonPermissionsTypes.switch].includes(buttonType)
            ? { isDisabled: disabled }
            : { disabled }),
          onClick: disabled || !rest.onClick ? undefined : rest.onClick,
          onChange:
            !disabled || rest.onChange || buttonType === ServerButtonPermissionsTypes.switch
              ? rest.onChange
              : undefined,
        };
        if (buttonType == ServerButtonPermissionsTypes.switch) delete additionalProps.onClick;

        return additionalProps;
      }}
      {...rest}
    >
      <Button {...rest} />
    </ServerElementPermissions>
  );
};
