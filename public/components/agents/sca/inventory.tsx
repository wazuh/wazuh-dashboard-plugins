import React, { Component, Fragment } from 'react';
import { Pie } from "../../d3/pie";
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
  EuiPopover
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { TimeService } from '../../../react-services/time-service';
import exportCsv from '../../../react-services/wz-csv';
import { getToasts }  from '../../../kibana-services';
import { WzSearchBar } from '../../../components/wz-search-bar';
import { RuleText, ComplianceText } from './components';
import _ from 'lodash';

export class Inventory extends Component {
  _isMount = false;
  constructor(props) {
    super(props);
    const { agent } = this.props;
    this.state = { agent, items: [], itemIdToExpandedRowMap: {}, showMoreInfo: false, loading: false, filters: [], pageTableChecks: {pageIndex: 0} }
    this.policies = [];
    this.suggestions = {};
    this.columnsPolicies = [
      {
        field: 'name',
        name: 'Policy'
      },
      {
        field: 'description',
        name: 'Description',
        truncateText: true
      },
      {
        field: 'end_scan',
        name: 'End scan',
        dataType: 'date',
        render: TimeService.offset
      },
      {
        field: 'pass',
        name: 'Pass',
        width: "100px"
      },
      {
        field: 'fail',
        name: 'Fail',
        width: "100px"
      },
      {
        field: 'invalid',
        name: 'Not applicable',
        width: "100px"
      },
      {
        field: 'score',
        name: 'Score',
        render: score => {
          return `${score}%`;
        },
        width: "100px"
      },
    ];
    this.columnsChecks = [
      {
        field: 'id',
        name: 'ID',
        sortable: true,
        width: "100px"
      },
      {
        field: 'title',
        name: 'Title',
        sortable: true,
        truncateText: true
      },
      {
        name: 'Target',
        truncateText: true,
        render: item => (
          <div>
            {item.file ? (
              <span>
                <b>File:</b> {item.file}
              </span>
            ) : item.directory ? (
              <span>
                <b>Directory:</b> {item.directory}
              </span>
            ) : item.process ? (
              <span>
                <b>Process: </b> {item.process}
              </span>
            ) : item.command ? (
              <span>
                <b>Command: </b> {item.command}
              </span>
            ) : item.registry ? (
              <span>
                <b>Registry: </b> {item.registry}
              </span>
            ) : (
                        '-'
                      )}
          </div>
        )
      },
      {
        field: 'result',
        name: 'Result',
        truncateText: true,
        sortable: true,
        width: "150px",
        render: this.addHealthResultRender,
      },
      {
        align: 'right',
        width: "40px",
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
        )
      }
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
        const policy = await WzRequest.apiReq(
          'GET',
          `/sca/${this.props.agent.id}`,
          { "q": "policy_id=" + id }
        );
        await this.loadScaPolicy(((((policy || {}).data || {}).data || {}).items || [])[0]);
        window.location.href = window.location.href.replace(new RegExp('redirectPolicy=' + '[^&]*'), '');
        this.setState({ loading: false });
      }
    } catch (error) {
      this.showToast('danger', error, 3000);
      this.setState({ loading: false });
    }
  }

  async componentDidUpdate(prevProps, prevState) {
    if (!_.isEqual(this.props.agent, prevProps.agent)) {
      this.setState({ lookingPolicy: false }, async () => await this.initialize());
    };
    if(!_.isEqual(this.state.filters, prevState.filters)){
      this.setState({itemIdToExpandedRowMap: {}, pageTableChecks: {pageIndex: 0, pageSize: this.state.pageTableChecks.pageSize}});
    }
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  addHealthResultRender(result) {
    const color = result => {
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

  buildSuggestionSearchBar(policy, checks) {
    if (this.suggestions[policy]) return;
    const distinctFields = {};
    checks.forEach(item => {
      Object.keys(item).forEach(field => {
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

    this.suggestions[policy] = [
      { type: 'params', label: 'condition', description: 'Filter by check condition', operators: ['=', '!=',], values: (value) => { return Object.keys(distinctFields["condition"]).filter(item => item && item.toLowerCase().includes(value.toLowerCase())) } },
      { type: 'params', label: 'file', description: 'Filter by check file', operators: ['=', '!=',], values: (value) => { return Object.keys(distinctFields["file"]).filter(item => item && item.toLowerCase().includes(value.toLowerCase())) } },
      { type: 'params', label: 'title', description: 'Filter by check title', operators: ['=', '!=',], values: (value) => { return Object.keys(distinctFields["title"]).filter(item => item && item.toLowerCase().includes(value.toLowerCase())) } },
      { type: 'params', label: 'result', description: 'Filter by check result', operators: ['=', '!=',], values: (value) => { return Object.keys(distinctFields["result"]).filter(item => item && item && item.toLowerCase().includes(value.toLowerCase())) } },
      { type: 'params', label: 'status', description: 'Filter by check status', operators: ['=', '!=',], values: (value) => { return Object.keys(distinctFields["status"]).filter(item => item && item.toLowerCase().includes(value.toLowerCase())) } },
      { type: 'params', label: 'rationale', description: 'Filter by check rationale', operators: ['=', '!=',], values: (value) => { return Object.keys(distinctFields["rationale"]).filter(item => item && item.toLowerCase().includes(value.toLowerCase())) } },
      { type: 'params', label: 'registry', description: 'Filter by check registry', operators: ['=', '!=',], values: (value) => { return Object.keys(distinctFields["registry"] || {}).filter(item => item && item.toLowerCase().includes(value.toLowerCase())) } },
      { type: 'params', label: 'description', description: 'Filter by check description', operators: ['=', '!=',], values: (value) => { return Object.keys(distinctFields["description"]).filter(item => item && item.toLowerCase().includes(value.toLowerCase())) } },
      { type: 'params', label: 'remediation', description: 'Filter by check remediation', operators: ['=', '!=',], values: (value) => { return Object.keys(distinctFields["remediation"]).filter(item => item && item.toLowerCase().includes(value.toLowerCase())) } },
      { type: 'params', label: 'reason', description: 'Filter by check reason', operators: ['=', '!=',], values: (value) => { return Object.keys(distinctFields["reason"]).filter(item => item && item.toLowerCase().includes(value.toLowerCase())) } },
    ]

  }

  async initialize() {
    try {
      this._isMount && this.setState({ loading: true });
      this.lookingPolicy = false;
      const policies = await WzRequest.apiReq(
        'GET',
        `/sca/${this.props.agent.id}`,
        {}
      );
      this.policies = (((policies || {}).data || {}).data || {}).affected_items || [];
      const models = [];
      for (let i = 0; i < this.policies.length; i++) {
        models.push({
          name: this.policies[i].name,
          status: [
            { id: 'pass', label: 'Pass', value: this.policies[i].pass },
            { id: 'fail', label: 'Fail', value: this.policies[i].fail },
            {
              id: 'invalid',
              label: 'Not applicable',
              value: this.policies[i].invalid
            }
          ]
        });
      }
      this._isMount && this.setState({ data: models, loading: false });
    } catch (error) {
      this.showToast('danger', error, 3000);
      this.setState({ loading: false });
      this.policies = [];
    }
  }

  async loadScaPolicy(policy) {
    this._isMount && this.setState({ loadingPolicy: true, itemIdToExpandedRowMap: {}, pageTableChecks: {pageIndex: 0} });
    if (policy) {
      try {
        const policyResponse = await WzRequest.apiReq(
          'GET',
          `/sca/${this.props.agent.id}`,
          { 
            params: {
              "q": "policy_id=" + policy.policy_id
            } 
          }
        );
        const [policyData] = policyResponse.data.data.affected_items;
        // It queries all checks without filters, because the filters are applied in the results
        // due to the use of EuiInMemoryTable instead EuiTable components and do arequest with each change of filters.
        const checksResponse = await WzRequest.apiReq(
          'GET',
          `/sca/${this.props.agent.id}/checks/${policy.policy_id}`,
          { }
        );
        const checks = ((((checksResponse || {}).data || {}).data || {}).affected_items || [])
          .map(item => ({...item, result: item.result || 'not applicable'}));
        this.buildSuggestionSearchBar(policyData.policy_id, checks);
        this._isMount && this.setState({ lookingPolicy: policyData, loadingPolicy: false, items: checks });
      } catch (err) {
        // We can't ensure the suggestions contains valid characters
        getToasts().add({
          color: 'danger',
          title: 'Error',
          text: 'The filter contains invalid characters',
          toastLifeTimeMs: 10000,
        });
        this.setState({ lookingPolicy: policy, loadingPolicy: false });
      }
    }else{
      this._isMount && this.setState({ lookingPolicy: policy, loadingPolicy: false, items: [] });
    }
  }

  filterPolicyChecks = () => !!this.state.items && this.state.items.filter(check =>
      this.state.filters.every(filter =>
        filter.field === 'search'
        ? Object.keys(check).some(key =>  ['string', 'number'].includes(typeof check[key]) && String(check[key]).toLowerCase().includes(filter.value.toLowerCase()))
        : typeof check[filter.field] === 'string' && (filter.value === '' ? check[filter.field] === filter.value
          : check[filter.field].toLowerCase().includes(filter.value.toLowerCase())
        )
      )
    )

  toggleDetails = item => {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };

    if (itemIdToExpandedRowMap[item.id]) {
      delete itemIdToExpandedRowMap[item.id];
    } else {
      let checks = '';
      checks += (item.rules || []).length > 1 ? 'Checks' : 'Check';
      checks += item.condition ? ` (Condition: ${item.condition})` : '';
      const complianceText = item.compliance && item.compliance.length 
        ? item.compliance.map(el => `${el.key}: ${el.value}`).join('\n')
        : '';
      const rulesText = item.rules.length ? item.rules.map(el => el.rule).join('\n') : '';
      const listItems = [
        {
          title: 'Check not applicable due to:',
          description: item.reason
        },
        {
          title: 'Rationale',
          description: item.rationale || '-'
        },
        {
          title: 'Remediation',
          description: item.remediation || '-'
        },
        {
          title: 'Description',
          description: item.description || '-'
        },
        {
          title: (item.directory || '').includes(',') ? 'Paths' : 'Path',
          description: item.directory
        },
        {
          title: checks,
          description: <RuleText rulesText={rulesText} />,
        },
        {
          title: 'Compliance',
          description: <ComplianceText complianceText={complianceText} />
        }
      ];
      const itemsToShow = listItems.filter(x => {
        return x.description;
      });
      itemIdToExpandedRowMap[item.id] = (
        <EuiDescriptionList listItems={itemsToShow} />
      );
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
      this.showToast('danger', error, 3000);
    }
  }

  buttonStat(text, field, value) {
    return <button onClick={() => this.setState({ filters: [{ field, value }] })}>{text}</button>
  }

  onChangeTableChecks({ page: {index: pageIndex, size: pageSize} }){
    this.setState({ pageTableChecks: {pageIndex, pageSize} });
  }

  render() {
    const getPoliciesRowProps = (item, idx) => {
      return {
        'data-test-subj': `sca-row-${idx}`,
        className: 'customRowClass',
        onClick: () => this.loadScaPolicy(item)
      };
    };
    const getChecksRowProps = (item, idx) => {
      return {
        'data-test-subj': `sca-check-row-${idx}`,
        className: 'customRowClass',
        onClick: () => this.toggleDetails(item)
      };
    };

    const sorting = {
      sort: {
        field: 'id',
        direction: 'asc'
      }
    };
    const buttonPopover = (
      <EuiButtonEmpty
        iconType="iInCircle"
        aria-label="Help"
        onClick={() => this.setState({ showMoreInfo: !this.state.showMoreInfo })}>
      </EuiButtonEmpty>
    );
    return (
      <Fragment>
        <div>
          {(this.state.loading &&
            <div style={{ margin: 16 }}>
              <EuiSpacer size="m" />
              <EuiProgress size="xs" color="primary" />
            </div>
          )}
        </div>
        <EuiPage>
          {((this.props.agent && (this.props.agent || {}).status !== 'never_connected' && !(this.policies || []).length && !this.state.loading) &&
            <EuiCallOut title="No scans available" iconType="iInCircle">
              <EuiButton color="primary" onClick={() => this.initialize()}>
                Refresh
           </EuiButton>
            </EuiCallOut>
          )}

          {((this.props.agent && (this.props.agent || {}).status === 'never_connected' && !this.state.loading) &&
            <EuiCallOut title="Agent has never connected" style={{ width: "100%" }} iconType="iInCircle">
              <EuiButton color="primary" onClick={() => this.initialize()}>
                Refresh
              </EuiButton>
            </EuiCallOut>
          )}
          {((this.props.agent && (this.props.agent || {}).os && !this.state.lookingPolicy && (this.policies || []).length > 0 && !this.state.loading) &&
            <div>
              {((this.state.data || []).length &&
                <EuiFlexGroup style={{ 'marginTop': 0 }}>
                  {(this.state.data || []).map((pie, idx) => (
                    <EuiFlexItem key={idx} grow={false}>
                      <EuiPanel betaBadgeLabel={pie.name} style={{ paddingBottom: 0 }}>
                        <Pie width={325} height={130} data={pie.status} colors={['#00a69b', '#ff645c', '#5c6773']} />
                      </EuiPanel>
                    </EuiFlexItem>
                  ))}
                </EuiFlexGroup>
              )}
              <EuiSpacer size="m" />
              <EuiPanel paddingSize="l">
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiBasicTable
                      items={this.policies}
                      columns={this.columnsPolicies}
                      rowProps={getPoliciesRowProps}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>
            </div>
          )}
          {((this.props.agent && (this.props.agent || {}).os && this.state.lookingPolicy && !this.state.loading) &&
            <div>
              <EuiPanel paddingSize="l">
                <EuiFlexGroup>
                  <EuiFlexItem grow={false}>
                    <EuiButtonIcon
                      color='primary'
                      style={{ padding: '6px 0px' }}
                      onClick={() => this.loadScaPolicy(false)}
                      iconType="arrowLeft"
                      aria-label="Back to policies"
                      {...{ iconSize: 'l' }}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiTitle
                      size="s">
                      <h2>{this.state.lookingPolicy.name}&nbsp;
                        <EuiToolTip position="right" content="Show policy checksum">
                          <EuiPopover
                            button={buttonPopover}
                            isOpen={this.state.showMoreInfo}
                            closePopover={() => this.setState({ showMoreInfo: false })}>
                            <EuiFlexItem style={{ width: 700 }}>
                              <EuiSpacer size="s" />
                              <EuiText>
                                <b>Policy description:</b> {this.state.lookingPolicy.description}
                                <br></br>
                                <b>Policy checksum:</b> {this.state.lookingPolicy.hash_file}
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
                      onClick={async () => await this.downloadCsv()} >
                      Export formatted
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty iconType="refresh" onClick={() => this.loadScaPolicy(this.state.lookingPolicy)}>
                      Refresh
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="m" />
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiStat title={this.buttonStat(this.state.lookingPolicy.pass, 'result', 'passed')} description="Pass" titleColor="secondary" titleSize="m" textAlign="center" />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiStat title={this.buttonStat(this.state.lookingPolicy.fail, 'result', 'failed')} description="Fail" titleColor="danger" titleSize="m" textAlign="center" />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiStat title={this.buttonStat(this.state.lookingPolicy.invalid, 'result', 'not applicable')} description="Not applicable" titleColor="subdued" titleSize="m" textAlign="center" />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiStat title={`${this.state.lookingPolicy.score}%`} description="Score" titleColor="accent" titleSize="m" textAlign="center" />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiStat title={TimeService.offset(this.state.lookingPolicy.end_scan)} description="End scan" titleColor="primary" titleSize="s" textAlign="center" style={{ padding: 5 }} />
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="m" />

                <EuiFlexGroup>
                  <EuiFlexItem>
                    <WzSearchBar
                      filters={this.state.filters}
                      suggestions={this.suggestions[this.state.lookingPolicy.policy_id]}
                      placeholder='Filter or search'
                      onFiltersChange={filters => { this.setState({ filters }) }} />
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
