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

import { IWzElementPermissionsProps, WzElementPermissions } from './element';

interface IWzButtonPermissionsProps
  extends Omit<
    IWzElementPermissionsProps,
    'children' | 'additionalPropsFunction'
  > {
  buttonType?: 'default' | 'empty' | 'icon' | 'link' | 'switch';
  rest: any;
}

export const WzButtonPermissions = ({
  buttonType = 'default',
  permissions,
  roles,
  tooltip,
  ...rest
}: IWzButtonPermissionsProps) => {
  const Button =
    buttonType === 'empty'
      ? EuiButtonEmpty
      : buttonType === 'icon'
      ? EuiButtonIcon
      : buttonType === 'link'
      ? EuiLink
      : buttonType === 'switch'
      ? EuiSwitch
      : EuiButton;

  return (
    <WzElementPermissions
      permissions={permissions}
      roles={roles}
      tooltip={tooltip}
      getAdditionalProps={disabled => {
        const additionalProps = {
          ...(!['link', 'switch'].includes(buttonType)
            ? { isDisabled: disabled }
            : { disabled }),
          onClick:
            disabled || !rest.onClick || buttonType == 'switch'
              ? undefined
              : rest.onClick,
          onChange: disabled || !rest.onChange ? undefined : rest.onChange,
        };

        if (buttonType == 'switch') delete additionalProps.onClick;

        return additionalProps;
      }}
    >
      <Button {...rest} />
    </WzElementPermissions>
  );
};
