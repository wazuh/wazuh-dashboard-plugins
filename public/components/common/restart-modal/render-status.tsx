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
import { RestartHandler } from '../../../react-services/wz-restart';
import {
  EuiDescriptionListTitle,
  EuiDescriptionListDescription,
  EuiIconTip,
  EuiLoadingSpinner,
} from '@elastic/eui';

export const RenderStatus = (props) => {
  const { node, statusRestart } = props;

  switch (statusRestart) {
    case RestartHandler.RESTART_STATES.SYNCING:
      return (
        <>
          <EuiDescriptionListTitle>{node.name}</EuiDescriptionListTitle>
          <EuiDescriptionListDescription className="wz-text-left">
            {node.synced ? (
              <EuiIconTip aria-label="Success" size="m" type="check" color="success" />
            ) : (
              <EuiLoadingSpinner size="m" />
            )}
          </EuiDescriptionListDescription>
        </>
      );
    case RestartHandler.RESTART_STATES.SYNC_ERROR:
      return (
        <>
          <EuiDescriptionListTitle>{node.name}</EuiDescriptionListTitle>
          <EuiDescriptionListDescription className="wz-text-left">
            {node.synced ? (
              <EuiIconTip aria-label="Synchronized" size="m" type="check" color="success" />
            ) : (
              <EuiIconTip aria-label="Unsynchronized" size="m" type="alert" color="danger" />
            )}
          </EuiDescriptionListDescription>
        </>
      );
    case RestartHandler.RESTART_STATES.RESTARTING:
      return (
        <>
          <EuiDescriptionListTitle>{node.node}</EuiDescriptionListTitle>
          <EuiDescriptionListDescription className="wz-text-left">
            {node.isRestarted ? (
              <EuiIconTip aria-label="Synchronized" size="m" type="check" color="success" />
            ) : (
              <EuiLoadingSpinner size="m" />
            )}
          </EuiDescriptionListDescription>
        </>
      );
    case RestartHandler.RESTART_STATES.RESTART_ERROR:
      return (
        <>
          <EuiDescriptionListTitle>{node.node}</EuiDescriptionListTitle>
          <EuiDescriptionListDescription className="wz-text-left">
            {node.isRestarted ? (
              <EuiIconTip aria-label="Synchronized" size="m" type="check" color="success" />
            ) : (
              <EuiIconTip aria-label="Unsynchronized" size="m" type="alert" color="danger" />
            )}
          </EuiDescriptionListDescription>
        </>
      );
      case RestartHandler.RESTART_STATES.RESTARTED_INFO:
      return (
        <>
          <EuiDescriptionListTitle>{node.node}</EuiDescriptionListTitle>
          <EuiDescriptionListDescription className="wz-text-left">
            <EuiIconTip aria-label="Synchronized" size="m" type="check" color="success" />
          </EuiDescriptionListDescription>
        </>
      );
    default:
      return (
        <>
          <EuiDescriptionListTitle>{node.name}</EuiDescriptionListTitle>
          <EuiDescriptionListDescription>
            {node.synced ? (
              <EuiIconTip aria-label="Success" size="m" type="check" color="success" />
            ) : (
              <EuiLoadingSpinner size="m" />
            )}
          </EuiDescriptionListDescription>
        </>
      );
  }
};
