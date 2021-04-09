import React, { Component } from 'react';
import { EuiLoadingSpinner, EuiDescriptionList, EuiIcon, EuiCallOut, EuiButtonIcon, EuiSpacer, EuiButton, EuiToolTip } from '@elastic/eui';
import { AppState } from '../../react-services/app-state';
import { PatternHandler } from '../../react-services/pattern-handler';
import { getAngularModule, getToasts, getHttp } from '../../kibana-services';
import { WazuhConfig } from '../../react-services/wazuh-config';
import { GenericRequest } from '../../react-services/generic-request';
import { ApiCheck } from '../../react-services/wz-api-check';
import { WzRequest } from '../../react-services/wz-request';
import { SavedObject } from '../../react-services/saved-objects';
import { ErrorHandler } from '../../react-services/error-handler';
import { WAZUH_ERROR_DAEMONS_NOT_READY, WAZUH_INDEX_TYPE_STATISTICS, WAZUH_INDEX_TYPE_MONITORING } from '../../../common/constants';
import { checkKibanaSettings, checkKibanaSettingsTimeFilter, checkKibanaSettingsMaxBuckets } from './lib';
import store from '../../redux/store';
import { updateWazuhNotReadyYet } from '../../redux/actions/appStateActions.js';

export class HealthCheck extends Component {
  checkPatternCount = 0;
  constructor(props) {
    super(props);
    this.state = {
      checks: [],
      results: [],
      errors: []
    };
  }
  async componentDidMount() {
    const app = getAngularModule();
    this.$rootScope = app.$injector.get('$rootScope');
    this.load();
  }

  showToast = (color, title, text, time) => {
    getToasts().add({
      color: color,
      title: title,
      text: text,
      toastLifeTimeMs: time
    });
  };

  /**
   * Manage an error
   */
  handleError(error) {
    let errors = this.state.errors;
    errors.push(ErrorHandler.handle(error, 'Health Check', { silent: true }));
    this.setState({ errors });
  }

  /**
   * Sleep method
   * @param time
   */
  delay = time => new Promise(res => setTimeout(res, time));

  /**
   * This validates a pattern
   */
  async checkPatterns() {
    this.checkPatternCount++;
    if (this.checkPatternCount > 10) return Promise.reject('Error trying to check patterns.');
    try {
      const patternId = AppState.getCurrentPattern();
      let patternTitle = '';
      let results = this.state.results;
      let errors = this.state.errors;
      if (this.state.checks.pattern) {
        const i = this.state.results.map(item => item.id).indexOf(2);
        let patternData = patternId ? await SavedObject.existsIndexPattern(patternId) : false;
        if (!patternData) patternData = {};
        patternTitle = patternData.title;

        if (!patternData.status) {
          const patternList = await PatternHandler.getPatternList("healthcheck");
          if (patternList.length) {
            const wazuhConfig = new WazuhConfig();
            const { pattern } = wazuhConfig.getConfig();
            const indexPatternDefault = patternList.find((indexPattern) => indexPattern.title === pattern);
            AppState.setCurrentPattern(indexPatternDefault.id);
            return await this.checkPatterns();
          } else {
            errors.push('The selected index-pattern is not present.');
            results[i].description = <span><EuiIcon type="alert" color="danger" ></EuiIcon> Error</span>;
          }
        } else {
          results[i].description = <span><EuiIcon type="check" color="secondary" ></EuiIcon> Ready</span>;
        }
        this.setState({ results, errors });
      }

      if (this.state.checks.template) {
        if (!patternTitle) {
          var patternData = await SavedObject.existsIndexPattern(patternId);
          patternTitle = patternData.title;
        }
        const i = results.map(item => item.id).indexOf(3);
        const templateData = await GenericRequest.request(
          'GET',
          `/elastic/template/${patternTitle}`
        );
        if (!templateData.data.status) {
          errors.push('No template found for the selected index-pattern.');
          results[i].description = <span><EuiIcon type="alert" color="danger" ></EuiIcon> Error</span>;
        } else {
          results[i].description = <span><EuiIcon type="check" color="secondary" ></EuiIcon> Ready</span>;
        }
        this.setState({ results, errors });
      }
      return;
    } catch (error) {
      this.handleError(error);
    }
  }

