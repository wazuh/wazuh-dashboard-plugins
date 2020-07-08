/*
 * Wazuh app - React component building the welcome screen of an agent.
 * version, OS, registration date, last keep alive.
 *
 * Copyright (C) 2015-2020 Wazuh, Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 2 of the License, or
 * (at your option) any later version.
 *  
 * Find more information about this on the LICENSE file.
 */

import React, { useRef, useEffect, useState } from 'react'
import { EuiIcon, EuiFlexGroup, EuiFlexItem, EuiBadge, EuiButtonEmpty, EuiToolTip, EuiScreenReaderOnly, EuiProgress, EuiCodeEditor, EuiButtonIcon } from '@elastic/eui';
import * as senseEditor from '../../../../../../src/plugins/console/public/application/models/sense_editor/';
import { AppState } from '../../../react-services/app-state'
import { WzRequest } from '../../../react-services/wz-request';
import $ from 'jquery';
import queryString from 'querystring-browser';
import { apiRequestList } from './api-requests-list';
import 'brace/theme/textmate';
import { DevToolsHistory } from './devToolsHistory';




export function DevTools({ initialTextValue }) {
  const editorRef = useRef(null);
  const editorInstanceRef = useRef(null);
  const wazuhDevTools = useRef(null);
  const [tabsState, setTabs] = useState([""])
  const [statusBadges, setStatusBadges] = useState([false])
  const [loading, setLoading] = useState(false)
  const inputId = 'ConAppInputTextarea';
  const [textArea, setTextArea] = useState<HTMLTextAreaElement | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);
  const [isPanelVisible, setisPanelVisible] = useState(false);
  const showHistory = () => setisPanelVisible(isPopoverOpen => !isPopoverOpen);
  const closeHistory = () => setisPanelVisible(false);

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
  const inputEditorOptions = {
    fontSize: '14px'
  };

  const handleResize = () => {
    $('#wz-dev-left-column').css('width', '30%');
    $('#wz-dev-right-column').css('width', '70%');
    const gutter = $('#wz-dev-right-column .ace_gutter');
    const gutterWidth = gutter.width();
    const gutterOffset = gutter.offset();
    $('#wz-tabs-margin').css('marginRight', gutterWidth + gutterOffset.left - 67); //67 is the width of the History button
  };

  useEffect(() => {
    editorInstanceRef.current = senseEditor.create(editorRef.current!);
    wazuhDevTools.current = { tabs: tabsState, selectedTab, statusBadges };
    const editor = editorInstanceRef.current;
    editor.coreEditor.editor.commands.addCommand({
      name: "sendRequest",
      bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
      exec: async (editor) => {
        await doRequest()
      }
    })
    editor.coreEditor.editor.setOptions(inputEditorOptions)
    const customAutocomplete = async (do_not_use_editor, do_not_use_session, position, prefix, callback) => {
      const lineValue = editor.coreEditor.getLineValue(position.row + 1);
      const splitArray = lineValue.split(' ');
      const firstWord = splitArray.filter(function (el) { return el.length != 0 })[0];
      const start = splitArray.indexOf(firstWord);
      const methodRange = { start: start, end: start + firstWord.length };

      let type = 'method';
      let method = '';

      let rowMode = editor.parser.getRowParseMode();
      if (rowMode & editor.parser.MODE.IN_REQUEST) {
        type = 'params';
      }

      if (rowMode & editor.parser.MODE.REQUEST_START) {
        const lineArray = lineValue.split(' ').filter(function (el) { return el.length != 0 });
        if (lineArray.length < 2 || (position.column >= methodRange.start && position.column <= methodRange.end)) {
          type = 'method';
        } else if (lineArray.length < 3) {
          type = 'url';
          method = lineArray[0].toUpperCase();
        }
      }
      if (type === 'method') {
        callback(null, [{ name: "GET", value: "GET", score: 1, meta: "GET" }, { name: "PUT", value: "PUT", score: 1, meta: "PUT" }, { name: "POST", value: "POST", score: 1, meta: "POST" }, { name: "DELETE", value: "DELETE", score: 1, meta: "DELETE" }]);
      }
      if (type === 'url') {
        callback(null, apiRequestList[method]);
      }

    }

    const evtDocument = document;
    // resize with column separator
    $('.wz-dev-column-separator').mousedown(function (e) {
      e.preventDefault();
      $('.wz-dev-column-separator').addClass('active');
      const leftOrigWidth = $('#wz-dev-left-column').width();
      const rightOrigWidth = $('#wz-dev-right-column').width();
      const gutter = $('#wz-dev-right-column .ace_gutter');
      $(evtDocument).mousemove(function (e) {
        const leftWidth = e.pageX;
        let rightWidth = leftOrigWidth - leftWidth;
        const gutterWidth = gutter.width();
        const gutterOffset = gutter.offset();
        $('#wz-dev-left-column').css('width', leftWidth);
        $('#wz-tabs-margin').css('marginRight', gutterWidth + gutterOffset.left - 67); //67 is the width of the History button
        $('#wz-dev-right-column').css('width', rightOrigWidth + rightWidth);
      });
    });

    $(evtDocument).mouseup(function () {
      $('.wz-dev-column-separator').removeClass('active');
      $(evtDocument).unbind('mousemove');
    });

    // on window resize
    window.addEventListener('resize', handleResize);

    editorInstanceRef.current.coreEditor.editor.completers[0].getCompletions = customAutocomplete;
    const textareaElement = editorRef.current!.querySelector('textarea');

    if (textareaElement) {
      textareaElement.setAttribute('id', inputId);
    }
    editor.update(initialTextValue || "# ");

    function setupAutosave() {
      let timer: number;
      const saveDelay = 500;

      editor.getCoreEditor().on('change', () => {
        if (timer) {
          clearTimeout(timer);
        }
        timer = window.setTimeout(saveCurrentState, saveDelay);
      });
    }

    function saveCurrentState() {
      try {
        const content = editor.getCoreEditor().getValue();
        AppState.setCurrentDevTools(content);
      } catch (e) { }
    }

    setTextArea(editorRef.current!.querySelector('textarea'));
    setupAutosave();
    return () => window.removeEventListener('resize', handleResize);
  }, [initialTextValue, history]);

  useEffect(() => {
    wazuhDevTools.current = { tabs: tabsState, selectedTab, statusBadges };
  }, [tabsState, selectedTab, statusBadges])

  const abs = {
    height: 'calc(100vh - 170px)',
    width: 'auto',
    position: 'relative',
    margin: 0
  };

  const addNewTab = () => {
    const tabsLength = wazuhDevTools.current.tabs.length;
    if (tabsLength < 5) {
      const newTabs = [...wazuhDevTools.current.tabs];
      newTabs[tabsLength] = '';
      setTabs(newTabs);
      const newBadges = [...wazuhDevTools.current.statusBadges];
      newBadges[tabsLength] = false;
      setStatusBadges(newBadges);
      setSelectedTab(newTabs.length - 1)
    }
  };

  const closeTab = (tabId) => {
    const newTabs = [...wazuhDevTools.current.tabs];
    newTabs.splice(tabId, 1);
    setTabs(newTabs);
    const newBadges = [...wazuhDevTools.current.statusBadges];
    newBadges.splice(tabId, 1);
    setStatusBadges(newBadges);
    if (tabId <= selectedTab) {
      setSelectedTab(tabId - 1 < 0 ? 0 : tabId - 1);
    }
  }

  const showTabs = () => {
    const tabsList = (tabsState || []).map((item, idx) => {
      return (
        <EuiFlexItem grow={false} >
          <EuiButtonEmpty
            color="text"
            className="wz-devtools-tab"
            style={{ backgroundColor: selectedTab === idx ? '#f5f7fa' : '', borderTop: selectedTab === idx ? '1px solid rgba(128, 128, 128, 0.11)' : '', borderLeft: selectedTab === idx ? '1px solid rgba(128, 128, 128, 0.11)' : '', borderRight: selectedTab === idx ? '1px solid rgba(128, 128, 128, 0.11)' : '' }}
            onClick={() => setSelectedTab(idx)}>
            Tab {idx + 1} &nbsp;
            {(tabsState || []).length > 1 && <EuiButtonIcon
              style={{ margin: 0, padding: 0 }}
              onClick={(ev) => { ev.stopPropagation(); closeTab(idx) }}
              color="text"
              iconType="cross"
              aria-label="close tab"
            />}
          </EuiButtonEmpty>
        </EuiFlexItem>)
    });

    return tabsList;
  }

  const addHistory = (req) => {
    var d = new Date();
    var time = d.getTime();
    const newReq = { "time": time, "endpoint": req.url.toLowerCase(), "method": req.method, "data": req.data }
    window.localStorage.setItem(`wazuh:history.elem_${time}`, JSON.stringify(newReq));
  }

  const getBadge = () => {
    const color = statusBadges[selectedTab].statusCode === 200 ? 'secondary' : 'warning';
    return <EuiBadge color={color}>{`${statusBadges[selectedTab].statusCode} - ${statusBadges[selectedTab].statusText}`}</EuiBadge>

  }

  const doRequest = async () => {
    setLoading(true);
    let result = '';
    let badgeStatus = {};
    const requests = await editorInstanceRef.current.getRequestsInRange();
    for (const currentReq of requests) {
      let formattedResponse = "";
      try {
        const splitReq = currentReq.url.split('?');
        let url = splitReq[0];
        const params = splitReq[1]
          ? queryString.parse(splitReq[1])
          : {};
        if (url[0] !== '/') {
          url = '/' + url;
        }
        const bodyParams = currentReq.data.length ? JSON.parse(currentReq.data[0]) : {};
        const response = await WzRequest.fullResponseApiReq(currentReq.method, url, { ...params, ...bodyParams }, true);
        formattedResponse = ((response || {}).data || {});
        addHistory(currentReq);
      } catch (err) {
        badgeStatus["statusCode"] = err.status || 500;
        badgeStatus["statusText"] = err.statusText || 'Internal server error';

        formattedResponse = ((err.data || {}).message) || 'Server did not respond';

        if (formattedResponse.includes('3029')) {
          formattedResponse = 'This method is not allowed without admin mode';
        }

        const newTabs = [...wazuhDevTools.current.tabs];
        newTabs[wazuhDevTools.current.selectedTab] = `#${currentReq.method} ${currentReq.url}\n${JSON.stringify(formattedResponse, null, 1)} \n\n`;
        setTabs(newTabs);
        const newBadges = [...wazuhDevTools.current.statusBadges];
        newBadges[wazuhDevTools.current.selectedTab] = badgeStatus;
        setStatusBadges(newBadges);
        setLoading(false);
        return;
      }
      if (requests.length > 1) {
        result += `#${currentReq.method} ${currentReq.url}\n${JSON.stringify(formattedResponse, null, 1)} \n\n\n`
      } else {
        result += JSON.stringify(formattedResponse, null, 1)
      }
    };
    const newTabs = [...wazuhDevTools.current.tabs];
    newTabs[wazuhDevTools.current.selectedTab] = result;
    setTabs(newTabs);
    const newBadges = [...wazuhDevTools.current.statusBadges];
    newBadges[wazuhDevTools.current.selectedTab] = { statusCode: 200, statusText: 'OK' };
    setStatusBadges(newBadges);
    setLoading(false);
  }

  const addRequest = async (req) => {
    const position = editorInstanceRef.current.coreEditor.getCurrentPosition();
    const nextReqEnd = editorInstanceRef.current.nextRequestEnd(position);
    editorInstanceRef.current.coreEditor.insert(nextReqEnd, `\n\n${req.method} ${req.endpoint}\n${req.data}`)
  }

  const renderRightColumn = () => {
    return (
      <div id="wz-dev-right-column" style={{ width: "70%", marginTop: 2, height: '100%' }}>
        <EuiCodeEditor
          theme="textmate"
          width="100%"
          height="100%"
          value={(tabsState || [""])[selectedTab]}
          mode="json"
          isReadOnly={true}
          wrapEnabled
          setOptions={codeEditorOptions}
          aria-label="Code Editor"
        />
      </div>)
  }

  const renderLeftColumn = () => {
    return (
      <div id="wz-dev-left-column" style={{ width: "30%", marginTop: 2 }} className="conApp__editor">
        <ul className="conApp__autoComplete" id="autocomplete" />
        <EuiFlexGroup
          className="conApp__editorActions"
          id="ConAppEditorActions"
          gutterSize="none"
          responsive={false}
        >
          <EuiFlexItem>
            <EuiToolTip
              content={'Click to send request'}
            >
              <button
                onClick={async () => await doRequest()}
                data-test-subj="sendRequestButton"
                aria-label={"test"}
                className="conApp__editorActionButton conApp__editorActionButton--success"
              >
                <EuiIcon type="play" />
              </button>
            </EuiToolTip>
          </EuiFlexItem>
        </EuiFlexGroup>

        <EuiScreenReaderOnly>
          <label htmlFor={inputId}>
            Dev Tools console
      </label>
        </EuiScreenReaderOnly>
        <div
          ref={editorRef}
          id="ConAppEditor"
          className="conApp__editorContent"
          data-test-subj="request-editor"
        />
      </div>)
  }

  const renderActionsBar = () => {
    return (
      <EuiFlexGroup gutterSize="none" responsive={false}>
        <EuiFlexItem id="wz-tabs-margin" style={{ marginRight: 'calc(30vw - 12px)' }} grow={false}>
          <EuiButtonEmpty
            color="text"
            onClick={showHistory}
          >
            History
            </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem className="wz-devtools-tabs" >
          <EuiFlexGroup gutterSize="none" responsive={false}>
            {!isPanelVisible &&
              <EuiFlexItem grow={false} style={{ maxWidth: "70%", overflow: 'auto' }} ><EuiFlexGroup gutterSize="none" responsive={false}>{showTabs()}</EuiFlexGroup></EuiFlexItem>}
            {!isPanelVisible && tabsState.length < 5 && <EuiFlexItem grow={false}>
              <EuiButtonEmpty
                onClick={(ev) => { ev.stopPropagation(); addNewTab() }}
                color="text"
                iconType="plusInCircle"
                aria-label="open new tab"
              />
            </EuiFlexItem>
            }
          </EuiFlexGroup>
        </EuiFlexItem>
        <EuiFlexItem grow={false} style={{ alignSelf: 'center', marginRight: 12 }}>
          {statusBadges[selectedTab] && getBadge()}
        </EuiFlexItem>
      </EuiFlexGroup>)
  }

  return (
    <div>
      {renderActionsBar()}
      {isPanelVisible &&
        <EuiFlexGroup>
          <EuiFlexItem>
            <DevToolsHistory localStorage={window.localStorage} closeHistory={closeHistory} addRequest={addRequest} />
          </EuiFlexItem>
        </EuiFlexGroup>}
      <div style={abs} className="conApp">
        {loading && <EuiProgress size="xs" color="accent" position="absolute" />}
        {renderLeftColumn()}
        <div className="wz-dev-column-separator layout-column" style={{ marginTop: 2 }}><span style={{ paddingTop: 'calc(50vh - 80px)' }}>︙</span></div>
        {renderRightColumn()}
      </div>
    </div>
  );
}