/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import { i18n } from '@osd/i18n';

export const getMenuItem = (name) => {
  return `
    <button class="euiButtonEmpty euiButtonEmpty--primary euiButtonEmpty--xSmall euiHeaderLink" type="button" id="downloadReport">
      <span data-html2canvas-ignore class="euiButtonContent euiButtonEmpty__content"><span data-html2canvas-ignore class="euiButtonEmpty__text">${name}</span></span>
    </button>
    `;
};

export const popoverMenu = (savedObjectAvailable) => {
  const buttonClass = savedObjectAvailable
    ? 'euiContextMenuItem'
    : 'euiContextMenuItem euiContextMenuItem-isDisabled';
  const button = savedObjectAvailable ? 'button' : 'button disabled';
  const message = savedObjectAvailable
    ? i18n.translate('opensearch.reports.menu.visual.waitPrompt', {
        defaultMessage:
          'Files can take a minute or two to generate depending on the size of your source data.',
      })
    : i18n.translate('opensearch.reports.menu.visual.savePrompt', {
        defaultMessage:
          'Save this Visualization/Dashboard to enable PDF/PNG reports.',
      });

  const arrowRight = '100px';
  const popoverRight = '170px';

  return `
    <div>
      <div data-focus-guard="true" tabindex="-1" style="width: 1px; height: 0px; padding: 0px; overflow: hidden; position: fixed; top: 1px; left: 1px;">
    </div>
      <div data-focus-guard="true" tabindex="-1" style="width: 1px; height: 0px; padding: 0px; overflow: hidden; position: fixed; top: 1px; left: 1px;">
    </div>
    <div data-focus-lock-disabled="disabled">
       <div class="euiPanel euiPopover__panel euiPopover__panel--bottom euiPopover__panel-isOpen euiPopover__panel-withTitle" aria-live="assertive" role="dialog" aria-modal="true" style="top: 100.972px; right: ${popoverRight}; z-index: 3000;" id="reportPopover">
          <div class="euiPopover__panelArrow euiPopover__panelArrow--bottom" style="right: ${arrowRight}; top: 0px;">
        </div>
          <div>
             <div class="euiContextMenu" data-test-subj="shareContextMenu" style="width: 235px;">
                <div class="euiContextMenuPanel" tabindex="0">
                   <div class="euiPopoverTitle">
                      <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                      ${i18n.translate(
                        'opensearch.reports.menu.visual.generateReport',
                        { defaultMessage: 'Generate report' }
                      )}
                      </span>
                   </div>
                   <div>
                    <span data-html2canvas-ignore class="euiContextMenuItem__text" style="padding-left: 10px; padding-right: 10px; margin-top: 10px; box-decoration-break: clone; display: inline-block;">
                      ${message}
                    </span>
                   </div>
                   <div>
                      <div>
                         <${button} class="${buttonClass}" type="button" data-test-subj="downloadPanel-GeneratePDF" id="generatePDF">
                            <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                            <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="euiIcon euiIcon--medium euiIcon-isLoaded euiContextMenu__icon" focusable="false" role="img" aria-hidden="true"><path d="M9 9.114l1.85-1.943a.52.52 0 01.77 0c.214.228.214.6 0 .829l-1.95 2.05a1.552 1.552 0 01-2.31 0L5.41 8a.617.617 0 010-.829.52.52 0 01.77 0L8 9.082V.556C8 .249 8.224 0 8.5 0s.5.249.5.556v8.558z"></path><path d="M16 13.006V10h-1v3.006a.995.995 0 01-.994.994H3.01a.995.995 0 01-.994-.994V10h-1v3.006c0 1.1.892 1.994 1.994 1.994h10.996c1.1 0 1.994-.893 1.994-1.994z"></path></svg>
                               <span data-html2canvas-ignore class="euiContextMenuItem__text">${i18n.translate(
                                 'opensearch.reports.menu.visual.downloadPdf',
                                 { defaultMessage: 'Download PDF' }
                               )}</span>
                            </span>
                         </button>
                         <${button} class="${buttonClass}" type="button" data-test-subj="downloadPanel-GeneratePNG" id="generatePNG">
                            <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                            <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="euiIcon euiIcon--medium euiIcon-isLoaded euiContextMenu__icon" focusable="false" role="img" aria-hidden="true"><path d="M9 9.114l1.85-1.943a.52.52 0 01.77 0c.214.228.214.6 0 .829l-1.95 2.05a1.552 1.552 0 01-2.31 0L5.41 8a.617.617 0 010-.829.52.52 0 01.77 0L8 9.082V.556C8 .249 8.224 0 8.5 0s.5.249.5.556v8.558z"></path><path d="M16 13.006V10h-1v3.006a.995.995 0 01-.994.994H3.01a.995.995 0 01-.994-.994V10h-1v3.006c0 1.1.892 1.994 1.994 1.994h10.996c1.1 0 1.994-.893 1.994-1.994z"></path></svg>
                               <span data-html2canvas-ignore class="euiContextMenuItem__text">${i18n.translate(
                                 'opensearch.reports.menu.visual.downloadPng',
                                 { defaultMessage: 'Download PNG' }
                               )}</span>
                            </span>
                         </button>
                      </div>
                   </div>
                   <div class="euiPopoverTitle">
                    <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                      ${i18n.translate(
                        'opensearch.reports.menu.visual.scheduleAndShare',
                        { defaultMessage: 'Schedule and share' }
                      )}
                    </span>
                  </div>
                  <div>
                    <${button} class="${buttonClass}" type="button" data-test-subj="downloadPanel-GeneratePDF" id="createReportDefinition">
                      <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                        <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="euiIcon euiIcon--medium euiIcon-isLoaded euiContextMenu__icon" focusable="false" role="img" aria-hidden="true"><path d="M14 4v-.994C14 2.45 13.55 2 12.994 2H11v1h-1V2H6v1H5V2H3.006C2.45 2 2 2.45 2 3.006v9.988C2 13.55 2.45 14 3.006 14h9.988C13.55 14 14 13.55 14 12.994V5H2V4h12zm-3-3h1.994C14.102 1 15 1.897 15 3.006v9.988A2.005 2.005 0 0112.994 15H3.006A2.005 2.005 0 011 12.994V3.006C1 1.898 1.897 1 3.006 1H5V0h1v1h4V0h1v1zM4 7h2v1H4V7zm3 0h2v1H7V7zm3 0h2v1h-2V7zM4 9h2v1H4V9zm3 0h2v1H7V9zm3 0h2v1h-2V9zm-6 2h2v1H4v-1zm3 0h2v1H7v-1zm3 0h2v1h-2v-1z" fill-rule="evenodd"></path></svg>
                        <span data-html2canvas-ignore class="euiContextMenuItem__text">${i18n.translate(
                          'opensearch.reports.menu.visual.createReportDefinition',
                          { defaultMessage: 'Create report definition' }
                        )}</span>
                        </svg>
                      </span>
                    </button>
                  </div>
                  <div class="euiPopoverTitle">
                    <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                      ${i18n.translate('opensearch.reports.menu.visual.view', {
                        defaultMessage: 'View',
                      })}
                    </span>
                  </div>
                  <div>
                    <button class="euiContextMenuItem" type="button" data-test-subj="downloadPanel-GeneratePDF" id="viewReports">
                      <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                        <svg id="reports-icon" width="16px" height="16px" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="euiIcon euiIcon--medium euiIcon-isLoaded euiContextMenu__icon">
                            <g transform="translate(1.000000, 0.000000)" fill="currentColor">
                              <path d="M9.8,0 L1,0 C0.448,0 0,0.448 0,1 L0,15 C0,15.552 0.448,16 1,16 L13,16 C13.552,16 14,15.552 14,15 L14,4.429 C14,4.173 13.902,3.926 13.726,3.74 L10.526,0.312 C10.337,0.113 10.074,0 9.8,0 M9,1 L9,4.5 C9,4.776 9.224,5 9.5,5 L9.5,5 L13,5 L13,15 L1,15 L1,1 L9,1 Z M11.5,13 L2.5,13 L2.5,14 L11.5,14 L11.5,13 Z M10.8553858,6.66036578 L7.924,9.827 L5.42565136,8.13939866 L2.63423628,11.1343544 L3.36576372,11.8161664 L5.574,9.446 L8.07559521,11.1358573 L11.5892757,7.33963422 L10.8553858,6.66036578 Z M7.5,4 L2.5,4 L2.5,5 L7.5,5 L7.5,4 Z M7.5,2 L2.5,2 L2.5,3 L7.5,3 L7.5,2 Z"></path>
                            </g>
                        </svg>
                          <span data-html2canvas-ignore class="euiContextMenuItem__text">${i18n.translate(
                            'opensearch.reports.menu.visual.viewReports',
                            { defaultMessage: 'View reports' }
                          )}</span>
                          </svg>
                      </span>
                    </button>
                    </div>
                </div>
             </div>
          </div>
       </div>
    </div>
    <div data-focus-guard="true" tabindex="-1" style="width: 1px; height: 0px; padding: 0px; overflow: hidden; position: fixed; top: 1px; left: 1px;"></div>
    `;
};

