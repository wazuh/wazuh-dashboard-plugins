// /*
//  * Wazuh app - React component building the welcome screen of an agent.
//  * version, OS, registration date, last keep alive.
//  *
//  * Copyright (C) 2015-2022 Wazuh, Inc.
//  *
//  * This program is free software; you can redistribute it and/or modify
//  * it under the terms of the GNU General Public License as published by
//  * the Free Software Foundation; either version 2 of the License, or
//  * (at your option) any later version.
//  *  
//  * Find more information about this on the LICENSE file.
//  */

// import React, { useRef, useEffect, useState, Fragment } from 'react'
// import { EuiIcon, EuiFlexGroup, EuiFlexItem, EuiBadge, EuiButtonEmpty, EuiToolTip, EuiScreenReaderOnly, EuiProgress, EuiCodeEditor, EuiButtonIcon, EuiSelect, EuiPopover } from '@elastic/eui';
// import * as senseEditor from '../../../../../../src/plugins/console/public/application/models/sense_editor/';
// import { AppState } from '../../../react-services/app-state'
// import { WzRequest } from '../../../react-services/wz-request';
// import $ from 'jquery';
// import queryString from 'querystring-browser';
// import { apiRequestList } from './api-requests-list';
// // import '../../../utils/brace/theme/textmate';
// import { DevToolsHistory } from './devToolsHistory';
// import * as FileSaver from '../../../services/file-saver';
// import { ErrorHandler } from '../../../react-services/error-handler';
// import { getToasts }  from '../../../kibana-services';
// import _ from 'lodash';
// import { webDocumentationLink } from "../../../../common/services/web_documentation";

// export function DevTools({ initialTextValue }) {
//   const editorRef = useRef(null);
//   const editorInstanceRef = useRef(null);
//   const wazuhDevTools = useRef(null);
//   const [tabsState, setTabs] = useState([""])
//   const [statusBadges, setStatusBadges] = useState([false])
//   const [loading, setLoading] = useState(false)
//   const inputId = 'ConAppInputTextarea';
//   const [textArea, setTextArea] = useState<HTMLTextAreaElement | null>(null);
//   const [selectedTab, setSelectedTab] = useState(0);
//   const [isPanelVisible, setisPanelVisible] = useState(false);
//   const showHistory = () => setisPanelVisible(isPopoverOpen => !isPopoverOpen);
//   const closeHistory = () => setisPanelVisible(false);
//   const [popoverOpen, setPopoverOpen] = useState(false)

//   const codeEditorOptions = {
//     fontSize: '14px',
//     displayIndentGuides: false,
//     indentedSoftWrap: false,
//     behavioursEnabled: false,
//     animatedScroll: true,
//     enableBasicAutocompletion: true,
//     enableSnippets: true,
//     useWorker: false,
//     enableLiveAutocompletion: false
//   };
//   const inputEditorOptions = {
//     fontSize: '14px'
//   };

//   const handleResize = () => {
//     $('#wz-dev-left-column').css('width', '30%');
//     $('#wz-dev-right-column').css('width', '70%');
//     const gutter = $('#wz-dev-right-column .ace_gutter');
//     const gutterWidth = gutter.width();
//     const gutterOffset = gutter.offset();
//     $('#wz-tabs-margin').css('marginRight', gutterWidth + gutterOffset.left - 66); //66 is the width of the History button
//   };

//   useEffect(() => {
//     editorInstanceRef.current = senseEditor.create(editorRef.current!);
//     wazuhDevTools.current = { tabs: tabsState, selectedTab, statusBadges };
//     const editor = editorInstanceRef.current;
//     editor.coreEditor.editor.commands.addCommand({
//       name: "sendRequest",
//       bindKey: { win: "Ctrl-Enter", mac: "Command-Enter" },
//       exec: async (editor) => {
//         await doRequest()
//       }
//     })
//     editor.coreEditor.editor.setOptions(inputEditorOptions)
//     const customAutocomplete = async (do_not_use_editor, do_not_use_session, position, prefix, callback) => {
//       const lineValue = editor.coreEditor.getLineValue(position.row + 1);
//       const splitArray = lineValue.split(' ');
//       const firstWord = splitArray.filter(function (el) { return el.length != 0 })[0];
//       const start = splitArray.indexOf(firstWord);
//       const methodRange = { start: start, end: start + firstWord.length };

