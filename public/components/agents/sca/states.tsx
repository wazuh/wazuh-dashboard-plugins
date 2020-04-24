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
  EuiCallOut
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import TimeService from '../../../react-services/time-service'
import exportCsv from '../../../react-services/wz-csv';
import { toastNotifications } from 'ui/notify';

export class States extends Component {
  _isMount = false;
  constructor(props) {
    super(props);
    const { agent } = this.props;
    this.state = { agent, itemIdToExpandedRowMap: {}, showMoreInfo: false, loading: false }
    this.policies = [];
    this.wzReq = WzRequest;
    this.timeService = TimeService;
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
        name: 'Last scan',
        dataType: 'date',
        render: value => this.offsetTimestamp('', value)
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
    this.initialize();
  }

  componentWillUnmount() {
    this._isMount = false;
  }

  offsetTimestamp(text, time) {
    try {
      return text + this.timeService.offset(time);
    } catch (error) {
      return time !== '-' ? `${text}${time} (UTC)` : time;
    }
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

  async initialize() {
    try {
      this._isMount && this.setState({ loading: true });
      this.lookingPolicy = false;
      const policies = await this.wzReq.apiReq(
        'GET',
        `/sca/${this.state.agent.id}`,
        {}
      );
      this.policies = (((policies || {}).data || {}).data || {}).items || [];
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
      this.policies = [];
    }
  }

  async loadScaPolicy(policy) {
    this._isMount && this.setState({ loadingPolicy: true, itemIdToExpandedRowMap: {}, pageIndex: 0 });
    if (policy) {
      const checks = await this.wzReq.apiReq(
        'GET',
        `/sca/${this.state.agent.id}/checks/${policy.policy_id}`,
        {}
      );
      this.checks = (((checks || {}).data || {}).data || {}).items || [];
    }
    this._isMount && this.setState({ lookingPolicy: policy, loadingPolicy: false });
  }

  toggleDetails = item => {
    const itemIdToExpandedRowMap = { ...this.state.itemIdToExpandedRowMap };

    if (item.compliance.length) {
      item.complianceText = '';
      item.compliance.forEach(x => {
        item.complianceText += `${x.key}: ${x.value}\n`;
      });
    }
    if (item.rules.length) {
      item.rulesText = '';
      item.rules.forEach(x => {
        item.rulesText += `${x.rule}\n`;
      });
    }

    if (itemIdToExpandedRowMap[item.id]) {
      delete itemIdToExpandedRowMap[item.id];
    } else {
      let checks = '';
      checks += (item.rules || []).length > 1 ? 'Checks' : 'Check';
      checks += item.condition ? ` (Condition: ${item.condition})` : ''
      const listItems = [
        {
          title: 'Check not applicable due to:',
          description: item.reason
        },
        {
          title: 'Rationale',
          description: item.rationale
        },
        {
          title: 'Remediation',
          description: item.remediation
        },
        {
          title: 'Description',
          description: item.description
        },
        {
          title: (item.directory || '').includes(',') ? 'Paths' : 'Path',
          description: item.directory
        },
        {
          title: checks,
          description: item.rulesText,
        },
        {
          title: 'Compliance',
          description: item.complianceText
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
    toastNotifications.add({
      color: color,
      title: title,
      toastLifeTimeMs: time,
    });
  };
  async downloadCsv() {
    try {
      this.showToast('success', 'Your download should begin automatically...', 3000);
      await exportCsv(
        '/sca/' + this.state.agent.id + '/checks/' + this.state.lookingPolicy.policy_id,
        [],
        this.state.lookingPolicy.policy_id + '.csv'
      );
    } catch (error) {
      this.showToast('danger', error, 3000);
    }
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
    const pagination = {
      pageIndex: this.state.pageIndex,
      pageSize: 10,
      totalItemCount: (this.checks || []).length,
      pageSizeOptions: [10, 25, 50, 100]
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
        direction: 'asc'
      }
    };

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
          {((this.state.agent && (this.state.agent || {}).status !== 'Never connected' && !(this.policies || []).length && !this.state.loading) &&
            <EuiCallOut title="No scans available" iconType="iInCircle">
              <EuiButton color="primary" onClick={() => this.initialize()}>
                Refresh
           </EuiButton>
            </EuiCallOut>
          )}
          {((this.state.agent && (this.state.agent || {}).os && !this.state.lookingPolicy && (this.policies || []).length > 0 && !this.state.loading) &&
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
          {((this.state.agent && (this.state.agent || {}).os && this.state.lookingPolicy && !this.state.loading) &&
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
                      {...{iconSize:'l'}}
                    />
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiTitle
                      size="s">
                      <h2>{this.state.lookingPolicy.name}&nbsp;
                        <EuiToolTip position="right" content="Show policy checksum">
                          <EuiButtonEmpty
                            iconType="iInCircle"
                            aria-label="Help"
                            onClick={() => this.setState({ showMoreInfo: !this.state.showMoreInfo })}>
                            More info
                          </EuiButtonEmpty>
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
                {(this.state.showMoreInfo &&
                  <div>
                    <EuiSpacer size="s" />
                    <EuiText>
                      <pre>
                        <code><b>Policy description:</b> {this.state.lookingPolicy.description}</code>
                        <br></br>
                        <code><b>Policy checksum:</b> {this.state.lookingPolicy.hash_file}</code>
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
            </div>
          )}
        </EuiPage>
      </Fragment>
    );
  }
}
