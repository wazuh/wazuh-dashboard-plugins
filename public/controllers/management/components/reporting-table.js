import React, { Component } from 'react';

import {
  EuiCard,
  EuiIcon,
  EuiPanel,
  EuiFlexItem,
  EuiFlexGroup,
  EuiSpacer,
  EuiBasicTable,
  EuiCode,
  EuiLink,
  EuiHealth,
  EuiSwitch,
  EuiButtonIcon,
  EuiButtonEmpty
} from '@elastic/eui';

export class ReportingTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      items: this.props.items,
      pageIndex: 0,
      pageSize: 10,
      showPerPageOptions: true
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      items: nextProps.items
    });
  }

  onTableChange({ page = {} }) {
    const { index: pageIndex, size: pageSize } = page;

    this.setState({
      pageIndex,
      pageSize
    });
  }

  filterItems(pageIndex, pageSize) {
    const { items } = this.state;
    const pages = [];
    const len = items.length;
    for (let i = 0, j = len; i < j; i += pageSize) {
      pages.push(items.slice(i, i + pageSize));
    }
    return { pageOfItems: pages[pageIndex], totalItemCount: len };
  }

  render() {
    const { pageIndex, pageSize } = this.state;

    const { pageOfItems, totalItemCount } = this.filterItems(
      pageIndex,
      pageSize
    );


    const columns = [
      {
        field: 'name',
        name: 'File',
        sortable: true
      },
      {
        field: 'size',
        name: 'Size',
        sortable: true,
        render: size => {
          const fixedSize = size / 1024;
          return `${fixedSize.toFixed(2)}KB`;
        }
      },
      {
        field: 'date',
        name: 'Created',
        sortable: true
      },
      {
        name: 'Actions',

        render: item => {
          return (
            <div>
              <EuiButtonIcon
                onClick={() => this.props.goReport(item.name)}
                iconType="importAction"
              />

              <EuiButtonIcon
                onClick={() =>
                  this.props
                    .deleteReport(item.name)
                    .then(items => this.setState({ items }))
                }
                iconType="trash"
                color="danger"
              />
            </div>
          );
        }
      }
    ];

    const pagination = {
      pageIndex,
      pageSize,
      totalItemCount,
      pageSizeOptions: [10, 20, 50]
    };

    return (
      <div>
        <EuiBasicTable
          items={pageOfItems}
          columns={columns}
          pagination={pagination}
          onChange={obj => this.onTableChange(obj)}
        />
      </div>
    );
  }
}
