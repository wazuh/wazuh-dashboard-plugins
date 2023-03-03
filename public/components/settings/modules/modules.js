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
import {
  UI_LOGGER_LEVELS,
  WAZUH_ROLE_ADMINISTRATOR_NAME,
} from '../../../../common/constants';
import { compose } from 'redux';
import { UI_ERROR_SEVERITIES } from '../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { i18n } from '@kbn/i18n';

export class EnableModulesWrapper extends Component {
  constructor(props) {
    try {
      super(props);
      this.currentApi = JSON.parse(AppState.getCurrentAPI(true)).id;
      this.state = {
        extensions: [],
        groups: [
          {
            title: i18n.translate(
              'wazuh.components.setting.modules.wrapper.security',
              {
                defaultMessage: 'Security Information Management',
              },
            ),
            modules: [
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.gernal',
                  {
                    defaultMessage: 'general',
                  },
                ),
                default: true,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.fim',
                  {
                    defaultMessage: 'fim',
                  },
                ),
                default: true,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.office',
                  {
                    defaultMessage: 'office',
                  },
                ),
                default: false,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.aws',
                  {
                    defaultMessage: 'aws',
                  },
                ),
                default: false,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.gcp',
                  {
                    defaultMessage: 'gcp',
                  },
                ),
                default: false,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.github',
                  {
                    defaultMessage: "'github'",
                  },
                ),
                default: false,
                agent: false,
              },
            ],
          },
          {
            title: i18n.translate(
              'wazuh.components.setting.modules.wrapper.auditing',
              {
                defaultMessage: 'Auditing and Policy Monitoring',
              },
            ),
            modules: [
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.pm',
                  {
                    defaultMessage: 'pm',
                  },
                ),
                default: true,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.sca',
                  {
                    defaultMessage: 'sca',
                  },
                ),
                default: true,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.audit',
                  {
                    defaultMessage: 'audit',
                  },
                ),
                default: true,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.oscap',
                  {
                    defaultMessage: 'oscap',
                  },
                ),
                default: false,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.ciscat',
                  {
                    defaultMessage: 'ciscat',
                  },
                ),
                default: false,
                agent: false,
              },
            ],
          },
          {
            title: i18n.translate(
              'wazuh.components.setting.modules.wrapper.response',
              {
                defaultMessage: 'Threat Detection and Response',
              },
            ),
            modules: [
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.vuls',
                  {
                    defaultMessage: 'vuls',
                  },
                ),
                default: true,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.mitre',
                  {
                    defaultMessage: 'mitre',
                  },
                ),
                default: true,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.virus',
                  {
                    defaultMessage: 'virustotal',
                  },
                ),
                default: false,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.osq',
                  {
                    defaultMessage: 'osquery',
                  },
                ),
                default: false,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.docker',
                  {
                    defaultMessage: 'docker',
                  },
                ),
                default: false,
                agent: false,
              },
            ],
          },
          {
            title: i18n.translate(
              'wazuh.components.setting.modules.wrapper.compliance',
              {
                defaultMessage: 'Regulatory Compliance',
              },
            ),
            modules: [
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.pci',
                  {
                    defaultMessage: 'pci',
                  },
                ),
                default: true,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.nist',
                  {
                    defaultMessage: 'nist',
                  },
                ),
                default: true,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.gdpr',
                  {
                    defaultMessage: 'gdpr',
                  },
                ),
                default: false,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.hipaa',
                  {
                    defaultMessage: 'hipaa',
                  },
                ),
                default: false,
                agent: false,
              },
              {
                name: i18n.translate(
                  'wazuh.components.setting.modules.wrapper.tsc',
                  {
                    defaultMessage: 'tsc',
                  },
                ),
                default: false,
                agent: false,
              },
            ],
          },
        ],
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
                label=''
                style={{
                  padding: '8px 0px',
                  right: 0,
                  position: 'absolute',
                  top: 0,
                }}
                checked={
                  typeof this.state.extensions[extension.name] !== 'undefined'
                    ? this.state.extensions[extension.name]
                    : false
                }
                onChange={() => this.toggleExtension(extension)}
              />
            )}
            {extension.default && (
              <EuiBetaBadge
                label={i18n.translate(
                  'wazuh.public.components.setting..modules.wrapper.',
                  {
                    defaultMessage: 'Default',
                  },
                )}
                tooltipContent={i18n.translate(
                  'wazuh.public.components.setting..modules.wrapper.defaultModule',
                  {
                    defaultMessage: 'This module is enabled by default',
                  },
                )}
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
                          <EuiBadge color='#006bb4'>{'Agent module'}</EuiBadge>
                          &nbsp;&nbsp;
                        </span>
                      )}
                      {WAZUH_MODULES[extension.name] &&
                        WAZUH_MODULES[extension.name].title}
                    </span>
                  ),
                  description: (
                    <span>
                      {WAZUH_MODULES[extension.name] &&
                        WAZUH_MODULES[extension.name].description}
                    </span>
                  ),
                },
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
          <EuiPanel paddingSize='l'>
            <EuiFlexGroup>
              <EuiFlexItem>
                <EuiTitle size='s'>
                  <h2>{group.title}</h2>
                </EuiTitle>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size='l' />
            <EuiFlexGroup>
              <EuiFlexItem>{this.buildModuleGroup(group.modules)}</EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiPage>
      );
    });
  }
}

export const EnableModules = compose(
  withErrorBoundary,
  withReduxProvider,
  withUserAuthorizationPrompt(null, [WAZUH_ROLE_ADMINISTRATOR_NAME]),
)(EnableModulesWrapper);
