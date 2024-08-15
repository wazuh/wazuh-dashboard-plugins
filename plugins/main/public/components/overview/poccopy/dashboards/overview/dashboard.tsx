import React, { useState, useEffect } from 'react';
import { SearchResponse } from '../../../../../../../../src/core/server';
import { getPlugins } from '../../../../../kibana-services';
import { ViewMode } from '../../../../../../../../src/plugins/embeddable/public';
import { getDashboardPanels } from './dashboard_panels';
import { I18nProvider } from '@osd/i18n/react';
import useSearchBar from '../../../../common/search-bar/use-search-bar';
import { getDashboardFilters } from './dashboard_panels_filters';
import { getKPIsPanel } from './dashboard_panels_kpis';
import { withErrorBoundary } from '../../../../common/hocs';
import { DiscoverNoResults } from '../../common/components/no_results';
import { LoadingSpinner } from '../../common/components/loading_spinner';
import {
  ErrorFactory,
  ErrorHandler,
  HttpError,
} from '../../../../../react-services/error-management';
import { compose } from 'redux';
import {
  withVulnerabilitiesStateDataSource,
  createDashboard,
} from '../../common/hocs/validate-vulnerabilities-states-index-pattern';
import { ModuleEnabledCheck } from '../../common/components/check-module-enabled';
import { getHttp, getDataPlugin } from '../../../../../kibana-services';
import { WzRequest } from '../../../../../../public/react-services/wz-request';
import {
  VulnerabilitiesDataSourceRepository,
  VulnerabilitiesDataSource,
  PatternDataSource,
  tParsedIndexPattern,
} from '../../../../common/data-source';
import { useDataSource } from '../../../../common/data-source/hooks';
import { IndexPattern } from '../../../../../../../../src/plugins/data/public';
import { WzSearchBar } from '../../../../common/search-bar';
import { GenericRequest } from '../../../../../react-services/generic-request';
import { SavedObject } from '../../../../../react-services';
// import file from './dashvis.ndjson';
import { PLUGIN_PLATFORM_REQUEST_HEADERS } from '../../../../../../common/constants';

