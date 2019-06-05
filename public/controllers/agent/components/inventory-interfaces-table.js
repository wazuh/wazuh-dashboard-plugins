import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiBasicTable, EuiHealth } from '@elastic/eui';

export class InventoryInterfacesTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      items: this.props.items,
      pageIndex: 0,
      pageSize: 10
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
    return { pageOfItems: pages[pageIndex] || [], totalItemCount: len };
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
        name: 'Name'
      },
      {
        field: 'mac',
        name: 'MAC'
      },
      {
        field: 'state',
        name: 'State',
        render: state => (
          <EuiHealth color={state === 'up' ? 'success' : 'danger'}>
            {state}
          </EuiHealth>
        )
      },
      {
        field: 'mtu',
        name: 'MTU'
      },
      {
        field: 'type',
        name: 'Type'
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

InventoryInterfacesTable.propTypes = {
  items: PropTypes.array
};
