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
  const closeFlyout = (ev) => {
    // Clicking on the flyout or on the flyout selector should not close the flyout.
    if (
      ev &&
      ev.path.some(
        (element) =>
          element.classList?.contains('euiFlyout') || element.classList?.contains('euiPanel')
      )
    ) {
      return;
    }
    onClose();
  };

  return (
    <EuiOutsideClickDetector onOutsideClick={closeFlyout}>
      {/*
        As the version of Elastic EUI (v34.6.0) has a bug in the EuiOverlayMask component,
        maskProps is added to avoid the closing of the overlay by the native function, as it contains the bug
        This bug is fixed in the Elastic EUI version 36.0.0
      */}
      <EuiFlyout onClose={onClose} maskProps={{ onClick: () => {} }} {...flyoutProps}>
        {children}
      </EuiFlyout>
    </EuiOutsideClickDetector>
  );
};
