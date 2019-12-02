/*
 * Wazuh app - React component for alerts stats.
 *
 * Copyright (C) 2015-2019 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { EuiPanel,
  EuiBasicTable,
  EuiFlexItem, 
  EuiFlexGroup, 
  EuiButtonEmpty, 
  EuiTitle,
  EuiTextColor,
  EuiFieldSearch, 
  EuiToolTip, 
  EuiButtonIcon, 
  EuiFlyout,
  EuiFlyoutHeader,
  EuiFlyoutBody,
  EuiLoadingContent,
  EuiLink,
  EuiSpacer,
  EuiDescriptionList,
} from '@elastic/eui';


 export class SyscheckTable extends Component {
  constructor(props) {
    super(props);

     this.state = {
      monitoredFiles: [],
      searchValue: '',
      pageIndex: 0,
      pageSize: 15,
      sortField: 'file',
      sortDirection: 'asc',
      isProcessing: true,
      totalItems: 0,
      q: '',
      search: '',
    };

  }




   async componentDidMount() {
     console.log("jaja")
    await this.getItems();
  }

  async componentDidUpdate() {
    if (this.state.isProcessing) {
      await this.getItems();
    }
  }

   formatFile(file) {
     return { // TODO 
      "file": file.file,
      "size": file.size,
      "gname": file.gname,
      "uname": file.uname,
      "perm": file.perm,
      "uid": file.uid,
      "gid": file.gid,
      "mtime": file.mtime,
    }
  }


   async getItems(){
    const files = await this.props.wzReq('GET',`/syscheck/${this.props.agentId}`,this.buildFilter());
    console.log(files)
    const formattedFiles =  (((files || {}).data || {}).data || {}).items.map(this.formatFile);
    this.setState({
      monitoredFiles: formattedFiles,
      totalItems: (((files || {}).data || {}).data || {}).totalItems - 1,
      isProcessing: false,
    });
  }

   buildFilter() {
    const { pageIndex, pageSize, search, q} = this.state;


     const filter = {
      offset: pageIndex * pageSize,
      limit: pageSize,
      sort: this.buildSortFilter(),

    };

     if (q !== ''){
      filter.q = q
    }

     if (search !== '') {
      filter.search = search;
    }

     return filter;
  }



   buildSortFilter() {
    const {sortField, sortDirection} = this.state;

    const field = (sortField === 'os_name') ? '' : sortField;
    const direction = (sortDirection === 'asc') ? '+' : '-';

    return direction+field;
  }

   columns() {
    return [
      {
        field: 'file',
        name: 'File',
        sortable: true,
      },
      {
        field: 'size',
        name: 'Size',
        sortable: true,
      },
      {
        field: 'gname',
        name: 'Group',
        sortable: true,
      },
      {
        field: 'uname',
        name: 'User',
        sortable: true,
      },
      {
        field: 'perm',
        name: 'Permissions',
        sortable: true,
      },
      {
        field: 'uid',
        name: 'User ID',
        sortable: true,
      },
      {
        field: 'gid',
        name: 'Group ID',
        sortable: true,
      },
      {
        field: 'mtime',
        name: 'Last modified',
        sortable: true,
      },
    ];
  }


  actionButtonsRender(tactic) {
    return (
      <div>
        <EuiToolTip content="View details" position="left">
          <EuiButtonIcon
            onClick={() => this.showFlyout(tactic)}
            iconType="eye"
            aria-label="View details"
          />
        </EuiToolTip>
      </div>
    );
  }


  onTableBarChange = e => {
    this.setState({
      searchValue: e.target.value,
    });
  };

  onTableBarSearch = searchTxt => {
    this.setState({
      search: searchTxt,
    });
  };



   onTableChange = ({ page = {}, sort = {} }) => {
    const { index: pageIndex, size: pageSize } = page;
    const { field: sortField, direction: sortDirection } = sort;
    this.setState({
      pageIndex,
      pageSize,
      sortField,
      sortDirection,
      isProcessing: true,
    });
  };


    /**
     * The "Export Formatted" button have been removed as long as the API can only returns 10 results.
     */
   formattedButton() { 
    return (
      <div>
        {/*
          <EuiFlexItem grow={false}>
            <EuiButtonEmpty iconType="importAction" onClick={this.downloadCsv}>
              Export formatted          
            </EuiButtonEmpty>
          </EuiFlexItem>
        */}
      </div>
    );
  }

   title() {
    const formattedButton = this.formattedButton()
    return (
      <div>
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiFlexGroup>
            <EuiFlexItem>
              <EuiTitle>
                <h2>Monitored files</h2>
              </EuiTitle>
            </EuiFlexItem>
          </EuiFlexGroup>
           <EuiSpacer size="m"/>
          <EuiFlexGroup>
            <EuiFlexItem style={{ paddingBottom: 10 }}>
              <EuiTextColor color="subdued">
                <p>
                 TODO - table description
                </p>
              </EuiTextColor>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
        {formattedButton}
      </EuiFlexGroup>
      { /*
      * Searchbar is disabled until our API adds the `search` filter to the `/mitre` call
      <EuiSpacer size="m"/>
      <EuiFlexGroup style={{ marginLeft: 2 }}>
        <EuiFieldSearch
                  fullWidth={true}
                  placeholder="Filter MITRE attacks"
                  value={this.state.searchValue}
                  onChange={this.onTableBarChange}
                  onSearch={this.onTableBarSearch}
                  aria-label="Filter MITRE attacks"
                />
        </EuiFlexGroup>
        */}
      </div>
    );
  }

   table(){
    const {pageIndex, pageSize, totalItems, sortField, sortDirection} = this.state
    const monitoredFiles = this.state.monitoredFiles
    const columns = this.columns()
    const pagination = {
      pageIndex: pageIndex,
      pageSize: pageSize,
      totalItemCount: totalItems,
      hidePerPageOptions: true,
    }
    const sorting = {
      sort: {
        field: sortField,
        direction: sortDirection,
      },
    };


     return (
      <EuiFlexGroup>
        <EuiFlexItem>
          <EuiBasicTable
              items={monitoredFiles}
              columns={columns}
              pagination={pagination}
              onChange={this.onTableChange}
              sorting={sorting}
            />
        </EuiFlexItem>
      </EuiFlexGroup>
    );
  }

   filterBar() {
     return (
      <EuiFlexGroup>
        <EuiFlexItem>

         </EuiFlexItem>
      </EuiFlexGroup>
    );
  }





   render() {    

    const title = this.title();
    const filter = this.filterBar();
    const table = this.table();

     return (
       <div>
        <EuiPanel paddingSize="l">
          {title}
          {filter}
          {table}
        </EuiPanel>

      </div>
    );
  }
}

SyscheckTable.propTypes = {
  wzReq: PropTypes.func,
  agentId: PropTypes.string
};