import React, { useMemo, useState, useEffect } from 'react';
import { getCore, getWazuhCorePlugin } from '../../../../kibana-services';
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
      const [patternId, setPatternId] = useState<string>('');

      useEffect(() => {
        (async () => {
          const pattern = await getWazuhCorePlugin().configuration.get(
            'pattern',
          );
          setPatternId(pattern);
        })();
      }, []);

      const href = useMemo(() => {
        if (!patternId) return '';
        return generatePathNavigate({
          document,
          agent,
          indexPattern: { id: patternId },
          applicationId,
          applicationTab,
          getSpecificFilters: recentEventsSpecificFilters,
        });
      }, [document, agent, patternId]); // Maybe it should be done when the index pattern is changed

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
