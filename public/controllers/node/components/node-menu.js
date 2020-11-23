import React, { Component, Fragment, useState, useEffect } from 'react';
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
  WzTextWithTooltipIfTruncated,
  EuiSelect,
  EuiLoadingChart,
  EuiToolTip,
  EuiButtonIcon,
  EuiEmptyPrompt,
  EuiPageBody
} from '@elastic/eui';
import { Pie } from "../../../components/d3/pie";
import { ProgressChart } from "../../../components/d3/progress";
import KibanaVis from '../../../kibana-integrations/kibana-vis';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import { VisFactoryHandler } from '../../../react-services/vis-factory-handler';
import { AppState } from '../../../react-services/app-state';
import { FilterHandler } from '../../../utils/filter-handler';
import { TabVisualizations } from '../../../factories/tab-visualizations';
import { WazuhConfig } from '../../../react-services/wazuh-config.js';
import { WzDatePicker } from '../../../components/wz-date-picker/wz-date-picker';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../components/common/hocs';
import { NodeDetailsTab } from '../../../redux/actions/nidsActions';
import { compose } from 'redux';
import { connect } from 'react-redux';
import { useSelector, useDispatch } from 'react-redux';
import { log } from '../../../../server/logger';
// import { AppNavigate } from '../../../react-services/app-navigate'

// export const NodeMenu = () => {
export const NodeMenu = withReduxProvider(() => {
    const dispatch = useDispatch();
    const nodeDetail = useSelector(state => state.nidsReducers.nodeDetail);
  
    const [menuElements, setMenuElements] = useState({})
    
    useEffect(() => { 
        updateMenuNodes()        
    }, []);

    function updateMenuNodes() {
        const defaultMenuNodes = {
            mntr: {
                id: 'overview',
                text: 'Overview',
                isPin: true,
            },
            srct: {
                id: 'suricata',
                text: 'Suricata',
                isPin: true,
            },
            zk: {
                id: 'zeek',
                text: 'Zeek',
                isPin: true,
            },
            st: {
                id: 'stap',
                text: 'Traffic Management - STAP',
                isPin: true,
            },
            anlyz: {
                id: 'analyzer',
                text: 'Analyzer',
                isPin: true,
            }
        }
  
        let menuNodesDetails = JSON.parse(window.localStorage.getItem('nodes'));
        window.localStorage.setItem('nodes', JSON.stringify(defaultMenuNodes));
        menuNodesDetails = defaultMenuNodes;
        setMenuElements(menuNodesDetails);
    }
  
    const menuNodesData = [...Object.keys(menuElements).map((item) => { 
        return menuElements[item] 
    })];

    return (
        <EuiFlexGroup style={{ marginLeft: 5, marginTop: 2 }}>
              <EuiFlexItem grow={false}>
                <span style={{ display: 'inline-flex' }}>
                  <EuiTitle size="s">
                    <p>{nodeDetail.name}</p>
                  </EuiTitle>
                </span>
              </EuiFlexItem>
            {
                menuNodesData.map((tab, i) => {
                return (
                <EuiFlexItem key={i} grow={false} style={{ marginLeft: 0, marginTop: 7 }}>
                    <EuiButtonEmpty
                    onClick={() => {
                        
                        dispatch(NodeDetailsTab(tab.id))

                        // this.props.toggleTabSelected(tab.id);
                        // window.location.href = `#/nids/?tab=${menuNodes.id}&tabView=${menuNodes.text}`;
                        // this.router.reload();
                    }} style={{ cursor: 'pointer' }}>
                    <span>{tab.text}&nbsp;</span>
                    </EuiButtonEmpty>
                </EuiFlexItem>
                )}
            )}
        </EuiFlexGroup>
    )
});