//       let type = 'method';
//       let method = '';

//       let rowMode = editor.parser.getRowParseMode();
//       if (rowMode & editor.parser.MODE.IN_REQUEST) {
//         type = 'params';
//       }

//       if (rowMode & editor.parser.MODE.REQUEST_START) {
//         const lineArray = lineValue.split(' ').filter(function (el) { return el.length != 0 });
//         if (lineArray.length < 2 || (position.column >= methodRange.start && position.column <= methodRange.end)) {
//           type = 'method';
//         } else if (lineArray.length < 3) {
//           type = 'url';
//           method = lineArray[0].toUpperCase();
//         }
//       }
//       if (type === 'method') {
//         callback(null, [{ name: "GET", value: "GET", score: 1, meta: "GET" }, { name: "PUT", value: "PUT", score: 1, meta: "PUT" }, { name: "POST", value: "POST", score: 1, meta: "POST" }, { name: "DELETE", value: "DELETE", score: 1, meta: "DELETE" }]);
//       }
//       if (type === 'url') {
//         callback(null, apiRequestList[method]);
//       }

//     }

//     const evtDocument = document;
//     // resize with column separator
//     $('.wz-dev-column-separator').mousedown(function (e) {
//       e.preventDefault();
//       $('.wz-dev-column-separator').addClass('active');
//       const leftOrigWidth = $('#wz-dev-left-column').width();
//       const rightOrigWidth = $('#wz-dev-right-column').width();
//       const gutter = $('#wz-dev-right-column .ace_gutter');
//       $(evtDocument).mousemove(function (e) {
//         const leftWidth = e.pageX - 10;
//         let rightWidth = leftOrigWidth - leftWidth + 10;
//         const gutterWidth = gutter.width();
//         const gutterOffset = gutter.offset();
//         $('#wz-dev-left-column').css('width', leftWidth);
//         $('#wz-tabs-margin').css('marginRight', gutterWidth + gutterOffset.left - 66); //66 is the width of the History button
//         $('#wz-dev-right-column').css('width', rightOrigWidth + rightWidth);
//       });
//     });

//     $(evtDocument).mouseup(function () {
//       $('.wz-dev-column-separator').removeClass('active');
//       $(evtDocument).unbind('mousemove');
//     });

//     // on window resize
//     window.addEventListener('resize', handleResize);

//     editorInstanceRef.current.coreEditor.editor.completers[0].getCompletions = customAutocomplete;
//     const textareaElement = editorRef.current!.querySelector('textarea');

//     if (textareaElement) {
//       textareaElement.setAttribute('id', inputId);
//     }
//     editor.update(initialTextValue || `#Example comment

// GET /manager/info

// GET /syscollector/000/packages?search=ssh
// {
//   "limit": 5
// }
// `);

//     function setupAutosave() {
//       let timer: number;
//       const saveDelay = 500;

//       editor.getCoreEditor().on('change', () => {
//         if (timer) {
//           clearTimeout(timer);
//         }
//         timer = window.setTimeout(saveCurrentState, saveDelay);
//       });
//     }

//     function saveCurrentState() {
//       try {
//         const content = editor.getCoreEditor().getValue();
//         AppState.setCurrentDevTools(content);
//       } catch (e) { }
//     }

//     setTextArea(editorRef.current!.querySelector('textarea'));
//     setupAutosave();
//     return () => window.removeEventListener('resize', handleResize);
//   }, [initialTextValue, history]);

//   useEffect(() => {
//     wazuhDevTools.current = { tabs: tabsState, selectedTab, statusBadges };
//   }, [tabsState, selectedTab, statusBadges])

//   const abs = {
//     height: !isPanelVisible ? 'calc(100vh - 115px)' : 'calc(100vh - 445px)',
//     width: 'auto',
//     position: 'relative',
//     marginTop: -1
//   };

