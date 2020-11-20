import React from 'react'
import {ZeekCurrentStatusTable} from './zeek-current-status-table'
import {ZeekStatusDetailsTable} from './zeek-status-details-table'

export const ZeekTable = () => {
    return (
        <div>
            <ZeekCurrentStatusTable></ZeekCurrentStatusTable>
            <br></br>
            <ZeekStatusDetailsTable></ZeekStatusDetailsTable>
        </div>
    )
}
