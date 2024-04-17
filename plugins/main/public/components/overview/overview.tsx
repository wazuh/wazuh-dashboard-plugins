import React, { useEffect, useState } from 'react';
import { Stats } from '../../controllers/overview/components/stats';
import { WzRequest } from '../../react-services';
import { OverviewWelcome } from '../common/welcome/overview-welcome';
import { getWzCurrentAppID } from '../../kibana-services';
import { MainModule } from '../common/modules/main';
import { UI_LOGGER_LEVELS } from '../../../common/constants';
import { UI_ERROR_SEVERITIES } from '../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../react-services/common-services';
import { WzCurrentOverviewSectionWrapper } from '../common/modules/overview-current-section-wrapper';

export const Overview: React.FC = () => {
  const [agentsCounts, setAgentsCounts] = useState({});
  const [appActive, setAppActive] = useState('');

  useEffect(() => {
    getSummary();
    const appActiveID = getWzCurrentAppID();
    setAppActive(appActiveID);
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

  function switchTab(tab: any, force: any) {
    try {
      console.log(tab, force);
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

  return (
    <>
      {appActive !== 'wz-home' && (
        <>
          <MainModule
            section={appActive}
            // disabledReport={resultState !== 'ready'}
            agentsSelectionProps={{
              tab: appActive,
              subtab: 'panel',
            }}
          />
          <WzCurrentOverviewSectionWrapper
            switchTab={(tab, force) => switchTab(tab, force)}
            currentTab={appActive}
          />
        </>
      )}
      {appActive === 'wz-home' && (
        <>
          <Stats {...agentsCounts} />
          <OverviewWelcome {...agentsCounts} />
        </>
      )}
    </>
  );
};