//   const addNewTab = () => {
//     const tabsLength = wazuhDevTools.current.tabs.length;
//     if (tabsLength < 5) {
//       const newTabs = [...wazuhDevTools.current.tabs];
//       newTabs[tabsLength] = '';
//       setTabs(newTabs);
//       const newBadges = [...wazuhDevTools.current.statusBadges];
//       newBadges[tabsLength] = false;
//       setStatusBadges(newBadges);
//       setSelectedTab(newTabs.length - 1)
//     }
//   };

//   const exportOutput = () => {
//     try {
//       // eslint-disable-next-line	
//       const blob = new Blob([(tabsState || [""])[selectedTab]], {
//         type: 'application/json'
//       });
//       FileSaver.saveAs(blob, 'export.json');
//     } catch (error) { }
//   }


//   const closeTab = (tabId) => {
//     const newTabs = [...wazuhDevTools.current.tabs];
//     newTabs.splice(tabId, 1);
//     setTabs(newTabs);
//     const newBadges = [...wazuhDevTools.current.statusBadges];
//     newBadges.splice(tabId, 1);
//     setStatusBadges(newBadges);
//     if (tabId <= selectedTab) {
//       setSelectedTab(tabId - 1 < 0 ? 0 : tabId - 1);
//     }
//   }

//   const showTabs = () => {
//     const tabsList = (tabsState || []).map((item, idx) => {
//       return (
//         <EuiFlexItem grow={false} >
//           <EuiButtonEmpty
//             color="text"
//             className="wz-devtools-tab"
//             style={{ backgroundColor: selectedTab === idx ? '#f5f7fa' : '', borderTop: selectedTab === idx ? '1px solid rgba(128, 128, 128, 0.11)' : '', borderLeft: selectedTab === idx ? '1px solid rgba(128, 128, 128, 0.11)' : '', borderRight: selectedTab === idx ? '1px solid rgba(128, 128, 128, 0.11)' : '' }}
//             onClick={() => setSelectedTab(idx)}>
//             Tab {idx + 1} &nbsp;
//             {(tabsState || []).length > 1 && <EuiButtonIcon
//               style={{ margin: 0, padding: 0 }}
//               onClick={(ev) => { ev.stopPropagation(); closeTab(idx) }}
//               color="text"
//               iconType="cross"
//               aria-label="close tab"
//             />}
//           </EuiButtonEmpty>
//         </EuiFlexItem>)
//     });

//     return tabsList;
//   }

//   const addHistory = (req) => {
//     var d = new Date();
//     var time = d.getTime();
//     const newReq = { "time": time, "endpoint": req.url.toLowerCase(), "method": req.method, "data": req.data }
//     window.localStorage.setItem(`wazuh:history.elem_${time}`, JSON.stringify(newReq));
//   }

//   const getBadge = () => {
//     const color = statusBadges[selectedTab].statusCode === 200 ? 'secondary' : 'warning';
//     return <EuiBadge color={color}>{`${statusBadges[selectedTab].statusCode} - ${statusBadges[selectedTab].statusText}`}</EuiBadge>

//   }

//   const doRequest = async () => {
//     setLoading(true);
//     let result = '';
//     let badgeStatus = {};
//     const requests = await editorInstanceRef.current.getRequestsInRange();
//     for (const currentReq of requests) {
//       let formattedResponse = "";
//       try {
//         const splitReq = currentReq.url.split('?');
//         let url = splitReq[0];
//         const params = splitReq[1]
//           ? queryString.parse(splitReq[1])
//           : {};
//         if (url[0] !== '/') {
//           url = '/' + url;
//         }
//         const bodyParams = currentReq.data.length ? JSON.parse(currentReq.data[0]) : {};
//         const response = await WzRequest.apiReq(currentReq.method, url, { ...params, ...bodyParams });
//         formattedResponse = ((response || {}).data || {});
//         addHistory(currentReq);
//       } catch (err) {
//         badgeStatus["statusCode"] = err.status || 500;
//         badgeStatus["statusText"] = err.statusText || 'Internal server error';

//         formattedResponse = ((err.data || {}).message) || 'Server did not respond';

//         if (formattedResponse.includes('3029')) {
//           formattedResponse = 'This method is not allowed without admin mode';
//         }