// TODO: merge this function and popoverMenu() into one
export const popoverMenuDiscover = (savedObjectAvailable) => {
  const buttonClass = savedObjectAvailable
    ? 'euiContextMenuItem'
    : 'euiContextMenuItem euiContextMenuItem-isDisabled';
  const button = savedObjectAvailable ? 'button' : 'button disabled';
  const message = savedObjectAvailable
    ? i18n.translate('opensearch.reports.menu.csv.waitPrompt', {
        defaultMessage:
          'Files can take a minute or two to generate depending on the size of your source data.',
      })
    : i18n.translate('opensearch.reports.menu.csv.savePrompt', {
        defaultMessage: 'Save this search to enable CSV/XLSX reports.',
      });
  const arrowRight = '60px';
  const popoverRight = '170px';

  return `
    <div>
      <div data-focus-guard="true" tabindex="-1" style="width: 1px; height: 0px; padding: 0px; overflow: hidden; position: fixed; top: 1px; left: 1px;">
    </div>
      <div data-focus-guard="true" tabindex="-1" style="width: 1px; height: 0px; padding: 0px; overflow: hidden; position: fixed; top: 1px; left: 1px;">
    </div>
    <div data-focus-lock-disabled="disabled">
       <div class="euiPanel euiPopover__panel euiPopover__panel--bottom euiPopover__panel-isOpen euiPopover__panel-withTitle" aria-live="assertive" role="dialog" aria-modal="true" aria-describedby="i199c7fc0-f92e-11ea-a40d-395bfe9dc89a" style="top: 100.972px; right: ${popoverRight}; z-index: 3000;" id="reportPopover">
          <div class="euiPopover__panelArrow euiPopover__panelArrow--bottom" style="right: ${arrowRight}; top: 0px;">
        </div>
          <div>
             <div class="euiContextMenu" data-test-subj="shareContextMenu" style="width: 235px;">
                <div class="euiContextMenuPanel" tabindex="0">
                   <div class="euiPopoverTitle">
                      <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                      ${i18n.translate(
                        'opensearch.reports.menu.csv.generateReport',
                        {
                          defaultMessage: 'Generate and download',
                        }
                      )}
                      </span>
                   </div>
                   <div>
                    <span data-html2canvas-ignore class="euiContextMenuItem__text" style="padding-left: 10px; padding-right: 10px; margin-top: 10px; box-decoration-break: clone; display: inline-block;">
                      ${message}
                    </span>
                   </div>
                  <div>
                    <${button} class="${buttonClass}" type="button" data-test-subj="downloadPanel-GeneratePDF" id="generateCSV">
                      <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                        <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="euiIcon euiIcon--medium euiIcon-isLoaded euiContextMenu__icon" focusable="false" role="img" aria-hidden="true"><path d="M9 9.114l1.85-1.943a.52.52 0 01.77 0c.214.228.214.6 0 .829l-1.95 2.05a1.552 1.552 0 01-2.31 0L5.41 8a.617.617 0 010-.829.52.52 0 01.77 0L8 9.082V.556C8 .249 8.224 0 8.5 0s.5.249.5.556v8.558z"></path><path d="M16 13.006V10h-1v3.006a.995.995 0 01-.994.994H3.01a.995.995 0 01-.994-.994V10h-1v3.006c0 1.1.892 1.994 1.994 1.994h10.996c1.1 0 1.994-.893 1.994-1.994z"></path></svg>
                        <span data-html2canvas-ignore class="euiContextMenuItem__text">${i18n.translate(
                          'opensearch.reports.menu.csv.generateCsv',
                          { defaultMessage: 'Generate CSV' }
                        )}</span>
                        </svg>
                      </span>
                    </button>
                    <${button} class="${buttonClass}" type="button" data-test-subj="downloadPanel-GeneratePDF" id="generateXLSX">
                      <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                        <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="euiIcon euiIcon--medium euiIcon-isLoaded euiContextMenu__icon" focusable="false" role="img" aria-hidden="true"><path d="M9 9.114l1.85-1.943a.52.52 0 01.77 0c.214.228.214.6 0 .829l-1.95 2.05a1.552 1.552 0 01-2.31 0L5.41 8a.617.617 0 010-.829.52.52 0 01.77 0L8 9.082V.556C8 .249 8.224 0 8.5 0s.5.249.5.556v8.558z"></path><path d="M16 13.006V10h-1v3.006a.995.995 0 01-.994.994H3.01a.995.995 0 01-.994-.994V10h-1v3.006c0 1.1.892 1.994 1.994 1.994h10.996c1.1 0 1.994-.893 1.994-1.994z"></path></svg>
                        <span data-html2canvas-ignore class="euiContextMenuItem__text">${i18n.translate(
                          'opensearch.reports.menu.csv.generateXLSX',
                          { defaultMessage: 'Generate XLSX' }
                        )}</span>
                      </span>
                    </button>
                  </div>
                   <div class="euiPopoverTitle">
                    <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                      ${i18n.translate(
                        'opensearch.reports.menu.scheduleAndShare',
                        {
                          defaultMessage: 'Schedule and share',
                        }
                      )}
                    </span>
                  </div>
                  <div>
                    <${button} class="${buttonClass}" type="button" data-test-subj="downloadPanel-GeneratePDF" id="createReportDefinition">
                      <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                        <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="euiIcon euiIcon--medium euiIcon-isLoaded euiContextMenu__icon" focusable="false" role="img" aria-hidden="true"><path d="M14 4v-.994C14 2.45 13.55 2 12.994 2H11v1h-1V2H6v1H5V2H3.006C2.45 2 2 2.45 2 3.006v9.988C2 13.55 2.45 14 3.006 14h9.988C13.55 14 14 13.55 14 12.994V5H2V4h12zm-3-3h1.994C14.102 1 15 1.897 15 3.006v9.988A2.005 2.005 0 0112.994 15H3.006A2.005 2.005 0 011 12.994V3.006C1 1.898 1.897 1 3.006 1H5V0h1v1h4V0h1v1zM4 7h2v1H4V7zm3 0h2v1H7V7zm3 0h2v1h-2V7zM4 9h2v1H4V9zm3 0h2v1H7V9zm3 0h2v1h-2V9zm-6 2h2v1H4v-1zm3 0h2v1H7v-1zm3 0h2v1h-2v-1z" fill-rule="evenodd"></path></svg>
                        <span data-html2canvas-ignore class="euiContextMenuItem__text">${i18n.translate(
                          'opensearch.reports.menu.createReportDefinition',
                          { defaultMessage: 'Create report definition' }
                        )}</span>
                        </svg>
                      </span>
                    </button>
                  </div>
                  <div class="euiPopoverTitle">
                    <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                      ${i18n.translate('opensearch.reports.menu.csv.view', {
                        defaultMessage: 'View',
                      })}
                    </span>
                  </div>
                  <div>
                    <button class="euiContextMenuItem" type="button" data-test-subj="downloadPanel-GeneratePDF" id="viewReports">
                      <span data-html2canvas-ignore class="euiContextMenu__itemLayout">
                        <svg id="reports-icon" width="16px" height="16px" viewBox="0 0 16 16" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="euiIcon euiIcon--medium euiIcon-isLoaded euiContextMenu__icon">
                            <g transform="translate(1.000000, 0.000000)" fill="currentColor">
                              <path d="M9.8,0 L1,0 C0.448,0 0,0.448 0,1 L0,15 C0,15.552 0.448,16 1,16 L13,16 C13.552,16 14,15.552 14,15 L14,4.429 C14,4.173 13.902,3.926 13.726,3.74 L10.526,0.312 C10.337,0.113 10.074,0 9.8,0 M9,1 L9,4.5 C9,4.776 9.224,5 9.5,5 L9.5,5 L13,5 L13,15 L1,15 L1,1 L9,1 Z M11.5,13 L2.5,13 L2.5,14 L11.5,14 L11.5,13 Z M10.8553858,6.66036578 L7.924,9.827 L5.42565136,8.13939866 L2.63423628,11.1343544 L3.36576372,11.8161664 L5.574,9.446 L8.07559521,11.1358573 L11.5892757,7.33963422 L10.8553858,6.66036578 Z M7.5,4 L2.5,4 L2.5,5 L7.5,5 L7.5,4 Z M7.5,2 L2.5,2 L2.5,3 L7.5,3 L7.5,2 Z"></path>
                            </g>
                        </svg>
                          <span data-html2canvas-ignore class="euiContextMenuItem__text">${i18n.translate(
                            'opensearch.reports.menu.csv.viewReports',
                            { defaultMessage: 'View reports' }
                          )}</span>
                          </svg>
                      </span>
                    </button>
                    </div>
                </div>
             </div>
          </div>
       </div>
    </div>
    <div data-focus-guard="true" tabindex="-1" style="width: 1px; height: 0px; padding: 0px; overflow: hidden; position: fixed; top: 1px; left: 1px;"></div>
    `;
};

