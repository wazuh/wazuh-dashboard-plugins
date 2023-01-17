/*
 * Wazuh app - Inventory component
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
import {
  EuiFlexItem,
  EuiFlexGroup,
  EuiPanel,
  EuiPage,
  EuiBasicTable,
  EuiInMemoryTable,
  EuiSpacer,
  EuiText,
  EuiProgress,
  EuiTitle,
  EuiButton,
  EuiButtonIcon,
  EuiStat,
  EuiHealth,
  EuiDescriptionList,
  EuiButtonEmpty,
  EuiToolTip,
  EuiCallOut,
  EuiPopover,
  EuiCard,
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { formatUIDate } from '../../../react-services/time-service';
import exportCsv from '../../../react-services/wz-csv';
import { getToasts } from '../../../kibana-services';
import { WzSearchBar } from '../../../components/wz-search-bar';
import { RuleText, ComplianceText } from './components';
import { i18n } from '@kbn/i18n';

import _ from 'lodash';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../react-services/error-orchestrator/types';
import { API_NAME_AGENT_STATUS, UI_LOGGER_LEVELS } from '../../../../common/constants';
import { getErrorOrchestrator } from '../../../react-services/common-services';
import { VisualizationBasic } from '../../common/charts/visualizations/basic';
const Descp1 = i18n.translate("wazuh.components.agents.sca.Descp1", {
  defaultMessage: "Filter by check condition",
});
const Descp2 = i18n.translate("wazuh.components.agents.sca.Descp2", {
  defaultMessage: "Filter by check file",
});
const Descp3 = i18n.translate("wazuh.components.agents.sca.agent.sca.filter", {
  defaultMessage: "Filter by check title",
});
const Descp4 = i18n.translate("wazuh.components.agents.sca.Descp4", {
  defaultMessage: "Filter by check result",
});
const Descp5 = i18n.translate("wazuh.components.agents.sca.Descp5", {
  defaultMessage: "Filter by check status",
});
const Descp6 = i18n.translate("wazuh.components.agents.sca.Descp6", {
  defaultMessage: "Filter by check rationale",
});
const Descp7 = i18n.translate("wazuh.components.agents.sca.Descp7", {
  defaultMessage: "Filter by check registry",
});
const Descp8 = i18n.translate("wazuh.components.agents.sca.Descp8", {
  defaultMessage: "Filter by check description",
});
const Descp9 = i18n.translate("wazuh.components.agents.sca.Descp9", {
  defaultMessage: "Filter by check remediation",
});
const Descp10 = i18n.translate("wazuh.components.agents.sca.regkeyDescp", {
  defaultMessage: "Filter by check reason",
});
const pass = i18n.translate('wazuh.public.components.agents.sca.inventory.pass', {
  defaultMessage: 'Pass',
})
const fail = i18n.translate('wazuh.public.components.agents.sca.inventory.fail', {
  defaultMessage: 'Fail',
})
const notApp = i18n.translate('wazuh.public.components.agents.sca.inventory.notApp', {
  defaultMessage: 'Not applicable',
})
const filter = i18n.translate('wazuh.public.components.agents.sca.inventory.filter', {
  defaultMessage: 'The filter contains invalid characters',
})
const filSearch = i18n.translate('wazuh.public.components.agents.sca.inventory.filSearch', {
  defaultMessage: 'Filter or search',
})
export class Inventory extends Component {
  _isMount = false;
  constructor(props) {
    super(props);
    const { agent } = this.props;
    this.state = {
      agent,
      items: [],
      itemIdToExpandedRowMap: {},
      showMoreInfo: false,
      loading: false,
      filters: [],
      pageTableChecks: { pageIndex: 0 },
      policies: [],
    };
    this.suggestions = {};
    this.columnsPolicies = [
      {
        field: 'name',
        name: i18n.translate('wazuh.public.components.agents.sca.inventory.Policy', {
              defaultMessage: 'Policy',
            }),
      },
      {
        field: 'description',
        name: i18n.translate('wazuh.public.components.agents.sca.inventory.Description', {
              defaultMessage: 'Description',
            }),
        truncateText: true,
      },
      {
        field: 'end_scan',
        name: i18n.translate('wazuh.public.components.agents.sca.inventory.endscan', {
              defaultMessage: 'End scan',
            }),
        dataType: 'date',
        render: formatUIDate,
      },
      {
        field: 'pass',
        name: i18n.translate('wazuh.public.components.agents.sca.inventory.Pass', {
              defaultMessage: 'Pass',
            }),
        width: '100px',
      },
      {
        field: 'fail',
        name: i18n.translate('wazuh.public.components.agents.sca.inventory.Fail', {
              defaultMessage: 'Fail',
            }),
        width: '100px',
      },
      {
        field: 'invalid',
        name: i18n.translate('wazuh.public.components.agents.sca.inventory.Notapplicable', {
              defaultMessage: 'Not applicable',
            }),
        width: '100px',
      },
      {
        field: 'score',
        name: i18n.translate('wazuh.public.components.agents.sca.inventory.Score', {
              defaultMessage: 'Score',
            }),
        render: (score) => {
          return `${score}%`;
        },
        width: '100px',
      },
    ];
    this.columnsChecks = [
      {
        field: 'id',
        name: i18n.translate(
          'wazuh.public.components.agents.sca.inventory.ID',
          {
            defaultMessage: 'ID',
          },
        ),
        sortable: true,
        width: '100px',
      },
      {
        field: 'title',
        name: i18n.translate(
          'wazuh.public.components.agents.sca.inventory.Title',
          {
            defaultMessage: 'Title',
          },
        ),
        sortable: true,
        truncateText: true,
      },
      {
        name: i18n.translate(
          'wazuh.public.components.agents.sca.inventory.Target',
          {
            defaultMessage: 'Target',
          },
        ),
        truncateText: true,
        render: item => (
          <div>
            {item.file ? (
              <span>
                <b>
                  {i18n.translate('wazuh.components.agent.fim.ivv.lib.File', {
                    defaultMessage: 'File:',
                  })}
                </b>{' '}
                {item.file}
              </span>
            ) : item.directory ? (
              <span>
                <b>
                  {i18n.translate(
                    'wazuh.components.agent.fim.ivv.lib.Directory',
                    {
                      defaultMessage: 'Directory:',
                    },
                  )}
                </b>{' '}
                {item.directory}
              </span>
            ) : item.process ? (
              <span>
                <b>
                  {i18n.translate(
                    'wazuh.components.agent.fim.ivv.lib.Process',
                    {
                      defaultMessage: 'Process:',
                    },
                  )}
                </b>{' '}
                {item.process}
              </span>
            ) : item.command ? (
              <span>
                <b>
                  {i18n.translate(
                    'wazuh.components.agent.fim.ivv.lib.Command',
                    {
                      defaultMessage: 'Command:',
                    },
                  )}
                </b>{' '}
                {item.command}
              </span>
            ) : item.registry ? (
              <span>
                <b>
                  {i18n.translate(
                    'wazuh.components.agent.fim.ivv.lib.Registry',
                    {
                      defaultMessage: 'Registry:',
                    },
                  )}
                </b>{' '}
                {item.registry}
              </span>
            ) : (
              '-'
            )}
          </div>
        ),
      },
      {
        field: 'result',
        name: i18n.translate('wazuh.public.components.agents.sca.inventory', {
          defaultMessage: 'Result',
        }),
        truncateText: true,
        sortable: true,
        width: '150px',
        render: this.addHealthResultRender,
      },
      {
        align: 'right',
        width: '40px',
        isExpander: true,
        render: item => (
          <EuiButtonIcon
            onClick={() => this.toggleDetails(item)}
            aria-label={
              this.state.itemIdToExpandedRowMap[item.id] ? 'Collapse' : 'Expand'
            }
            iconType={
              this.state.itemIdToExpandedRowMap[item.id]
                ? 'arrowUp'
                : 'arrowDown'
            }
          />
        ),
      },
    ];
  }

  async componentDidMount() {
    this._isMount = true;
    await this.initialize();
    const regex = new RegExp('redirectPolicy=' + '[^&]*');
    const match = window.location.href.match(regex);
    try {
      if (match && match[0]) {
        this.setState({ loading: true });
        const id = match[0].split('=')[1];
        const policy = await WzRequest.apiReq('GET', `/sca/${this.props.agent.id}`, {
          q: 'policy_id=' + id,
        });
        await this.loadScaPolicy(((((policy || {}).data || {}).data || {}).items || [])[0]);
        window.location.href = window.location.href.replace(
          new RegExp('redirectPolicy=' + '[^&]*'),
          ''
        );
        this.setState({ loading: false });
      }
    } catch (error) {
      this.setState({ loading: false });

      const options: UIErrorLog = {
        context: `${Inventory.name}.componentDidMount`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
        error: {
          error: error,
          message: error.message || error,
          title: error.name,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(this.props.agent, prevProps.agent)) {
      this.setState({ lookingPolicy: false }, async () => await this.initialize());
    }
    if (!_.isEqual(this.state.filters, prevState.filters)) {
      this.setState({
        itemIdToExpandedRowMap: {},
        pageTableChecks: { pageIndex: 0, pageSize: this.state.pageTableChecks.pageSize },
      });
    }
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  addHealthResultRender(result) {
    const color = (result) => {
      if (result.toLowerCase() === 'passed') {
        return 'success';
      } else if (result.toLowerCase() === 'failed') {
        return 'danger';
      } else {
        return 'subdued';
      }
    };

    return (
      <EuiHealth color={color(result)} style={{ textTransform: 'capitalize' }}>
        {result || 'Not applicable'}
      </EuiHealth>
    );
  }

  /**
   * Generate and assign the suggestions for the searchbar
   * @param policy
   * @param checks
   * @returns
   */
  buildSuggestionSearchBar(policy, checks) {
    if (this.suggestions[policy]) return;
    const distinctFields = {};
    checks.forEach((item) => {
      Object.keys(item).forEach((field) => {
        if (typeof item[field] === 'string') {
          if (!distinctFields[field]) {
            distinctFields[field] = {};
          }
          if (!distinctFields[field][item[field]]) {
            distinctFields[field][item[field]] = true;
          }
        }
      });
    });

    /**
     * Get list of values defined in distinctFields by field
     * @param value
     * @param field
     * @returns
     */
    const getSuggestionsValues = (value, field) => {
      if (!distinctFields[field]) return [];
      return Object.keys(distinctFields[field]).filter(
        (item) => item && item.toLowerCase().includes(value.toLowerCase().trim())
      );
    };

    /**
     * Get list of suggestions.
     * This method validate if the suggestion item exists in the checks array fields
     * @returns List of suggestions
     */
    const getSuggestionsFields = () => {
      const defaultSuggestions = [
        {
          type: 'params',
          label: i18n.translate('wazuh.public.components.agents.sca.inventory.condition', {
              defaultMessage: 'condition',
            }),
          description: Descp1,
          operators: ['=', '!='],
          values: (value) => getSuggestionsValues(value, 'condition'),
        },
        {
          type: 'params',
          label: i18n.translate('wazuh.public.components.agents.sca.inventory.file', {
              defaultMessage: 'file',
            }),
          description: Descp2,
          operators: ['=', '!='],
          values: (value) => getSuggestionsValues(value, 'file'),
        },
        {
          type: 'params',
          label: i18n.translate('wazuh.public.components.agents.sca.inventory.title', {
              defaultMessage: 'title',
            }),
          description: Descp3,
          operators: ['=', '!='],
          values: (value) => getSuggestionsValues(value, 'title'),
        },
        {
          type: 'params',
          label: i18n.translate('wazuh.public.components.agents.sca.inventory.result', {
              defaultMessage: 'result',
            }),
          description: Descp4,
          operators: ['=', '!='],
          values: (value) => getSuggestionsValues(value, 'result'),
        },
        {
          type: 'params',
          label: i18n.translate('wazuh.public.components.agents.sca.inventory.status', {
              defaultMessage: 'status',
            }),
          description: Descp5,
          operators: ['=', '!='],
          values: (value) => getSuggestionsValues(value, 'status'),
        },
        {
          type: 'params',
          label:i18n.translate('wazuh.public.components.agents.sca.inventory.rationale', {
              defaultMessage: 'rationale',
            }),
          description: Descp6,
          operators: ['=', '!='],
          values: (value) => getSuggestionsValues(value, 'rationale'),
        },
        {
          type: 'params',
          label: i18n.translate('wazuh.public.components.agents.sca.inventory.registry', {
              defaultMessage: 'registry',
            }),
          description: Descp7,
          operators: ['=', '!='],
          values: (value) => getSuggestionsValues(value, 'registry'),
        },
        {
          type: 'params',
          label: i18n.translate('wazuh.public.components.agents.sca.inventory.description', {
              defaultMessage: 'description',
            }),
          description: Descp8,
          operators: ['=', '!='],
          values: (value) => getSuggestionsValues(value, 'description'),
        },
        {
          type: 'params',
          label: i18n.translate('wazuh.public.components.agents.sca.inventory.remediation', {
              defaultMessage: 'remediation',
            }),
          description: Descp9,
          operators: ['=', '!='],
          values: (value) => getSuggestionsValues(value, 'remediation'),
        },
        {
          type: 'params',
          label: i18n.translate('wazuh.public.components.agents.sca.inventory.reason', {
              defaultMessage: 'reason',
            }),
          description: Descp10,
          operators: ['=', '!='],
          values: (value) => getSuggestionsValues(value, 'reason'),
        },
      ];

      const filteresSuggestions = defaultSuggestions.filter((item) =>
        Object.keys(distinctFields).includes(item.label)
      );
      return filteresSuggestions;
    };

    this.suggestions[policy] = getSuggestionsFields();
  }

  async initialize() {
    try {
      this._isMount && this.setState({ loading: true });
      this.lookingPolicy = false;
      const {
        data: {
          data: { affected_items: policies },
        },
      } = await WzRequest.apiReq('GET', `/sca/${this.props.agent.id}`, {});
      this._isMount && this.setState({ loading: false, policies });
    } catch (error) {
      this.setState({ loading: false, policies: [] });

      const options: UIErrorLog = {
        context: `${Inventory.name}.initialize`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
        error: {
          error: error,
          message: error.message || error,
          title: error.name,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  async loadScaPolicy(policy) {
    this._isMount &&
      this.setState({
        loadingPolicy: true,
        itemIdToExpandedRowMap: {},
        pageTableChecks: { pageIndex: 0 },
      });
    if (policy) {
      try {
        const policyResponse = await WzRequest.apiReq('GET', `/sca/${this.props.agent.id}`, {
          params: {
            q: 'policy_id=' + policy.policy_id,
          },
        });
        const [policyData] = policyResponse.data.data.affected_items;
        // It queries all checks without filters, because the filters are applied in the results
        // due to the use of EuiInMemoryTable instead EuiTable components and do a request with each change of filters.
        const checksResponse = await WzRequest.apiReq(
          'GET',
          `/sca/${this.props.agent.id}/checks/${policy.policy_id}`,
          {}
        );
        const checks = (
          (((checksResponse || {}).data || {}).data || {}).affected_items || []
        ).map((item) => ({ ...item, result: item.result || 'not applicable' }));
        this.buildSuggestionSearchBar(policyData.policy_id, checks);
        this._isMount &&
          this.setState({ lookingPolicy: policyData, loadingPolicy: false, items: checks });
      } catch (error) {
        this.setState({ lookingPolicy: policy, loadingPolicy: false });

        const options: UIErrorLog = {
          context: `${Inventory.name}.loadScaPolicy`,
          level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
          severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
          error: {
            error: error,
            message: filter || error.message,
            title: error.name,
          },
        };
        getErrorOrchestrator().handleError(options);
      }
    } else {
      this._isMount && this.setState({ lookingPolicy: policy, loadingPolicy: false, items: [] });
    }
  }

  filterPolicyChecks = () =>
    !!this.state.items &&
    this.state.items.filter((check) =>
      this.state.filters.every((filter) =>
        filter.field === 'search'
          ? Object.keys(check).some(
              (key) =>
                ['string', 'number'].includes(typeof check[key]) &&
                String(check[key]).toLowerCase().includes(filter.value.toLowerCase())
            )
          : typeof check[filter.field] === 'string' &&
            (filter.value === ''
              ? check[filter.field] === filter.value
              : check[filter.field].toLowerCase().includes(filter.value.toLowerCase()))
      )
    );

  toggleDetails = (item) => {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };

    if (itemIdToExpandedRowMap[item.id]) {
      delete itemIdToExpandedRowMap[item.id];
    } else {
      let checks = '';
      checks += (item.rules || []).length > 1 ? 'Checks' : 'Check';
      checks += item.condition ? ` (Condition: ${item.condition})` : '';
      const complianceText =
        item.compliance && item.compliance.length
          ? item.compliance.map((el) => `${el.key}: ${el.value}`).join('\n')
          : '';
      const rulesText = item.rules.length ? item.rules.map((el) => el.rule).join('\n') : '';
      const listItems = [
        {
          title: i18n.translate('wazuh.public.components.agents.sca.inventory.checkApp', {
              defaultMessage: 'Check not applicable due to:',
            }),
          description: item.reason,
        },
        {
          title: i18n.translate('wazuh.public.components.agents.sca.inventory.Rationale', {
              defaultMessage: 'Rationale',
            }),
          description: item.rationale || '-',
        },
        {
          title: i18n.translate('wazuh.public.components.agents.sca.inventory.Remediation', {
              defaultMessage: 'Remediation',
            }),
          description: item.remediation || '-',
        },
        {
          title: i18n.translate('wazuh.public.components.agents.sca.inventory.Description', {
              defaultMessage: 'Description',
            }),
          description: item.description || '-',
        },
        {
          title: (item.directory || '').includes(',') ? 'Paths' : 'Path',
          description: item.directory,
        },
        {
          title: checks,
          description: <RuleText rules={item.rules.length ? item.rules : []} />,
        },
        {
          title: i18n.translate('wazuh.public.components.agents.sca.inventory.Compliance', {
              defaultMessage: 'Compliance',
            }),
          description: <ComplianceText complianceText={complianceText} />,
        },
      ];
      const itemsToShow = listItems.filter((x) => {
        return x.description;
      });
      itemIdToExpandedRowMap[item.id] = <EuiDescriptionList listItems={itemsToShow} />;
    }
    this.setState({ itemIdToExpandedRowMap });
  };

  showToast = (color, title, time) => {
    getToasts().add({
      color: color,
      title: title,
      toastLifeTimeMs: time,
    });
  };
  async downloadCsv() {
    try {
      this.showToast('success', 'Your download should begin automatically...', 3000);
      await exportCsv(
        '/sca/' + this.props.agent.id + '/checks/' + this.state.lookingPolicy.policy_id,
        [],
        this.state.lookingPolicy.policy_id
      );
    } catch (error) {
      const options: UIErrorLog = {
        context: `${Inventory.name}.downloadCsv`,
        level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
        severity: UI_ERROR_SEVERITIES.BUSINESS as UIErrorSeverity,
        error: {
          error: error,
          message: error.message || error,
          title: error.name,
        },
      };
      getErrorOrchestrator().handleError(options);
    }
  }

  buttonStat(text, field, value) {
    return <button onClick={() => this.setState({ filters: [{ field, value }] })}>{text}</button>;
  }

  onChangeTableChecks({ page: { index: pageIndex, size: pageSize } }) {
    this.setState({ pageTableChecks: { pageIndex, pageSize } });
  }

  render() {
    const getPoliciesRowProps = (item, idx) => {
      return {
        'data-test-subj': `sca-row-${idx}`,
        className: 'customRowClass',
        onClick: () => this.loadScaPolicy(item),
      };
    };
    const getChecksRowProps = (item, idx) => {
      return {
        'data-test-subj': `sca-check-row-${idx}`,
        className: 'customRowClass',
        onClick: () => this.toggleDetails(item),
      };
    };

    const sorting = {
      sort: {
        field: 'id',
        direction: 'asc',
      },
    };
    const buttonPopover = (
      <EuiButtonEmpty
        iconType="iInCircle"
        aria-label="Help"
        onClick={() => this.setState({ showMoreInfo: !this.state.showMoreInfo })}
      ></EuiButtonEmpty>
    );
    return (
      <Fragment>
        <div>
          {this.state.loading && (
            <div style={{ margin: 16 }}>
              <EuiSpacer size="m" />
              <EuiProgress size="xs" color="primary" />
            </div>
          )}
        </div>
        <EuiPage>
          {this.props.agent &&
            (this.props.agent || {}).status !== API_NAME_AGENT_STATUS.NEVER_CONNECTED &&
            !this.state.policies.length &&
            !this.state.loading && (
              <EuiCallOut title= {i18n.translate('wazuh.public.components.agents.sca.inventory.noScans', {
              defaultMessage: 'No scans available',
            })} iconType="iInCircle">
                <EuiButton color="primary" onClick={() => this.initialize()}>
                 {i18n.translate('wazuh.public.components.agents.sca.inventory.Refresh', {
              defaultMessage: 'Refresh',
            })}
                </EuiButton>
              </EuiCallOut>
            )}

          {this.props.agent &&
            (this.props.agent || {}).status === API_NAME_AGENT_STATUS.NEVER_CONNECTED &&
            !this.state.loading && (
              <EuiCallOut
                title="Agent has never connected"
                style={{ width: '100%' }}
                iconType="iInCircle"
              >
                <EuiButton color="primary" onClick={() => this.initialize()}>
                  {i18n.translate('wazuh.public.components.agents.sca.inventory.Refresh', {
              defaultMessage: 'Refresh',
            })}
                </EuiButton>
              </EuiCallOut>
            )}
          {this.props.agent &&
            (this.props.agent || {}).os &&
            !this.state.lookingPolicy &&
            this.state.policies.length > 0 &&
            !this.state.loading && (
              <div>
                {this.state.policies.length && (
                  <EuiFlexGroup style={{ marginTop: 0 }}>
                    {this.state.policies.map((policy, idx) => (
                      <EuiFlexItem key={idx} grow={false}>
                        <EuiCard
                          title
                          description
                          betaBadgeLabel={policy.name}
                          style={{ paddingBottom: 0 }}
                        >
                          <VisualizationBasic
                            type="donut"
                            size={{ width: '100%', height: '150px' }}
                            data={[
                              { label: pass, value: policy.pass, color: '#00a69b' },
                              { label: fail, value: policy.fail, color: '#ff645c' },
                              {
                                label: notApp,
                                value: policy.invalid,
                                color: '#5c6773',
                              },
                            ]}
                            showLegend
                            noDataTitle="No results"
                            noDataMessage="No results were found."
                          />
                          <EuiSpacer size="m" />
                        </EuiCard>
                      </EuiFlexItem>
                    ))}
                  </EuiFlexGroup>
                )}
                <EuiSpacer size="m" />
                <EuiPanel paddingSize="l">
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiBasicTable
                        items={this.state.policies}
                        columns={this.columnsPolicies}
                        rowProps={getPoliciesRowProps}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
              </div>
            )}
          {this.props.agent &&
            (this.props.agent || {}).os &&
            this.state.lookingPolicy &&
            !this.state.loading && (
              <div>
                <EuiPanel paddingSize="l">
                  <EuiFlexGroup>
                    <EuiFlexItem grow={false}>
                      <EuiButtonIcon
                        color="primary"
                        style={{ padding: '6px 0px' }}
                        onClick={() => this.loadScaPolicy(false)}
                        iconType="arrowLeft"
                        aria-label={i18n.translate('wazuh.public.components.agents.sca.inventory.policies', {
              defaultMessage: 'Back to policies',
            })}
                        {...{ iconSize: 'l' }}
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiTitle size="s">
                        <h2>
                          {this.state.lookingPolicy.name}&nbsp;
                          <EuiToolTip position="right" content="Show policy checksum">
                            <EuiPopover
                              button={buttonPopover}
                              isOpen={this.state.showMoreInfo}
                              closePopover={() => this.setState({ showMoreInfo: false })}
                            >
                              <EuiFlexItem style={{ width: 700 }}>
                                <EuiSpacer size="s" />
                                <EuiText>
                                  <b>{
                                    i18n.translate("wazuh.components.agent.fim.ivv.lib.Policydescription", {
                                      defaultMessage: "Policy description:",
                                    })}</b> {this.state.lookingPolicy.description}
                                  <br></br>
                                  <b>{
                                    i18n.translate("wazuh.components.agent.fim.ivv.lib.Policychecksum:", {
                                      defaultMessage: "Policy checksum:",
                                    })}</b> {this.state.lookingPolicy.hash_file}
                                </EuiText>
                              </EuiFlexItem>
                            </EuiPopover>
                          </EuiToolTip>
                        </h2>
                      </EuiTitle>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiButtonEmpty
                        iconType="importAction"
                        onClick={async () => await this.downloadCsv()}
                      >{
                        i18n.translate("wazuh.components.agent.fim.ivv.lib.Exportformatted", {
                          defaultMessage: "Export formatted",
                        })}

                      </EuiButtonEmpty>
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiButtonEmpty
                        iconType="refresh"
                        onClick={() => this.loadScaPolicy(this.state.lookingPolicy)}
                      >{
                        i18n.translate("wazuh.components.agent.fim.ivv.lib.emptyRefresh", {
                          defaultMessage: "Refresh",
                        })}

                      </EuiButtonEmpty>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiSpacer size="m" />
                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiStat
                        title={this.buttonStat(this.state.lookingPolicy.pass, 'result', 'passed')}
                        description={i18n.translate('wazuh.public.components.agents.sca.inventory.Pass', {
              defaultMessage: 'Pass',
            })}
                        titleColor="secondary"
                        titleSize="m"
                        textAlign="center"
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiStat
                        title={this.buttonStat(this.state.lookingPolicy.fail, 'result', 'failed')}
                        description={i18n.translate('wazuh.public.components.agents.sca.inventory.Fail', {
              defaultMessage: 'Fail',
            })}
                        titleColor="danger"
                        titleSize="m"
                        textAlign="center"
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiStat
                        title={this.buttonStat(
                          this.state.lookingPolicy.invalid,
                          'result',
                          'not applicable'
                        )}
                        description={i18n.translate('wazuh.public.components.agents.sca.inventory.notApplicable', {
              defaultMessage: 'Not applicable',
            })}
                        titleColor="subdued"
                        titleSize="m"
                        textAlign="center"
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiStat
                        title={`${this.state.lookingPolicy.score}%`}
                        description={i18n.translate('wazuh.public.components.agents.sca.inventory.score', {
              defaultMessage: 'Score',
            })}
                        titleColor="accent"
                        titleSize="m"
                        textAlign="center"
                      />
                    </EuiFlexItem>
                    <EuiFlexItem>
                      <EuiStat
                        title={formatUIDate(this.state.lookingPolicy.end_scan)}
                        description={i18n.translate('wazuh.public.components.agents.sca.inventory.endScan', {
              defaultMessage: 'End scan',
            })}
                        titleColor="primary"
                        titleSize="s"
                        textAlign="center"
                        style={{ padding: 5 }}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                  <EuiSpacer size="m" />

                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <WzSearchBar
                        filters={this.state.filters}
                        suggestions={this.suggestions[this.state.lookingPolicy.policy_id]}
                        placeholder={filSearch}
                        onFiltersChange={(filters) => {
                          this.setState({ filters });
                        }}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>

                  <EuiFlexGroup>
                    <EuiFlexItem>
                      <EuiInMemoryTable
                        items={this.filterPolicyChecks()}
                        columns={this.columnsChecks}
                        rowProps={getChecksRowProps}
                        itemId="id"
                        itemIdToExpandedRowMap={this.state.itemIdToExpandedRowMap}
                        isExpandable={true}
                        sorting={sorting}
                        pagination={this.state.pageTableChecks}
                        loading={this.state.loadingPolicy}
                        onTableChange={(change) => this.onChangeTableChecks(change)}
                      />
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiPanel>
              </div>
            )}
        </EuiPage>
      </Fragment>
    );
  }
}
