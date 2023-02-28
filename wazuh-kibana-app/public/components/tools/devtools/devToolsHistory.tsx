/*
 * Wazuh app - DevTools history component
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2022 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *
 * Find more information about this on the LICENSE file.
 */

import React, { useEffect, useState } from 'react';
import moment from 'moment-timezone';
import {
    EuiButtonEmpty,
    EuiIcon,
    EuiPanel,
    EuiButton,
    EuiCodeEditor,
    EuiFlexGroup,
    EuiFlexItem,
    EuiTitle
} from '@elastic/eui';
import 'brace/mode/json';
import 'brace/snippets/json';
import 'brace/ext/language_tools';
import "brace/ext/searchbox";


export function DevToolsHistory({ localStorage, closeHistory, addRequest }) {
    const [selectedRequest, setSelectedRequest] = useState(false);
    const [hoverRequest, setHoverRequest] = useState(false);

    useEffect(() => {
        const initialReq = getHistoryFromLocalStorageOrdered()[0];
        if (initialReq)
            setSelectedRequest(localStorage[initialReq[0]])
    }, [])

    const getHistoryFromLocalStorageOrdered = () => {
        const wazuhHistoryElems = Object.keys(localStorage).filter(x => x.startsWith('wazuh:history.elem_')).flatMap(x => {
            const time = x.split("_")[1];
            return [[x, parseInt(time)]]
        }).sort(function (a, b) { return b[1] - a[1] });
        while(wazuhHistoryElems.length > 150){ // we only maintain the last 150 requests
            const lastEl = wazuhHistoryElems[wazuhHistoryElems.length-1];
            window.localStorage.removeItem(lastEl[0])
            wazuhHistoryElems.pop();
        }
        return wazuhHistoryElems;
    }

    const formatElem = (elem) => {
        const elJson = JSON.parse(elem);
        return `${elJson.endpoint}   (${moment(elJson.time).fromNow()})`
    }

    const tryRequest = (isActive, req) => {
        if(isActive){
            addRequest(JSON.parse(req))
        }
    }

    const showHistoryList = () => {
        const wazuhElements = getHistoryFromLocalStorageOrdered();
        const elements = wazuhElements.map(x => {
            const currentElement = localStorage[x[0]];
            const isActive = currentElement === selectedRequest;
            return <li
                onMouseEnter={() => { setHoverRequest(currentElement) }}
                onMouseLeave={() => { setHoverRequest(false) }}
                onClick={() => { setSelectedRequest(currentElement); tryRequest(isActive, currentElement); }}
                className={ isActive ? "history-list-item history-list-item-active" : 'history-list-item' }>{formatElem(currentElement)} <EuiIcon style={{ float: 'right' }} type="arrowRight" />        </li>
        })

        return wazuhElements.length ? <ul className="history-list">
            {elements}
        </ul> : <></>
    }

    const codeEditorOptions = {
        fontSize: '14px',
        displayIndentGuides: false,
        indentedSoftWrap: false,
        behavioursEnabled: false,
        animatedScroll: true,
        enableBasicAutocompletion: true,
        enableSnippets: true,
        useWorker: false,
        enableLiveAutocompletion: false
    };
    const formatReq = (req) => {
        const reqJson = JSON.parse(req);
        return `${reqJson.method} ${reqJson.endpoint} ${reqJson.data}`
    }


    const showOutputEditor = () => {
        return (
            <EuiCodeEditor
                width="100%"
                height="100%"
                value={hoverRequest ? formatReq(hoverRequest) : selectedRequest ? formatReq(selectedRequest) : "No history available"}
                mode="json"
                isReadOnly={true}
                wrapEnabled
                setOptions={codeEditorOptions}
                aria-label="Code Editor"
            />
        )
    }

    const removeHistory = () => {
        Object.keys(localStorage).filter(x => x.startsWith('wazuh:history.elem_')).forEach(item => {
            window.localStorage.removeItem(item)
        })
        setSelectedRequest(false);
    }

    return (
        <EuiPanel paddingSize="s" style={{ margin: "0px 8px" }}>
            <EuiFlexGroup>
                <EuiFlexItem>
                    <EuiTitle size="s"><h3>History</h3></EuiTitle>
                </EuiFlexItem>
            </EuiFlexGroup>
            <EuiFlexGroup>
                <EuiFlexItem grow={2}>
                    {showHistoryList()}
                </EuiFlexItem>
                <EuiFlexItem grow={2} style={{ height: '25vh' }}>
                    {showOutputEditor()}
                </EuiFlexItem>
            </EuiFlexGroup>

            <EuiFlexGroup>
                <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                        color="danger"
                        onClick={() => removeHistory()}>
                        Clear history
                    </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                        onClick={() => closeHistory()}>
                        Close
                    </EuiButtonEmpty>
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                    <EuiButton disabled={!selectedRequest} fill onClick={() => addRequest(JSON.parse(selectedRequest))}>
                        Apply
                </EuiButton>
                </EuiFlexItem>
            </EuiFlexGroup>

        </EuiPanel>
    );

}