export const permissionsMissingOnGeneration = () => {
  return `
  <div class="euiToast euiToast--danger" id="permissionsMissingErrorToast" data-html2canvas-ignore>
  <p class="euiScreenReaderOnly">${i18n.translate(
    'opensearch.reports.menu.newNotificationAppears',
    { defaultMessage: 'A new notification appears' }
  )}</p>
  <div class="euiToastHeader euiToastHeader--withBody" aria-label="Notification" data-test-subj="euiToastHeader">
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="euiIcon euiIcon--medium euiToastHeader__icon" focusable="false" role="img" aria-hidden="true">
        <path fill-rule="evenodd" d="M7.59 10.059L7.35 5.18h1.3L8.4 10.06h-.81zm.394 1.901a.61.61 0 01-.448-.186.606.606 0 01-.186-.444c0-.174.062-.323.186-.446a.614.614 0 01.448-.184c.169 0 .315.06.44.182.124.122.186.27.186.448a.6.6 0 01-.189.446.607.607 0 01-.437.184zM2 14a1 1 0 01-.878-1.479l6-11a1 1 0 011.756 0l6 11A1 1 0 0114 14H2zm0-1h12L8 2 2 13z"></path>
    </svg>
    <span data-html2canvas-ignore class="euiToastHeader__title">${i18n.translate(
      'opensearch.reports.menu.errorGeneratingReport',
      { defaultMessage: 'Error generating report.' }
    )}</span>
  </div>
  <button type="button" class="euiToast__closeButton" aria-label="Dismiss toast" data-test-subj="toastCloseButton">
    <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="euiIcon euiIcon--medium euiIcon-isLoaded" focusable="false" role="img" aria-hidden="true">
        <path d="M7.293 8L3.146 3.854a.5.5 0 11.708-.708L8 7.293l4.146-4.147a.5.5 0 01.708.708L8.707 8l4.147 4.146a.5.5 0 01-.708.708L8 8.707l-4.146 4.147a.5.5 0 01-.708-.708L7.293 8z"></path>
    </svg>
  </button>
  <div class="euiText euiText--small euiToastBody">
    <p>${i18n.translate('opensearch.reports.menu.insufficientPermissions', {
      defaultMessage:
        'Insufficient permissions. Reach out to your OpenSearch Dashboards administrator.',
    })}</p>
  </div>
  </div>
  `;
};