//Contenido NDJSON
// Contenido de la cadena NDJSON
const ndjsonData = `{"attributes":{"fields":"[{\\"count\\":0,\\"name\\":\\"_index\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"_index\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":false},{\\"count\\":0,\\"name\\":\\"_source\\",\\"type\\":\\"_source\\",\\"esTypes\\":[\\"_source\\"],\\"scripted\\":false,\\"searchable\\":false,\\"aggregatable\\":false,\\"readFromDocValues\\":false},{\\"count\\":0,\\"name\\":\\"agent.build.original\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"agent.ephemeral_id\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"agent.id\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"agent.name\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"agent.type\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"agent.version\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"ecs.version\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"host.os.family\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"host.os.full\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"host.os.full.text\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"text\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":false,\\"readFromDocValues\\":false,\\"subType\\":{\\"multi\\":{\\"parent\\":\\"host.os.full\\"}}},{\\"count\\":0,\\"name\\":\\"host.os.kernel\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"host.os.name\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"host.os.name.text\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"text\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":false,\\"readFromDocValues\\":false,\\"subType\\":{\\"multi\\":{\\"parent\\":\\"host.os.name\\"}}},{\\"count\\":0,\\"name\\":\\"host.os.platform\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"host.os.type\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"host.os.version\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"message\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"text\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":false,\\"readFromDocValues\\":false},{\\"count\\":0,\\"name\\":\\"package.architecture\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"package.build_version\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"package.checksum\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"package.description\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"package.install_scope\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"package.installed\\",\\"type\\":\\"date\\",\\"esTypes\\":[\\"date\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"package.license\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"package.name\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"package.path\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"package.reference\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"package.size\\",\\"type\\":\\"number\\",\\"esTypes\\":[\\"long\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"package.type\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"package.version\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"tags\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.category\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.classification\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.description\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.description.text\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"text\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":false,\\"readFromDocValues\\":false,\\"subType\\":{\\"multi\\":{\\"parent\\":\\"vulnerability.description\\"}}},{\\"count\\":0,\\"name\\":\\"vulnerability.detected_at\\",\\"type\\":\\"date\\",\\"esTypes\\":[\\"date\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.enumeration\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.id\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.published_at\\",\\"type\\":\\"date\\",\\"esTypes\\":[\\"date\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.reference\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.report_id\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.scanner.vendor\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.score.base\\",\\"type\\":\\"number\\",\\"esTypes\\":[\\"float\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.score.environmental\\",\\"type\\":\\"number\\",\\"esTypes\\":[\\"float\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.score.temporal\\",\\"type\\":\\"number\\",\\"esTypes\\":[\\"float\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.score.version\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"vulnerability.severity\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"wazuh.cluster.name\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"wazuh.cluster.node\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"wazuh.manager.name\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true},{\\"count\\":0,\\"name\\":\\"wazuh.node.name\\",\\"type\\":\\"string\\",\\"esTypes\\":[\\"keyword\\"],\\"scripted\\":false,\\"searchable\\":true,\\"aggregatable\\":true,\\"readFromDocValues\\":true}]","title":"wazuh-states-vulnerabilities-*"},"id":"wazuh-states-vulnerabilities-*","migrationVersion":{"index-pattern":"7.6.0"},"references":[],"type":"index-pattern","updated_at":"2024-08-08T16:23:10.532Z","version":"WzI4MCwxXQ=="}
{"attributes":{"description":"","kibanaSavedObjectMeta":{"searchSourceJSON":"{\\"query\\":{\\"query\\":\\"\\",\\"language\\":\\"kuery\\"},\\"filter\\":[],\\"indexRefName\\":\\"kibanaSavedObjectMeta.searchSourceJSON.index\\"}"},"title":"vis","uiStateJSON":"{}","version":1,"visState":"{\\"title\\":\\"vis\\",\\"type\\":\\"area\\",\\"aggs\\":[{\\"id\\":\\"1\\",\\"enabled\\":true,\\"type\\":\\"count\\",\\"params\\":{},\\"schema\\":\\"metric\\"},{\\"id\\":\\"2\\",\\"enabled\\":true,\\"type\\":\\"terms\\",\\"params\\":{\\"field\\":\\"agent.name\\",\\"orderBy\\":\\"1\\",\\"order\\":\\"desc\\",\\"size\\":5,\\"otherBucket\\":false,\\"otherBucketLabel\\":\\"Other\\",\\"missingBucket\\":false,\\"missingBucketLabel\\":\\"Missing\\"},\\"schema\\":\\"segment\\"}],\\"params\\":{\\"type\\":\\"area\\",\\"grid\\":{\\"categoryLines\\":false},\\"categoryAxes\\":[{\\"id\\":\\"CategoryAxis-1\\",\\"type\\":\\"category\\",\\"position\\":\\"bottom\\",\\"show\\":true,\\"style\\":{},\\"scale\\":{\\"type\\":\\"linear\\"},\\"labels\\":{\\"show\\":true,\\"filter\\":true,\\"truncate\\":100},\\"title\\":{}}],\\"valueAxes\\":[{\\"id\\":\\"ValueAxis-1\\",\\"name\\":\\"LeftAxis-1\\",\\"type\\":\\"value\\",\\"position\\":\\"left\\",\\"show\\":true,\\"style\\":{},\\"scale\\":{\\"type\\":\\"linear\\",\\"mode\\":\\"normal\\"},\\"labels\\":{\\"show\\":true,\\"rotate\\":0,\\"filter\\":false,\\"truncate\\":100},\\"title\\":{\\"text\\":\\"Count\\"}}],\\"seriesParams\\":[{\\"show\\":true,\\"type\\":\\"area\\",\\"mode\\":\\"stacked\\",\\"data\\":{\\"label\\":\\"Count\\",\\"id\\":\\"1\\"},\\"drawLinesBetweenPoints\\":true,\\"lineWidth\\":2,\\"showCircles\\":true,\\"interpolate\\":\\"linear\\",\\"valueAxis\\":\\"ValueAxis-1\\"}],\\"addTooltip\\":true,\\"addLegend\\":true,\\"legendPosition\\":\\"right\\",\\"times\\":[],\\"addTimeMarker\\":false,\\"thresholdLine\\":{\\"show\\":false,\\"value\\":10,\\"width\\":1,\\"style\\":\\"full\\",\\"color\\":\\"#E7664C\\"},\\"labels\\":{}}}"},"id":"9caace70-55a1-11ef-a580-5b5ba88681be","migrationVersion":{"visualization":"7.10.0"},"references":[{"id":"wazuh-states-vulnerabilities-*","name":"kibanaSavedObjectMeta.searchSourceJSON.index","type":"index-pattern"}],"type":"visualization","updated_at":"2024-08-08T16:23:10.532Z","version":"WzI4MSwxXQ=="}
{"attributes":{"description":"","hits":0,"kibanaSavedObjectMeta":{"searchSourceJSON":"{\\"query\\":{\\"query\\":\\"\\",\\"language\\":\\"kuery\\"},\\"filter\\":[]}"},"optionsJSON":"{\\"useMargins\\":true,\\"hidePanelTitles\\":false}","panelsJSON":"[{\\"version\\":\\"2.13.0\\",\\"gridData\\":{\\"x\\":0,\\"y\\":0,\\"w\\":24,\\"h\\":15,\\"i\\":\\"dde69adc-98bc-4c6d-bd0b-3756c9d0228e\\"},\\"panelIndex\\":\\"dde69adc-98bc-4c6d-bd0b-3756c9d0228e\\",\\"embeddableConfig\\":{},\\"panelRefName\\":\\"panel_0\\"}]","timeRestore":false,"title":"dash","version":1},"id":"94febc80-55a2-11ef-a580-5b5ba88681be","migrationVersion":{"dashboard":"7.9.3"},"references":[{"id":"9caace70-55a1-11ef-a580-5b5ba88681be","name":"panel_0","type":"visualization"}],"type":"dashboard","updated_at":"2024-08-08T16:23:44.456Z","version":"WzI4MiwxXQ=="}
{"exportedCount":3,"missingRefCount":0,"missingReferences":[]}`;

