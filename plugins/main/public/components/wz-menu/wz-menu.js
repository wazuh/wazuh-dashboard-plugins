/*
 * Wazuh app - React component for build q queries.
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPopover,
  EuiButtonEmpty,
  EuiCallOut,
  EuiToolTip,
  EuiLoadingSpinner,
  EuiSelect,
} from '@elastic/eui';
import { AppState } from '../../react-services/app-state';

import { connect } from 'react-redux';
import { getHeaderActionMenuMounter } from '../../kibana-services';
import { GenericRequest } from '../../react-services/generic-request';
import { ApiCheck } from '../../react-services/wz-api-check';
import { withWindowSize } from '../../components/common/hocs/withWindowSize';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { MountPointPortal } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { setBreadcrumbs } from '../common/globalBreadcrumb/platformBreadcrumb';
import { PinnedAgentManager } from '../wz-agent-selector/wz-agent-selector-service';
import NavigationService from '../../react-services/navigation-service';
import { useAsyncActionRunOnStart } from '../common/hooks';
import { useSelectedServerApi } from '../common/hooks/use-selected-server-api';
import { Selector, SelectorContainer, SelectorLabel } from './selectors';

async function getServerAPIList() {
  const response = await GenericRequest.request('GET', '/hosts/apis', {});
  return response?.data;
}

const ServerAPISelector = ({ showSelectorsInPopover }) => {
  const action = useAsyncActionRunOnStart(getServerAPIList, []);

  const { selectedAPI: currentAPI } = useSelectedServerApi();

  let style = { minWidth: 100, textOverflow: 'ellipsis' };
  if (showSelectorsInPopover) {
    style = { width: '100%', minWidth: 220 };
  }

  const notSelected = !Boolean(currentAPI);
  const actionError =
    action.error?.message ||
    (!action.running && notSelected && 'Server API is not selected');

  const isInvalid = Boolean(actionError);

  const changeAPI = async event => {
    try {
      const apiId = event.target[event.target.selectedIndex];
      const apiEntry = action.data?.filter(item => {
        return item.id === apiId.value;
      });
      const response = await ApiCheck.checkApi(apiEntry[0]);
      const clusterInfo = response.data || {};
      const apiData = action.data?.filter(item => {
        return item.id === apiId.value;
      });

      apiData[0].cluster_info = clusterInfo;

      AppState.setClusterInfo(apiData[0].cluster_info);
      AppState.setCurrentAPI(
        JSON.stringify({
          name: apiData[0].cluster_info?.cluster,
          id: apiId.value,
        }),
      );
      const pinnedAgentManager = new PinnedAgentManager();
      const isPinnedAgent = pinnedAgentManager.isPinnedAgent();
      if (isPinnedAgent) {
        pinnedAgentManager.unPinAgent();
      }

      /* TODO: this reloads the page to force the components are remounted with the new
          selection of. To avoid this refresh, we would have to do the components are able to react
          to these changes redoing the requests, etc... This will need a considerable time to
          apply the changes. The reload of the pages is the same behavior used for the routing based
          on AngularJS.
          */
      NavigationService.getInstance().reload();
    } catch (error) {
      const options = {
        context: `${WzMenu.name}.${changeAPI.name}`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: `Error changing the selected API`,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  };

  return (
    <SelectorContainer>
      <SelectorLabel
        actionError={actionError}
        showSelectorsInPopover={showSelectorsInPopover}
      >
        Manager API
      </SelectorLabel>
      <Selector showSelectorsInPopover={showSelectorsInPopover}>
        <div style={style}>
          <EuiSelect
            id='selectAPIBar'
            fullWidth={true}
            options={
              action.data?.map(item => {
                return { value: item.id, text: item.id };
              }) || []
            }
            value={currentAPI?.id}
            onChange={changeAPI}
            aria-label='API selector'
            hasNoInitialSelection={notSelected}
            isInvalid={isInvalid}
            append={
              <EuiButtonIcon
                iconType='refresh'
                color='primary'
                isDisabled={action.running}
                onClick={() => {
                  action.run();
                }}
              ></EuiButtonIcon>
            }
          />
        </div>
      </Selector>
    </SelectorContainer>
  );
};

