import React, { useEffect, useState } from 'react';
import {
  EuiPanel,
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiTitle,
  EuiToolTip,
  EuiButtonIcon,
} from '@elastic/eui';
import _ from 'lodash';
import { formatUIDate } from '../../../../react-services/time-service';
import WzRibbon from '../../../common/ribbon/ribbon';
import {
  IRibbonItem,
  RibbonItemLabel,
} from '../../../common/ribbon/ribbon-item';
import { getOsName } from '../../../common/platform';
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
import { WAZUH_AGENTS_OS_TYPE } from '../../../../../common/constants';
import { getCore } from '../../../../kibana-services';
import NavigationService from '../../../../react-services/navigation-service';
import { ITHygiene } from '../../../../utils/applications';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';

interface SyscollectorMetricsProps {
  agent: Agent;
}

const offsetTimestamp = (text: string, time: string) => {
  try {
    return text + formatUIDate(time);
  } catch (error) {
    return time !== '-' ? `${text}${time} (UTC)` : time;
  }
};

// This is a customized method (see getAgentOSType from react-services/wz-agents.ts)
// for the system inventory data
function getAgentOSTypeIndexerData(agent?: Agent) {
  if (agent?.os?.name?.toLowerCase().includes(WAZUH_AGENTS_OS_TYPE.LINUX)) {
    return WAZUH_AGENTS_OS_TYPE.LINUX;
  } else if (agent?.os?.platform === WAZUH_AGENTS_OS_TYPE.WINDOWS) {
    return WAZUH_AGENTS_OS_TYPE.WINDOWS;
  } else if (agent?.os?.platform === WAZUH_AGENTS_OS_TYPE.SUNOS) {
    return WAZUH_AGENTS_OS_TYPE.SUNOS;
  } else if (agent?.os?.platform === WAZUH_AGENTS_OS_TYPE.DARWIN) {
    return WAZUH_AGENTS_OS_TYPE.DARWIN;
  } else {
    return WAZUH_AGENTS_OS_TYPE.OTHERS;
  }
}

const getPlatformIcon = (agent?: Agent): React.JSX.Element => {
  let icon = '';
  const osType = getAgentOSTypeIndexerData(agent);
  if (osType === WAZUH_AGENTS_OS_TYPE.DARWIN) {
    icon = 'apple';
  } else if (
    [WAZUH_AGENTS_OS_TYPE.WINDOWS, WAZUH_AGENTS_OS_TYPE.LINUX].includes(osType)
  ) {
    icon = osType;
  }

  if (icon) {
    return (
      <i
        className={`fa fa-${icon} AgentsTable__soBadge AgentsTable__soBadge--${osType}`}
        aria-hidden='true'
      ></i>
    );
  }
  return <></>;
};

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
    }, [itHygieneDataSource.isLoading, agent.id]);

    if (
      !isLoading &&
      (_.isEmpty(data?.hardware) || _.isEmpty(data?.software))
    ) {
      return (
        <EuiPanel paddingSize='s' style={{ margin: 16, textAlign: 'center' }}>
          <EuiIcon type='iInCircle' /> Not enough hardware or operating system
          information
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
        value: data?.hardware?.host?.memory?.total
          ? `${(data?.hardware?.host?.memory?.total / 1024).toFixed(2)} MB`
          : '-',
        isLoading: isLoading,
        style: { maxWidth: 100 },
      },
      {
        key: 'arch',
        label: 'Arch',
        value: data?.hardware?.agent?.host?.architecture,
        isLoading: isLoading,
        style: { maxWidth: 100 },
      },
      // {
      //   key: RibbonItemLabel.OPERATING_SYSTEM,
      //   value: data?.software?.host,
      //   label: 'Operating system',
      //   isLoading: isLoading,
      //   style: { maxWidth: 200 },
      //   render: (value: Agent) => (
      //     <>
      //       {getPlatformIcon(value)}
      //       {getOsName(value)}
      //     </>
      //   ),
      // },
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
        key: 'board-serial',
        label: 'Board serial',
        value: data?.hardware?.observer?.serial_number,
        isLoading: isLoading,
        style: { maxWidth: 100 },
      },
      {
        key: 'last-scan',
        label: 'Last scan',
        value: data?.software?.['@timestamp']
          ? offsetTimestamp('', data?.software?.['@timestamp']) // there are 2 dates (hardware/software) Should we indicate each value?
          : '-',
        isLoading: isLoading,
        style: { maxWidth: 180 },
      },
    ];

    return (
      <WzRibbon
        data-test-subj='syscollector-metrics'
        items={items}
        title={
          <EuiFlexGroup justifyContent='spaceBetween'>
            <EuiFlexItem grow={false}>
              <EuiTitle>
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