  async trySetDefault() {
    try {
      const response = await GenericRequest.request('GET', '/hosts/apis');
      const hosts = response.data;
      const errors = [];
      const results = this.state.results;
      const maxTries = 5;

      if (hosts.length) {
        for (let i = 0; i < hosts.length; i++) {
          let tries = maxTries;
          while (tries--) {
            await this.delay(3000);
            try {
              const API = await ApiCheck.checkApi(hosts[i], true);
              if (API && API.data) {
                return hosts[i].id;
              }
            } catch (err) {
              if (tries) {
                results[0].description = <span><EuiLoadingSpinner size="m" /> Retrying {'.'.repeat(maxTries - tries) }</span>;
                results[1].description = <span><EuiLoadingSpinner size="m" /> Retrying {'.'.repeat(maxTries - tries) }</span>;
                this.setState({ results });
              } else {
                if (err.includes(WAZUH_ERROR_DAEMONS_NOT_READY)) {
                  const updateNotReadyYet = updateWazuhNotReadyYet(false);
                  store.dispatch(updateNotReadyYet);         
                }
                errors.push(`Could not connect to API with id: ${hosts[i].id}: ${err.message || err}`);
              }
            }
          }
        }

        const updateNotReadyYet = updateWazuhNotReadyYet(true);
        store.dispatch(updateNotReadyYet);

        if (errors.length) {
          let err = this.state.errors;
          errors.forEach(error => err.push(error));
          this.setState({ errors: err })
          return Promise.reject('No API available to connect.');
        }
      }
    } catch (err) {
      return Promise.reject(`Error connecting to API: ${err}`);
    }
  }

  /**
   * This attempts to reconnect with API
   */
  reconnectWithAPI() {
    let results = this.state.results;
    results[0].description = <span><EuiLoadingSpinner size="m" /> Checking...</span>;
    results[1].description = <span><EuiLoadingSpinner size="m" /> Checking...</span>;
    getToasts().toasts$._value.forEach(toast => {
      if (toast.text.includes('3000'))
        getToasts().remove(toast.id);
    });
    
    const errors = this.state.errors.filter((error: string) => error.indexOf('API') < 0)
    this.setState({ results, errors });
    this.checkApiConnection();
  }

