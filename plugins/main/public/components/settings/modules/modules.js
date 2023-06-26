import React, { Component } from 'react';
import {
  EuiBadge,
  EuiBetaBadge,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPage,
  EuiPanel,
  EuiSpacer,
  EuiSwitch,
  EuiTitle,
} from '@elastic/eui';
import { WAZUH_MODULES } from '../../../../common/wazuh-modules';
import { AppState } from '../../../react-services/app-state';
import store from '../../../redux/store';
import { updateSelectedSettingsSection } from '../../../redux/actions/appStateActions';
import {
  withErrorBoundary,
  withReduxProvider,
  withUserAuthorizationPrompt,
} from '../../common/hocs';
import { UI_LOGGER_LEVELS, WAZUH_ROLE_ADMINISTRATOR_NAME } from '../../../../common/constants';
import { compose } from 'redux';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';

export class EnableModulesWrapper extends Component {
  constructor(props) {
    try {
      super(props);
      this.currentApi = JSON.parse(AppState.getCurrentAPI(true)).id;
      this.state = {
        extensions: [],
        groups: [
          {
            title: 'Security Information Management',
            modules: [
              { name: 'general', default: true, agent: false },
              { name: 'fim', default: true, agent: false },
              { name: 'office', default: false, agent: false },
              { name: 'aws', default: false, agent: false },
              { name: 'gcp', default: false, agent: false },
              { name: 'github', default: false, agent: false }
            ]
          },
          {
            title: 'Auditing and Policy Monitoring',
            modules: [
              { name: 'pm', default: true, agent: false },
              { name: 'sca', default: true, agent: false },
              { name: 'audit', default: true, agent: false },
              { name: 'oscap', default: false, agent: false },
              { name: 'ciscat', default: false, agent: false }
            ]
          },
          {
            title: 'Threat Detection and Response',
            modules: [
              { name: 'vuls', default: true, agent: false },
              { name: 'mitre', default: true, agent: false },
              { name: 'virustotal', default: false, agent: false },
              { name: 'osquery', default: false, agent: false },
              { name: 'docker', default: false, agent: false },
            ]
          },
          {
            title: 'Regulatory Compliance',
            modules: [
              { name: 'pci', default: true, agent: false },
              { name: 'nist', default: true, agent: false },
              { name: 'gdpr', default: false, agent: false },
              { name: 'hipaa', default: false, agent: false },
              { name: 'tsc', default: false, agent: false }
            ]
          }
        ]
      };
    } catch (error) {
      const options = {
        context: `${EnableModulesWrapper.name}.constructor`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.CRITICAL,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
  }

  async componentDidMount() {
    try {
      store.dispatch(updateSelectedSettingsSection('modules'));
      const extensions = await AppState.getExtensions(this.currentApi);
      this.setState({ extensions });
    } catch (error) {
      const options = {
        context: `${EnableModulesWrapper.name}.componentDidMount`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
  }

  toggleExtension(extension) {
    const extensions = this.state.extensions;
    extensions[extension.name] = !extensions[extension.name];
    this.setState({ extensions });
    try {
      this.currentApi && AppState.setExtensions(this.currentApi, extensions);
    } catch (error) {
      const options = {
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
  }

  buildModuleGroup(extensions) {
    const switches = extensions.map(extension => {
      return (
        <EuiFlexGroup key={extension.name} responsive={false}>
          <EuiFlexItem grow={false} style={{ minWidth: 90 }}>
            {!extension.default && (
              <EuiSwitch
                label=""
                style={{
                  padding: '8px 0px',
                  right: 0,
                  position: 'absolute',
                  top: 0
                }}
                checked={typeof this.state.extensions[extension.name] !== 'undefined' ? this.state.extensions[extension.name] : false}
                onChange={() => this.toggleExtension(extension)}
              />
            )}
            {extension.default && (
              <EuiBetaBadge
                label="Default"
                tooltipContent="This module is enabled by default"
                style={{ margin: '6px 0px' }}
              />
            )}
          </EuiFlexItem>
          <EuiFlexItem>
            <EuiDescriptionList
              listItems={[
                {
                  title: (
                    <span>
                      {extension.agent && (
                        <span>
                          <EuiBadge color="#006bb4">{'Agent module'}</EuiBadge>
                          &nbsp;&nbsp;
                        </span>
                      )}
                      {WAZUH_MODULES[extension.name].title}
                    </span>
                  ),
                  description: (
                    <span>{WAZUH_MODULES[extension.name].description}</span>
                  )
                }
              ]}
            />
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    });

    return <div>{switches}</div>;
  }

  render() {
    return this.state.groups.map((group, i) => {
      return (
        <EuiPage
          key={i}
          style={{ paddingBottom: i !== this.state.groups.length - 1 ? 8 : 16 }}
        >
          <EuiPanel paddingSize="l">
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle size="s">
                  <h2>{group.title}</h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="l" />
            <EuiFlexGroup>
              <EuiFlexItem>{this.buildModuleGroup(group.modules)}</EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiPage>
      );
    });
  }
}

export const EnableModules = compose (
  withErrorBoundary,
  withReduxProvider,
  withUserAuthorizationPrompt(null, [WAZUH_ROLE_ADMINISTRATOR_NAME])
)(EnableModulesWrapper);