export const reportGenerationSuccess = () => {
  return `
  <div class="euiToast euiToast--success" id="reportSuccessToast" data-html2canvas-ignore>
    <p class="euiScreenReaderOnly">A new notification appears</p>
    <div class="euiToastHeader euiToastHeader--withBody"
    aria-label="Notification" data-test-subj="euiToastHeader">
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"
      class="euiIcon euiIcon--medium euiToastHeader__icon" focusable="false"
      role="img" aria-hidden="true">
        <path fill-rule="evenodd" d="M6.5 12a.502.502 0 01-.354-.146l-4-4a.502.502 0 01.708-.708L6.5 10.793l6.646-6.647a.502.502 0 01.708.708l-7 7A.502.502 0 016.5 12"></path>
      </svg>
      <span data-html2canvas-ignore class="euiToastHeader__title">${i18n.translate(
        'opensearch.reports.menu.successfullyGenerated',
        { defaultMessage: 'Successfully generated report.' }
      )}</span>
    </div>
    <button type="button" class="euiToast__closeButton" aria-label="Dismiss toast" id="closeReportSuccessToast"
    data-test-subj="toastCloseButton">
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"
      class="euiIcon euiIcon--medium" focusable="false" role="img" aria-hidden="true">
        <path d="M7.293 8L3.146 3.854a.5.5 0 11.708-.708L8 7.293l4.146-4.147a.5.5 0 01.708.708L8.707 8l4.147 4.146a.5.5 0 01-.708.708L8 8.707l-4.146 4.147a.5.5 0 01-.708-.708L7.293 8z"></path>
      </svg>
    </button>
    <div class="euiText euiText--small euiToastBody">
      <p>View
        <a class="euiLink euiLink--primary"
        href="reports-alerts#/" rel="noreferrer">${i18n.translate(
          'opensearch.reports.menu.button.reports',
          { defaultMessage: 'Reports' }
        )}</a>.</p>
    </div>
  </div>
  `;
};

