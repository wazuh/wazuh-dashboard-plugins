import React, { Component, Fragment } from 'react';
import {
  EuiButtonIcon,
  EuiCheckbox,
  EuiFlexGroup,
  EuiFlexItem,
  EuiHealth,
  EuiSpacer,
  EuiTable,
  EuiTableBody,
  EuiTableFooterCell,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableHeaderCellCheckbox,
  EuiTableHeaderMobile,
  EuiTablePagination,
  EuiTableRow,
  EuiTableRowCell,
  EuiTableRowCellCheckbox,
  EuiTableSortMobile,
  EuiToolTip,
} from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';
import { LEFT_ALIGNMENT } from '@elastic/eui/lib/services';
import { updateCurrentAgentData } from '../../../../redux/actions/appStateActions';
import store from '../../../../redux/store';
import { GroupTruncate } from '../../../../components/common/util/agent-group-truncate/';
import { filtersToObject, WzSearchBar } from '../../../../components/wz-search-bar';
import { getAgentFilterValues } from '../../../../controllers/management/components/management/groups/get-agents-filters-values';
import _ from 'lodash';
import { UI_LOGGER_LEVELS, UI_ORDER_AGENT_STATUS } from '../../../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';
import { AgentStatus } from '../../../../components/agents/agent_status';

const checkField = field => {
  return field !== undefined ? field : '-';
};

export class AgentSelectionTable extends Component {
  constructor(props) {
    super(props);
    this.state = {
      itemIdToSelectedMap: {},
      itemIdToOpenActionsPopoverMap: {},
      sortedColumn: 'title',
      itemsPerPage: 10,
      pageIndex: 0,
      totalItems: 0,
      isLoading: false,
      sortDirection: 'asc',
      sortField: 'id',
      agents: [],
      selectedOptions: [],
      filters: []
    };

    this.columns = [
      {
        id: 'id',
        label: 'ID',
        alignment: LEFT_ALIGNMENT,
        width: '60px',
        mobileOptions: {
          show: true,
        },
        isSortable: true,
      },
      {
        id: 'name',
        label: 'Name',
        alignment: LEFT_ALIGNMENT,
        mobileOptions: {
          show: true,
        },
        isSortable: true
      },
      {
        id: 'group',
        label: 'Group',
        alignment: LEFT_ALIGNMENT,
        mobileOptions: {
          show: false,
        },
        isSortable: true,
        render: groups => this.renderGroups(groups)
      },
      {
        id: 'version',
        label: 'Version',
        width: '80px',
        alignment: LEFT_ALIGNMENT,
        mobileOptions: {
          show: true,
        },
        isSortable: true,
      },
      {
        id: 'os',
        label: 'Operating system',
        alignment: LEFT_ALIGNMENT,
        mobileOptions: {
          show: false,
        },
        isSortable: true,
        render: os => this.addIconPlatformRender(os)
      },
      {
        id: 'status',
        label: 'Status',
        alignment: LEFT_ALIGNMENT,
        mobileOptions: {
          show: true,
        },
        isSortable: true,
        width: 'auto',
        render: status => <AgentStatus status={status} style={{ whiteSpace: 'no-wrap' }}/>,
      },
    ];
    this.suggestions = [
      { type: 'q', label: 'status', description: 'Filter by agent connection status', operators: ['=', '!=',], values: UI_ORDER_AGENT_STATUS },
      { type: 'q', label: 'os.platform', description: 'Filter by operating system platform', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('os.platform', value, { q: 'id!=000'})},
      { type: 'q', label: 'ip', description: 'Filter by agent IP address', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('ip', value, { q: 'id!=000'})},
      { type: 'q', label: 'name', description: 'Filter by agent name', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('name', value, { q: 'id!=000'})},
      { type: 'q', label: 'id', description: 'Filter by agent id', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('id', value, { q: 'id!=000'})},
      { type: 'q', label: 'group', description: 'Filter by agent group', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('group', value, { q: 'id!=000'})},
      { type: 'q', label: 'node_name', description: 'Filter by node name', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('node_name', value, { q: 'id!=000'})},
      { type: 'q', label: 'manager', description: 'Filter by manager', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('manager', value, { q: 'id!=000'})},
      { type: 'q', label: 'version', description: 'Filter by agent version', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('version', value, { q: 'id!=000'})},
      { type: 'q', label: 'configSum', description: 'Filter by agent config sum', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('configSum', value, { q: 'id!=000'})},
      { type: 'q', label: 'mergedSum', description: 'Filter by agent merged sum', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('mergedSum', value, { q: 'id!=000'})},
      { type: 'q', label: 'dateAdd', description: 'Filter by add date', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('dateAdd', value, { q: 'id!=000'})},
      { type: 'q', label: 'lastKeepAlive', description: 'Filter by last keep alive', operators: ['=', '!=',], values: async (value) => getAgentFilterValues('lastKeepAlive', value, { q: 'id!=000'})},
    ];
  }