//         const newTabs = [...wazuhDevTools.current.tabs];
//         newTabs[wazuhDevTools.current.selectedTab] = `#${currentReq.method} ${currentReq.url}\n${JSON.stringify(formattedResponse, null, 1)} \n\n`;
//         setTabs(newTabs);
//         const newBadges = [...wazuhDevTools.current.statusBadges];
//         newBadges[wazuhDevTools.current.selectedTab] = badgeStatus;
//         setStatusBadges(newBadges);
//         setLoading(false);
//         return;
//       }
//       if (requests.length > 1) {
//         result += `#${currentReq.method} ${currentReq.url}\n${JSON.stringify(formattedResponse, null, 1)} \n\n\n`
//       } else {
//         result += JSON.stringify(formattedResponse, null, 1)
//       }
//     };
//     const newTabs = [...wazuhDevTools.current.tabs];
//     newTabs[wazuhDevTools.current.selectedTab] = result;
//     setTabs(newTabs);
//     const newBadges = [...wazuhDevTools.current.statusBadges];
//     newBadges[wazuhDevTools.current.selectedTab] = { statusCode: 200, statusText: 'OK' };
//     setStatusBadges(newBadges);
//     setLoading(false);
//   }

//   const addRequest = async (req) => {
//     const position = editorInstanceRef.current.coreEditor.getCurrentPosition();
//     const nextReqEnd = editorInstanceRef.current.nextRequestEnd(position);
//     editorInstanceRef.current.coreEditor.insert(nextReqEnd, `\n\n${req.method} ${req.endpoint}\n${req.data}`)
//   }


//   $.event.special.resizeComponent = {
//     remove: function() {
//         $(this).children('iframe.width-changed').remove();
//     },
//     add: function () {
//       var elm = $(this);
//       var iframe = elm.children('iframe.width-changed');
//       if (!iframe.length) {
//         iframe = $('<iframe/>').addClass('width-changed').prependTo(this);
//       }

//       var oldWidth = elm.width();
//       function elmResized() {
//         var width = elm.width();
//         if (oldWidth != width) {
//           elm.trigger('resizeComponent', [width, oldWidth]);
//           oldWidth = width;
//         }
//       }

//       var timer = 0;
//       var ielm = iframe[0];
//       (ielm.contentWindow || ielm).onresize = function() {
//           clearTimeout(timer);
//           timer = setTimeout(elmResized, 10);
//       };
//     }
//   }

//   const showToast = (color, title, text, time) => {
//     getToasts().add({
//       color: color,
//       title: title,
//       text: text,
//       toastLifeTimeMs: time
//     });
//   };

//   const convertCurl = async () => {
//     const request = await editorInstanceRef.current.getRequest();
//     const curl = await editorInstanceRef.current.getRequestsAsCURL('https://localhost:55000', request.range);
//     /* Auxiliar textarea creator */
//     const el = document.createElement('textarea');
//     el.value = curl;
//     document.body.appendChild(el);
//     el.select();
//     document.execCommand('copy');
//     document.body.removeChild(el);
//     showToast('success', 'Request copied as cURL', '' , 3000);
//     setPopoverOpen(false);
//   }

//   const goToDocumentation = async () => {
//     try {
//       const request = await editorInstanceRef.current.getRequest();
//       const splitReq = request.url.split('?');
//       const requestPath = splitReq[0];
//       const requestArray = requestPath.substr(1).split('/')
//       const filtered = apiRequestList[request.method].map(o => ({...o, splitURL: o.value.split('/')})).filter(o => {
//         return o.splitURL.length === requestArray.length
//       }).find(o => {
//         return o.splitURL.reduce((accum,str,index) => {
//           return accum && (str.startsWith(':') ? true : str === requestArray[index])
//         },true)
//       })
//       window.open(filtered.documentationLink, '_blank');
//       setPopoverOpen(false); 
//     } catch (error) {
//       showToast('danger', 'No documentation related to this request was found.', '' , 3000);
//     }
//   }