export const WzMenu = withWindowSize(
  class WzMenu extends Component {
    constructor(props) {
      super(props);
      this.state = {
        isSelectorsPopoverOpen: false,
      };
    }

    async componentDidMount() {
      setBreadcrumbs(this.props.globalBreadcrumbReducers.breadcrumb);
    }

    async componentDidUpdate(prevProps) {
      if (
        !_.isEqual(
          this.props.globalBreadcrumbReducers.breadcrumb,
          prevProps.globalBreadcrumbReducers.breadcrumb,
        )
      ) {
        setBreadcrumbs(this.props.globalBreadcrumbReducers.breadcrumb);
      }
    }

    buildWazuhNotReadyYet() {
      const container = document.getElementsByClassName('wazuhNotReadyYet');
      return ReactDOM.createPortal(
        <EuiCallOut title={this.props.state.wazuhNotReadyYet} color='warning'>
          <EuiFlexGroup
            responsive={false}
            direction='row'
            style={{ maxHeight: '40px', marginTop: '-45px' }}
          >
            <EuiFlexItem>
              <p></p>
            </EuiFlexItem>
            {typeof this.props.state.wazuhNotReadyYet === 'string' &&
              this.props.state.wazuhNotReadyYet.includes('Restarting') && (
                <EuiFlexItem grow={false}>
                  <p>
                    {' '}
                    <EuiLoadingSpinner size='l' /> &nbsp; &nbsp;{' '}
                  </p>
                </EuiFlexItem>
              )}
            {this.props.state.wazuhNotReadyYet ===
              'Server could not be recovered.' && (
              <EuiFlexItem grow={false}>
                <EuiButtonEmpty
                  grow={false}
                  onClick={() => NavigationService.getInstance().reload()}
                  className='WzNotReadyButton'
                >
                  <span> Reload </span>
                </EuiButtonEmpty>
              </EuiFlexItem>
            )}
          </EuiFlexGroup>
        </EuiCallOut>,
        container[0],
      );
    }

    switchSelectorsPopOver() {
      this.setState({
        isSelectorsPopoverOpen: !this.state.isSelectorsPopoverOpen,
      });
    }

    render() {
      const openSelectorsButton = (
        <EuiToolTip position='bottom' content='Show selectors'>
          <EuiButtonEmpty
            iconType='boxesVertical'
            iconSide='right'
            style={{ position: 'relative', right: 0 }}
            onClick={() => this.switchSelectorsPopOver()}
            size='s'
            aria-label='Open selectors'
          ></EuiButtonEmpty>
        </EuiToolTip>
      );

      const showSelectorsInPopover =
        this.props.windowSize && this.props.windowSize.width < 1100;

      return (
        <>
          <MountPointPortal setMountPoint={getHeaderActionMenuMounter()}>
            <EuiFlexGroup
              alignItems='center'
              responsive={false}
              className='wz-margin-left-10 wz-margin-right-10 font-size-14'
            >
              {(showSelectorsInPopover && (
                <>
                  <EuiFlexItem grow={false}>
                    <EuiPopover
                      ownFocus
                      anchorPosition='downCenter'
                      button={openSelectorsButton}
                      isOpen={this.state.isSelectorsPopoverOpen}
                      closePopover={() => this.switchSelectorsPopOver()}
                    >
                      <EuiFlexGroup
                        alignItems='center'
                        style={{ paddingTop: 5 }}
                        direction='row'
                      >
                        <ServerAPISelector
                          showSelectorsInPopover={showSelectorsInPopover}
                        />
                      </EuiFlexGroup>
                    </EuiPopover>
                  </EuiFlexItem>
                </>
              )) || (
                <>
                  <EuiFlexItem grow={showSelectorsInPopover}>
                    <ServerAPISelector
                      showSelectorsInPopover={showSelectorsInPopover}
                    />
                  </EuiFlexItem>
                </>
              )}
              {this.props.state.wazuhNotReadyYet &&
                this.buildWazuhNotReadyYet()}
            </EuiFlexGroup>
          </MountPointPortal>
        </>
      );
    }
  },
);

const mapStateToProps = state => {
  return {
    state: state.appStateReducers,
    appConfig: state.appConfig,
    globalBreadcrumbReducers: state.globalBreadcrumbReducers,
  };
};

export default connect(mapStateToProps, null)(WzMenu);
