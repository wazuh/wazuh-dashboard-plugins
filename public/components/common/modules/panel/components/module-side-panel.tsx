/*
 * Wazuh app - React component ModuleSidePanel.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import { EuiButtonEmpty, EuiCollapsibleNav } from '@elastic/eui';
import React, { useState } from 'react';
import './module-side-panel.scss';

export const ModuleSidePanel = ({ navIsDocked = false, children, ...props }) => {
  const [navIsOpen, setNavIsOpen] = useState(false);

  return (
    <EuiCollapsibleNav
      isOpen={navIsOpen}
      isDocked={navIsDocked}
      showCloseButton={true}
      maskProps={{ headerZindexLocation: 'below', className: 'wz-no-display' }}
      button={
        <EuiButtonEmpty
          className={'sidepanel-infoBtnStyle'}
          onClick={() => setNavIsOpen(!navIsOpen)}
          iconType={'iInCircle'}
        />
      }
      onClose={() => setNavIsOpen(false)}
    >
      <div>
        <EuiButtonEmpty
          style={{ position: 'absolute', right: 0 }}
          onClick={() => setNavIsOpen(!navIsOpen)}
          iconType={'cross'}
        />
        <div className={'wz-padding-16'}>{children}</div>
      </div>
    </EuiCollapsibleNav>
  );
};
