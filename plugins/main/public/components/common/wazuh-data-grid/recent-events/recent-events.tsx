import React, { useState, useEffect } from 'react';
import { getCore, getDataPlugin } from '../../../../kibana-services';
import { AppState } from '../../../../react-services';
import { PatternDataSourceFilterManager } from '../../data-source';
import { withWrapComponent } from '../../hocs';
import { WazuhFlyoutDiscoverNewFilterManager } from '../../wazuh-discover/wz-flyout-discover';
import { EuiFlexGroup, EuiFlexItem, EuiLink } from '@elastic/eui';

const generatePathNavigate = ({
  document,
  indexPattern,
  agent,
  applicationId,
  applicationTab,
  getSpecificFilters,
}) => {
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

  return destURL;
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
      const [href, setHref] = useState(undefined);
      useEffect(() => {
        (async () => {
          const indexPattern = await getDataPlugin().indexPatterns.get(
            AppState.getCurrentPattern(),
          );
          setHref(
            generatePathNavigate({
              document,
              agent,
              indexPattern,
              applicationId,
              applicationTab,
              getSpecificFilters: recentEventsSpecificFilters,
            }),
          );
        })();
      }, [document, agent]); // Maybe it should be done when the index pattern is changed

      return (
        <>
          {children}
          <EuiFlexGroup>
            <EuiFlexItem grow={false}>
              <EuiLink
                href={href}
                external
                target='_blank'
                rel='noopener noreferrer'
              >
                Explore events
              </EuiLink>
            </EuiFlexItem>
          </EuiFlexGroup>
        </>
      );
    },
  )(WazuhFlyoutDiscoverNewFilterManager);
