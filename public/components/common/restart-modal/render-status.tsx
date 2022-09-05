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
import {
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiIconTip,
  EuiLoadingSpinner,
} from '@elastic/eui';
import WzTextWithTooltipIfTruncated from '../wz-text-with-tooltip-if-truncated';
import { ENUM_RESTART_STATES } from '../../../react-services/interfaces/wz-restart.interface';

interface IRenderStatus {
  node: { name: string; synced: boolean; isRestarted: boolean };
  statusRestart: string;
}

export const RenderStatus = (props: IRenderStatus) => {
  const { node, statusRestart } = props;

  let iconStatus;
  switch (statusRestart) {
    case ENUM_RESTART_STATES.SYNCING:
      iconStatus = (
        <>
          <EuiDescriptionListDescription className="wz-text-left">
            {node.synced ? (
              <EuiIconTip aria-label="Success" size="m" type="check" color="success" />
            ) : (
              <EuiLoadingSpinner size="m" />
            )}
          </EuiDescriptionListDescription>
        </>
      );
      break;
    case ENUM_RESTART_STATES.SYNC_ERROR:
      iconStatus = (
        <>
          <EuiDescriptionListDescription className="wz-text-left">
            {node.synced ? (
              <EuiIconTip aria-label="Synchronized" size="m" type="check" color="success" />
            ) : (
              <EuiIconTip aria-label="Unsynchronized" size="m" type="alert" color="danger" />
            )}
          </EuiDescriptionListDescription>
        </>
      );
      break;
    case ENUM_RESTART_STATES.RESTARTING:
      iconStatus = (
        <>
          <EuiDescriptionListDescription className="wz-text-left">
            {node.isRestarted ? (
              <EuiIconTip aria-label="Synchronized" size="m" type="check" color="success" />
            ) : (
              <EuiLoadingSpinner size="m" />
            )}
          </EuiDescriptionListDescription>
        </>
      );
      break;
    case ENUM_RESTART_STATES.RESTART_ERROR:
      iconStatus = (
        <>
          <EuiDescriptionListDescription className="wz-text-left">
            {node.isRestarted ? (
              <EuiIconTip aria-label="Synchronized" size="m" type="check" color="success" />
            ) : (
              <EuiIconTip aria-label="Unsynchronized" size="m" type="alert" color="danger" />
            )}
          </EuiDescriptionListDescription>
        </>
      );
      break;
    case ENUM_RESTART_STATES.RESTARTED_INFO:
      iconStatus = (
        <>
          <EuiDescriptionListDescription className="wz-text-left">
            <EuiIconTip aria-label="Synchronized" size="m" type="check" color="success" />
          </EuiDescriptionListDescription>
        </>
      );
      break;
    default:
      iconStatus = (
        <>
          <EuiDescriptionListDescription>
            <EuiIconTip aria-label="Success" size="m" type="check" color="success" />
          </EuiDescriptionListDescription>
        </>
      );
  }

  return (
    <>
      <EuiDescriptionListTitle>
        <span className="euiToolTipAnchor">
          <WzTextWithTooltipIfTruncated elementStyle={{ maxWidth: '85px' }}>
            {node.name}
          </WzTextWithTooltipIfTruncated>
        </span>
      </EuiDescriptionListTitle>
      {iconStatus}
    </>
  );
};
