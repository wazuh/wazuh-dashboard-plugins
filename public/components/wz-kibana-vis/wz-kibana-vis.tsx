import React, { useEffect, useRef, useState } from 'react';
import { EuiEmptyPrompt, EuiIcon, EuiLoadingChart, EuiToolTip } from '@elastic/eui';

import { GenericRequest } from '../../react-services/generic-request';
import { VisFactoryHandler } from '../../react-services/vis-factory-handler';
import { AppState } from '../../react-services/app-state';

import { TabVisualizations } from '../../factories/tab-visualizations';
import { RawVisualizations } from '../../factories/raw-visualizations';

import WzReduxProvider from '../../redux/wz-redux-provider';
import KibanaVis from '../../kibana-integrations/kibana-vis';
import { FilterHandler } from '../../utils/filter-handler';

// error handler
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';

const VIS_TAB_OVERVIEW = 'general';
const VIS_TAB_AGENTS = 'agents';

interface IWzKibanaVisProps {
  visID: string;
  tab: string;
}

function WzKibanaVis(props: IWzKibanaVisProps) {
  const { visID, tab } = props;
  const [currentRawVis, setCurrentRawVis] = useState(null);
  const [visCouldBeRendered, setVisCouldBeRendered] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const rawVisualizations = new RawVisualizations();
  const tabVisualizations = new TabVisualizations();

  useEffect(() => {
    initializeVis(visID, tab);
  }, []);

  useEffect(() => {
    if (currentRawVis) {
      validateVisualization(currentRawVis);
    }
  }, [currentRawVis]);

  /**
   *
   * @param visID
   * @param tab
   */
  const initializeVis = async (visID: string, tab: string) => {
    setIsLoading(true);
    try {
      if (!visID || !tab) {
        throw new Error(`visID and tab are required`);
      }
      // assign current tab
      tabVisualizations.removeAll();
      tabVisualizations.setTab(tab);
      tabVisualizations.assign({
        general: 1,
      });
      // create filter handler for visualizations
      const filterHandler = new FilterHandler(AppState.getCurrentPattern());
      // set visFactoryHandler
      // set rawVisualizations json definitions from api
      if (tab === VIS_TAB_OVERVIEW) {
        await VisFactoryHandler.buildOverviewVisualizations(filterHandler, tab, null);
      } else if (tab === VIS_TAB_AGENTS) {
        await VisFactoryHandler.buildAgentsVisualizations(filterHandler, tab, null);
      } else {
        // tab doesn't exist
        throw new Error(`tab ${tab} doesn't exist`);
      }

      // get raw vis definition
      const rawVis = getRawVisualizationById(visID);
      setCurrentRawVis(rawVis);
      if (!rawVis) {
        throw new Error(`id ${visID} visualization is not defined`);
      }
    } catch (error) {
      const options = {
        context: `${WzKibanaVis.name}.initializeVis`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        store: true,
        error: {
          error: error,
          message: error.message || error,
          title: `Could not render visualization`,
        },
      };
      getErrorOrchestrator().handleError(options);
      setIsLoading(false);
      setVisCouldBeRendered(false);
    }
  };

  /**
   * 
   * @param raw 
   */
  const validateVisualization = async (raw) => {
    setIsLoading(true);
    try {
      if (!raw) {
        throw new Error('raw must be defined');
      }

      const visIndexPattern = getVisIndexPattern(raw);
      if (!visIndexPattern) {
        throw new Error('Index pattern is not defined in visualization');
      }
      // checking if module is enable in confi
      await checkVisIndexExist(visIndexPattern);
      // set state visualization is ok for render
      setVisCouldBeRendered(true);
      setIsLoading(false);
    } catch (error) {
      // visualization couldn't be rendered
      //console.log(`Error validating visualization: ${error}`);
      setErrorMessage(error);
      setVisCouldBeRendered(false);
      setIsLoading(false);
    }
  };

  /**
   *
   * @param index
   */
  const checkVisIndexExist = async (index: string) => {
    let res = await GenericRequest.request(
      'GET',
      `/api/index_patterns/_fields_for_wildcard?pattern=${index}`,
      {}
    );
    return true;
  };

  /**
   *
   * @param visID
   */
  const getRawVisualizationById = (visID: string) => {
    // get all visualizations definitions
    const rawVisList = rawVisualizations.getList();
    return rawVisList ? rawVisList.filter((item) => item && item.id === visID)[0] : null;
  };

  /**
   *
   * @param raw
   */
  const getVisIndexPattern = (raw) => {
    return (
      JSON.parse(raw.attributes?.kibanaSavedObjectMeta?.searchSourceJSON || '{}').index || null
    );
  };

  return (
    <>
      {isLoading && (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <EuiLoadingChart size="xl" />
        </div>
      )}
      {!isLoading && !visCouldBeRendered && (
          <EuiEmptyPrompt
            iconType="securitySignalDetected"
            title={<h4>No data found</h4>}
            body={errorMessage}
          />
      )}
      {!isLoading && visCouldBeRendered && (
        <WzReduxProvider>
          <KibanaVis visID={visID} tab={tab} />
        </WzReduxProvider>
      )}
    </>
  );
}

export default WzKibanaVis;