  /**
   * This attempts to connect with API
   */
  async checkApiConnection() {
    let results = this.state.results;
    let errors = this.state.errors;
    let apiChanged = false;
    const buttonRestartApi = <div> <span><EuiIcon type="alert" color="danger" ></EuiIcon> Error</span>
      {<EuiToolTip
        position='top'
        content='Try to reconnect to the API'
      >
        <EuiButtonIcon
          display="base"
          iconType="refresh"
          isLoading
          iconSize="l"
          onClick={() => this.reconnectWithAPI()}
          size="m"
          aria-label="Next"
        />
      </EuiToolTip>}
    </div>;

    try {
      const currentApi = JSON.parse(AppState.getCurrentAPI() || '{}');
      if (this.state.checks.api && currentApi && currentApi.id) {
        let data;
        try {
          data = await ApiCheck.checkStored(currentApi.id);
        } catch (err) {
          try {
            const newApi = await this.trySetDefault();
            data = await ApiCheck.checkStored(newApi, true);
            apiChanged = true;
          } catch (err2) {
            throw err2
          };
        }
        if (apiChanged) {
          this.showToast(
            'warning',
            'Selected Wazuh API has been updated',
            '',
            3000
          );
          const api = ((data || {}).data || {}).data || {};
          const name = (api.cluster_info || {}).manager || false;
          AppState.setCurrentAPI(
            JSON.stringify({ name: name, id: api.id })
          );
        }
        //update cluster info
        const cluster_info = (((data || {}).data || {}).data || {})
          .cluster_info;
        if (cluster_info) {
          AppState.setClusterInfo(cluster_info);
        }
        const i = results.map(item => item.id).indexOf(0);
        if (data === 3099) {
          errors.push('Wazuh not ready yet.');
          results[i].description = <span><EuiIcon type="alert" color="danger" ></EuiIcon> Error</span>;;
          if (this.checks.setup) {
            const i = results.map(item => item.id).indexOf(1);
            results[i].description = <span><EuiIcon type="alert" color="danger" ></EuiIcon> Error</span>;
          }
          this.setState({ results, errors });
        } else if (data.data.error || data.data.data.apiIsDown) {
          errors.push(data.data.data.apiIsDown ? 'Wazuh API is down.' : `Error connecting to the API.${data.data.error && data.data.error.message ? ` ${data.data.error.message}` : ''}`);
          results[i].description = buttonRestartApi;
          results[i + 1].description = <span><EuiIcon type="alert" color="danger" ></EuiIcon> Error</span>
          this.setState({ results, errors });
        } else {
          results[i].description = <span><EuiIcon type="check" color="secondary" ></EuiIcon> Ready</span>;
          this.setState({ results, errors });
          if (this.state.checks.setup) {
            const versionData = await WzRequest.apiReq(
              'GET',
              '//',
              {}
            );
            const apiVersion = versionData.data.data.api_version;
            const setupData = await GenericRequest.request(
              'GET',
              '/api/setup'
            );
            if (!setupData.data.data['app-version']) {
              errors.push('Error fetching app version');
            };
            if (!apiVersion) {
              errors.push('Error fetching Wazuh API version');
            };
            const api = /v?(?<version>\d+)\.(?<minor>\d+)\.(?<path>\d+)/.exec(apiVersion);
            const appSplit = setupData.data.data['app-version'].split('.');

            const i = this.state.results.map(item => item.id).indexOf(1);
            if (api.groups.version !== appSplit[0] || api.groups.minor !== appSplit[1]) {
              errors.push(
                'API version mismatch. Expected v' +
                setupData.data.data['app-version']
              );
              results[i].description = <span><EuiIcon type="alert" color="danger" ></EuiIcon> Error</span>;
              this.setState({ results, errors });
            } else {
              let permissionToGoToTheApp = true;
              if (!results[i].description.props.children[1].includes('Checking')) {
                permissionToGoToTheApp = false;
              }
              results[i].description = <span><EuiIcon type="check" color="secondary" ></EuiIcon> Ready</span>;
              if (results[i].description.props.children[1].includes('Error')) {
                permissionToGoToTheApp = false;
              }
              this.setState({ results, errors });
              if (permissionToGoToTheApp) {
                this.goAppOverview();
                const updateNotReadyYet = updateWazuhNotReadyYet(false);
                store.dispatch(updateNotReadyYet);
              }
            }
          }
        }
      }
      return;
    } catch (error) {
      results[0].description = buttonRestartApi;
      results[1].description = <span><EuiIcon type="alert" color="danger" ></EuiIcon> Error</span>;
      this.setState({ results });
      AppState.removeNavigation();
      if (error && error.data && error.data.code && error.data.code === 3002) {
        return error;
      } else {
        this.handleError(error);
      }
    }
  }

  /**
   * This check if the pattern exist then create if not
   * @param pattern string
   */
  async checkSupportPattern(pattern, itemId, indexType) {
    let results = this.state.results;
    let errors = this.state.errors;

    const result = await SavedObject.existsIndexPattern(pattern);
    if (!result.data) {
      const toast = getToasts().addWarning(`${pattern} index pattern was not found and it will be created`)
      const fields = await SavedObject.getIndicesFields(pattern, indexType);
      try {
        await SavedObject.createSavedObject(
          'index-pattern',
          pattern,
          {
            attributes: {
              title: pattern,
              timeFieldName: 'timestamp'
            }
          },
          fields
        );
        getToasts().remove(toast.id);
        getToasts().addSuccess(`${pattern} index pattern created successfully`)
        results[itemId].description = <span><EuiIcon type="check" color="secondary" ></EuiIcon> Ready</span>;
        this.setState({ results });
      } catch (error) {
        getToasts().remove(toast.id);
        errors.push(`Error trying to create ${pattern} index pattern: ${error.message}`);
        results[itemId].description = <span><EuiIcon type="alert" color="danger" ></EuiIcon> Error</span>;
        this.setState({ results });
      }
    } else {
      results[itemId].description = <span><EuiIcon type="check" color="secondary" ></EuiIcon> Ready</span>;
      this.setState({ results });
    }
  }

