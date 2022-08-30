/*
 * Wazuh app - React component for render status nodes.
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
import { EuiFlexGroup, EuiFlexItem, EuiDescriptionList } from '@elastic/eui';
import { RenderStatus } from './render-status';

interface IRenderBodyModal {
  nodos: [];
  statusRestart: string;
}

export const RenderBodyModal = (props: IRenderBodyModal) => {
  const { nodos, statusRestart } = props;

  return (
    <div className="wz-info-nodes-restart">
      <EuiFlexGroup wrap direction={nodos.length > 5 ? 'row' : 'column'}>
        {nodos.map((node, index) => (
          <EuiFlexItem className={nodos.length > 5 ? 'wz-check-restart-item' : ''} key={index}>
            <EuiDescriptionList textStyle="reverse" align="center" type="column">
              <RenderStatus node={node} key={index} statusRestart={statusRestart} />
            </EuiDescriptionList>
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    </div>
  )
};
