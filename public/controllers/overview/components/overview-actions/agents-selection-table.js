import React, { Component, Fragment } from 'react';

import {
  EuiBadge,
  EuiHealth,
  EuiButton,
  EuiCheckbox,
  EuiFieldSearch,
  EuiFlexGroup,
  EuiFlexItem,
  EuiSpacer,
  EuiTable,
  EuiTableBody,
  EuiTableFooterCell,
  EuiTableHeader,
  EuiTableHeaderCell,
  EuiTableHeaderCellCheckbox,
  EuiTablePagination,
  EuiTableRow,
  EuiTableRowCell,
  EuiTableRowCellCheckbox,
  EuiTableSortMobile,
  EuiKeyPadMenu,
  EuiKeyPadMenuItem,
  EuiTableHeaderMobile,
  EuiButtonIcon,
  EuiIcon,
  EuiPopover,
  EuiText,
  EuiToolTip
} from '@elastic/eui';

import { WzRequest } from '../../../../react-services/wz-request';
import { LEFT_ALIGNMENT, RIGHT_ALIGNMENT, SortableProperties } from '@elastic/eui/lib/services';
import {  updateCurrentAgentData } from '../../../../redux/actions/appStateActions';
import  store  from '../../../../redux/store';
import chrome from 'ui/chrome';


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
      currentSearch: '',
    };
    this.wzReq = (...args) => WzRequest.apiReq(...args);

    this.columns = [
      // {
      //   id: 'checkbox',
      //   isCheckbox: true,
      //   textOnly: false,
      //   width: '32px',
      // },
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
        isSortable: true,
      },
      {
        id: 'group',
        label: 'Group',
        alignment: LEFT_ALIGNMENT,
        mobileOptions: {
          show: false,
        },
        isSortable: true,
      },
      {
        id: 'version',
        label: 'Version',
        alignment: LEFT_ALIGNMENT,
        mobileOptions: {
          show: true,
        },
        isSortable: true,
      },
      {
        id: 'os',
        label: 'OS',
        alignment: LEFT_ALIGNMENT,
        mobileOptions: {
          show: false,
        },
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
        render: status => this.addHealthStatusRender(status),
      },
    ];

    this.items = [];
  }

  onChangeItemsPerPage = async itemsPerPage => {
    this.setState({ itemsPerPage }, async () => await this.getItems());
  };

  onChangePage = async pageIndex => {
    this.setState({ pageIndex }, async () => await this.getItems());
  };

  async componentDidMount() {
    const $injector = await chrome.dangerouslyGetActiveInjector();
    this.router = $injector.get('$route');
    const tmpSelectedAgents = {};
    if(!store.getState().appStateReducers.currentAgentData.id){
      tmpSelectedAgents[store.getState().appStateReducers.currentAgentData.id] = true;
    }
    this.setState({itemIdToSelectedMap: this.props.selectedAgents});
    await this.getItems();
  }

  getArrayFormatted(arrayText) {
    try {
      const stringText = arrayText.toString();
      const splitString = stringText.split(',');
      const resultString = splitString.join(', ');
      return resultString;
    } catch (err) {
      return arrayText;
    }
  }

  async getItems() {
    try{
      this.setState({isLoading: true});
      const rawData = await this.wzReq('GET', '/agents', this.buildFilter());
      const data = (((rawData || {}).data || {}).data || {}).items;
  
      const totalItems = (((rawData || {}).data || {}).data || {}).totalItems;
      const formattedData = data.map((item, id) => {
        return {
          id: item.id,
          name: item.name,
          version: item.version || '-',
          os: (item.os || {}).name || '-',
          status: item.status,
          group: this.getArrayFormatted(item.group) || '-',
        };
      });
      this.items = formattedData;
  
      this.setState({ totalItems, isLoading: false });
    }catch(err){
      this.setState({ isLoading: false });
    }
  }

  agentStatusColor(status){
    if (status.toLowerCase() === 'active') {
      return 'success';
    } else if (status.toLowerCase() === 'disconnected') {
      return 'danger';
    } else if (status.toLowerCase() === 'never connected') {
      return 'subdued';
    }
  }

  agentStatusBadgeColor(status){
    if (status.toLowerCase() === 'active') {
      return 'secondary';
    } else if (status.toLowerCase() === 'disconnected') {
      return 'danger';
    } else if (status.toLowerCase() === 'never connected') {
      return 'default';
    }
  }

  addHealthStatusRender(status) {
    return (
      <EuiHealth color={this.agentStatusColor(status)} style={{ whiteSpace: 'no-wrap' }}>
        {status}
      </EuiHealth>
    );
  }

  buildFilter() {
    const { itemsPerPage, pageIndex } = this.state;
    const filter = {
      q: "id!=000",
      offset: pageIndex * itemsPerPage,
      limit: pageIndex * itemsPerPage + itemsPerPage,
      ...this.buildSortFilter(),
    };
    if (this.state.currentSearch) {
      filter['search'] = this.state.currentSearch;
    }

    return filter;
  }

  buildSortFilter() {
    const { sortDirection, sortField } = this.state;
    const sortFilter = {};
    if (sortField) {
      const direction = sortDirection === 'asc' ? '+' : '-';
      sortFilter['sort'] = direction + sortField;
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

    this.setState({ sortField, sortDirection }, async () => await this.getItems());
  };

  toggleItem = itemId => {
    this.setState(previousState => {
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
    this.items.forEach(item => (newItemIdToSelectedMap[item.id] = !allSelected));

    this.setState({
      itemIdToSelectedMap: newItemIdToSelectedMap,
    });
  };

  isItemSelected = itemId => {
    return this.state.itemIdToSelectedMap[itemId];
  };

  areAllItemsSelected = () => {
    const indexOfUnselectedItem = this.items.findIndex(item => !this.isItemSelected(item.id));
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
    this.setState(previousState => {
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
      this.setState(previousState => {
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
    if (!this.state.isLoading && this.items.length) {
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
          if (column.id === 'status') {
            child = column.render(item.status);
          }
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
          this.state.itemsPerPage && this.items[itemIndex];
      itemIndex++
    ) {
      const item = this.items[itemIndex];
      rows.push(renderRow(item));
    }

    return rows;
  }

  renderFooterCells() {
    const footers = [];

    const items = this.items;
    const pagination = {
      pageIndex: this.state.pageIndex,
      pageSize: this.state.itemsPerPage,
      totalItemCount: this.state.totalItems,
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

  onSearchFieldChange = e => {
    this.setState(
      { currentSearch: e.target.value, pageIndex: 0 },
      async () => await this.getItems()
    );
  };

  getSelectedItems(){
    return Object.keys(this.state.itemIdToSelectedMap).filter(x => {
      return (this.state.itemIdToSelectedMap[x] === true)
    })
  }

  unselectAgents(){
    this.setState({itemIdToSelectedMap: {}});
    this.props.removeAgentsFilter(true);      
    store.dispatch(updateCurrentAgentData({}));
  }

  getSelectedCount(){
    return this.getSelectedItems().length;
  }

  async newSearch(){
    if(this.areAnyRowsSelected()){
      const data = await this.wzReq('GET', '/agents', {"q" : "id="+this.getSelectedItems()[0]  } );
      const formattedData = data.data.data.items[0] //TODO: do it correctly
      store.dispatch(updateCurrentAgentData(formattedData));
      this.props.removeAgentsFilter(false);
      this.props.updateAgentSearch(this.getSelectedItems());
    }else{
      this.props.removeAgentsFilter(true);      
      store.dispatch(updateCurrentAgentData({}));
    }
   // this.router.reload();
  }

  async selectAgentAndApply(agentID){
    try{
      const data = await this.wzReq('GET', '/agents', {"q" : "id="+agentID } );
      const formattedData = data.data.data.items[0] //TODO: do it correctly
      store.dispatch(updateCurrentAgentData(formattedData));
      this.props.removeAgentsFilter(false);
      this.props.updateAgentSearch([agentID]);
    }catch(error){
      this.props.removeAgentsFilter(true);      
      store.dispatch(updateCurrentAgentData({}));
    }
  }

  showContextMenu(id){
    this.setState({contextMenuId: id})
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
    // let optionalActionButtons;

    // if (this.items.length) {
    //   optionalActionButtons = (

    //     <EuiFlexGroup gutterSize="m">
    //       <EuiFlexItem grow={false}>
    //         <EuiButton onClick={async() => await this.newSearch()} color="primary">
    //           Apply
    //         </EuiButton>
    //       </EuiFlexItem>
    //     </EuiFlexGroup>
    //   );
    // }
    const selectedAgent = store.getState().appStateReducers.currentAgentData;
    return (
      <div>
        <EuiFlexGroup gutterSize="m">
          <EuiFlexItem>
            <EuiFieldSearch
              value={this.state.currentSearch}
              onChange={this.onSearchFieldChange}
              fullWidth
              placeholder="Search agent..."
            />
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer size="m" />
        {selectedAgent && Object.keys(selectedAgent).length > 0 && (
          <Fragment>
            <EuiFlexGroup responsive={false} justifyContent="flexEnd">
              {/* Unpin button - agent name (agent id) */}
              {/* <EuiFlexItem grow={false} style={{margin: "10px 0 0 10px"}}>
                <EuiToolTip position="top" content={`Unpin ${selectedAgent.name} agent`}>
                  <EuiButtonIcon
                    color='danger'
                    onClick={() => this.unselectAgents()}
                    iconType="pinFilled"
                    aria-label="unpin agent"
                  />
                </EuiToolTip> 
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{marginLeft: 4}}>
                <EuiHealth color={this.agentStatusColor(selectedAgent.status)} style={{ whiteSpace: 'no-wrap' }}>
                  {selectedAgent.name} ({selectedAgent.id})
                </EuiHealth>
              </EuiFlexItem> */}

              {/* agent name (agent id) Unpin button right aligned, require justifyContent="flexEnd" in the EuiFlexGroup */}
              <EuiFlexItem grow={false} style={{marginRight: 0}}>
                <EuiHealth color={this.agentStatusColor(selectedAgent.status)} style={{ whiteSpace: 'no-wrap' }}>
                  {selectedAgent.name} ({selectedAgent.id})
                </EuiHealth>
              </EuiFlexItem>
              <EuiFlexItem grow={false} style={{marginTop: 10, marginLeft: 4}}>
                <EuiToolTip position="top" content={`Unpin ${selectedAgent.name} agent`}>
                  <EuiButtonIcon
                    color='danger'
                    onClick={() => this.unselectAgents()}
                    iconType="pinFilled"
                    aria-label="unpin agent"
                  />
                </EuiToolTip> 
              </EuiFlexItem>

              {/* Badge */}
              {/* <EuiFlexItem grow={false}>
                <EuiBadge
                  color={this.agentStatusBadgeColor(selectedAgent.status)}
                  // title={undefined}
                  iconType="pinFilled"
                  iconSide="right"
                  iconOnClick={() => this.unselectAgents()}
                  iconOnClickAriaLabel={`Unpin ${selectedAgent.name} agent`}
                >{selectedAgent.name} ({selectedAgent.id})</EuiBadge>
              </EuiFlexItem> */}
              
              {/* <EuiFlexItem grow={false}>
                <EuiButton
                  onClick={() => this.unselectAgents()} color="danger"
                  iconType='pinFilled'
                >
                    Unpin {selectedAgent.name}
                </EuiButton>
              </EuiFlexItem> */}
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
          {(this.items.length && (
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
          itemsPerPageOptions={[10]}
          pageCount={pagination.pageCount}
          onChangeItemsPerPage={this.onChangeItemsPerPage}
          onChangePage={this.onChangePage}
        />
      </div>
    );
  }
}