  /**
   * On controller loads
   */
  async load() {
    try {
      const wazuhConfig = new WazuhConfig();
      const configuration = wazuhConfig.getConfig();
      checkKibanaSettings(configuration['checks.metaFields']);
      checkKibanaSettingsTimeFilter(configuration['checks.timeFilter']);
      checkKibanaSettingsMaxBuckets(configuration['checks.maxBuckets']);
      AppState.setPatternSelector(configuration['ip.selector']);
      let checks = {};
      checks.pattern = configuration['checks.pattern'];
      checks.template = configuration['checks.template'];
      checks.api = configuration['checks.api'];
      checks.setup = configuration['checks.setup'];
      checks.fields = configuration['checks.fields'];
      const results = []
      results.push(
        {
          id: 0,
          title: 'Check Wazuh API connection',
          description: checks.api ? <span><EuiLoadingSpinner size="m" /> Checking...</span> : 'Disabled'
        },
        {
          id: 1,
          title: 'Check for Wazuh API version',
          description: checks.setup ? <span><EuiLoadingSpinner size="m" /> Checking...</span> : 'Disabled'
        },
        {
          id: 2,
          title: 'Check Elasticsearch index pattern',
          description: checks.pattern ? <span><EuiLoadingSpinner size="m" /> Checking...</span> : 'Disabled'
        },
        {
          id: 3,
          title: 'Check Elasticsearch template',
          description: checks.template ? <span><EuiLoadingSpinner size="m" /> Checking...</span> : 'Disabled'
        },
        {
          id: 4,
          title: 'Check index pattern fields',
          description: checks.fields ? <span><EuiLoadingSpinner size="m" /> Checking...</span> : 'Disabled'
        },
        {
          id: 5,
          title: 'Check Monitoring index pattern',
          description: <span><EuiLoadingSpinner size="m" /> Checking...</span>
        },
        {
          id: 6,
          title: 'Check Statistics index pattern',
          description: <span><EuiLoadingSpinner size="m" /> Checking...</span>
        },
      );
      this.setState({ checks, results },
        async () => {
          await Promise.all([
            this.checkPatterns(),
            this.checkApiConnection(),
            this.checkSupportPattern(configuration['wazuh.monitoring.pattern'], 5, WAZUH_INDEX_TYPE_MONITORING),
            this.checkSupportPattern(`${configuration['cron.prefix']}-${configuration['cron.statistics.index.name']}-*`, 6, WAZUH_INDEX_TYPE_STATISTICS),
          ]);
          if (checks.fields) {
            const i = results.map(item => item.id).indexOf(4);
            try {
              await PatternHandler.refreshIndexPattern();
              results[i].description = <span><EuiIcon type="check" color="secondary" ></EuiIcon> Ready</span>;
              this.setState({ results });
            } catch (error) {
              results[i].description = <span><EuiIcon type="alert" color="danger" ></EuiIcon> Error</span>;
              this.setState({ results }, () => this.handleError(error));
            }
          }

          if (!this.state.errors || !this.state.errors.length) {
            setTimeout(() => {
              const params = this.$rootScope.previousParams || {};
              var queryString = Object.keys(params).map(key => key + '=' + params[key]).join('&');
              const url = 'wazuh#' + (this.$rootScope.previousLocation || '') + '?' + queryString;
              window.location.assign(
                getHttp().basePath.prepend(url)
              );
              return;
            }, 300);
          }
          return;
        });
    } catch (error) {
      this.handleError(error);
    }
  }

  goAppSettings() {
    window.location.href = '/app/wazuh#/settings';
  }

  goAppOverview() {
    window.location.href = '/app/wazuh#/overview';
  }

  render() {
    const logo_url = getHttp().basePath.prepend('/plugins/wazuh/assets/icon_blue.svg');
    return (
      <div className="health-check">
        {!this.state.errors && (
          <EuiLoadingSpinner className="health-check-loader" />
        )}
        <img src={logo_url} className="health-check-logo" alt=""></img>
        <div className="margin-top-30">
          <EuiDescriptionList
            textStyle="reverse"
            align="center"
            type="column"
            listItems={this.state.results}
          />
        </div>
        <EuiSpacer size="xxl" />
        {(this.state.errors || []).map(error => (
          <>
            <EuiCallOut
              title={error}
              color="danger"
              iconType="alert"
              style={{ textAlign: 'left' }}>
            </EuiCallOut>
            <EuiSpacer size="xs" />
          </>
        ))}
        <EuiSpacer size="xxl" />
        {!!this.state.errors.length && (
          <EuiButton
            fill
            onClick={() => this.goAppSettings()}>
            Go to App
          </EuiButton>
        )}
      </div >
    );
  }
};
