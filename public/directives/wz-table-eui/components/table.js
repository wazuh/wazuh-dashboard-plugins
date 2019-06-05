import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiBasicTable } from '@elastic/eui';

export class BasicTable extends Component {
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

  async onTableChange({ page = {} }) {
    const { index: pageIndex, size: pageSize } = page;
    const { pageOfItems } = this.filterItems(pageIndex, pageSize);
    const needMoreData = pageOfItems.includes(null);

    if (needMoreData) {
      const { items } = this.state;
      const nonNull = items.filter(item => !!item).length;
      await this.props.getData({ offset: nonNull });
      return this.onTableChange({ page });
    }

    this.setState({
      pageIndex,
      pageSize
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
    const { pageIndex, pageSize } = this.state;

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

BasicTable.propTypes = {
  items: PropTypes.array
};
