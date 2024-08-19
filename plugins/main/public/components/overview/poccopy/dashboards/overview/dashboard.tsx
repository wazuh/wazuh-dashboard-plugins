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
} from '../../../../common/hocs/validate-vulnerabilities-states-index-pattern';
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
    // (async () => {
    //   try {
    //     createDashboard();
    //   } catch (error) {
    //     console.error('Error create dashboard:', error);
    //   } finally {
    //     setIsLoading(false);
    //   }
    // })();
    (async () => {
      try {
        const dashboards = await getAllDashboards();
        let targetDashboard = dashboards.find(
          dashboard =>
            dashboard.attributes.title === 'dash' &&
            dashboard.id === '94febc80-55a2-11ef-a580-5b5ba88681be',
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
