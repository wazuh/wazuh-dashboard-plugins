import React, { useEffect, useState } from 'react';
import { getAngularModule } from '../../kibana-services';
import { Stats } from '../../controllers/overview/components/stats';
import { WzRequest } from '../../react-services';
import { OverviewWelcome } from '../common/welcome/overview-welcome';
import { MainModule } from '../common/modules/main';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { WzCurrentOverviewSectionWrapper } from '../common/modules/overview-current-section-wrapper';

export const Overview: React.FC = () => {
  const [agentsCounts, setAgentsCounts] = useState({});
  const [tabActive, setTabActive] = useState('welcome');
  const [tabViewActive, setTabViewActive] = useState('panels');
  const [agentSelected, setAgentSelected] = useState({});

  useEffect(() => {
    const tab = getAngularModule().$injector.get('$location').search().tab;
    const tabView = getAngularModule()
      .$injector.get('$location')
      .search().tabView;
    setTabActive(tab || 'welcome');
    setTabViewActive(tabView || 'panels');
    if (tab === 'welcome' || tab === undefined) {
      getSummary();
    }
  }, []);

  /**
   * This fetch de agents summary
   */
  const getSummary = async () => {
    try {
      const {
        data: {
          data: { connection: data },
        },
      } = await WzRequest.apiReq('GET', '/agents/summary/status', {});
      setAgentsCounts(data);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  function switchTab(newTab: any, force: any) {
    try {
      if (tabActive === newTab && !force) {
        return;
      }
      setTabActive(newTab);
    } catch (error) {
      const options = {
        context: `${Overview.name}.switchTab`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
  }

  const switchSubTab = (subTab: string) => {
    try {
      if (tabViewActive !== subTab) {
        setTabViewActive(subTab);
      }
    } catch (error) {
      const options = {
        context: `${Overview.name}.switchSubtab`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
  };

  const updateSelectedAgents = (agentList: Array<any>) => {
    try {
      if (typeof agentList.length) {
        setAgentSelected(agentList[0]);
      }
    } catch (error) {
      const options = {
        context: `${Overview.name}.updateSelectedAgents`,
        level: UI_LOGGER_LEVELS.ERROR,
        severity: UI_ERROR_SEVERITIES.BUSINESS,
        error: {
          error: error,
          message: error.message || error,
          title: error.name || error,
        },
      };

      getErrorOrchestrator().handleError(options);
    }
  };

  return (
    <>
      {tabActive && tabActive !== 'welcome' && (
        <>
          <MainModule
            section={tabActive}
            agentsSelectionProps={{
              tab: tabActive,
              subtab: tabViewActive,
              setAgent: (agentList: Array<any>) =>
                updateSelectedAgents(agentList),
            }}
            switchSubTab={subTab => switchSubTab(subTab)}
          />
          <WzCurrentOverviewSectionWrapper
            switchTab={(tab, force) => switchTab(tab, force)}
            currentTab={tabActive}
          />
        </>
      )}
      {tabActive === 'welcome' && (
        <>
          <Stats {...agentsCounts} />
          <OverviewWelcome {...agentsCounts} />
        </>
      )}
    </>
  );
};
