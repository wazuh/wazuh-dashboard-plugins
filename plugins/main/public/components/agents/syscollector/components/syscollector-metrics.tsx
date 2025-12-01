import React, { useEffect, useState } from 'react';
import {
  EuiIcon,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiText,
} from '@elastic/eui';
import _ from 'lodash';
import {
  IWzRibbonBody,
  WzRibbonBody,
  WzRibbonPanel,
  WzRibbonTitle,
} from '../../../common/ribbon/ribbon';
import { IRibbonItem } from '../../../common/ribbon/ribbon-item';
import {
  PatternDataSource,
  SystemInventoryHardwareStatesDataSourceRepository,
  SystemInventoryStatesDataSource,
  SystemInventorySystemStatesDataSourceRepository,
  tParsedIndexPattern,
  useDataSource,
} from '../../../common/data-source';
import {
  withSystemInventoryHardwareDataSource,
  withSystemInventorySystemDataSource,
} from '../../../overview/it-hygiene/common/hocs/validate-system-inventory-index-pattern';
import { getCore } from '../../../../kibana-services';
import NavigationService from '../../../../react-services/navigation-service';
import { ITHygiene } from '../../../../utils/applications';
import { RedirectAppLinks } from '../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { IndexPatternFormattedField } from '../../../common/index-pattern';
import { withDataSourceInitiated } from '../../../common/hocs';
import { Typography } from '../../../common/typography/typography';
import { compose } from 'redux';

const RibbonBodyProtected = withDataSourceInitiated({})(
  ({ items, 'data-test-subj': dataTestSubj }: IWzRibbonBody) => (
    <WzRibbonBody items={items} data-test-subj={dataTestSubj}></WzRibbonBody>
  ),
);

export const InventoryMetrics = compose(
  withSystemInventorySystemDataSource,
  withSystemInventoryHardwareDataSource,
)(() => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [data, setData] = useState<{ hardware: any; software: any } | null>(
    null,
  );

  const itHygieneSystemDataSource = useDataSource<
    tParsedIndexPattern,
    PatternDataSource
  >({
    DataSource: SystemInventoryStatesDataSource,
    repository: new SystemInventorySystemStatesDataSourceRepository(),
  });
  const itHygieneHardwareDataSource = useDataSource<
    tParsedIndexPattern,
    PatternDataSource
  >({
    DataSource: SystemInventoryStatesDataSource,
    repository: new SystemInventoryHardwareStatesDataSourceRepository(),
  });

  const dataSourceIsLoading =
    itHygieneSystemDataSource.isLoading ||
    itHygieneHardwareDataSource.isLoading;

  const notEnoughData =
    !isLoading &&
    _.isEmpty(data?.hardware?.host) &&
    _.isEmpty(data?.software?.host);

  useEffect(() => {
    if (!dataSourceIsLoading) {
      const fetchInventoryHardwareSystemData = async () => {
        try {
          setIsLoading(true);
          const [hardware, software] = (
            await Promise.all([
              itHygieneHardwareDataSource.fetchData({
                pagination: {
                  // Get the first item
                  pageIndex: 0,
                  pageSize: 1,
                },
              }),
              itHygieneSystemDataSource.fetchData({
                pagination: {
                  // Get the first item
                  pageIndex: 0,
                  pageSize: 1,
                },
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
  }, [
    dataSourceIsLoading,
    itHygieneSystemDataSource.fetchFilters,
    itHygieneHardwareDataSource.fetchFilters,
  ]);

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
      render: () =>
        itHygieneHardwareDataSource?.dataSource?.indexPattern && (
          <IndexPatternFormattedField // This could be used to render the rest of fields to take into account the field formatter
            indexPattern={itHygieneHardwareDataSource?.dataSource?.indexPattern}
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
    <WzRibbonPanel>
      <WzRibbonTitle
        title={
          <EuiFlexGroup justifyContent='spaceBetween'>
            <EuiFlexItem grow={false}>
              <Typography level='section'>System inventory</Typography>
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
      ></WzRibbonTitle>
      {notEnoughData ? (
        <EuiFlexGroup
          direction='row'
          alignItems='center'
          justifyContent='center'
          gutterSize='xs'
        >
          <EuiFlexItem grow={false} responsive={false}>
            <EuiIcon type='iInCircle' />
          </EuiFlexItem>
          <EuiFlexItem grow={false} responsive={false}>
            <EuiText size='s'>
              Not enough hardware or operating system information
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      ) : (
        <RibbonBodyProtected
          items={items}
          dataTestSubj='syscollector-metrics'
          dataSource={itHygieneHardwareDataSource} // TODO: We need to validate the loading state of all the data sources used inside the RibbonBodyProtected. Now it only validates one.
        />
      )}
    </WzRibbonPanel>
  );
});
