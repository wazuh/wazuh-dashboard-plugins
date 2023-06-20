/*
 * Wazuh app - React component for base button that wraps the EuiButton components
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
  EuiButton,
  EuiButtonEmpty,
  EuiButtonIcon,
  EuiLink,
  EuiToolTip
} from '@elastic/eui';

enum WzButtonType{
  default = 'default',
  empty = 'empty',
  icon = 'icon',
  link = 'link'
}

interface WzButtonProps{
  buttonType?: WzButtonType
  tooltip?: any
  rest?: any
};

const WzButtons: {[key in WzButtonType]: React.FunctionComponent} = {
  'default': EuiButton,
  'empty': EuiButtonEmpty,
  'icon': EuiButtonIcon,
  'link': EuiLink,
}

export const WzButton = ({buttonType = WzButtonType.default, tooltip, ...rest}: WzButtonProps) => {
  const Button = WzButtons[buttonType];
  
  const button = <Button {...rest} />
  return tooltip ? 
    <EuiToolTip
      {...tooltip}
    >
      {button}
    </EuiToolTip>
  : button
}