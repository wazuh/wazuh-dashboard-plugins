import React from 'react';
import { EuiPageBody, EuiFlexGroup, EuiFlexItem, EuiBasicTable, EuiPanel, EuiTitle, Random } from '@elastic/eui';
import WzReduxProvider from '../../../../redux/wz-redux-provider';


export const ModuleBody = ({ visualizations = [], ...props }) => {

    return <>
        <WzReduxProvider>
            {visualizations?.map((row, key) => {
                return <EuiFlexGroup key={key} style={{
                    height: row.height || 150 + 'px'
                  }}>{
                    row.columns.map((column, key) => {
                        return <EuiFlexItem key={key}>
                            {column.component}
                        </EuiFlexItem>
                    })
                }</EuiFlexGroup>
            })
            }
        </WzReduxProvider>
    </>
}