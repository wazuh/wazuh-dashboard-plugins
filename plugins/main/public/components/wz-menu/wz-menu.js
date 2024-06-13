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
import { PatternHandler } from '../../react-services/pattern-handler';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { connect } from 'react-redux';
import store from '../../redux/store';
import {
  getToasts,
  getDataPlugin,
  getHeaderActionMenuMounter,
} from '../../kibana-services';
import { GenericRequest } from '../../react-services/generic-request';
import { ApiCheck } from '../../react-services/wz-api-check';
import { withWindowSize } from '../../components/common/hocs/withWindowSize';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { MountPointPortal } from '../../../../../src/plugins/opensearch_dashboards_react/public';
import { setBreadcrumbs } from '../common/globalBreadcrumb/platformBreadcrumb';
import WzDataSourceSelector from '../common/data-source/components/wz-data-source-selector/wz-data-source-selector';
import { PinnedAgentManager } from '../wz-agent-selector/wz-agent-selector-service';
import NavigationService from '../../react-services/navigation-service';

const sections = {
  overview: 'overview',
  manager: 'manager',
  'agents-preview': 'agents-preview',
  agents: 'agents-preview',
  settings: 'settings',
  'wazuh-dev': 'wazuh-dev',
  'health-check': 'health-check',
  security: 'security',
};