//   const renderRightColumn = () => {
//     $('#wz-dev-right-column').on('resizeComponent',function(){
//       let $rightColumn = $('#wz-dev-right-column');
//       if ($rightColumn.width() < 860) { 
//         $('#selectTabs').show();
//         $('#buttonSelectTab').hide();
//         $('#addButtonTab').addClass('marginAddTab');
//         $('.wideElementsDevTools').hide();
//       } 
//       if ($rightColumn.width() > 860) {
//         $('#selectTabs').hide();
//         $('#buttonSelectTab').show();
//         $('#addButtonTab').removeClass('marginAddTab');
//         $('.wideElementsDevTools').show();
//       }
//     });

//     return (
//       <div id="wz-dev-right-column" style={{ width: "70%", minWidth: "30%",borderTop: '1px solid #8080801c', height: '100%' }}>
//         <EuiCodeEditor
//           // theme="textmate"
//           width="100%"
//           height="100%"
//           value={(tabsState || [""])[selectedTab]}
//           mode="json"
//           isReadOnly={true}
//           wrapEnabled
//           setOptions={codeEditorOptions}
//           aria-label="Code Editor"
//         />
//       </div>)
//   }

//   const renderLeftColumn = () => {
//     return (
//       <div id="wz-dev-left-column" style={{ width: "30%", borderTop: '1px solid #8080801c' }} className="conApp__editor">
//         <ul className="conApp__autoComplete" id="autocomplete" />
//         <EuiFlexGroup
//           className="conApp__editorActions"
//           id="ConAppEditorActions"
//           gutterSize="none"
//           responsive={false}
//         >
//           <EuiFlexItem>
//             <EuiToolTip
//               content={'Click to send request'}
//             >
//               <button
//                 onClick={async () => await doRequest()}
//                 data-test-subj="sendRequestButton"
//                 aria-label={"test"}
//                 className="conApp__editorActionButton conApp__editorActionButton--success"
//               >
//                 <EuiIcon type="play" />
//               </button>
//             </EuiToolTip>
//           </EuiFlexItem>
//           <EuiFlexItem>
//           <EuiPopover
//             button={
//               <button
//                 onClick={ () => setPopoverOpen(true) }
//                 data-test-subj="sendRequestButton"
//                 aria-label={"More Actions"}
//               >
//                 <EuiIcon type="wrench" />
//               </button>
//             }
//             isOpen={popoverOpen}
//             closePopover={ () => setPopoverOpen(false) }>
//             <EuiFlexGroup
//               direction={'column'}
//               alignItems={'flexStart'}
//               justifyContent={'flexStart'}
//               >
//               <EuiFlexItem grow={false}>
//                 <EuiButtonEmpty
//                   color={'text'}
//                   onClick={() => convertCurl() }
//                   data-test-subj="sendRequestButton"
//                   aria-label={"cURL"}
//                   >
//                   <EuiIcon type="console" /> Copy as cURL
//                 </EuiButtonEmpty>
//               </EuiFlexItem>
//               <EuiFlexItem grow={false}>
//                 <EuiButtonEmpty
//                   color={'text'}
//                   onClick={() => goToDocumentation() }
//                   data-test-subj="sendRequestButton"
//                   aria-label={"Documentation reference"}
//                   >
//                   <EuiIcon type="link" /> Open documentation
//                 </EuiButtonEmpty>
//               </EuiFlexItem>
//             </EuiFlexGroup>
//           </EuiPopover>
//           </EuiFlexItem>
//         </EuiFlexGroup>

//         <EuiScreenReaderOnly>
//           <label htmlFor={inputId}>
//             Dev Tools console
//       </label>
//         </EuiScreenReaderOnly>
//         <div
//           ref={editorRef}
//           id="ConAppEditor"
//           className="conApp__editorContent"
//           data-test-subj="request-editor"
//         />
//       </div>)
//   }

//   const renderSelectTabs = () => {
//     let auxTabs: { index: number, text: string }[] = [];
//     for (let index = 0; index < tabsState.length; index++) {
//       auxTabs.push({
//         index: index,
//         text: `Tab ${index+1}`
//       });
//     }

//     const onchange = (value) => {
//       let auxTabIndex = value.split(' ');
//       setSelectedTab(parseInt(auxTabIndex[1]) - 1)
//     }

