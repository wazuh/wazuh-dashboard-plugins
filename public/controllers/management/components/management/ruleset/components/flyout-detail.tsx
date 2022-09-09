/*
 * Wazuh app - Rules components
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
  WzFlyout,
} from '../../../../../../components/common/flyouts';
import WzRuleInfo from '../views/rule-info';
import '../../common/flyout-detail.scss'

export const FlyoutDetail = ({ isLoading, item, title, closeFlyout, filters, ...rest }) => {

  
  return (
    <WzFlyout
      onClose={() => closeFlyout()}
      flyoutProps={{
        size: "l",
        'aria-labelledby': title,
        maxWidth: "70%",
        className: "wz-inventory wzApp wz-ruleset-flyout",
      }}
    >
      {item && !isLoading && <>
          <WzRuleInfo item={item} closeFlyout={closeFlyout} {...rest} filters={filters} />
      </>}
    </WzFlyout>
  );
}
