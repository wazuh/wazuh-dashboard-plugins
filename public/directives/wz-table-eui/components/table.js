import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiBasicTable } from '@elastic/eui';

export class BasicTable extends Component {
  constructor(props) {
    super(props);

    this.state = {
      items: this.props.items,
      pageIndex: 0,
      pageSize: 10,
      sortField: this.props.initialSortField || this.props.columns[0].field,
      sortDirection: 'desc'
    };

    this.lastSorting = {
      sortField: this.props.initialSortField || this.props.columns[0].field,
      sortDirection: 'desc'
    };
  }

  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      items: nextProps.items
    });
  }

  async onTableChange({ page = {}, sort = {} }) {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;

    const sortingChanged =
      this.lastSorting.sortField !== sortField ||
      this.lastSorting.sortDirection !== sortDirection;

    if (sortingChanged) {
      this.lastSorting = { sortField, sortDirection };
      await this.props.sortByField(sortField);
    }

    const { pageOfItems } = this.filterItems(pageIndex, pageSize);
    let needMoreData = pageOfItems.includes(null);

    while (needMoreData) {
      const { items } = this.state;
      const nonNull = items.filter(item => !!item).length;
      const newItems = await this.props.getData({ offset: nonNull });
      await this.promisedSetState({
        items: newItems
      });
      const result = this.filterItems(pageIndex, pageSize);
      needMoreData = result.pageOfItems.includes(null);
    }

    this.setState({
      pageIndex,
      pageSize,
      sortField,
      sortDirection
    });
  }

  promisedSetState(newState) {
    return new Promise(resolve => {
      this.setState(newState, () => {
        resolve();
      });
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
    const { pageIndex, pageSize, sortField, sortDirection } = this.state;

    const { pageOfItems, totalItemCount } = this.filterItems(
      pageIndex,
      pageSize
    );

    const columns = [...this.props.columns];

    const pagination = {
      pageIndex,
      pageSize,
      totalItemCount,
      pageSizeOptions: [10, 20, 50],
      hidePerPageOptions: this.state.items.length <= 10
    };

    const sorting = {
      sort: {
        field: sortField,
        direction: sortDirection
      }
    };

    return (
      <div>
        <EuiBasicTable
          sorting={sorting}
          items={pageOfItems}
          columns={columns}
          pagination={pagination}
          onChange={obj => this.onTableChange(obj)}
        />
      </div>
    );
  }
}

BasicTable.propTypes = {
  items: PropTypes.array
};
