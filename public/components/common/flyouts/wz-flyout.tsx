/*
 * Wazuh app - Index of Wazuh buttons
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
import { EuiFlyout, EuiOutsideClickDetector } from '@elastic/eui';

export const WzFlyout = ({ children, flyoutProps = {}, onClose }) => {
  // As the version of Elastic EUI (v34.6.0) has a bug in the EuiOverlayMask component,
  // This function was created to not close the overlay by the native function and close it with the following function
  // This bug is fixed in the Elastic EUI version 36.0.0
  const doNotCloseFlyout = () => {
    return;
  };

  const closeFlyout = (ev) => {
    if (ev && ev.path.some((element) => element.classList?.contains('euiFlyout'))) {
      return;
    }
    onClose();
  };

  return (
    <EuiOutsideClickDetector onOutsideClick={closeFlyout}>
      <EuiFlyout onClose={onClose} maskProps={{ onClick: doNotCloseFlyout }} {...flyoutProps}>
        {children}
      </EuiFlyout>
    </EuiOutsideClickDetector>
  );
};
