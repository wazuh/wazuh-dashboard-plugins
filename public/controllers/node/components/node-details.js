// /*
//  * Wazuh app - React component for building the agents preview section.
//  *
//  * Copyright (C) 2015-2020 Wazuh, Inc.
//  *
//  * This program is free software; you can redistribute it and/or modify
//  * it under the terms of the GNU General Public License as published by
//  * the Free Software Foundation; either version 2 of the License, or
//  * (at your option) any later version.
//  *
//  * Find more information about this on the LICENSE file.
//  */

import React, { useState, useEffect, Component, Fragment } from 'react';
import PropTypes from 'prop-types';
import {
  EuiCard,
  EuiIcon,
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiText,
  EuiFlexGrid,
  EuiButtonEmpty,
  EuiTitle,
  EuiHealth,
  EuiHorizontalRule,
  EuiPage,
  EuiButton,
  EuiPopover,
  EuiSelect,
  EuiLoadingChart,
  EuiToolTip,
  EuiButtonIcon,
  EuiEmptyPrompt,
  EuiPageBody
} from '@elastic/eui';
import { NodeMenu } from './node-menu';
import { SuricataTable } from './Suricata/suricata-table';
import { StapTables } from './SoftwareTAP/stap-tables';
import { ZeekTable } from './Zeek/zeek-table';
// import { WazuhTable } from './Wazuh/wazuh-table';
import { WazuhTable } from './Wazuh/wazuh-table';
import { AnalyzerTable } from './Analyzer/analyzer-table';
import { PingPluginsNode, LoadInterfaces, loadRuleset, PingZeek, PingAnalyzer, PingWazuhFiles, PingWazuh } from '../../../redux/actions/nidsActions';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../components/common/hocs';
import { useSelector, useDispatch } from 'react-redux';

export const NodeDetails = withReduxProvider(() => {
  const dispatch = useDispatch();
  const nodeTab = useSelector(state => state.nidsReducers.nodeTabSelected);
  const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);

  useEffect(() => { 
    dispatch(PingPluginsNode(nodeDetail.uuid))
    dispatch(LoadInterfaces())
    dispatch(loadRuleset())
    dispatch(PingZeek(nodeDetail.uuid))
    dispatch(PingAnalyzer(nodeDetail.uuid))
    dispatch(PingWazuhFiles(nodeDetail.uuid))
    dispatch(PingWazuh(nodeDetail.uuid))
  }, []);
  
  return (
    <Fragment>
      <NodeMenu></NodeMenu>    
        <EuiPage>
            {nodeTab === "overview" ? <p>Overview</p> : null} 
            {nodeTab === "suricata" ? <SuricataTable></SuricataTable> : null}
            {nodeTab === "zeek" ? <ZeekTable></ZeekTable> : null}
            {nodeTab === "output" ? <WazuhTable></WazuhTable> : null}
            {nodeTab === "stap" ? <StapTables></StapTables> : null}
            {nodeTab === "analyzer" ? <AnalyzerTable></AnalyzerTable> : null} 
        </EuiPage>
    </Fragment>
  )
});
// export default NodeDetails