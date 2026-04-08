import React, { Component } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiTitle,
} from '@elastic/eui';
import { i18n } from '@osd/i18n';
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
          name={i18n.translate('wazuh.name', { defaultMessage: {i18n.translate('wazuh.name', { defaultMessage: 'Name' })} })},
          searchable: true,
          sortable: true,
          truncateText: true,
        },
        {
          field: 'version',
          name={i18n.translate('wazuh.version', { defaultMessage: {i18n.translate('wazuh.version', { defaultMessage: 'Version' })} })},
          searchable: true,
          sortable: true,
        },
        {
          field: 'ip',
          name={i18n.translate('wazuh.ipaddress', { defaultMessage: {i18n.translate('wazuh.ipaddress', { defaultMessage: 'IP address' })} })},
          searchable: true,
          sortable: true,
        },
        {
          field: 'type',
          name={i18n.translate('wazuh.type', { defaultMessage: {i18n.translate('wazuh.type', { defaultMessage: 'Type' })} })},
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
              <EuiToolTip content={i18n.translate('wazuh.goback', { defaultMessage: 'Go back' })} position='bottom'>
                <EuiButtonIcon
                  color='primary'
                  size='m'
                  display='empty'
                  iconType='arrowLeft'
                  aria-label={i18n.translate('wazuh.back', { defaultMessage: {i18n.translate('wazuh.back', { defaultMessage: 'Back' })} })}
                  onClick={() => this.props.goBack()}
                />
              </EuiToolTip>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiTitle>
                <h2>{i18n.translate('wazuh.clusternodes', { defaultMessage: 'Cluster nodes' })}</h2>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <TableWzAPI
                title={i18n.translate('wazuh.nodes', { defaultMessage: {i18n.translate('wazuh.nodes', { defaultMessage: 'Nodes' })} })}
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
                          {i18n.translate('wazuh.get', { defaultMessage: 'GET' })},
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
