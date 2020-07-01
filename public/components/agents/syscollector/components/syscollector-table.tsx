import React, { useState } from "react";
import {EuiPanel, EuiFlexGroup, EuiButtonEmpty, EuiFlexItem, EuiText, EuiLoadingSpinner,EuiFieldSearch,EuiHorizontalRule, EuiIcon, EuiBasicTable} from "@elastic/eui";
import {useApiRequest} from '../../../common/hooks/useApiRequest';
import { KeyEquivalence } from '../../../../../util/csv-key-equivalence';
import { AppState } from '../../../../react-services/app-state';


export function SyscollectorTable({tableParams}) {
    const [params, setParams] = useState({limit: 500, offset: 0, sort: '+', search: ""});
    const [pageIndex, setPageIndex] = useState(0);
    const [searchBarValue, setSearchBarValue] = useState("");
    const [pageSize, setPageSize] = useState(10);
    const [sortField, setSortField] = useState('');
    const [timerDelaySearch, setTimerDelaySearch] = useState(false);
    const [sortDirection, setSortDirection] = useState('');
    const syscollector = useApiRequest('GET', tableParams.path, params, (result) => {return ((result || {}).data || {}).data || {};});

    const onTableChange = ({ page = {}, sort = {} }) => {
        const { index: pageIndex, size: pageSize } = page;
        const { field: sortField, direction: sortDirection } = sort;
        
        setPageIndex(pageIndex);
        setPageSize(pageSize);
        setSortField(sortField);
        setSortDirection(sortDirection);
        const newParams = params;
        newParams.offset =  Math.floor((pageIndex * pageSize) / params.limit) * params.limit;
        const field = (sortField === 'os_name') ? '' : sortField;
        const direction = (sortDirection === 'asc') ? '+' : '-';
        newParams.sort = direction+field;
        setParams(newParams);
        
    };

    const buildColumns = () => {
        const columns = tableParams.columns.map(item => {
            return {
                field: item.id,
                name: KeyEquivalence[item.id] || item.id,
                sortable: typeof item.sortable !== 'undefined' ? item.sortable : true,
                width: item.width || undefined,
            }
        });
        return columns;
    }
    
    const columns = buildColumns();
   
    const pagination = {
      pageIndex: pageIndex,
      pageSize: pageSize,
      totalItemCount: syscollector.data.totalItems || 0,
      pageSizeOptions: [10, 25, 50],
    };
    
    const sorting = {
        sort: {
            field: sortField,
            direction: sortDirection,
        }
    };

    const itemsOfPage = () => {
        const result = [];
        const start = (pageIndex*pageSize) %500;
        const end = start + pageSize;
        for(var i=start; i<end && ((pageIndex*pageSize)) < pagination.totalItemCount; i++ ){
            if(syscollector.data.items[i])
                result.push(syscollector.data.items[i]);
        }
        return result;
    }

    const onChange = (e) => {
        const value = e.target.value;
        if(timerDelaySearch)
            setTimerDelaySearch(clearTimeout(timerDelaySearch));
        
        setSearchBarValue(value);

        setTimerDelaySearch( setTimeout(() => {
            const newParams = {...params, search:value};
            setParams(newParams);
            setPageIndex(0);
        }, 400));
    }


    return (
        <EuiPanel paddingSize="m" style={{margin: '12px 16px 12px 16px'}}>
            <EuiFlexGroup>
                <EuiFlexItem grow={false}>
                    <span style={{display: "flex"}}> <EuiIcon type={tableParams.icon} style={{marginTop: 3}}></EuiIcon>  &nbsp; <EuiText>{tableParams.title}</EuiText> </span>
                </EuiFlexItem>
            </EuiFlexGroup>
            <EuiHorizontalRule margin="xs" />
                {tableParams.searchBar && 
                    <EuiFlexGroup>
                        <EuiFlexItem>
                            <EuiFieldSearch
                                placeholder={`Filter ${tableParams.title.toLowerCase()}...`}
                                value={searchBarValue}
                                fullWidth={true}
                                onChange={onChange}
                                aria-label={`Filter ${tableParams.title.toLowerCase()}...`}
                            />
                        </EuiFlexItem>
                    </EuiFlexGroup>
                }
                <EuiFlexGroup>
                    <EuiFlexItem>
                        <EuiBasicTable
                            items={itemsOfPage()}
                            columns={columns}
                            pagination={pagination}
                            loading={syscollector.isLoading}
                            sorting={sorting}
                            onChange={onTableChange}
                        />
                    </EuiFlexItem>
                </EuiFlexGroup>
                {tableParams.exportFormatted &&
                    <EuiFlexGroup >
                        <EuiFlexItem grow={true} > </EuiFlexItem>
                        <EuiFlexItem grow={false} >
                            <EuiButtonEmpty
                                onClick={async() => await AppState.downloadCsv(tableParams.path, tableParams.exportFormatted, params.search ? [{ name: 'search', value: params.search }]: [])}
                                iconType="importAction">
                                Download CSV
                            </EuiButtonEmpty>
                        </EuiFlexItem>
                    </EuiFlexGroup>
                }

        </EuiPanel>
        );    
}
