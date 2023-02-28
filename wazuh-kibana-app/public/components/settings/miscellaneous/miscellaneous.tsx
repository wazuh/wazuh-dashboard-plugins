/*
 * Wazuh app - React component for Settings > Miscellaneous
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 *
 */

import React, { Fragment, useCallback } from 'react';

import {
  EuiButton,
  EuiDescribedFormGroup,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPage,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { getHttp } from '../../../kibana-services';

export const SettingsMiscellaneous = () => {

  const redirectHealthCheckDebugMode = useCallback(() => {
    window.location.href = getHttp().basePath.prepend('/app/wazuh#/health-check?debug');
  }, []);

  return (
    <EuiPage>
      <EuiPanel paddingSize="l">
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiTitle>
              <h2>Miscellaneous</h2>
            </EuiTitle>
            <EuiText color="subdued">
              App utils
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer />
        <SettingsMiscellaneousCategory 
          title='Health check'
          actions={[
            {
              title: 'Execute in debug mode',
              description: 'Run health check and no redirect when all checks are ready',
              render: (
                <EuiFormRow>
                  <EuiButton
                      fill
                      onClick={redirectHealthCheckDebugMode}
                    >
                      Run
                  </EuiButton>
                </EuiFormRow>
              )
            }
          ]}
        />
      </EuiPanel>
    </EuiPage>
  )
};


const SettingsMiscellaneousCategory = ({title, description = '', actions}) => (
  <EuiPanel>
    <>
      <EuiTitle>
        <h2>{title}</h2>
      </EuiTitle>
      {description && (
        <EuiText color='subdued'>
          {description}
        </EuiText>
      )}
      <EuiSpacer size='xs' />
      {actions.map(action => (
        <Fragment key={`settins-miscellaneous-category-action-${action.title}`}>
          <EuiDescribedFormGroup
            title={<h2>{action.title}</h2>}
            titleSize='s'
            description={action.description}
          >
            {action.render}
          </EuiDescribedFormGroup>
        </Fragment>
      ))}
    </>
  </EuiPanel>
)