// Crear un Blob a partir del contenido NDJSON
// const ndjsonBlob = new Blob([ndjsonData], { type: 'application/x-ndjson' });
// // const formData = new FormData();
// // formData.append('file', ndjsonBlob);

// const sendNdjson = async blob => {
//   try {
//     const result = await GenericRequest.request(
//       'POST',
//       '/api/saved_objects/_import',
//       ndjsonBlob,
//       false,
//       true,
//     );

//     console.log(result, 'result blob');

//     return result;
//   } catch (error) {
//     throw ((error || {}).data || {}).message || false
//       ? new Error(error.data.message)
//       : error;
//   }
// };
// sendNdjson(ndjsonBlob);

const DashboardByRenderer =
  getPlugins().dashboard.DashboardContainerByValueRenderer;

const transformPanelsJSON = ({ panelsJSON, references }) =>
  Object.fromEntries(
    JSON.parse(panelsJSON).map(({ gridData, panelIndex, panelRefName }) => [
      panelIndex,
      {
        gridData: gridData,
        type: 'visualization',
        explicitInput: {
          id: panelIndex,
          savedObjectId: references.find(({ name }) => name === panelRefName)
            .id,
        },
      },
    ]),
  );

const transform = spec => {
  const options = JSON.parse(spec.attributes.optionsJSON);
  return {
    title: spec.attributes.title,
    panels: transformPanelsJSON({
      panelsJSON: spec.attributes.panelsJSON,
      references: spec.references,
    }),
    useMargins: options.useMargins,
    hidePanelTitles: options.hidePanelTitles,
    description: spec.attributes.description,
    id: spec.id,
  };
};

export const DashboardSavedObject = ({ savedObjectId }) => {
  const [dashboardSpecForComponent, setDashboardSpecForComponent] =
    useState(null);

  useEffect(() => {
    console.log('entre al useEffect');

    (async () => {
      try {
        const { data } = await GenericRequest.request(
          'GET',
          `/api/saved_objects/dashboard/${savedObjectId}`,
        );
        // Transform to the expected by the render component
        const dashboardSpecRenderer = transform(data);
        console.log(dashboardSpecRenderer, 'dashboardSpecRenderer');
        setDashboardSpecForComponent(dashboardSpecRenderer);
      } catch (error) {
        console.error('Error fetching dashboard:', error);
      }
    })();
  }, [savedObjectId]);

  return dashboardSpecForComponent ? (
    <DashboardByRenderer
      input={{
        ...dashboardSpecForComponent,
        viewMode: ViewMode.VIEW,
        isFullScreenMode: false,
        filters: [],
        query: '',
        refreshConfig: {
          pause: false,
          value: 15,
        },
      }}
    />
  ) : (
    <p>Loading dashboard...</p>
  );
};
const getAllDashboards = async () => {
  try {
    const { data } = await GenericRequest.request(
      'GET',
      '/api/saved_objects/_find?type=dashboard',
    );
    return data.saved_objects;
  } catch (error) {
    console.error('Error fetching dashboards:', error);
    return [];
  }
};

