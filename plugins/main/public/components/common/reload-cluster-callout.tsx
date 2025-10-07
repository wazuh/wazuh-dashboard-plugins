/*
 * Wazuh app - React component for registering agents.
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

// Eui components
import {
  EuiFlexGroup,
  EuiFlexItem,
  EuiButton,
  EuiCallOut,
  EuiText,
  EuiIcon,
} from '@elastic/eui';

import { getToasts } from '../../kibana-services';
import { reloadRuleset } from '../../controllers/management/components/management/configuration/utils/wz-fetch';
import { WzButtonPermissions } from './permissions/button';

interface IWzReloadClusterCalloutProps {
  onReloaded: () => void;
  onReloadedError: () => void;
}

interface IWzReloadClusterCalloutState {
  warningReloading: boolean;
}

class WzReloadClusterCallout extends Component<
  IWzReloadClusterCalloutProps,
  IWzReloadClusterCalloutState
> {
  constructor(props) {
    super(props);
    this.state = {
      warningReloading: false,
    };
  }
  showToast(color, title, text = '', time = 3000) {
    getToasts().add({
      color,
      title,
      text,
      toastLifeTimeMs: time,
      ...(color === 'success' ? { iconType: 'check' } : {}),
    });
  }
  reloadCluster = async () => {
    try {
      this.setState({
        warningReloading: true,
      });
      getToasts().add({
        color: 'success',
        title:
          'Reloading ruleset across the cluster. This may take a few seconds.',
        toastLifeTimeMs: 5000,
      });

      const {
        data: { data, message },
      } = await reloadRuleset();

      const nodesReloaded = data.affected_items?.filter(
        node => !data.failed_items?.includes(node),
      );

      if (nodesReloaded.length) {
        this.props.onReloaded();
        this.showToast(
          'success',
          `Cluster reloaded in ${nodesReloaded.length} node(s)`,
          <div>
            <p>{message}:</p>
            <strong>{nodesReloaded.map(node => node.name).join(', ')}</strong>
          </div>,
          10000,
        );
      }
      if (data.total_failed_items > 0) {
        const errorDetails = data.failed_items.map(item => (
          <>
            <b>{item.id.join(', ')}</b>: {item.error.message} (code:{' '}
            {item.error.code})<br />
            Suggestion: {item.error.remediation}
            <br />
          </>
        ));

        const errorObj = {
          name: '',
          message: (
            <div>
              <p>
                Problems were encountered when reloading on the following nodes:{' '}
              </p>
              {errorDetails}
            </div>
          ),
          stack: JSON.stringify(data.failed_items),
        };

        const toastOptions = {
          title: `Failed to reload ruleset in ${data.total_failed_items} node(s)`,
          toastLifeTimeMs: 10000,
        };

        getToasts().addError(errorObj, toastOptions);
      }
      if (data.total_affected_items === 0) {
        this.props.onReloaded();
        throw new Error(`Failed to reload ruleset: ${message}`);
      }
    } catch (error) {
      this.setState({ warningReloading: false });
      this.props.onReloadedError();
      this.showToast(
        'danger',
        'Failed to reload ruleset:',
        JSON.stringify(error?.data?.detail || error),
        10000,
      );
    }
  };
  render() {
    const { warningReloading } = this.state;
    return (
      <Fragment>
        {!warningReloading && (
          <EuiCallOut>
            <EuiFlexGroup justifyContent='spaceBetween' alignItems='center'>
              <EuiFlexItem style={{ marginTop: '0', marginBottom: '0' }}>
                <EuiText style={{ color: 'rgb(0, 107, 180)' }}>
                  <EuiIcon
                    type='iInCircle'
                    color='primary'
                    style={{ marginBottom: '0px', marginRight: '6px' }}
                  />
                  <span>
                    Changes will not take effect until a reload is performed.
                  </span>
                </EuiText>
              </EuiFlexItem>
              <EuiFlexItem grow={false}>
                <WzButtonPermissions
                  buttonType='default'
                  permissions={[
                    { action: 'cluster:restart', resource: 'node:id:*' },
                  ]}
                  iconType='refresh'
                  onClick={() => this.reloadCluster()}
                >
                  {'Reload'}
                </WzButtonPermissions>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiCallOut>
        )}
      </Fragment>
    );
  }
}

export default WzReloadClusterCallout;
