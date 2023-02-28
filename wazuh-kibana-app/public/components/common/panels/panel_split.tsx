/*
 * Wazuh app - Panel split component
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
import { EuiPanel, EuiFlexGroup, EuiFlexItem } from '@elastic/eui';

export const PanelSplit = ({side, sideColor='#80808014', content, panelProps = {}, sideProps = {}, contentProps = {}}) => {
  const {style: sidePropsSytle, ...restSideProps} = sideProps;
  const {style: contentPropsSytle, ...restContentProps} = contentProps;
  return (
    <EuiPanel paddingSize="none" {...panelProps}>
      <EuiFlexGroup style={{margin: 0}}>
        <EuiFlexItem grow={false} style={{backgroundColor: sideColor, margin: 0,...(sidePropsSytle || {})}}{...restSideProps}>
          {side}
        </EuiFlexItem>
        <EuiFlexItem style={{...(contentPropsSytle || {})}} {...restContentProps}>
          {content}
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  )
}