//     return (
//       <EuiFlexItem
//         id={'selectTabs'}
//         grow={false}
//         className={'selectDevTools'}>
//         <EuiSelect
//           id="selectTab"
//           options={auxTabs}
//           value={auxTabs.text}
//           onChange={ (e) => onchange(e.target.value)}
//           aria-label="Selected tabs"
//         />
//       </EuiFlexItem>
//     )
//   }

//   const renderActionsBar = () => {
//     return (
//       <EuiFlexGroup gutterSize="none" responsive={false} style={{ paddingTop: 6, paddingLeft: 8 }}>
//         <EuiFlexItem id="wz-tabs-margin" style={{ marginRight: 'calc(30vw - 4px)' }} grow={false}>
//           <EuiButtonEmpty
//             color="text"
//             onClick={showHistory}
//           >
//             History
//             </EuiButtonEmpty>
//         </EuiFlexItem>
//         <EuiFlexItem className="wz-devtools-tabs" style={{ zIndex: 1 }}>
//           <EuiFlexGroup gutterSize="none" responsive={false}>
//             {!isPanelVisible &&
//               <EuiFlexItem 
//                 grow={false}
//                 style={{ overflow: 'auto' }}
//                 id={'buttonSelectTab'}
//                 className={'wideElementsDevTools'}
//               >
//                 <EuiFlexGroup gutterSize="none" responsive={false}>
//                   {showTabs()}
//                 </EuiFlexGroup>
//               </EuiFlexItem>}
//             {!isPanelVisible && renderSelectTabs()}
//             {!isPanelVisible && tabsState.length < 5 && <EuiFlexItem grow={false}>
//               <EuiButtonEmpty
//                 onClick={(ev) => { ev.stopPropagation(); addNewTab() }}
//                 id={'addButtonTab'}
//                 color="text"
//                 iconType="plusInCircle"
//                 aria-label="open new tab"
//               />
//             </EuiFlexItem>
//             }
//           </EuiFlexGroup>
//         </EuiFlexItem>
//         <EuiFlexItem grow={false} style={{ alignSelf: 'center', marginRight: 12 }}>
//           {statusBadges[selectedTab] && getBadge()}
//         </EuiFlexItem>
//         <EuiFlexItem grow={false} style={{ alignSelf: 'center', marginRight: 12 }} className={'wideElementsDevTools'}>
//           <EuiToolTip
//             position="left"
//             content="Export in JSON">
//             <EuiButtonIcon
//               color={'subdued'}
//               onClick={() => exportOutput()}
//               iconType="importAction"
//               aria-label="Export"
//             />
//           </EuiToolTip>
//         </EuiFlexItem>
//         <EuiFlexItem grow={false} style={{ alignSelf: 'center', marginRight: 12 }} className={'wideElementsDevTools'}>
//           <EuiToolTip
//             position="left"
//             content="API reference">
//             <EuiButtonIcon
//               color={'subdued'}
//               onClick={() => window.open(webDocumentationLink('user-manual/api/reference.html'))}
//               iconType="questionInCircle"
//               aria-label="Reference"
//             />
//           </EuiToolTip>
//         </EuiFlexItem>
//       </EuiFlexGroup>)
//   }
//   return (
//     <>
//       {renderActionsBar()}
//       {isPanelVisible &&
//         <EuiFlexGroup>
//           <EuiFlexItem>
//             <DevToolsHistory localStorage={window.localStorage} closeHistory={closeHistory} addRequest={addRequest} />
//           </EuiFlexItem>
//         </EuiFlexGroup>
//       }
//       <EuiFlexGroup style={{ padding: "0px 8px" }}>
//         <EuiFlexItem style={{ marginBottom: 0 }}>
//           <div style={abs} className="conApp">
//             {loading && <EuiProgress size="xs" color="accent" position="absolute" />}
//             {renderLeftColumn()}
//             <div className="wz-dev-column-separator layout-column" style={{ marginTop: 0, borderTop: '1px solid #8080801c' }}>
//               <span><EuiIcon type='grabHorizontal'></EuiIcon></span>
//             </div>
//             {renderRightColumn()}
//           </div>
//         </EuiFlexItem>
//       </EuiFlexGroup>
//     </>
//   );
// } 