export const reportGenerationFailure = (
  title = i18n.translate('opensearch.reports.menu.downloadError', {
    defaultMessage: 'Download error',
  }),
  text = i18n.translate('opensearch.reports.menu.errorGeneratingThisReport', {
    defaultMessage: 'There was an error generating this report.',
  })
) => {
  return `
  <div class="euiToast euiToast--danger" id="reportFailureToast" data-html2canvas-ignore>
    <p class="euiScreenReaderOnly">A new notification appears</p>
    <div class="euiToastHeader euiToastHeader--withBody"
    aria-label="Notification" data-test-subj="euiToastHeader">
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"
      class="euiIcon euiIcon--medium euiToastHeader__icon" focusable="false"
      role="img" aria-hidden="true">
        <path fill-rule="evenodd" d="M7.59 10.059L7.35 5.18h1.3L8.4 10.06h-.81zm.394 1.901a.61.61 0 01-.448-.186.606.606 0 01-.186-.444c0-.174.062-.323.186-.446a.614.614 0 01.448-.184c.169 0 .315.06.44.182.124.122.186.27.186.448a.6.6 0 01-.189.446.607.607 0 01-.437.184zM2 14a1 1 0 01-.878-1.479l6-11a1 1 0 011.756 0l6 11A1 1 0 0114 14H2zm0-1h12L8 2 2 13z"></path>
      </svg>
      <span data-html2canvas-ignore class="euiToastHeader__title">${title}</span>
    </div>
    <button type="button" class="euiToast__closeButton" aria-label="Dismiss toast" id="closeReportFailureToast"
    data-test-subj="toastCloseButton">
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"
      class="euiIcon euiIcon--medium" focusable="false" role="img" aria-hidden="true">
        <path d="M7.293 8L3.146 3.854a.5.5 0 11.708-.708L8 7.293l4.146-4.147a.5.5 0 01.708.708L8.707 8l4.147 4.146a.5.5 0 01-.708.708L8 8.707l-4.146 4.147a.5.5 0 01-.708-.708L7.293 8z"></path>
      </svg>
    </button>
    <div class="euiText euiText--small euiToastBody">
      <p>${text}</p>
    </div>
  </div>
  `;
};