const DashboardComponent = () => {
  const [idDashboard, setIdDashboard] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const handleFile = async e => {
    e.preventDefault();
    const file = e.target.files[0];
    try {
      const myHeaders = new Headers();
      myHeaders.append('osd-xsrf', 'true');
      myHeaders.append('Authorization', 'Basic YWRtaW46YWRtaW4=');
      myHeaders.append(
        'Cookie',
        'security_authentication=Fe26.2**24b9dd400347e3c6d5b85b21cf0bba620ac2703644514e11248c110e2f597292*1DoNdnCbl1l-M5IWq0yraQ*F_haGiEJGLLL5WfO4Ydcs9_MffBbOYS8eg88gJwhmrX8g33g-baGykq16O_mzjCGBguMHy6g4ozlmQqrKZf9q6D-jH1AI6h5KhtaLGbZiEyZddlwvEDvJ39s8va8NWQQR_KMw-fbcK-T9RhLGKqNmskEf11xM1gKnvsp7Uy74T73ziBQIFCsZmaePaI0m4kg**09949aa5a7bc8d6aa9b9a4963bb33d76f21bae4a3d0f55f6d2d5b7ded0c598c5*eNnWZjCOL43kB6qF6xSOLZq4dWZ7bxieq8bm3f58INw',
      );
      // const dash = await fetch('./dashvis.ndjson');
      // const blobDash = await dash.blob();
      // const ndjsonBlob = new Blob([ndjsonData], {
      //   type: 'application/x-ndjson',
      // });

      const formdata = new FormData();
      formdata.append('file', file);

      WzRequest.genericReq(
        'POST',
        '/api/saved_objects/_import?overwrite=true',
        formdata,
        { overwriteHeaders: { 'content-type': 'multipart/form-data' } },
      );

      const requestOptions = {
        method: 'POST',
        headers: {
          ...PLUGIN_PLATFORM_REQUEST_HEADERS,
          // 'content-type': 'multipart/form-data',
        },
        body: formdata,
        // redirect: 'follow',
      };
      const tmpUrl = getHttp().basePath.prepend(
        '/api/saved_objects/_import?overwrite=true',
      );

      // fetch(
      //   'https://localhost:5601/api/saved_objects/_import?overwrite=true',
      //   requestOptions,
      // )
      //     .then(response => response.text())
      //     .then(result => console.log(result))
      //     .catch(error => console.error(error));
    } catch (error) {
      console.log(error);
    }
  };
  useEffect(() => {
    (async () => {
      try {
        const dashboardVuls = await WzRequest.genericReq(
          'GET',
          '/api/dashboards/vulnerabilityDashboard.ndjson',
        );

        // const dash = await fetch('./dashvis.ndjson');
        // const blobDash = await dash.blob();
        const ndjsonBlob = new Blob([dashboardVuls.data], {
          type: 'application/x-ndjson',
        });

        const formdata = new FormData();
        formdata.append('file', ndjsonBlob, 'ndjsonBlob.ndjson');

        WzRequest.genericReq(
          'POST',
          '/api/saved_objects/_import?overwrite=true',
          formdata,
          { overwriteHeaders: { 'content-type': 'multipart/form-data' } },
        );

        const requestOptions = {
          method: 'POST',
          headers: {
            ...PLUGIN_PLATFORM_REQUEST_HEADERS,
            // 'content-type': 'multipart/form-data',
          },
          body: formdata,
          // redirect: 'follow',
        };
        const tmpUrl = getHttp().basePath.prepend(
          '/api/saved_objects/_import?overwrite=true',
        );

        // fetch(
        //   'https://localhost:5601/api/saved_objects/_import?overwrite=true',
        //   requestOptions,
        // )
      } catch (error) {
        console.log(error);
      }
    })();
    (async () => {
      try {
        const dashboards = await getAllDashboards();
        let targetDashboard = dashboards.find(
          dashboard =>
            dashboard.attributes.title === 'Agents and Vuls' &&
            dashboard.id === '6e71e2a1-89ca-49c9-b9e6-1f2aa404903b',
        );

        if (!targetDashboard) {
          const newDashboardId = await createDashboard();
          if (newDashboardId) {
            targetDashboard = { id: newDashboardId };
          }
        }

        if (targetDashboard) {
          setIdDashboard(targetDashboard.id);
        }
      } catch (error) {
        console.error('Error processing dashboards:', error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <>
      {idDashboard ? (
        <DashboardSavedObject key={idDashboard} savedObjectId={idDashboard} />
      ) : isLoading ? (
        <p>Loading dashboard...</p>
      ) : (
        <p>No matching dashboard found.</p>
      )}
      <input type='file' onChange={handleFile} />
    </>
  );
};

export const DashboardVuls = compose(
  withErrorBoundary,
  withVulnerabilitiesStateDataSource,
)(DashboardComponent);
