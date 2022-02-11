/*
 * Wazuh app - React component VisCard.
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

import React, { useState } from 'react';
import { EuiButtonIcon, EuiFlexGroup, EuiFlexItem, EuiPanel, EuiTitle } from '@elastic/eui';
import { RawVisualizations } from '../../../../../factories/raw-visualizations';
import KibanaVis from '../../../../../kibana-integrations/kibana-vis';

export const VisCard = ({ changeView = () => {}, id, width, tab, ...props }) => {
  const [expandedVis, setExpandedVis] = useState(false);

  const title = (() => {
    const visList = new RawVisualizations().getList();
    const rawVis = visList ? visList.filter((item) => item && item.id === id) : [];
    return rawVis.length && rawVis[0]?.attributes?.title;
  })();

  const toggleExpand = () => {
    setExpandedVis(!expandedVis);
  };

  return (
    <>
      <EuiFlexItem grow={width}>
        <EuiPanel paddingSize={'s'} className={expandedVis ? 'fullscreen h-100' : 'h-100'}>
          <EuiFlexGroup direction={'column'} className={'h-100'}>
            <EuiFlexItem grow={false}>
              <EuiFlexGroup justifyContent="spaceBetween">
                <EuiFlexItem>
                  {title && (
                    <EuiTitle size={'xxs'}>
                      <h4>{title}</h4>
                    </EuiTitle>
                  )}
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButtonIcon
                    color="text"
                    style={{ padding: '0px 6px', height: 30 }}
                    onClick={() => toggleExpand()}
                    iconType="expand"
                    aria-label="Expand"
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
            <EuiFlexItem grow={true}>
              <div className={'h-100'}>
                <KibanaVis
                  visID={id}
                  tab={tab}
                  {...props}
                />
              </div>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiFlexItem>
    </>
  );
};
