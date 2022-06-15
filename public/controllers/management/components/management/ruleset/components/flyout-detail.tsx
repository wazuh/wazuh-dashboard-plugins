/*
 * Wazuh app - Agent vulnerabilities components
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useState } from 'react';
import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiTitle,
  EuiLoadingContent,
  EuiCallOut,
} from '@elastic/eui';
import WzRuleInfo from '../views/rule-info';
import './flyout-detail.scss'

export const FlyoutDetail = ({ isLoading, item, title, closeFlyout, filters, ...rest }) => {

  
  return (
    <EuiFlyout
      onClose={() => closeFlyout()}
      size="l"
      aria-labelledby={title}
      maxWidth="70%"
      className="wz-inventory wzApp wz-ruleset-flyout"
    >
      {item && !isLoading && <>
          <WzRuleInfo item={item} {...rest} filters={filters} />
      </>}
    </EuiFlyout>
  );
}
