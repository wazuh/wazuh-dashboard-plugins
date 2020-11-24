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
import { Pie } from "../../../components/d3/pie";
import { ProgressChart } from "../../../components/d3/progress";
import { NidsTable } from './nids-table';
import { NidsExample } from './nids-add-node';
import NidsMenu from './nids-menu';
import KibanaVis from '../../../kibana-integrations/kibana-vis';
import WzReduxProvider from '../../../redux/wz-redux-provider';
import { VisFactoryHandler } from '../../../react-services/vis-factory-handler';
import { AppState } from '../../../react-services/app-state';
import { FilterHandler } from '../../../utils/filter-handler';
import { TabVisualizations } from '../../../factories/tab-visualizations';
import { WazuhConfig } from '../../../react-services/wazuh-config.js';
import { NidsConfig } from '../../../react-services/nids-config.js';
import { WzDatePicker } from '../../../components/wz-date-picker/wz-date-picker';
import { withReduxProvider, withGlobalBreadcrumb, withUserAuthorizationPrompt } from '../../../components/common/hocs';
import { useSelector, useDispatch } from 'react-redux';
import { updateGlobalBreadcrumb } from '../../../redux/actions/globalBreadcrumbActions';
// import { compose } from 'redux';
import { log } from '../../../../server/logger';
import { changeTabSelected } from '../../../redux/actions/nidsActions';
// import { connect } from 'react-redux';

export const NidsPreview = withReduxProvider(() => {
  const dispatch = useDispatch();
  const tab = useSelector(state => state.nidsReducers.tabSelected);
  
  // useEffect(() => { 
  //   {setGlobalBreadcrumb()}
  // }, []);

  // setGlobalBreadcrumb = () => {
  //   const breadcrumb = [
  //     { text: '' },
  //     { text: 'NIDS',href: "#/nids"},
  //   ];
  //   dispatch(updateGlobalBreadcrumb(breadcrumb));
  // }

  return (
    <div>
       {/* <Fragment> */}
        <NidsMenu></NidsMenu>
        <EuiPage>
          {tab === "nodes" ? <NidsTable></NidsTable> : null}
          {tab === "groups" ? <p>groups</p> : null}
          {tab === "openrules" ? <p>openrules</p> : null}
          {tab === "master" ? <p>master</p> : null}
          {tab === "config" ? <p>config</p> : null}
        </EuiPage>
      {/* </Fragment> */}
    </div>
  )
}
);