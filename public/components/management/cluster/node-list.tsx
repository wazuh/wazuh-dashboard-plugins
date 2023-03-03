import React, { Component } from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiTitle,
  EuiInMemoryTable,
  EuiFieldSearch,
} from '@elastic/eui';
import { WzRequest } from '../../../react-services/wz-request';
import { withErrorBoundary } from '../../common/hocs';
import { i18n } from '@kbn/i18n';
import { version } from '../../../utils/codemirror/lib/codemirror';

const name1 = i18n.translate(
  'wazuh.public.components.management.cluster.node.name',
  {
    defaultMessage: 'Name',
  },
);
const versionName = i18n.translate(
  'wazuh.public.components.management.cluster.node.version',
  {
    defaultMessage: 'Version',
  },
);
const ipAddress = i18n.translate(
  'wazuh.public.components.management.cluster.node.ipAddress',
  {
    defaultMessage: 'IP',
  },
);
const type = i18n.translate(
  'wazuh.public.components.management.cluster.node.type',
  {
    defaultMessage: 'Type',
  },
);
const filterPlace = i18n.translate(
  'wazuh.public.components.management.cluster.node.filterPlace',
  {
    defaultMessage: 'Filter nodes...',
  },
);
const filterLabel = i18n.translate(
  'wazuh.public.components.management.cluster.node.filterLabel',
  {
    defaultMessage: 'Filter',
  },
);
const groupContent = i18n.translate(
  'wazuh.public.components.management.cluster.node.groupContent',
  {
    defaultMessage: 'Back to groups',
  },
);
const backLabel = i18n.translate(
  'wazuh.public.components.management.cluster.node.backLabel',
  {
    defaultMessage: 'Back',
  },
);
export const NodeList = withErrorBoundary(
  class NodeList extends Component {
    constructor(props) {
      super(props);
      this.state = {
        nodes: [],
        loading: false,
      };
    }
    async componentDidMount() {
      this.search();
    }

    async search(searchTerm = false) {
      let params = {};
      if (searchTerm) {
        params.search = searchTerm;
      }
      this.setState({ loading: true });
      try {
        const request = await WzRequest.apiReq('GET', '/cluster/nodes', {
          params,
        });
        this.setState({
          nodes: (((request || {}).data || {}).data || {}).affected_items || [],
          loading: false,
        });
      } catch (error) {
        this.setState({ loading: false });
      }
    }

    render() {
      const columns = [
        {
          field: 'name',
          name: name1,
          sortable: true,
          truncateText: true,
        },
        {
          field: 'version',
          name: versionName,
          sortable: true,
        },
        {
          field: 'ip',
          name: ipAddress,
          sortable: true,
        },
        {
          field: 'type',
          name: type,
          sortable: true,
        },
      ];

      const sorting = {
        sort: {
          field: 'name',
          direction: 'asc',
        },
      };
      return (
        <EuiPanel>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFlexGroup>
                <EuiFlexItem grow={false} style={{ marginRight: 0 }}>
                  <EuiToolTip position='right' content={groupContent}>
                    <EuiButtonIcon
                      aria-label={backLabel}
                      style={{ paddingTop: 8 }}
                      color='primary'
                      iconSize='l'
                      iconType='arrowLeft'
                      onClick={() => this.props.goBack()}
                    />
                  </EuiToolTip>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiTitle>
                    <h1>
                      {i18n.translate(
                        'wazuh.components.management.cluster.nodes',
                        {
                          defaultMessage: 'Nodes',
                        },
                      )}
                    </h1>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFieldSearch
                placeholder={filterPlace}
                onSearch={e => this.search(e)}
                isClearable={true}
                fullWidth={true}
                aria-label={filterLabel}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiInMemoryTable
                items={this.state.nodes}
                columns={columns}
                pagination={true}
                sorting={sorting}
                loading={this.state.loading}
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      );
    }
  },
);