export const WzMenu = withWindowSize(
  class WzMenu extends Component {
    constructor(props) {
      super(props);
      this.state = {
        showMenu: false,
        menuOpened: false,
        currentAPI: '',
        APIlist: [],
        showSelector: false,
        theresPattern: false,
        currentPattern: '',
        patternList: [],
        currentSelectedPattern: '',
        isManagementPopoverOpen: false,
        isOverviewPopoverOpen: false,
      };
      this.store = store;
      this.genericReq = GenericRequest;
      this.wazuhConfig = new WazuhConfig();
      this.indexPatterns = getDataPlugin().indexPatterns;
      this.isLoading = false;
      this.pinnedAgentManager = new PinnedAgentManager();
    }

    async componentDidMount() {
      setBreadcrumbs(this.props.globalBreadcrumbReducers.breadcrumb);
      try {
        const APIlist = await this.loadApiList();
        this.setState({ APIlist: APIlist });
        if (APIlist.length) {
          const { id: apiId } = JSON.parse(AppState.getCurrentAPI());
          const filteredApi = APIlist.filter(api => api.id === apiId);
          const selectedApi = filteredApi[0];
          if (selectedApi) {
            const apiData = await ApiCheck.checkStored(selectedApi.id);
            //update cluster info
            const cluster_info = apiData?.data?.data?.cluster_info;
            if (cluster_info) {
              AppState.setClusterInfo(cluster_info);
            }
          }
        }
      } catch (error) {
        const options = {
          context: `${WzMenu.name}.componentDidMount`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.CRITICAL,
          store: true,
          display: true,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    }

    showToast = (color, title, text, time) => {
      getToasts().add({
        color: color,
        title: title,
        text: text,
        toastLifeTimeMs: time,
      });
    };

    loadApiList = async () => {
      const result = await this.genericReq.request('GET', '/hosts/apis', {});
      const APIlist = (result || {}).data || [];
      return APIlist;
    };

    loadIndexPatternsList = async () => {
      try {
        let newState = {};
        let list = await PatternHandler.getPatternList('api');
        if (!list) return;
        this.props?.appConfig?.data?.['ip.ignore']?.length &&
          (list = list.filter(
            indexPattern =>
              !this.props?.appConfig?.data?.['ip.ignore'].includes(
                indexPattern.title,
              ),
          ));

        // When not exists patterns, not show the selector
        if (list.length === 1) return;

        let filtered = false;
        // If there is no current pattern, fetch it
        if (!AppState.getCurrentPattern()) {
          AppState.setCurrentPattern(list[0].id);
        } else {
          // Check if the current pattern cookie is valid
          filtered = list.find(item =>
            item.id.includes(AppState.getCurrentPattern()),
          );
          if (!filtered) AppState.setCurrentPattern(list[0].id);
        }

        const data = filtered
          ? filtered
          : await this.indexPatterns.get(AppState.getCurrentPattern());
        newState = {
          ...newState,
          theresPattern: true,
          currentPattern: data.title,
        };

        // Getting the list of index patterns
        if (list) {
          newState = {
            ...newState,
            patternList: list,
            currentSelectedPattern: AppState.getCurrentPattern(),
          };
        }
        return newState;
      } catch (error) {
        throw error;
      }
    };

    async componentDidUpdate(prevProps) {
      let newState = {};
      const { id: apiId } = JSON.parse(AppState.getCurrentAPI());
      const { currentAPI } = this.state;

      if (this.props.windowSize) {
        this.showSelectorsInPopover = this.props.windowSize.width < 1100;
      }

      if (
        prevProps.state.showMenu !== this.props.state.showMenu ||
        (this.props.state.showMenu === true && this.state.showMenu === false)
      ) {
        newState = { ...newState, ...(await this.load()) };
      }
      if ((!currentAPI && apiId) || apiId !== currentAPI) {
        newState = { ...newState, currentAPI: apiId };
      } else {
        if (
          currentAPI &&
          this.props.state.currentAPI &&
          currentAPI !== this.props.state.currentAPI
        ) {
          newState = { ...newState, currentAPI: this.props.state.currentAPI };
        }
      }
      if (
        !_.isEqual(
          prevProps?.appConfig?.data?.['ip.ignore'],
          this.props?.appConfig?.data?.['ip.ignore'],
        )
      ) {
        newState = { ...newState, ...(await this.loadIndexPatternsList()) };
      }

      if (
        !_.isEqual(
          this.props.globalBreadcrumbReducers.breadcrumb,
          prevProps.globalBreadcrumbReducers.breadcrumb,
        )
      ) {
        setBreadcrumbs(this.props.globalBreadcrumbReducers.breadcrumb);
      }

      newState = { ...prevProps.state, ...newState };
      if (!_.isEqual(newState, prevProps.state)) {
        // and the state is different from the previous one
        this.setState(newState);
      }
    }

    async load() {
      try {
        let newState = {};
        newState = {
          showMenu: true,
          isOverviewPopoverOpen: false,
          isManagementPopoverOpen: false,
          isSelectorsPopoverOpen: false,
        };

        let list = await PatternHandler.getPatternList('api');
        if (!list || (list && !list.length)) return;
        this.props?.appConfig?.data?.['ip.ignore']?.length &&
          (list = list.filter(
            indexPattern =>
              !this.props?.appConfig?.data?.['ip.ignore'].includes(
                indexPattern.title,
              ),
          ));

        let filtered = false;
        // If there is no current pattern, fetch it
        if (!AppState.getCurrentPattern()) {
          AppState.setCurrentPattern(list[0].id);
        } else {
          // Check if the current pattern cookie is valid
          filtered = list.filter(item =>
            item.id.includes(AppState.getCurrentPattern()),
          );
          if (!filtered.length) AppState.setCurrentPattern(list[0].id);
        }

        const data = filtered
          ? filtered
          : await this.indexPatterns.get(AppState.getCurrentPattern());
        newState = {
          ...newState,
          theresPattern: true,
          currentPattern: data.title,
        };

        // Getting the list of index patterns
        if (list) {
          newState = {
            ...newState,
            patternList: list,
            currentSelectedPattern: AppState.getCurrentPattern(),
          };
        }
        return newState;
      } catch (error) {
        const options = {
          context: `${WzMenu.name}.load`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: true,
          display: true,
          error: {
            error: error,
            message: error.message || error,
            title: error.name || error,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
      this.isLoading = false;
    }

    updatePatternAndApi = async () => {
      this.setState({
        menuOpened: false,
        ...{ APIlist: await this.loadApiList() },
        ...(await this.loadIndexPatternsList()),
      });
    };

    changeAPI = async event => {
      try {
        const apiId = event.target[event.target.selectedIndex];
        const apiEntry = this.state.APIlist.filter(item => {
          return item.id === apiId.value;
        });
        const response = await ApiCheck.checkApi(apiEntry[0]);
        const clusterInfo = response.data || {};
        const apiData = this.state.APIlist.filter(item => {
          return item.id === apiId.value;
        });

        apiData[0].cluster_info = clusterInfo;

        AppState.setClusterInfo(apiData[0].cluster_info);
        AppState.setCurrentAPI(
          JSON.stringify({ name: apiData[0].manager, id: apiId.value }),
        );
        const isPinnedAgent = this.pinnedAgentManager.isPinnedAgent();
        if (isPinnedAgent) {
          this.pinnedAgentManager.unPinAgent();
        }
        if (this.state.currentMenuTab !== 'wazuh-dev') {
          /* TODO: this reloads the page to force the components are remounted with the new
          selection of. To avoid this refresh, we would have to do the components are able to react
          to these changes redoing the requests, etc... This will need a considerable time to
          apply the changes. The reload of the pages is the same behavior used for the routing based
          on AngularJS.
          */
          NavigationService.getInstance().reload();
        }
      } catch (error) {
        const options = {
          context: `${WzMenu.name}.changePattern`,
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

    getApiSelectorComponent() {
      let style = { minWidth: 100, textOverflow: 'ellipsis' };
      if (this.showSelectorsInPopover) {
        style = { width: '100%', minWidth: 200 };
      }

      return (
        <>
          <EuiFlexItem grow={this.showSelectorsInPopover}>
            <p>API</p>
          </EuiFlexItem>
          <EuiFlexItem grow={this.showSelectorsInPopover}>
            <div style={style}>
              <EuiSelect
                id='selectAPIBar'
                fullWidth={true}
                options={this.state.APIlist.map(item => {
                  return { value: item.id, text: item.id };
                })}
                value={this.state.currentAPI}
                onChange={this.changeAPI}
                aria-label='API selector'
              />
            </div>
          </EuiFlexItem>
        </>
      );
    }

    onChangePattern = async pattern => {
      try {
        this.setState({ currentSelectedPattern: pattern.id });
        if (this.state.currentMenuTab !== 'wazuh-dev') {
          /* TODO: this reloads the page to force the components are remounted with the new
          selection of. To avoid this refresh, we would have to do the components are able to react
          to these changes redoing the requests, etc... This will need a considerable time to
          apply the changes. The reload of the pages is the same behavior used for the routing based
          on AngularJS.
          */
          NavigationService.getInstance().reload();
        }
        await this.updatePatternAndApi();
      } catch (error) {
        const options = {
          context: `${WzMenu.name}.onChangePattern`,
          level: UI_LOGGER_LEVELS.ERROR,
          severity: UI_ERROR_SEVERITIES.BUSINESS,
          store: false,
          display: true,
          error: {
            error: error,
            message: error.message || error,
            title: `Error changing the Index Pattern`,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    };

    getIndexPatternSelectorComponent() {
      let style = { maxWidth: 200, maxHeight: 50 };
      if (this.showSelectorsInPopover) {
        style = { width: '100%', maxHeight: 50, minWidth: 200 };
      }

      return (
        <>
          <EuiFlexItem grow={this.showSelectorsInPopover}>
            <p>Index pattern</p>
          </EuiFlexItem>
          <EuiFlexItem grow={this.showSelectorsInPopover}>
            <div style={style}>
              <WzDataSourceSelector
                onChange={this.onChangePattern}
                name='index pattern'
              />
            </div>
          </EuiFlexItem>
        </>
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

      return (
        <>
          <MountPointPortal setMountPoint={getHeaderActionMenuMounter()}>
            <EuiFlexGroup
              alignItems='center'
              responsive={false}
              className='wz-margin-left-10 wz-margin-right-10 font-size-14'
            >
              {!this.showSelectorsInPopover &&
                this.state.patternList.length > 1 &&
                this.getIndexPatternSelectorComponent()}

              {!this.showSelectorsInPopover &&
                this.state.APIlist.length > 1 &&
                this.getApiSelectorComponent()}

              {this.showSelectorsInPopover &&
                (this.state.patternList.length > 1 ||
                  this.state.APIlist.length > 1) && (
                  <>
                    <EuiFlexItem grow={false}>
                      <EuiPopover
                        ownFocus
                        anchorPosition='downCenter'
                        button={openSelectorsButton}
                        isOpen={this.state.isSelectorsPopoverOpen}
                        closePopover={() => this.switchSelectorsPopOver()}
                      >
                        {this.state.patternList.length > 1 && (
                          <EuiFlexGroup
                            alignItems='center'
                            style={{ paddingTop: 5 }}
                          >
                            {this.getIndexPatternSelectorComponent()}
                          </EuiFlexGroup>
                        )}
                        {this.state.APIlist.length > 1 && (
                          <EuiFlexGroup
                            alignItems='center'
                            style={{ paddingTop: 5 }}
                            direction='row'
                          >
                            {this.getApiSelectorComponent()}
                          </EuiFlexGroup>
                        )}
                      </EuiPopover>
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
