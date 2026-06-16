import React, { useEffect, useState } from 'react';
import { IndexPattern } from '../../../../../../../src/plugins/data/public';
import { search } from '../../../common/search-bar/search-bar-service';
import { DashboardNormalizationStatistics } from './dashboard_engine_health';
import { DashboardPerSpaceMetrics } from './dashboard_per_space_metrics';

interface DashboardNormalizationPanelProps {
  indexPattern: IndexPattern;
  searchBarProps: any;
  lastReloadRequestTime: number;
  filters: any[];
  dataSourceId: string;
  selectedSubTab: string;
}

export const DashboardNormalizationPanel: React.FC<
  DashboardNormalizationPanelProps
> = ({
  indexPattern,
  searchBarProps,
  lastReloadRequestTime,
  filters,
  dataSourceId,
  selectedSubTab,
}) => {
  const [spaces, setSpaces] = useState<string[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<string>('');

  useEffect(() => {
    if (!indexPattern) return;

    let isCancelled = false;

    const loadSpaces = async () => {
      try {
        const response: any = await search({
          indexPattern,
          aggs: {
            spaces: {
              terms: {
                field: 'wazuh.space.name',
                size: 50,
              },
            },
          },
        } as any);

        if (isCancelled) return;

        const buckets = response?.aggregations?.spaces?.buckets ?? [];
        const spaceNames: string[] = buckets
          .map((bucket: any) => bucket.key)
          .filter(
            (name: unknown): name is string =>
              typeof name === 'string' && name.length > 0,
          );

        setSpaces(spaceNames);
        setSelectedSpace(current =>
          current && spaceNames.includes(current)
            ? current
            : spaceNames[0] ?? '',
        );
      } catch (error) {
        console.error(error);
      }
    };

    loadSpaces();
    return () => {
      isCancelled = true;
    };
  }, [indexPattern?.id, lastReloadRequestTime]);

  return (
    <div>
      {selectedSubTab === 'global' && (
        <DashboardNormalizationStatistics
          indexPatternId={dataSourceId}
          searchBarProps={searchBarProps}
          lastReloadRequestTime={lastReloadRequestTime}
          filters={filters}
        />
      )}
      {selectedSubTab === 'per-space-metrics' && (
        <DashboardPerSpaceMetrics
          indexPattern={indexPattern}
          searchBarProps={searchBarProps}
          lastReloadRequestTime={lastReloadRequestTime}
          filters={filters}
          spaces={spaces}
          selectedSpace={selectedSpace}
          onSelectSpace={setSelectedSpace}
        />
      )}
    </div>
  );
};
