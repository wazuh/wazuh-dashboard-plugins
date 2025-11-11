import React, { useEffect, useState } from 'react';
import {
  EuiPanel,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiToolTip,
  EuiButtonIcon,
  EuiText,
} from '@elastic/eui';
import _ from 'lodash';
import WzRibbon from '../../../common/ribbon/ribbon';
import { IRibbonItem } from '../../../common/ribbon/ribbon-item';
import { Agent } from '../../../endpoints-summary/types';
import {
  FILTER_OPERATOR,
  PatternDataSource,
  PatternDataSourceFilterManager,
  SystemInventoryStatesDataSource,
  SystemInventoryStatesDataSourceRepository,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import { withSystemInventoryDataSource } from '../../../overview/it-hygiene/common/hocs/validate-system-inventory-index-pattern';
import { getCore } from '../../../../kibana-services';
import NavigationService from '../../../../react-services/navigation-service';
import { ITHygiene } from '../../../../utils/applications';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { IndexPatternFormattedField } from '../../../common/index-pattern';
interface SyscollectorMetricsProps {
  agent: Agent;
}

export const InventoryMetrics = withSystemInventoryDataSource(
  ({ agent }: SyscollectorMetricsProps) => {
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [data, setData] = useState<{ hardware: any; software: any } | null>(
      null,
    );

    const itHygieneDataSource = useDataSource<
      tParsedIndexPattern,
      PatternDataSource
    >({
      DataSource: SystemInventoryStatesDataSource,
      repository: new SystemInventoryStatesDataSourceRepository(),
    });

    useEffect(() => {
      if (!itHygieneDataSource.isLoading) {
        const fetchInventoryHardwareSystemData = async () => {
          try {
            setIsLoading(true);
            const [hardware, software] = (
              await Promise.all([
                itHygieneDataSource.fetchData({
                  pagination: {
                    // Get the first item
                    pageIndex: 0,
                    pageSize: 1,
                  },
                  filters: [
                    ...itHygieneDataSource.fetchFilters,
                    PatternDataSourceFilterManager.createFilter(
                      FILTER_OPERATOR.EXISTS,
                      'host.cpu.name',
                      null,
                      itHygieneDataSource.title,
                    ),
                  ],
                }),
                itHygieneDataSource.fetchData({
                  pagination: {
                    // Get the first item
                    pageIndex: 0,
                    pageSize: 1,
                  },
                  filters: [
                    ...itHygieneDataSource.fetchFilters,
                    PatternDataSourceFilterManager.createFilter(
                      FILTER_OPERATOR.EXISTS,
                      'host.os.name',
                      null,
                      itHygieneDataSource.title,
                    ),
                  ],
                }),
              ])
            ).map(response => response?.hits?.hits[0]?._source);
            setData({ hardware, software });
          } finally {
            setIsLoading(false);
          }
        };
        fetchInventoryHardwareSystemData();
      }
    }, [itHygieneDataSource.isLoading, itHygieneDataSource.fetchFilters]);

    if (
      !isLoading &&
      (_.isEmpty(data?.hardware) || _.isEmpty(data?.software))
    ) {
      return (
        <EuiPanel>
          <EuiFlexGroup
            direction='row'
            alignItems='center'
            justifyContent='center'
            gutterSize='xs'
          >
            <EuiFlexItem grow={false}>
              <EuiIcon type='iInCircle' />
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <EuiText size='s'>
                Not enough hardware or operating system information
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      );
    }

    const items: IRibbonItem[] = [
      {
        key: 'cores',
        label: 'Cores',
        value: data?.hardware?.host?.cpu?.cores,
        isLoading: isLoading,
        style: { maxWidth: 100 },
      },
      {
        key: 'memory',
        label: 'Memory',
        render: () => (
          <IndexPatternFormattedField // This could be used to render the rest of fields to take into account the field formatter
            indexPattern={itHygieneDataSource?.dataSource?.indexPattern}
            doc={{ _source: data?.hardware }}
            field='host.memory.total'
          />
        ),
        isLoading: isLoading,
        style: { maxWidth: 100 },
      },
      {
        key: 'cpu',
        label: 'CPU',
        value: data?.hardware?.host?.cpu?.name,
        isLoading: isLoading,
        style: { maxWidth: 250 },
      },
      {
        key: 'hostname',
        label: 'Host name',
        value: data?.software?.host?.hostname,
        isLoading: isLoading,
        style: { maxWidth: 100 },
      },
      {
        key: 'serial_number',
        label: 'Serial number',
        value: data?.hardware?.host?.serial_number,
        isLoading: isLoading,
        style: { maxWidth: 100 },
      },
    ];

    return (
      <WzRibbon
        data-test-subj='syscollector-metrics'
        items={items}
        title={
          <EuiFlexGroup justifyContent='spaceBetween'>
            <EuiFlexItem grow={false}>
              <EuiTitle size='s'>
                <h2>System inventory</h2>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <RedirectAppLinks application={getCore().application}>
                <EuiToolTip position='top' content={`Open ${ITHygiene.title}`}>
                  <EuiButtonIcon
                    iconType='popout'
                    color='primary'
                    className='EuiButtonIcon'
                    href={NavigationService.getInstance().getUrlForApp(
                      ITHygiene.id,
                    )}
                    aria-label={`Open ${ITHygiene.title}`}
                  />
                </EuiToolTip>
              </RedirectAppLinks>
            </EuiFlexItem>
          </EuiFlexGroup>
        }
        titleAction
      />
    );
  },
);
