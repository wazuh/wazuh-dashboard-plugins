import React, { useState, useEffect, useCallback } from 'react';
import { getCore, getDataPlugin } from '../../../../kibana-services';
import { AppState } from '../../../../react-services';
import { PatternDataSourceFilterManager } from '../../data-source';
import { withWrapComponent } from '../../hocs';
import { WazuhFlyoutDiscoverNewFilterManager } from '../../wazuh-discover/wz-flyout-discover';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { ButtonExploreEvents } from './button-recent-events';

const viewInEvents =
  ({
    document,
    indexPattern,
    agent,
    applicationId,
    applicationTab,
    getSpecificFilters,
  }) =>
  async ev => {
    const specificFilters = getSpecificFilters
      ? getSpecificFilters({ document, indexPattern, agent })
      : [];

    const agentId = agent?.id;

    const predefinedFilters =
      PatternDataSourceFilterManager.filtersToURLFormat(specificFilters);

    const destURL = getCore().application.getUrlForApp(applicationId, {
      path: `#/overview/?${[
        `tab=${applicationTab}`,
        'tabView=events',
        agentId && `agentId=${agentId}`,
        `_a=${predefinedFilters}`,
      ]
        .filter(Boolean)
        .join('&')}`,
    });

    window.open(destURL, '_blank', 'noreferrer');
  };

export const WazuhFlyoutDiscoverNewFilterManagerRecentEvents =
  withWrapComponent(
    ({
      children,
      document,
      agent,
      applicationId,
      applicationTab,
      recentEventsSpecificFilters,
    }) => {
      const [indexPattern, setIndexPattern] = useState(undefined);
      useEffect(() => {
        (async () => {
          const indexPattern = await getDataPlugin().indexPatterns.get(
            AppState.getCurrentPattern(),
          );
          setIndexPattern(indexPattern);
        })();
      }, []);

      const onClick = useCallback(
        viewInEvents({
          document,
          agent,
          indexPattern,
          applicationId,
          applicationTab,
          getSpecificFilters: recentEventsSpecificFilters,
        }),
        [document, agent, indexPattern],
      );
      return (
        <>
          {children}
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <ButtonExploreEvents onClick={onClick} />
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      );
    },
  )(WazuhFlyoutDiscoverNewFilterManager);
