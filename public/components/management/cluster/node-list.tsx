import React, { Component, Fragment } from 'react';
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
          name: 'Name',
          sortable: true,
        },
        {
          field: 'version',
          name: 'Version',
          sortable: true,
        },
        {
          field: 'ip',
          name: 'IP address',
          sortable: true,
        },
        {
          field: 'type',
          name: 'Type',
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
                  <EuiToolTip position='right' content={`Back to groups`}>
                    <EuiButtonIcon
                      aria-label='Back'
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
                    <h1>Nodes</h1>
                  </EuiTitle>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiFieldSearch
                placeholder='Filter nodes...'
                onSearch={e => this.search(e)}
                isClearable={true}
                fullWidth={true}
                aria-label='Filter'
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
                tableLayout='auto'
              />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      );
    }
  },
);
