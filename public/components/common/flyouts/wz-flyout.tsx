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

import React, { Component, Fragment } from 'react';
import { EuiFlyout, EuiOverlayMask, EuiOutsideClickDetector } from '@elastic/eui';
import { satisfyPluginPlatformVersion } from '../../../../common/semver';

export const WzFlyout = ({children, flyoutProps = {}, overlayMaskProps = {}, outsideClickDetectorProps = {}, onClose}) => (
  <EuiOverlayMask headerZindexLocation="below" {...overlayMaskProps}>
    <EuiOutsideClickDetector
      onOutsideClick={onClose}
      isDisabled={satisfyPluginPlatformVersion('>7.10')}
      {...outsideClickDetectorProps}
    >
      <EuiFlyout
        onClose={onClose}
        {...(satisfyPluginPlatformVersion('>7.10') ? { outsideClickCloses: true } : {})}
        {...flyoutProps}
      >
        {children}
      </EuiFlyout>
    </EuiOutsideClickDetector>
  </EuiOverlayMask>
);