export const reportGenerationInProgressModal = () => {
  return `
  <div class="euiOverlayMask" id="reportGenerationProgressModal" data-html2canvas-ignore>
  <div data-focus-guard="true" tabindex="0" style="width: 1px; height: 0px; padding: 0px; overflow: hidden; position: fixed; top: 1px; left: 1px;"></div>
  <div data-focus-guard="true" tabindex="1" style="width: 1px; height: 0px; padding: 0px; overflow: hidden; position: fixed; top: 1px; left: 1px;"></div>
  <div data-focus-lock-disabled="false">
     <div class="euiModal euiModal--maxWidth-default" tabindex="0" style="max-width: 350px; min-width: 300px;">
        <button class="euiButtonIcon euiButtonIcon--text euiModal__closeIcon" type="button" aria-label="Closes this modal window" id="closeReportGenerationModal">
           <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" class="euiIcon euiIcon--medium euiIcon-isLoaded euiButtonIcon__icon" focusable="false" role="img" aria-hidden="true">
              <path d="M7.293 8L3.146 3.854a.5.5 0 11.708-.708L8 7.293l4.146-4.147a.5.5 0 01.708.708L8.707 8l4.147 4.146a.5.5 0 01-.708.708L8 8.707l-4.146 4.147a.5.5 0 01-.708-.708L7.293 8z"></path>
           </svg>
        </button>
        <div class="euiModal__flex">
           <div class="euiModalHeader">
              <div class="euiText euiText--medium euiTitle euiTitle--medium">
                 <div class="euiTextAlign euiTextAlign--right">
                    <h2>${i18n.translate(
                      'opensearch.reports.menu.progress.generatingReport',
                      { defaultMessage: 'Generating report' }
                    )}</h2>
                 </div>
              </div>
           </div>
           <div class="euiModalBody">
              <div class="euiModalBody__overflow">
                 <div class="euiText euiText--medium">${i18n.translate(
                   'opensearch.reports.menu.progress.preparingYourFile',
                   { defaultMessage: 'Preparing your file for download.' }
                 )}</div>
                 <div class="euiText euiText--medium">${i18n.translate(
                   'opensearch.reports.menu.progress.youCanClose',
                   {
                     defaultMessage:
                       'Please keep this dialog open while report is being generated.',
                   }
                 )}</div>
                 <div class="euiSpacer euiSpacer--l"></div>
                 <div class="euiFlexGroup euiFlexGroup--gutterLarge euiFlexGroup--alignItemsCenter euiFlexGroup--justifyContentCenter euiFlexGroup--directionRow euiFlexGroup--responsive">
                    <div class="euiFlexItem euiFlexItem--flexGrowZero"><span data-html2canvas-ignore class="euiLoadingSpinner euiLoadingSpinner--xLarge" style="min-width: 75px; min-height: 75px;"></span></div>
                 </div>
                 <div class="euiSpacer euiSpacer--l"></div>
              </div>
           </div>
        </div>
     </div>
  </div>
  <div data-focus-guard="true" tabindex="0" style="width: 1px; height: 0px; padding: 0px; overflow: hidden; position: fixed; top: 1px; left: 1px;"></div>
</div>
  `;
};

export function getPopoverHeight(isDiscover, isSavedObjectAvailable) {
  if (isDiscover && !isSavedObjectAvailable) {
    return '372px';
  }

  return '388px';
}
