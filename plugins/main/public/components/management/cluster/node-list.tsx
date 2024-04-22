import React, { Component } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiTitle,
} from '@elastic/eui';
import { withErrorBoundary } from '../../common/hocs';
import { TableWzAPI } from '../../common/tables';
import { WzRequest } from '../../../react-services';
import { SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT } from '../../../../common/constants';

const searchBarWQLFieldSuggestions = [
  { label: 'ip', description: 'filter by IP address' },
  { label: 'name', description: 'filter by name' },
  { label: 'type', description: 'filter by type' },
  { label: 'version', description: 'filter by version' },
];

export const NodeList = withErrorBoundary(
  class NodeList extends Component {
    constructor(props) {
      super(props);
      this.columns = [
        {
          field: 'name',
          name: 'Name',
          searchable: true,
          sortable: true,
          truncateText: true,
        },
        {
          field: 'version',
          name: 'Version',
          searchable: true,
          sortable: true,
        },
        {
          field: 'ip',
          name: 'IP address',
          searchable: true,
          sortable: true,
        },
        {
          field: 'type',
          name: 'Type',
          searchable: true,
          sortable: true,
        },
      ];
      this.state = {
        nodes: [],
        loading: false,
      };
    }
    render() {
      return (
        <EuiPanel>
          <EuiFlexGroup responsive={false} alignItems='center' gutterSize='s'>
            <EuiFlexItem grow={false}>
              <EuiToolTip content='Go back' position='bottom'>
                <EuiButtonIcon
                  color='primary'
                  size='m'
                  display='empty'
                  iconType='arrowLeft'
                  aria-label='Back'
                  onClick={() => this.props.goBack()}
                />
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiTitle>
                <h2>Cluster nodes</h2>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <TableWzAPI
                title='Nodes'
                endpoint='/cluster/nodes'
                tableColumns={this.columns}
                tableInitialSortingField='name'
                tablePageSizeOptions={[10, 25, 50, 100]}
                downloadCsv
                showReload
                searchTable
                searchBarWQL={{
                  suggestions: {
                    field(currentValue) {
                      return searchBarWQLFieldSuggestions;
                    },
                    value: async (currentValue, { field }) => {
                      try {
                        const response = await WzRequest.apiReq(
                          'GET',
                          '/cluster/nodes',
                          {
                            params: {
                              distinct: true,
                              limit: SEARCH_BAR_WQL_VALUE_SUGGESTIONS_COUNT,
                              select: field,
                              sort: `+${field}`,
                              ...(currentValue
                                ? { q: `${field}~${currentValue}` }
                                : {}),
                            },
                          },
                        );
                        return response?.data?.data.affected_items.map(
                          item => ({
                            label: item[field],
                          }),
                        );
                      } catch (error) {
                        return [];
                      }
                    },
                  },
                }}
                tableProps={{
                  tableLayout: 'auto',
                }}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      );
    }
  },
);
