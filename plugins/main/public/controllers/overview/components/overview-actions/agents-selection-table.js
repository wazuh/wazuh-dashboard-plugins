import React, { Component, Fragment } from 'react';
import {
  EuiButtonIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiToolTip,
} from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { updateCurrentAgentData } from '../../../../redux/actions/appStateActions';
import store from '../../../../redux/store';
import { GroupTruncate } from '../../../../components/common/util/agent-group-truncate/';
import { get as getLodash } from 'lodash';
import {
  SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
  UI_LOGGER_LEVELS,
  UI_ORDER_AGENT_STATUS,
} from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { AgentStatus } from '../../../../components/agents/agent-status';
import { TableWzAPI } from '../../../../components/common/tables';

const searchBarWQLOptions = {
  implicitQuery: {
    query: 'id!=000',
    conjunction: ';',
  },
};

export class AgentSelectionTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      filters: { default: { q: 'id!=000' } },
    };

    this.columns = [
      {
        field: 'id',
        name: 'ID',
        width: '60px',
        searchable: true,
        sortable: true,
      },
      {
        field: 'name',
        name: 'Name',
        searchable: true,
        sortable: true,
      },
      {
        field: 'group',
        name: 'Group',
        sortable: true,
        searchable: true,
        render: groups => this.renderGroups(groups),
      },
      {
        field: 'version',
        name: 'Version',
        width: '80px',
        searchable: true,
        sortable: true,
      },
      {
        field: 'os.name,os.version',
        composeField: ['os.name', 'os.version'],
        name: 'Operating system',
        sortable: true,
        searchable: true,
        render: (field, agentData) => this.addIconPlatformRender(agentData),
      },
      {
        field: 'status',
        name: 'Status',
        searchable: true,
        sortable: true,
        width: 'auto',
        render: (status, agent) => (
          <AgentStatus
            status={status}
            agent={agent}
            style={{ whiteSpace: 'no-wrap' }}
          />
        ),
      },
    ];
  }

  unselectAgents() {
    store.dispatch(updateCurrentAgentData({}));
    this.props.removeAgentsFilter();
  }

  async selectAgentAndApply(agentID) {
    try {
      const data = await WzRequest.apiReq('GET', '/agents', {
        params: { q: 'id=' + agentID },
      });
      const formattedData = data?.data?.data?.affected_items?.[0];
      store.dispatch(updateCurrentAgentData(formattedData));
      this.props.updateAgentSearch([agentID]);
    } catch (error) {
      store.dispatch(updateCurrentAgentData({}));
      this.props.removeAgentsFilter(true);
      const options = {
        context: `${AgentSelectionTable.name}.selectAgentAndApply`,
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

  addIconPlatformRender(agent) {
    let icon = '';
    const os = agent?.os || {};

    if ((os?.uname || '').includes('Linux')) {
      icon = 'linux';
    } else if (os?.platform === 'windows') {
      icon = 'windows';
    } else if (os?.platform === 'darwin') {
      icon = 'apple';
    }
    const os_name = `${agent?.os?.name || ''} ${agent?.os?.version || ''}`;

    return (
      <EuiFlexGroup gutterSize='xs'>
        <EuiFlexItem grow={false}>
          <i
            className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${icon}`}
            aria-hidden='true'
          ></i>
        </EuiFlexItem>{' '}
        <EuiFlexItem>{os_name.trim() || '-'}</EuiFlexItem>
      </EuiFlexGroup>
    );
  }

  filterGroupBadge = group => {
    this.setState({
      filters: {
        default: { q: 'id!=000' },
        q: `group=${group}`,
      },
    });
  };

  renderGroups(groups) {
    return Array.isArray(groups) ? (
      <GroupTruncate
        groups={groups}
        length={20}
        label={'more'}
        action={'filter'}
        filterAction={this.filterGroupBadge}
        {...this.props}
      />
    ) : (
      groups
    );
  }

  render() {
    const selectedAgent = store.getState().appStateReducers.currentAgentData;

    const getRowProps = (item, idx) => {
      return {
        'data-test-subj': `explore-agent-${idx}`,
        className: 'customRowClass',
        onClick: () => this.selectAgentAndApply(item.id),
      };
    };

    return (
      <div>
        {selectedAgent && Object.keys(selectedAgent).length > 0 && (
          <Fragment>
            <EuiFlexGroup responsive={false} justifyContent='flexEnd'>
              {/* agent name (agent id) Unpin button right aligned, require justifyContent="flexEnd" in the EuiFlexGroup */}
              <EuiFlexItem grow={false} style={{ marginRight: 0 }}>
                <AgentStatus
                  status={selectedAgent.status}
                  agent={selectedAgent}
                  style={{ whiteSpace: 'no-wrap' }}
                >
                  {selectedAgent.name} ({selectedAgent.id})
                </AgentStatus>
              </EuiFlexItem>
              <EuiFlexItem
                grow={false}
                style={{ marginTop: 10, marginLeft: 4 }}
              >
                <EuiToolTip position='top' content='Unpin agent'>
                  <EuiButtonIcon
                    color='danger'
                    onClick={() => this.unselectAgents()}
                    iconType='pinFilled'
                    aria-label='unpin agent'
                  />
                </EuiToolTip>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size='m' />
          </Fragment>
        )}

        <TableWzAPI
          endpoint='/agents'
          tableColumns={this.columns}
          tableInitialSortingField='id'
          tablePageSizeOptions={[10, 25, 50, 100]}
          mapResponseItem={item => {
            return {
              ...item,
              /*
              The agent version contains the Wazuh word, this get the string starting with
              v<NUMBER><ANYTHING>
              */
              ...(typeof item.version === 'string'
                ? { version: item.version.match(/(v\d.+)/)?.[1] }
                : { version: '-' }),
            };
          }}
          rowProps={getRowProps}
          filters={this.state.filters}
          searchTable
          searchBarWQL={{
            options: searchBarWQLOptions,
            suggestions: {
              field(currentValue) {
                return [
                  { label: 'id', description: 'filter by ID' },
                  { label: 'group', description: 'filter by group' },
                  { label: 'name', description: 'filter by name' },
                  {
                    label: 'os.name',
                    description: 'filter by operating system name',
                  },
                  {
                    label: 'os.version',
                    description: 'filter by operating system version',
                  },
                  { label: 'status', description: 'filter by status' },
                  { label: 'version', description: 'filter by version' },
                ];
              },
              value: async (currentValue, { field }) => {
                try {
                  switch (field) {
                    case 'status':
                      return UI_ORDER_AGENT_STATUS.map(status => ({
                        label: status,
                      }));
                    default: {
                      const response = await WzRequest.apiReq(
                        'GET',
                        '/agents',
                        {
                          params: {
                            distinct: true,
                            limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                            select: field,
                            sort: `+${field}`,
                            ...(currentValue
                              ? {
                                  q: `${searchBarWQLOptions.implicitQuery.query}${searchBarWQLOptions.implicitQuery.conjunction}${field}~${currentValue}`,
                                }
                              : {
                                  q: `${searchBarWQLOptions.implicitQuery.query}`,
                                }),
                          },
                        },
                      );
                      if (field === 'group') {
                        /* the group field is returned as an string[],
                        example: ['group1', 'group2']

                        Due the API request done to get the distinct values for the groups is
                        not returning the exepected values, as workaround, the values are
                        extracted in the frontend using the returned results.

                        This API request to get the distint values of groups doesn't
                        return the unique values for the groups, else the unique combination
                        of groups.
                        */
                        return response?.data?.data.affected_items
                          .map(item => getLodash(item, field))
                          .flat()
                          .filter(
                            (item, index, array) =>
                              array.indexOf(item) === index,
                          )
                          .sort()
                          .map(group => ({ label: group }));
                      }
                      return response?.data?.data.affected_items.map(item => ({
                        label: getLodash(item, field),
                      }));
                    }
                  }
                } catch (error) {
                  return [];
                }
              },
            },
          }}
        />
      </div>
    );
  }
}