  onChangeItemsPerPage = async itemsPerPage => {
    this._isMounted && this.setState({ itemsPerPage }, async () => await this.getItems());
  };

  onChangePage = async pageIndex => {
    this._isMounted && this.setState({ pageIndex }, async () => await this.getItems());
  };

  async componentDidMount() {
    this._isMounted = true;
    const tmpSelectedAgents = {};
    if(!store.getState().appStateReducers.currentAgentData.id){
      tmpSelectedAgents[store.getState().appStateReducers.currentAgentData.id] = true;
    }
    this._isMounted && this.setState({itemIdToSelectedMap: this.props.selectedAgents});
    await this.getItems();
  }

  componentWillUnmount(){
    this._isMounted = false;
  }

  async componentDidUpdate(prevProps, prevState) {
    if(!(_.isEqual(prevState.filters,this.state.filters))){
      await this.getItems();
    }
  }

  getArrayFormatted(arrayText) {
    try {
      const stringText = arrayText.toString();
      const splitString = stringText.split(',');
      return splitString.join(', ');
    } catch (error) {
      const options = {
        context: `${AgentSelectionTable.name}.getArrayFormatted`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.UI,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };

      getErrorOrchestrator().handleError(options);
      return arrayText;
    }
  }

  async getItems() {
    try {
      this._isMounted && this.setState({ isLoading: true });
      const rawData = await WzRequest.apiReq('GET', '/agents', { params: this.buildFilter() });
      const data = (((rawData || {}).data || {}).data || {}).affected_items;
      const totalItems = (((rawData || {}).data || {}).data || {}).total_affected_items;
      const formattedData = data.map((item, id) => {
        return {
          id: item.id,
          name: item.name,
          version: item.version !== undefined ? item.version.split(' ')[1] : '-',
          os: item.os || '-',
          status: item.status,
          group: item.group || '-',
        };
      });
      this._isMounted && this.setState({ agents: formattedData, totalItems, isLoading: false });
    } catch (error) {
      this._isMounted && this.setState({ isLoading: false });
      const options = {
        context: `${AgentSelectionTable.name}.getItems`,
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

  buildFilter() {
    const { itemsPerPage, pageIndex, filters } = this.state;
    const filter = {
      ...filtersToObject(filters),
      offset: (pageIndex * itemsPerPage) || 0,
      limit: pageIndex * itemsPerPage + itemsPerPage,
      ...this.buildSortFilter()
    };
    filter.q = !filter.q ? `id!=000` : `id!=000;${filter.q}`;
    return filter;
  }

  buildSortFilter() {
    const { sortDirection, sortField } = this.state;
    const sortFilter = {};
    if (sortField) {
      const direction = sortDirection === 'asc' ? '+' : '-';
      sortFilter['sort'] = direction + (sortField === 'os'? 'os.name,os.version' : sortField);
    }

    return sortFilter;
  }

  onSort = async prop => {
    const sortField = prop;
    const sortDirection =
      this.state.sortField === prop && this.state.sortDirection === 'asc'
        ? 'desc'
        : this.state.sortDirection === 'asc'
        ? 'desc'
        : 'asc';

    this._isMounted && this.setState({ sortField, sortDirection }, async () => await this.getItems());
  };

  toggleItem = itemId => {
    this._isMounted && this.setState(previousState => {
      const newItemIdToSelectedMap = {
        [itemId]: !previousState.itemIdToSelectedMap[itemId],
      };

      return {
        itemIdToSelectedMap: newItemIdToSelectedMap,
      };
    });
  };

  toggleAll = () => {
    const allSelected = this.areAllItemsSelected();
    const newItemIdToSelectedMap = {};
    this.state.agents.forEach(item => (newItemIdToSelectedMap[item.id] = !allSelected));
    this._isMounted && this.setState({
      itemIdToSelectedMap: newItemIdToSelectedMap,
    });
  };

  isItemSelected = itemId => {
    return this.state.itemIdToSelectedMap[itemId];
  };

  areAllItemsSelected = () => {
    const indexOfUnselectedItem = this.state.agents.findIndex(item => !this.isItemSelected(item.id));
    return indexOfUnselectedItem === -1;
  };

  areAnyRowsSelected = () => {
    return (
      Object.keys(this.state.itemIdToSelectedMap).findIndex(id => {
        return this.state.itemIdToSelectedMap[id];
      }) !== -1
    );
  };

  togglePopover = itemId => {
    this._isMounted && this.setState(previousState => {
      const newItemIdToOpenActionsPopoverMap = {
        ...previousState.itemIdToOpenActionsPopoverMap,
        [itemId]: !previousState.itemIdToOpenActionsPopoverMap[itemId],
      };

      return {
        itemIdToOpenActionsPopoverMap: newItemIdToOpenActionsPopoverMap,
      };
    });
  };

  closePopover = itemId => {
    // only update the state if this item's popover is open
    if (this.isPopoverOpen(itemId)) {
      this._isMounted && this.setState(previousState => {
        const newItemIdToOpenActionsPopoverMap = {
          ...previousState.itemIdToOpenActionsPopoverMap,
          [itemId]: false,
        };

        return {
          itemIdToOpenActionsPopoverMap: newItemIdToOpenActionsPopoverMap,
        };
      });
    }
  };

  isPopoverOpen = itemId => {
    return this.state.itemIdToOpenActionsPopoverMap[itemId];
  };

  renderSelectAll = mobile => {
    if (!this.state.isLoading && this.state.agents.length) {
      return (
        <EuiCheckbox
          id="selectAllCheckbox"
          label={mobile ? 'Select all' : null}
          checked={this.areAllItemsSelected()}
          onChange={this.toggleAll.bind(this)}
          type={mobile ? null : 'inList'}
        />
      );
    }
  };

  getTableMobileSortItems() {
    const items = [];
    this.columns.forEach(column => {
      if (column.isCheckbox || !column.isSortable) {
        return;
      }
      items.push({
        name: column.label,
        key: column.id,
        onSort: this.onSort.bind(this, column.id),
        isSorted: this.state.sortField === column.id,
        isSortAscending: this.state.sortDirection === 'asc',
      });
    });
    return items.length ? items : null;
  }

  renderHeaderCells() {
    const headers = [];

    this.columns.forEach((column, columnIndex) => {
      if (column.isCheckbox) {
        headers.push(
          <EuiTableHeaderCellCheckbox key={column.id} width={column.width}>
          </EuiTableHeaderCellCheckbox>
        );
      } else {
        headers.push(
          <EuiTableHeaderCell
            key={column.id}
            align={this.columns[columnIndex].alignment}
            width={column.width}
            onSort={column.isSortable ? this.onSort.bind(this, column.id) : undefined}
            isSorted={this.state.sortField === column.id}
            isSortAscending={this.state.sortDirection === 'asc'}
            mobileOptions={column.mobileOptions}
          >
            {column.label}
          </EuiTableHeaderCell>
        );
      }
    });
    return headers.length ? headers : null;
  }

  renderRows() {
    const renderRow = item => {
      const cells = this.columns.map(column => {
        const cell = item[column.id];

        let child;

        if (column.isCheckbox) {
          return (
            <EuiTableRowCellCheckbox key={column.id}>
              <EuiCheckbox
                id={`${item.id}-checkbox`}
                checked={this.isItemSelected(item.id)}
                onChange={() => {}}
                type="inList"
              />
            </EuiTableRowCellCheckbox>
          );
        }

        if (column.render) {
          child = column.render(item[column.id]);
        } else {
          child = cell;
        }

        return (
          <EuiTableRowCell
            key={column.id}
            align={column.alignment}
            truncateText={cell && cell.truncateText}
            textOnly={cell ? cell.textOnly : true}
            mobileOptions={{
              header: column.label,
              ...column.mobileOptions,
            }}
          >
            {child}
          </EuiTableRowCell>
        );
      });

      return (
        <EuiTableRow
          key={item.id}
          isSelected={this.isItemSelected(item.id)}
          isSelectable={true}
          onClick={async () => await this.selectAgentAndApply(item.id)}
          hasActions={true}
        >
          {cells}
        </EuiTableRow>
      );
    };

    const rows = [];

    for (
      let itemIndex = (this.state.pageIndex * this.state.itemsPerPage) % this.state.itemsPerPage;
      itemIndex <
        ((this.state.pageIndex * this.state.itemsPerPage) % this.state.itemsPerPage) +
          this.state.itemsPerPage && this.state.agents[itemIndex];
      itemIndex++
    ) {
      const item = this.state.agents[itemIndex];
      rows.push(renderRow(item));
    }

    return rows;
  }

  renderFooterCells() {
    const footers = [];

    const items = this.state.agents;
    const pagination = {
      pageIndex: this.state.pageIndex,
      pageSize: this.state.itemsPerPage,
      totalItemCount: this.state.totalItems,
      pageSizeOptions: [10, 25, 50, 100]
    };

    this.columns.forEach(column => {
      const footer = this.getColumnFooter(column, { items, pagination });
      if (column.mobileOptions && column.mobileOptions.only) {
        return; // exclude columns that only exist for mobile headers
      }

      if (footer) {
        footers.push(
          <EuiTableFooterCell key={`footer_${column.id}`} align={column.alignment}>
            {footer}
          </EuiTableFooterCell>
        );
      } else {
        footers.push(
          <EuiTableFooterCell key={`footer_empty_${footers.length - 1}`} align={column.alignment}>
            {undefined}
          </EuiTableFooterCell>
        );
      }
    });
    return footers;
  }

  getColumnFooter = (column, { items, pagination }) => {
    if (column.footer === null) {
      return null;
    }
    if (column.footer) {
      return column.footer;
    }

    return undefined;
  };

  async onQueryChange(result) {
    this._isMounted &&
      this.setState({ isLoading: true, ...result }, async () => {
        await this.getItems();
      });
  }

  getSelectedItems(){
    return Object.keys(this.state.itemIdToSelectedMap).filter(x => {
      return (this.state.itemIdToSelectedMap[x] === true)
    })
  }

  unselectAgents(){
    this._isMounted && this.setState({itemIdToSelectedMap: {}});
    store.dispatch(updateCurrentAgentData({}));
    this.props.removeAgentsFilter();
  }

  getSelectedCount(){
    return this.getSelectedItems().length;
  }

  async selectAgentAndApply(agentID){
    try{
      const data = await WzRequest.apiReq('GET', '/agents', { params: { q: 'id=' + agentID}});
      const formattedData = data.data.data.affected_items[0] //TODO: do it correctly
      store.dispatch(updateCurrentAgentData(formattedData));
      this.props.updateAgentSearch([agentID]);
    } catch(error) {
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

  showContextMenu(id){
    this._isMounted && this.setState({contextMenuId: id})
  }

  addIconPlatformRender(os) {
    if(typeof os === "string" ){ return os};
    let icon = false;

    if (((os || {}).uname || '').includes('Linux')) {
      icon = 'linux';
    } else if ((os || {}).platform === 'windows') {
      icon = 'windows';
    } else if ((os || {}).platform === 'darwin') {
      icon = 'apple';
    }
    const os_name =
      checkField((os || {}).name) +
      ' ' +
      checkField((os || {}).version);
    return (
      <span className="euiTableCellContent__text euiTableCellContent--truncateText">
        <i
          className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${icon}`}
          aria-hidden="true"
        ></i>{' '}
        {os_name === '--' ? '-' : os_name}
      </span>
    );
  }

  filterGroupBadge = (group) => {
    const { filters } = this.state;
    let auxFilters = filters.map( filter => filter.value.match(/group=(.*S?)/)[1] );
    if (filters.length > 0) {
      !auxFilters.includes(group) ?
      this.setState({
        filters: [...filters, {field: "q", value: `group=${group}`}],
      }) : false;
    } else {
      this.setState({
        filters: [...filters, {field: "q", value: `group=${group}`}],
      })
    }
  }

  renderGroups(groups){
    return Array.isArray(groups) ? (
      <GroupTruncate
        groups={groups}
        length={20}
        label={'more'}
        action={'filter'}
        filterAction={this.filterGroupBadge}
        {...this.props} />
    ) : groups
  }

  render() {
    const pagination = {
      pageIndex: this.state.pageIndex,
      pageSize: this.state.itemsPerPage,
      totalItemCount: this.state.totalItems,
      pageCount:
        this.state.totalItems % this.state.itemsPerPage === 0
          ? this.state.totalItems / this.state.itemsPerPage
          : parseInt(this.state.totalItems / this.state.itemsPerPage) + 1,
    };
    const selectedAgent = store.getState().appStateReducers.currentAgentData;

    return (
      <div>
        <EuiFlexGroup gutterSize="m">
          <EuiFlexItem>
            <WzSearchBar
              filters={this.state.filters}
              suggestions={this.suggestions}
              onFiltersChange={filters => this.setState({filters, pageIndex: 0})}
              placeholder="Filter or search agent"
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        {selectedAgent && Object.keys(selectedAgent).length > 0 && (
          <Fragment>
            <EuiFlexGroup responsive={false} justifyContent="flexEnd">
              {/* agent name (agent id) Unpin button right aligned, require justifyContent="flexEnd" in the EuiFlexGroup */}
              <EuiFlexItem grow={false} style={{marginRight: 0}}>
                <AgentStatus status={selectedAgent.status} style={{ whiteSpace: 'no-wrap' }}>
                  {selectedAgent.name} ({selectedAgent.id})
                </AgentStatus>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{marginTop: 10, marginLeft: 4}}>
                <EuiToolTip position='top' content='Unpin agent'>
                  <EuiButtonIcon
                    color='danger'
                    onClick={() => this.unselectAgents()}
                    iconType="pinFilled"
                    aria-label="unpin agent"
                  />
                </EuiToolTip>
              </EuiFlexItem>
            </EuiFlexGroup>
            <EuiSpacer size="m" />
          </Fragment>
        )}

        <EuiTableHeaderMobile>
          <EuiFlexGroup responsive={false} justifyContent="spaceBetween" alignItems="baseline">
            <EuiFlexItem grow={false}></EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiTableSortMobile items={this.getTableMobileSortItems()} />
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiTableHeaderMobile>

        <EuiTable>
          <EuiTableHeader>{this.renderHeaderCells()}</EuiTableHeader>
          {(this.state.agents.length && (
            <EuiTableBody className={this.state.isLoading ? 'agent-selection-table-loading' : ''}>
              {this.renderRows()}
            </EuiTableBody>
          )) || (
            <EuiTableBody className={this.state.isLoading ? 'agent-selection-table-loading' : ''}>
              <EuiTableRow key={0}>
                <EuiTableRowCell colSpan="10" isMobileFullWidth={true} align="center">
                  {this.state.isLoading ? 'Loading agents' : 'No results found'}
                </EuiTableRowCell>
              </EuiTableRow>
            </EuiTableBody>
          )}
        </EuiTable>

        <EuiSpacer size="m" />

        <EuiTablePagination
          activePage={pagination.pageIndex}
          itemsPerPage={pagination.pageSize}
          itemsPerPageOptions={pagination.pageSizeOptions}
          pageCount={pagination.pageCount}
          onChangeItemsPerPage={this.onChangeItemsPerPage}
          onChangePage={this.onChangePage}
        />
      </div>
    );
  }
}
