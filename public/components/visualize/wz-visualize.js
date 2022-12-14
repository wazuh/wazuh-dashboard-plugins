/*
 * Wazuh app - React component for Visualize.
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
import { visualizations } from './visualizations';
import { agentVisualizations } from './agent-visualizations';
import KibanaVis from '../../kibana-integrations/kibana-vis';
import {
  EuiPage,
  EuiFlexGroup,
  EuiPanel,
  EuiFlexItem,
  EuiButton,
  EuiButtonIcon,
  EuiDescriptionList,
  EuiCallOut,
} from '@elastic/eui';
import WzReduxProvider from '../../redux/wz-redux-provider';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { WzRequest } from '../../react-services/wz-request';
import { CommonData } from '../../services/common-data';
import { VisHandlers } from '../../factories/vis-handlers';
import { RawVisualizations } from '../../factories/raw-visualizations';
import { Metrics } from '../overview/metrics/metrics';
import { PatternHandler } from '../../react-services/pattern-handler';
import { getToasts } from '../../kibana-services';
import { SampleDataWarning, SecurityAlerts } from './components';
import { toMountPoint } from '../../../../../src/plugins/kibana_react/public';
import { withReduxProvider, withErrorBoundary } from '../common/hocs';
import { compose } from 'redux';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { satisfyPluginPlatformVersion } from '../../../common/semver';
import { webDocumentationLink } from '../../../common/services/web_documentation';

const visHandler = new VisHandlers();

export const WzVisualize = compose(
  withErrorBoundary,
  withReduxProvider
)(
  class WzVisualize extends Component {
    _isMount = false;
    constructor(props) {
      super(props);
      this.state = {
        visualizations: !!props.isAgent ? agentVisualizations : visualizations,
        expandedVis: false,
        refreshingKnownFields: [],
        refreshingIndex: true,
      };
      this.hasRefreshedKnownFields = false;
      this.isRefreshing = false;
      this.metricValues = false;
      this.rawVisualizations = new RawVisualizations();
      this.wzReq = WzRequest;
      const wazuhConfig = new WazuhConfig();
      this.commonData = new CommonData();
      const configuration = wazuhConfig.getConfig();
      this.monitoringEnabled = !!(configuration || {})['wazuh.monitoring.enabled'];
      this.newFields = {};
    }

    async componentDidMount() {
      this._isMount = true;
      visHandler.removeAll();
      this.agentsStatus = false;
    }

    /**
     * Reset the visualizations when the type of Dashboard is changed.
     * 
     * There are 2 kinds of Dashboards:
     *   - General or overview   --> When to agent is pinned.
     *   - Specific or per agent --> When there is an agent pinned.
     * 
     * The visualizations are reset only when the type of Dashboard changes 
     * from a type to another, but aren't when the pinned agent changes.
     * 
     * More info:
     * https://github.com/wazuh/wazuh-kibana-app/issues/4230#issuecomment-1152161434
     * 
     * @param {Object} prevProps 
     */
    async componentDidUpdate(prevProps) {
      if (
        (!prevProps.isAgent && this.props.isAgent) ||
        (prevProps.isAgent && !this.props.isAgent)
      ) {
        this._isMount &&
          this.setState({
            visualizations: !!this.props.isAgent ? agentVisualizations : visualizations,
          });
        visHandler.removeAll();
      }
    }

    componentWillUnmount() {
      this._isMount = false;
    }

    expand = (id) => {
      this.setState({ expandedVis: this.state.expandedVis === id ? false : id });
    };

    refreshKnownFields = async (newField = null) => {
      if (newField && newField.name) {
        this.newFields[newField.name] = newField;
      }
      if (!this.hasRefreshedKnownFields) {
        // Known fields are refreshed only once per dashboard loading
        try {
          this.hasRefreshedKnownFields = true;
          this.isRefreshing = true;
          if(satisfyPluginPlatformVersion('<7.11')){
            await PatternHandler.refreshIndexPattern(this.newFields);
          };
          this.isRefreshing = false;
          this.reloadToast();
          this.newFields = {};
        } catch (error) {
          this.isRefreshing = false;
          const options = {
            context: `${WzVisualize.name}.refreshKnownFields`,
            level: UI_LOGGER_LEVELS.ERROR,
            severity: UI_ERROR_SEVERITIES.BUSINESS,
            error: {
              error: error,
              message: 'The index pattern could not be refreshed' || error.message || error,
              title: error.name || error,
            },
          };
          getErrorOrchestrator().handleError(options);
        }
      } else if (this.isRefreshing) {
        await new Promise((r) => setTimeout(r, 150));
        await this.refreshKnownFields();
      }
    };
    reloadToast = () => {
      const toastLifeTimeMs = 300000;
      if(satisfyPluginPlatformVersion('<7.11')){
        getToasts().add({
          color: 'success',
          title: 'The index pattern was refreshed successfully.',
          text: toMountPoint(<EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
            <EuiFlexItem grow={false}>
              There were some unknown fields for the current index pattern.
              You need to refresh the page to apply the changes.
              <a
                title="More information in Wazuh documentation"
                href={webDocumentationLink('user-manual/elasticsearch/troubleshooting.html#index-pattern-was-refreshed-toast-keeps-popping-up')}
                target="documentation"
              >
                Troubleshooting
                </a>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton onClick={() => window.location.reload()} size="s">Reload page</EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>),
          toastLifeTimeMs
        });
      }else if(satisfyPluginPlatformVersion('>=7.11')){
        getToasts().add({
          color: 'warning',
          title: 'Found unknown fields in the index pattern.',
          text: toMountPoint(<EuiFlexGroup justifyContent="flexEnd" gutterSize="s">
            <EuiFlexItem grow={false}>
              There are some unknown fields for the current index pattern.
              You need to refresh the page to update the fields.
              <a
                title="More information in Wazuh documentation"
                href={urlTroubleShootingDocs}
                target="documentation">
                Troubleshooting
                </a>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiButton onClick={() => window.location.reload()} size="s">Reload page</EuiButton>
            </EuiFlexItem>
          </EuiFlexGroup>),
          toastLifeTimeMs
        });
      };
    };
    render() {
      const { visualizations } = this.state;
      const { selectedTab } = this.props;
      const renderVisualizations = (vis) => {
        return (
          <EuiFlexItem
            grow={parseInt((vis.width || 10) / 10)}
            key={vis.id}
            style={{ maxWidth: vis.width + '%', margin: 0, padding: 12 }}
          >
            <EuiPanel
              paddingSize="none"
              className={this.state.expandedVis === vis.id ? 'fullscreen h-100' : 'h-100'}
            >
              <EuiFlexItem className="h-100">
                <EuiFlexGroup style={{ padding: '12px 12px 0px' }} className="embPanel__header">
                  <h2 className="embPanel__title wz-headline-title">{vis.title}</h2>
                  <EuiButtonIcon
                    color="text"
                    style={{ padding: '0px 6px', height: 30 }}
                    onClick={() => this.expand(vis.id)}
                    iconType="expand"
                    aria-label="Expand"
                  />
                </EuiFlexGroup>
                <div style={{ height: '100%' }}>   
                  <WzReduxProvider>
                    <KibanaVis
                      refreshKnownFields={this.refreshKnownFields}
                      visID={vis.id}
                      tab={selectedTab}
                      {...this.props}
                    ></KibanaVis>
                  </WzReduxProvider>
                </div>
              </EuiFlexItem>
            </EuiPanel>
          </EuiFlexItem>
        );
      };

      const renderVisualizationRow = (rows, width, idx) => {
        return (
          <EuiFlexItem
            grow={(width || 10) / 10}
            key={idx}
            style={{ maxWidth: width + '%', margin: 0, padding: 12 }}
          >
            {rows.map((visRow, j) => {
              return (
                <EuiFlexGroup
                  key={j}
                  style={{
                    height: visRow.height || 0 + 'px',
                    marginBottom: visRow.noMargin ? '' : '4px',
                  }}
                >
                  {visRow.vis.map((visualizeRow) => {
                    return renderVisualizations(visualizeRow);
                  })}
                </EuiFlexGroup>
              );
            })}
          </EuiFlexItem>
        );
      };

      return (
        <Fragment>
          {/* Sample alerts Callout */}
          {this.props.resultState === 'ready' && <SampleDataWarning />}

          {this.props.resultState === 'none' && (
            <div className="wz-margin-top-10 wz-margin-right-8 wz-margin-left-8">
              <EuiCallOut
                title="There are no results for selected time range. Try another
                    one."
                color="warning"
                iconType="help"
              ></EuiCallOut>
            </div>
          )}
          <EuiFlexItem className={(this.props.resultState === 'none' && 'no-opacity') || ''}>
            {this.props.resultState === 'ready' && (
              <Metrics section={selectedTab} resultState={this.props.resultState} />
            )}

            {selectedTab &&
              selectedTab !== 'welcome' &&
              visualizations[selectedTab] &&
              visualizations[selectedTab].rows.map((row, i) => {
                return (
                  <EuiFlexGroup
                    key={i}
                    style={{
                      display: row.hide && 'none',
                      height: row.height || 0 + 'px',
                      margin: 0,
                      maxWidth: '100%',
                    }}
                  >
                    {row.vis.map((vis, n) => {
                      return !vis.hasRows
                        ? renderVisualizations(vis)
                        : renderVisualizationRow(vis.rows, vis.width, n);
                    })}
                  </EuiFlexGroup>
                );
              })}
          </EuiFlexItem>
          <EuiFlexGroup style={{ margin: 0 }}>
            <EuiFlexItem>
              {this.props.selectedTab === 'general' && this.props.resultState !== 'none' && (
                <EuiPanel
                  paddingSize="none"
                  className={
                    this.state.expandedVis === 'security-alerts'
                      ? 'fullscreen h-100 wz-overflow-y-auto wz-overflow-x-hidden'
                      : 'h-100'
                  }
                >
                  <EuiFlexItem className="h-100" style={{ marginBottom: 12 }}>
                    <EuiFlexGroup style={{ padding: '12px 12px 0px' }} className="embPanel__header">
                      <h2 className="embPanel__title wz-headline-title">Security Alerts</h2>
                      <EuiButtonIcon
                        color="text"
                        style={{ padding: '0px 6px', height: 30 }}
                        onClick={() => this.expand('security-alerts')}
                        iconType="expand"
                        aria-label="Expand"
                      />
                    </EuiFlexGroup>
                    <SecurityAlerts />
                  </EuiFlexItem>
                </EuiPanel>
              )}
            </EuiFlexItem>
          </EuiFlexGroup>
        </Fragment>
      );
    }
  }
);
