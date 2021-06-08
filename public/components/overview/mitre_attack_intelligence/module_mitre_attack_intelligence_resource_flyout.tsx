/*
 * Wazuh app - React component for showing the Mitre Att&ck intelligence flyout.
 *
 * Copyright (C) 2015-2021 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React , {useRef} from 'react';
import { MitreAttackResources } from './mitre_attack_resources';
import { GetFlyoutSubtable } from './module_mitre_attack_intelligence_resource_flyout_subTables';

import {
  EuiFlyout,
  EuiFlyoutHeader,
  EuiOverlayMask,
  EuiTitle,
  EuiText,
  EuiFlexGroup,
  EuiFlyoutBody,
  EuiFlexItem,
} from '@elastic/eui';
import { Markdown } from '../../common/util/markdown';

export const ModuleMitreAttackIntelligenceFlyout = ({details, closeFlyout, tableProps}) => {
  const startReference = useRef(null);
  startReference.current?.scrollIntoView();

  return (
    <EuiOverlayMask
            headerZindexLocation="below"
            onClick= {closeFlyout} >
            <EuiFlyout
              onClose={closeFlyout}
              size="l"
              aria-labelledby={``}
            >
              <EuiFlyoutHeader hasBorder>
                <EuiTitle size="m">
                  <h2 id="flyoutTitle">Details</h2>
                </EuiTitle>
              </EuiFlyoutHeader>
              <EuiFlyoutBody>
                <div ref={startReference}>
                  <EuiFlexGroup>
                    {MitreAttackResources[0].mitreFlyoutHeaderProperties.map(detailProperty => (
                      <EuiFlexItem>
                        <div>
                          <strong>
                            {detailProperty.label}
                          </strong>
                        </div>
                        <EuiText color='subdued'>
                          {detailProperty.render ? detailProperty.render(details[detailProperty.id]) : details[detailProperty.id]}
                        </EuiText>
                      </EuiFlexItem>
                    ))}
                  </EuiFlexGroup>
                </div>
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <div>
                      <strong>
                        Description
                      </strong>
                    </div>
                    <EuiText color='subdued'>
                      { details.description ? <Markdown markdown={details.description}/> : ''}
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiFlexGroup>
                  <EuiFlexItem>
                      {MitreAttackResources.filter((item) => details[item.id]).map((item) => 
                        <GetFlyoutSubtable
                          subtableName={item.id}
                          subtableArray={details[item.id]}
                          subtableProps={tableProps}
                        />
                      )}
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlyoutBody>
            </EuiFlyout>
          </EuiOverlayMask>
  )
};

