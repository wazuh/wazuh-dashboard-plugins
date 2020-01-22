import React, { Component } from 'react';
import { Pie } from "../../d3/pie";
import {
  EuiFlexItem, EuiFlexGroup, EuiPanel, EuiPage, EuiBasicTable, EuiInMemoryTable, EuiSpacer, EuiText, EuiProgress,
  EuiTitle, EuiButton, EuiButtonIcon, EuiStat, EuiHealth, EuiDescriptionList, EuiButtonEmpty, EuiToolTip, EuiCallOut
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import timeService from '../../../services/time-service'

export class ScaDashboard extends Component {
  constructor(props) {
    super(props);
    const { agent } = this.props;
    this.state = { agent, itemIdToExpandedRowMap: {}, showChecksum: false, loading: false }
    this.policies = [];
    this.wzReq = WzRequest;
    this.timeService = timeService;
    this.columnsPolicies = [
      {
        field: 'name',
        name: 'Policy'
      },
      {
        field: 'description',
        name: 'Description',
        truncateText: true,
      },
      {
        field: 'end_scan',
        name: 'Last scan',
        dataType: 'date',
        render: value => this.offsetTimestamp('', value),
      },
      {
        field: 'pass',
        name: 'Pass',
        width: 100
      },
      {
        field: 'fail',
        name: 'Fail',
        width: 100
      },
      {
        field: 'invalid',
        name: 'Not applicable',
        width: 100
      },
      {
        field: 'score',
        name: 'Score',
        render: score => {
          return `${score}%`;
        },
        width: 100
      },
    ];
    this.columnsChecks = [
      {
        field: 'id',
        name: 'ID',
        sortable: true,
        width: 50
      },
      {
        field: 'title',
        name: 'Title',
        sortable: true,
        truncateText: true,
      },
      {
        name: 'Target',
        sortable: true,
        truncateText: true,
        render: item => (
          <div>
            {item.file ? <span><b>File:</b> {item.file}</span>
              : item.directory ? <span><b>Directory:</b> {item.directory}</span>
                : item.process ? <span><b>Process: </b> {item.process}</span>
                  : item.command ? <span><b>Command: </b> {item.command}</span>
                    : item.registry ? <span><b>Registry: </b> {item.registry}</span>
                      : '-'}
          </div>
        ),
      },
      {
        field: 'result',
        name: 'Result',
        truncateText: true,
        sortable: true,
        width: 150,
        render: this.addHealthResultRender,
      },
      {
        align: 'right',
        width: 40,
        isExpander: true,
        render: item => (
          <EuiButtonIcon
            onClick={() => this.toggleDetails(item)}
            aria-label={this.state.itemIdToExpandedRowMap[item.id] ? 'Collapse' : 'Expand'}
            iconType={this.state.itemIdToExpandedRowMap[item.id] ? 'arrowUp' : 'arrowDown'}
          />
        ),
      },
    ];
  }

  offsetTimestamp(text, time) {
    try {
      return text + this.timeService.offset(time);
    } catch (error) {
      return time !== '-' ? `${text}${time} (UTC)` : time;
    }
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

  async initialize() {
    try {
      this.setState({ loading: true });
      this.lookingPolicy = false;
      const policies = await this.wzReq.apiReq('GET', `/sca/${this.state.agent.id}`, {});
      this.policies = (((policies || {}).data || {}).data || {}).items || [];
      const models = [];
      for (let i = 0; i < this.policies.length; i++) {
        models.push({
          name: this.policies[i].name, status:
            [
              { id: 'pass', label: "Pass", value: this.policies[i].pass },
              { id: 'fail', label: "Fail", value: this.policies[i].fail },
              { id: 'invalid', label: "Not applicable", value: this.policies[i].invalid },
            ]
        }
        )
      }
      this.setState({ data: models, loading: false });
    } catch (error) {
      this.policies = [];
    }
  }

  async componentDidMount() {
    this.initialize();
  }

  async loadScaPolicy(policy) {
    this.setState({ loadingPolicy: true, itemIdToExpandedRowMap: {}, pageIndex: 0 });
    if (policy) {
      const checks = await this.wzReq.apiReq('GET', `/sca/${this.state.agent.id}/checks/${policy.policy_id}`, {});
      this.checks = (((checks || {}).data || {}).data || {}).items || [];
    }
    this.setState({ lookingPolicy: policy, loadingPolicy: false });
  }

  toggleDetails = item => {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };

    if (item.compliance.length) {
      item.complianceText = '';
      item.compliance.forEach(x => {
        item.complianceText += `${x.key}: ${x.value}\n`
      })
    }
    if (item.rules.length) {
      item.rulesText = '';
      item.rules.forEach(x => {
        item.rulesText += `${x.rule}\n`
      })
    }

    if (itemIdToExpandedRowMap[item.id]) {
      delete itemIdToExpandedRowMap[item.id];
    } else {
      const listItems = [
        {
          title: 'Check not applicable due to:',
          description: item.reason,
        },
        {
          title: 'Rationale',
          description: item.rationale,
        },
        {
          title: 'Condition',
          description: item.condition,
        },
        {
          title: 'Remediation',
          description: item.remediation,
        },
        {
          title: 'Description',
          description: item.description,
        },
        {
          title: (item.directory || '').includes(',') ? 'Paths' : 'Path',
          description: item.directory,
        },
        {
          title: (item.rules || []).length > 1 ? 'Checks' : 'Check',
          description: item.rulesText,
        },
        {
          title: 'Compliance',
          description: item.complianceText,
        }
      ];
      const itemsToShow = listItems.filter(x => { return x.description });
      itemIdToExpandedRowMap[item.id] = (
        <EuiDescriptionList listItems={itemsToShow} />
      );
    }
    this.setState({ itemIdToExpandedRowMap });
  };


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
    const pagination = {
      pageIndex: this.state.pageIndex,
      pageSize: 10,
      totalItemCount: (this.checks || []).length,
      pageSizeOptions: [10, 25, 50, 100],
    };

    const search = {
      box: {
        incremental: this.state.incremental,
        schema: true
      }
    };
    const sorting = {
      sort: {
        field: 'id',
        direction: 'asc',
      },
    };

    return (
      <div>
        {(this.state.loading &&
          <EuiProgress size="xs" color="primary" style={{ margin: 16 }} />
        )}
        {((this.state.agent && (this.state.agent || {}).status !== 'Never connected' && !(this.policies || []).length && !this.state.loading) &&
          <EuiCallOut title="No scans available" iconType="iInCircle" style={{ margin: 16 }}>
            <EuiButton color="primary" onClick={() => this.initialize()}>
              Refresh
           </EuiButton>
          </EuiCallOut>
        )}
        {((this.state.agent && (this.state.agent || {}).os && !this.state.lookingPolicy && (this.policies || []).length > 0 && !this.state.loading) &&
          <div>
            <EuiPage>
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
            </EuiPage>
            <EuiPage style={{ paddingTop: 0 }}>
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
            </EuiPage>
          </div>
        )}
        {((this.state.agent && (this.state.agent || {}).os && this.state.lookingPolicy && !this.state.loading) &&
          <div>
            <EuiPage>
              <EuiPanel paddingSize="l">
                <EuiFlexGroup>
                  <EuiFlexItem grow={false}>
                    <EuiButtonIcon
                      color='primary'
                      iconSize='l'
                      style={{ padding: '6px' }}
                      onClick={() => this.loadScaPolicy(false)}
                      iconType="arrowLeft"
                      aria-label="Back to policies"
                    />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiTitle>
                      <h2>{this.state.lookingPolicy.name}&nbsp;
                        <EuiToolTip position="right" content="Show policy checksum">
                          <EuiButtonIcon
                            iconType="iInCircle"
                            iconSize="l"
                            aria-label="Help"
                            onClick={() => this.setState({ showChecksum: !this.state.showChecksum })}
                          />
                        </EuiToolTip>
                      </h2>
                    </EuiTitle>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      iconType="importAction"
                      onClick={async () => await this.props.downloadCsv('/sca/' + this.state.agent.id + '/checks/' + this.state.lookingPolicy.policy_id,
                        this.state.lookingPolicy.policy_id + '.csv')} >
                      Export formatted
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty iconType="refresh" onClick={() => this.loadScaPolicy(this.state.lookingPolicy)}>
                      Refresh
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                </EuiFlexGroup>
                {(this.state.showChecksum &&
                  <div>
                    <EuiSpacer size="m" />
                    <EuiText>
                      <pre>
                        <code>Policy checksum: {this.state.lookingPolicy.hash_file}</code>
                      </pre>
                    </EuiText>
                  </div>
                )}
                <EuiSpacer size="m" />
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiStat title={this.state.lookingPolicy.pass} description="Pass" titleColor="secondary" titleSize="m" textAlign="center" />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiStat title={this.state.lookingPolicy.fail} description="Fail" titleColor="danger" titleSize="m" textAlign="center" />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiStat title={this.state.lookingPolicy.invalid} description="Not applicable" titleColor="subdued" titleSize="m" textAlign="center" />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiStat title={`${this.state.lookingPolicy.score}%`} description="Score" titleColor="accent" titleSize="m" textAlign="center" />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiStat title={this.state.lookingPolicy.end_scan} description="Last scan" titleColor="primary" titleSize="s" textAlign="center" style={{ padding: 5 }} />
                  </EuiFlexItem>
                </EuiFlexGroup>
                <EuiSpacer size="m" />
                <EuiFlexGroup>
                  <EuiFlexItem>
                    <EuiInMemoryTable
                      items={this.checks}
                      columns={this.columnsChecks}
                      rowProps={getChecksRowProps}
                      itemId="id"
                      itemIdToExpandedRowMap={this.state.itemIdToExpandedRowMap}
                      isExpandable={true}
                      sorting={sorting}
                      search={search}
                      pagination={pagination}
                      loading={this.state.loadingPolicy}
                    />
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiPanel>
            </EuiPage>
          </div>
        )}
      </div>
    );
  }
}
