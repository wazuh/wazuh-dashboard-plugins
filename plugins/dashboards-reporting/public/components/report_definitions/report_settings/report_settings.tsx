/*
 * Copyright OpenSearch Contributors
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFormRow,
  EuiPageHeader,
  EuiTitle,
  EuiPageContent,
  EuiPageContentBody,
  EuiHorizontalRule,
  EuiText,
  EuiSpacer,
  EuiRadioGroup,
  EuiSelect,
  EuiTextArea,
  EuiCheckboxGroup,
  EuiComboBox,
} from '@elastic/eui';
import {
  REPORT_SOURCE_RADIOS,
  PDF_PNG_FILE_FORMAT_OPTIONS,
  HEADER_FOOTER_CHECKBOX,
  REPORT_SOURCE_TYPES,
  SAVED_SEARCH_FORMAT_OPTIONS,
} from './report_settings_constants';
import Showdown from 'showdown';
import ReactMde from 'react-mde';
import 'react-mde/lib/styles/css/react-mde-all.css';
import {
  reportDefinitionParams,
  timeRangeParams,
} from '../create/create_report_definition';
import {
  parseInContextUrl,
  getSavedSearchBaseUrlCreate,
  getVisualizationBaseUrlCreate,
  getSavedSearchOptions,
  getVisualizationOptions,
  getDashboardBaseUrlCreate,
  getDashboardOptions,
  handleDataToVisualReportSourceChange,
  getNotebooksOptions,
  getNotebooksBaseUrlCreate,
  getReportSourceFromURL,
} from './report_settings_helpers';
import { TimeRangeSelect } from './time_range';
import { converter } from '../utils';
import { ReportDefinitionSchemaType } from 'server/model';
import { ReportTrigger } from '../report_trigger';

type ReportSettingProps = {
  edit: boolean;
  editDefinitionId: string;
  reportDefinitionRequest: reportDefinitionParams;
  httpClientProps: any;
  timeRange: timeRangeParams;
  showSettingsReportNameError: boolean;
  settingsReportNameErrorMessage: string;
  showSettingsReportSourceError: boolean;
  settingsReportSourceErrorMessage: string;
  showTimeRangeError: boolean;
  showTriggerIntervalNaNError: boolean;
  showCronError: boolean;
};

export function ReportSettings(props: ReportSettingProps) {
  const {
    edit,
    editDefinitionId,
    reportDefinitionRequest,
    httpClientProps,
    timeRange,
    showSettingsReportNameError,
    settingsReportNameErrorMessage,
    showSettingsReportSourceError,
    settingsReportSourceErrorMessage,
    showTimeRangeError,
    showTriggerIntervalNaNError,
    showCronError,
  } = props;

  const [reportName, setReportName] = useState('');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSourceId, setReportSourceId] = useState('dashboardReportSource');

  const [dashboardSourceSelect, setDashboardSourceSelect] = useState([] as any);
  const [dashboards, setDashboards] = useState([] as any);

  const [visualizationSourceSelect, setVisualizationSourceSelect] = useState(
    [] as any
  );
  const [visualizations, setVisualizations] = useState([] as any);

  const [savedSearchSourceSelect, setSavedSearchSourceSelect] = useState(
    [] as any
  );
  const [savedSearches, setSavedSearches] = useState([] as any);

  const [notebooksSourceSelect, setNotebooksSourceSelect] = useState([] as any);
  const [notebooks, setNotebooks] = useState([] as any);

  const [fileFormat, setFileFormat] = useState('pdf');

  const handleDashboards = (e) => {
    setDashboards(e);
  };

  const handleVisualizations = (e) => {
    setVisualizations(e);
  };

  const handleSavedSearches = (e) => {
    setSavedSearches(e);
  };

  const handleNotebooks = (e) => {
    setNotebooks(e);
  };

  const handleReportName = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setReportName(e.target.value);
    reportDefinitionRequest.report_params.report_name =
      e.target.value.toString();
  };

  const handleReportDescription = (e: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setReportDescription(e.target.value);
    reportDefinitionRequest.report_params.description =
      e.target.value.toString();
  };

  const handleReportSource = (e: React.SetStateAction<string>) => {
    setReportSourceId(e);
    let fromInContext = false;
    if (window.location.href.includes('?')) {
      fromInContext = true;
    }
    if (e === 'dashboardReportSource') {
      reportDefinitionRequest.report_params.report_source = 'Dashboard';
      reportDefinitionRequest.report_params.core_params.base_url =
        getDashboardBaseUrlCreate(edit, editDefinitionId, fromInContext) +
        dashboards[0]?.value;

      // set params to visual report params after switch from saved search
      handleDataToVisualReportSourceChange(reportDefinitionRequest);
      setFileFormat('pdf');
    } else if (e === 'visualizationReportSource') {
      reportDefinitionRequest.report_params.report_source = 'Visualization';
      reportDefinitionRequest.report_params.core_params.base_url =
        getVisualizationBaseUrlCreate(edit, editDefinitionId, fromInContext) +
        visualizations[0]?.value;

      // set params to visual report params after switch from saved search
      handleDataToVisualReportSourceChange(reportDefinitionRequest);
      setFileFormat('pdf');
    } else if (e === 'savedSearchReportSource') {
      reportDefinitionRequest.report_params.report_source = 'Saved search';
      reportDefinitionRequest.report_params.core_params.base_url =
        getSavedSearchBaseUrlCreate(edit, editDefinitionId, fromInContext) +
        savedSearches[0]?.value;
      reportDefinitionRequest.report_params.core_params.saved_search_id =
        savedSearches[0]?.value;
      reportDefinitionRequest.report_params.core_params.report_format = 'csv';
      reportDefinitionRequest.report_params.core_params.limit = 10000;
      reportDefinitionRequest.report_params.core_params.excel = true;
    } else if (e === 'notebooksReportSource') {
      reportDefinitionRequest.report_params.report_source = 'Notebook';
      reportDefinitionRequest.report_params.core_params.base_url =
        getNotebooksBaseUrlCreate(edit, editDefinitionId, fromInContext) +
        notebooks[0]?.value;

      // set params to visual report params after switch from saved search
      handleDataToVisualReportSourceChange(reportDefinitionRequest);
      setFileFormat('pdf');
    }
  };

  const handleDashboardSelect = (e: string | any[]) => {
    setDashboardSourceSelect(e);

    let fromInContext = false;
    if (window.location.href.includes('?')) {
      fromInContext = true;
    }

    if (e.length > 0) {
      reportDefinitionRequest.report_params.core_params.base_url =
        getDashboardBaseUrlCreate(edit, editDefinitionId, fromInContext) +
        e[0].value;
    } else {
      reportDefinitionRequest.report_params.core_params.base_url = '';
    }
  };

  const handleVisualizationSelect = (e) => {
    setVisualizationSourceSelect(e);
    let fromInContext = false;
    if (window.location.href.includes('?')) {
      fromInContext = true;
    }

    if (e.length > 0) {
      reportDefinitionRequest.report_params.core_params.base_url =
        getVisualizationBaseUrlCreate(edit, editDefinitionId, fromInContext) +
        e[0].value;
    } else {
      reportDefinitionRequest.report_params.core_params.base_url = '';
    }
  };

  const handleSavedSearchSelect = (e) => {
    setSavedSearchSourceSelect(e);
    let fromInContext = false;
    if (window.location.href.includes('?')) {
      fromInContext = true;
    }
    if (e.length > 0) {
      reportDefinitionRequest.report_params.core_params.saved_search_id =
        e[0].value;

      reportDefinitionRequest.report_params.core_params.base_url =
        getSavedSearchBaseUrlCreate(edit, editDefinitionId, fromInContext) +
        e[0].value;
    } else {
      reportDefinitionRequest.report_params.core_params.base_url = '';
    }
  };

  const handleNotebooksSelect = (e) => {
    setNotebooksSourceSelect(e);
    let fromInContext = false;
    if (window.location.href.includes('?')) {
      fromInContext = true;
    }
    if (e.length > 0) {
      reportDefinitionRequest.report_params.core_params.base_url =
        getNotebooksBaseUrlCreate(edit, editDefinitionId, fromInContext) +
        e[0].value;
    } else {
      reportDefinitionRequest.report_params.core_params.base_url = '';
    }
  };

  const handleFileFormat = (e: React.SetStateAction<string>) => {
    setFileFormat(e);
    reportDefinitionRequest.report_params.core_params.report_format =
      e.toString();
  };

  const PDFandPNGFileFormats = () => {
    return (
      <div>
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.reportSettingProps.fileFormat',
            {
              defaultMessage: 'File format',
            }
          )}
        >
          <EuiRadioGroup
            options={PDF_PNG_FILE_FORMAT_OPTIONS}
            idSelected={fileFormat}
            onChange={handleFileFormat}
          />
        </EuiFormRow>
      </div>
    );
  };

  const CSVandXLSXFileFormats = () => {
    return (
      <div>
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.reportSettingProps.fileFormat',
            {
              defaultMessage: 'File format',
            }
          )}
        >
          <EuiRadioGroup
            options={SAVED_SEARCH_FORMAT_OPTIONS}
            idSelected={fileFormat}
            onChange={handleFileFormat}
          />
        </EuiFormRow>
      </div>
    );
  };

  const SettingsMarkdown = () => {
    const [checkboxIdSelectHeaderFooter, setCheckboxIdSelectHeaderFooter] =
      useState({ ['header']: false, ['footer']: false });

    const [footer, setFooter] = useState('');
    const [selectedTabFooter, setSelectedTabFooter] = React.useState<
      'write' | 'preview'
    >('write');

    const [header, setHeader] = useState('');
    const [selectedTabHeader, setSelectedTabHeader] = React.useState<
      'write' | 'preview'
    >('write');

    const handleHeader = (e) => {
      setHeader(e);
      reportDefinitionRequest.report_params.core_params.header = e;
    };

    const handleFooter = (e) => {
      setFooter(e);
      reportDefinitionRequest.report_params.core_params.footer = e;
    };

    const handleCheckboxHeaderFooter = (optionId) => {
      const newCheckboxIdToSelectedMap = {
        ...checkboxIdSelectHeaderFooter,
        ...{
          [optionId]: !checkboxIdSelectHeaderFooter[optionId],
        },
      };
      setCheckboxIdSelectHeaderFooter(newCheckboxIdToSelectedMap);
    };

    const showFooter = checkboxIdSelectHeaderFooter.footer ? (
      <EuiFormRow
        label={i18n.translate('opensearch.reports.reportSettingProps.footer', {
          defaultMessage: 'Footer',
        })}
        fullWidth={true}
      >
        <ReactMde
          value={footer}
          onChange={handleFooter}
          selectedTab={selectedTabFooter}
          onTabChange={setSelectedTabFooter}
          toolbarCommands={[
            ['header', 'bold', 'italic', 'strikethrough'],
            ['unordered-list', 'ordered-list', 'checked-list'],
          ]}
          generateMarkdownPreview={(markdown) =>
            Promise.resolve(converter.makeHtml(markdown))
          }
        />
      </EuiFormRow>
    ) : null;

    const showHeader = checkboxIdSelectHeaderFooter.header ? (
      <EuiFormRow
        label={i18n.translate('opensearch.reports.reportSettingProps.header', {
          defaultMessage: 'Header',
        })}
        fullWidth={true}
      >
        <ReactMde
          value={header}
          onChange={handleHeader}
          selectedTab={selectedTabHeader}
          onTabChange={setSelectedTabHeader}
          toolbarCommands={[
            ['header', 'bold', 'italic', 'strikethrough'],
            ['unordered-list', 'ordered-list', 'checked-list'],
          ]}
          generateMarkdownPreview={(markdown) =>
            Promise.resolve(converter.makeHtml(markdown))
          }
        />
      </EuiFormRow>
    ) : null;

    useEffect(() => {
      let unmounted = false;
      if (edit) {
        httpClientProps
          .get(`../api/reporting/reportDefinitions/${editDefinitionId}`)
          .then(async (response: {}) => {
            const reportDefinition: ReportDefinitionSchemaType =
              response.report_definition;
            const {
              report_params: {
                core_params: { header, footer },
              },
            } = reportDefinition;
            // set header/footer default
            if (header) {
              checkboxIdSelectHeaderFooter.header = true;
              if (!unmounted) {
                setHeader(header);
              }
            }
            if (footer) {
              checkboxIdSelectHeaderFooter.footer = true;
              if (!unmounted) {
                setFooter(footer);
              }
            }
          })
          .catch((error: any) => {
            console.error(
              'error in fetching report definition details:',
              error
            );
          });
      } else {
        // keeps header/footer from re-rendering empty when other fields in Report Settings are changed
        checkboxIdSelectHeaderFooter.header =
          'header' in reportDefinitionRequest.report_params.core_params;
        checkboxIdSelectHeaderFooter.footer =
          'footer' in reportDefinitionRequest.report_params.core_params;
        if (checkboxIdSelectHeaderFooter.header) {
          setHeader(reportDefinitionRequest.report_params.core_params.header);
        }
        if (checkboxIdSelectHeaderFooter.footer) {
          setFooter(reportDefinitionRequest.report_params.core_params.footer);
        }
      }
      return () => {
        unmounted = true;
      };
    }, []);

    return (
      <div>
        <EuiCheckboxGroup
          options={HEADER_FOOTER_CHECKBOX}
          idToSelectedMap={checkboxIdSelectHeaderFooter}
          onChange={handleCheckboxHeaderFooter}
          legend={{
            children: i18n.translate(
              'opensearch.reports.reportSettingProps.headerAndFooter',
              { defaultMessage: 'Report header and footer' }
            ),
          }}
        />
        <EuiSpacer />
        {showHeader}
        {showFooter}
      </div>
    );
  };

  const VisualReportFormatAndMarkdown = () => {
    return (
      <div>
        <PDFandPNGFileFormats />
        <EuiSpacer />
      </div>
    );
  };

  const DataReportFormatAndMarkdown = () => {
    return (
      <div>
        <CSVandXLSXFileFormats />
      </div>
    );
  };

  const setReportSourceDropdownOption = (options, reportSource, url) => {
    let index = 0;
    if (reportSource === REPORT_SOURCE_TYPES.dashboard) {
      for (index = 0; index < options.dashboard.length; ++index) {
        if (url.includes(options.dashboard[index].value)) {
          setDashboardSourceSelect([options.dashboard[index]]);
        }
      }
    } else if (reportSource === REPORT_SOURCE_TYPES.visualization) {
      for (index = 0; index < options.visualizations.length; ++index) {
        if (url.includes(options.visualizations[index].value)) {
          setVisualizationSourceSelect([options.visualizations[index]]);
        }
      }
    } else if (reportSource === REPORT_SOURCE_TYPES.savedSearch) {
      for (index = 0; index < options.savedSearch.length; ++index) {
        if (url.includes(options.savedSearch[index].value)) {
          setSavedSearchSourceSelect([options.savedSearch[index]]);
        }
      }
    }
  };

  const setDefaultFileFormat = (fileFormat) => {
    let index = 0;
    for (index = 0; index < PDF_PNG_FILE_FORMAT_OPTIONS.length; ++index) {
      if (
        fileFormat.toUpperCase() === PDF_PNG_FILE_FORMAT_OPTIONS[index].label
      ) {
        setFileFormat(PDF_PNG_FILE_FORMAT_OPTIONS[index].id);
      }
    }
  };

  const setDashboardFromInContextMenu = (response, id) => {
    let index;
    for (index = 0; index < response.dashboard.length; ++index) {
      if (id === response.dashboard[index].value) {
        setDashboardSourceSelect([response.dashboard[index]]);
      }
    }
  };

  const setVisualizationFromInContextMenu = (response, id) => {
    let index;
    for (index = 0; index < response.visualizations.length; ++index) {
      if (id === response.visualizations[index].value) {
        setVisualizationSourceSelect([response.visualizations[index]]);
      }
    }
  };

  const setSavedSearchFromInContextMenu = (response, id) => {
    let index;
    for (index = 0; index < response.savedSearch.length; ++index) {
      if (id === response.savedSearch[index].value) {
        setSavedSearchSourceSelect([response.savedSearch[index]]);
      }
    }
  };

  const setNotebookFromInContextMenu = (response, id) => {
    for (let index = 0; index < response.notebooks.length; ++index) {
      if (id === response.notebooks[index].value) {
        setNotebooksSourceSelect([response.notebooks[index]]);
      }
    }
  };

  const setInContextDefaultConfiguration = (response) => {
    const url = window.location.href;
    const source = getReportSourceFromURL(url);
    const id = parseInContextUrl(url, 'id');
    if (source === 'dashboard') {
      setReportSourceId('dashboardReportSource');
      reportDefinitionRequest.report_params.report_source =
        REPORT_SOURCE_RADIOS[0].label;

      setDashboardFromInContextMenu(response, id);
      reportDefinitionRequest.report_params.core_params.base_url =
        getDashboardBaseUrlCreate(edit, id, true) + id;
    } else if (source === 'visualize') {
      setReportSourceId('visualizationReportSource');
      reportDefinitionRequest.report_params.report_source =
        REPORT_SOURCE_RADIOS[1].label;

      setVisualizationFromInContextMenu(response, id);
      reportDefinitionRequest.report_params.core_params.base_url =
        getVisualizationBaseUrlCreate(edit, editDefinitionId, true) + id;
    } else if (source === 'discover') {
      setReportSourceId('savedSearchReportSource');
      reportDefinitionRequest.report_params.core_params.report_format = 'csv';
      reportDefinitionRequest.report_params.core_params.saved_search_id = id;
      reportDefinitionRequest.report_params.report_source =
        REPORT_SOURCE_RADIOS[2].label;

      setSavedSearchFromInContextMenu(response, id);
      reportDefinitionRequest.report_params.core_params.base_url =
        getSavedSearchBaseUrlCreate(edit, editDefinitionId, true) + id;
    } else if (source === 'notebook') {
      setReportSourceId('notebooksReportSource');
      reportDefinitionRequest.report_params.report_source =
        REPORT_SOURCE_RADIOS[3].label;

      setNotebookFromInContextMenu(response, id);
      reportDefinitionRequest.report_params.core_params.base_url =
        getNotebooksBaseUrlCreate(edit, id, true) + id;
      // set placeholder time range since notebooks doesn't use it
      reportDefinitionRequest.report_params.core_params.time_duration = 'PT30M';
    }
  };

  const setDefaultEditValues = async (response, reportSourceOptions) => {
    setReportName(response.report_definition.report_params.report_name);
    setReportDescription(response.report_definition.report_params.description);
    reportDefinitionRequest.report_params.report_name =
      response.report_definition.report_params.report_name;
    reportDefinitionRequest.report_params.description =
      response.report_definition.report_params.description;
    reportDefinitionRequest.report_params =
      response.report_definition.report_params;
    const reportSource = response.report_definition.report_params.report_source;
    REPORT_SOURCE_RADIOS.map((radio) => {
      if (radio.label === reportSource) {
        setReportSourceId(radio.id);
        reportDefinitionRequest.report_params.report_source = reportSource;
      }
    });
    setDefaultFileFormat(
      response.report_definition.report_params.core_params.report_format
    );
    setReportSourceDropdownOption(
      reportSourceOptions,
      reportSource,
      response.report_definition.report_params.core_params.base_url
    );
  };

  const defaultConfigurationEdit = async (httpClientProps) => {
    let editData = {};
    await httpClientProps
      .get(`../api/reporting/reportDefinitions/${editDefinitionId}`)
      .then(async (response: {}) => {
        editData = response;
      })
      .catch((error: any) => {
        console.error('error in fetching report definition details:', error);
      });
    return editData;
  };

  const defaultConfigurationCreate = async (httpClientProps) => {
    let reportSourceOptions = {
      dashboard: [],
      visualizations: [],
      savedSearch: [],
      notebooks: [],
    };
    reportDefinitionRequest.report_params.core_params.report_format =
      fileFormat;
    await httpClientProps
      .get('../api/reporting/getReportSource/dashboard')
      .then(async (response) => {
        let dashboardOptions = getDashboardOptions(response['hits']['hits']);
        reportSourceOptions.dashboard = dashboardOptions;
        handleDashboards(dashboardOptions);
        if (!edit) {
          reportDefinitionRequest.report_params.report_source = 'Dashboard';
        }
      })
      .catch((error) => {
        console.log('error when fetching dashboards:', error);
      });

    await httpClientProps
      .get('../api/reporting/getReportSource/visualization')
      .then(async (response) => {
        let visualizationOptions = getVisualizationOptions(
          response['hits']['hits']
        );
        reportSourceOptions.visualizations = visualizationOptions;
        await handleVisualizations(visualizationOptions);
      })
      .catch((error) => {
        console.log('error when fetching visualizations:', error);
      });

    await httpClientProps
      .get('../api/reporting/getReportSource/search')
      .then(async (response) => {
        let savedSearchOptions = getSavedSearchOptions(
          response['hits']['hits']
        );
        reportSourceOptions.savedSearch = savedSearchOptions;
        await handleSavedSearches(savedSearchOptions);
      })
      .catch((error) => {
        console.log('error when fetching saved searches:', error);
      });

    await httpClientProps
      .get('../api/observability/notebooks/savedNotebook')
      .catch((error: any) => {
        console.error(
          'error fetching notebooks, retrying with legacy api',
          error
        );
        return httpClientProps.get('../api/notebooks/');
      })
      .then(async (response: any) => {
        let notebooksOptions = getNotebooksOptions(response.data);
        reportSourceOptions.notebooks = notebooksOptions;
        await handleNotebooks(notebooksOptions);
      })
      .catch((error) => {
        console.log('error when fetching notebooks:', error);
      });
    return reportSourceOptions;
  };

  useEffect(() => {
    let reportSourceOptions = {};
    let editData = {};
    if (edit) {
      defaultConfigurationEdit(httpClientProps).then(async (response) => {
        editData = response;
      });
    }
    defaultConfigurationCreate(httpClientProps).then(async (response) => {
      reportSourceOptions = response;
      // if coming from in-context menu
      if (window.location.href.indexOf('?') > -1) {
        setInContextDefaultConfiguration(response);
      }
      if (edit) {
        setDefaultEditValues(editData, reportSourceOptions);
      }
    });
  }, []);

  const displayDashboardSelect =
    reportSourceId === 'dashboardReportSource' ? (
      <div>
        <EuiFormRow
          id="reportSourceDashboardSelect"
          label={i18n.translate(
            'opensearch.reports.reportSettingProps.selectDashboard',
            { defaultMessage: 'Select dashboard' }
          )}
          isInvalid={showSettingsReportSourceError}
          error={settingsReportSourceErrorMessage}
        >
          <EuiComboBox
            id="reportSourceDashboardSelector"
            placeholder={i18n.translate(
              'opensearch.reports.reportSettingProps.placeholder.selectDashboard',
              { defaultMessage: 'Select a dashboard' }
            )}
            singleSelection={{ asPlainText: true }}
            options={dashboards}
            onChange={handleDashboardSelect}
            selectedOptions={dashboardSourceSelect}
          />
        </EuiFormRow>
        <EuiSpacer />
      </div>
    ) : null;

  const displayVisualizationSelect =
    reportSourceId === 'visualizationReportSource' ? (
      <div>
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.reportSettingProps.form.selectVisualization',
            { defaultMessage: 'Select visualization' }
          )}
          isInvalid={showSettingsReportSourceError}
          error={settingsReportSourceErrorMessage}
        >
          <EuiComboBox
            id="reportSourceVisualizationSelect"
            placeholder={i18n.translate(
              'opensearch.reports.reportSettingProps.form.placeholder.selectAVisualization',
              { defaultMessage: 'Select a visualization' }
            )}
            singleSelection={{ asPlainText: true }}
            options={visualizations}
            onChange={handleVisualizationSelect}
            selectedOptions={visualizationSourceSelect}
          />
        </EuiFormRow>
        <EuiSpacer />
      </div>
    ) : null;

  const displaySavedSearchSelect =
    reportSourceId === 'savedSearchReportSource' ? (
      <div>
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.reportSettingProps.form.selectSavedSearch',
            { defaultMessage: 'Select saved search' }
          )}
          isInvalid={showSettingsReportSourceError}
          error={settingsReportSourceErrorMessage}
        >
          <EuiComboBox
            id="reportSourceSavedSearchSelect"
            placeholder={i18n.translate(
              'opensearch.reports.reportSettingProps.form.placeholder.selectASavedSearch',
              { defaultMessage: 'Select a saved search' }
            )}
            singleSelection={{ asPlainText: true }}
            options={savedSearches}
            onChange={handleSavedSearchSelect}
            selectedOptions={savedSearchSourceSelect}
          />
        </EuiFormRow>
        <EuiSpacer />
      </div>
    ) : null;

  const displayVisualReportsFormatAndMarkdown =
    reportSourceId != 'savedSearchReportSource' ? (
      <div>
        <VisualReportFormatAndMarkdown />
        <SettingsMarkdown />
      </div>
    ) : (
      <DataReportFormatAndMarkdown />
    );

  const displayNotebooksSelect =
    reportSourceId === 'notebooksReportSource' ? (
      <div>
        <EuiFormRow
          label="Select notebook"
          isInvalid={showSettingsReportSourceError}
          error={settingsReportSourceErrorMessage}
        >
          <EuiComboBox
            id="reportSourceNotebooksSelect"
            placeholder="Select a notebook"
            singleSelection={{ asPlainText: true }}
            options={notebooks}
            onChange={handleNotebooksSelect}
            selectedOptions={notebooksSourceSelect}
          />
        </EuiFormRow>
        <EuiSpacer />
      </div>
    ) : null;

  const displayTimeRangeSelect =
    reportSourceId != 'notebooksReportSource' ? (
      <div>
        <TimeRangeSelect
          timeRange={timeRange}
          reportDefinitionRequest={reportDefinitionRequest}
          edit={edit}
          id={editDefinitionId}
          httpClientProps={httpClientProps}
          showTimeRangeError={showTimeRangeError}
        />
        <EuiSpacer />
      </div>
    ) : null;

  return (
    <EuiPageContent panelPaddingSize={'l'}>
      <EuiPageHeader>
        <EuiTitle>
          <h2>
            {i18n.translate(
              'opensearch.reports.reportSettingProps.form.reportSettings',
              { defaultMessage: 'Report settings' }
            )}
          </h2>
        </EuiTitle>
      </EuiPageHeader>
      <EuiHorizontalRule />
      <EuiPageContentBody>
        <EuiFlexGroup>
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate(
                'opensearch.reports.reportSettingProps.form.name',
                { defaultMessage: 'Name' }
              )}
              helpText={i18n.translate(
                'opensearch.reports.reportSettingProps.form.help.name',
                {
                  defaultMessage:
                    'Valid characters are a-z, A-Z, 0-9, (), [], _ (underscore), - (hyphen) and (space).',
                }
              )}
              isInvalid={showSettingsReportNameError}
              error={settingsReportNameErrorMessage}
              id={'reportSettingsName'}
            >
              <EuiFieldText
                placeholder={i18n.translate(
                  'opensearch.reports.reportSettingProps.form.placeholder.reportName',
                  {
                    defaultMessage:
                      'Report name (e.g Log Traffic Daily Report)',
                  }
                )}
                value={reportName}
                onChange={handleReportName}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiFlexGroup style={{ maxWidth: 600 }}>
          <EuiFlexItem>
            <EuiFormRow
              label={i18n.translate(
                'opensearch.reports.reportSettingProps.form.description',
                { defaultMessage: 'Description (optional)' }
              )}
              id={'reportSettingsDescription'}
            >
              <EuiTextArea
                placeholder={i18n.translate(
                  'opensearch.reports.reportSettingProps.form.placeholder.description',
                  {
                    defaultMessage:
                      'Describe this report (e.g Morning daily reports for log traffic)',
                  }
                )}
                value={reportDescription}
                onChange={handleReportDescription}
              />
            </EuiFormRow>
          </EuiFlexItem>
        </EuiFlexGroup>
        <EuiSpacer />
        <EuiFormRow
          label={i18n.translate(
            'opensearch.reports.reportSettingProps.form.reportSource',
            { defaultMessage: 'Report source' }
          )}
        >
          <EuiRadioGroup
            options={REPORT_SOURCE_RADIOS}
            idSelected={reportSourceId}
            onChange={handleReportSource}
            disabled={edit}
          />
        </EuiFormRow>
        <EuiSpacer />
        {displayDashboardSelect}
        {displayVisualizationSelect}
        {displaySavedSearchSelect}
        {/* <TimeRangeSelect
          timeRange={timeRange}
          reportDefinitionRequest={reportDefinitionRequest}
          edit={edit}
          id={editDefinitionId}
          httpClientProps={httpClientProps}
          showTimeRangeError={showTimeRangeError}
        />
        <EuiSpacer /> */}
        {displayNotebooksSelect}
        {displayTimeRangeSelect}
        {displayVisualReportsFormatAndMarkdown}
        <EuiSpacer />
        <ReportTrigger
          edit={edit}
          editDefinitionId={editDefinitionId}
          httpClientProps={httpClientProps}
          reportDefinitionRequest={reportDefinitionRequest}
          showTriggerIntervalNaNError={showTriggerIntervalNaNError}
          showCronError={showCronError}
        />
      </EuiPageContentBody>
    </EuiPageContent>
  );
}
