import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiToolTip,
  EuiButtonIcon,
  EuiSpacer,
  EuiLink,
  EuiTitle,
} from '@elastic/eui';
import React, { Fragment, useEffect, useState } from 'react';
import { VulsTopPackageTable } from '../top_packages_table';
import VulsSeverityStat from '../vuls_severity_stat/vuls_severity_stat';
import {
  PatternDataSourceFilterManager,
  PatternDataSource,
  tParsedIndexPattern,
  useDataSource,
  FILTER_OPERATOR,
  VulnerabilitiesDataSourceRepository,
  VulnerabilitiesDataSource,
} from '../../../data-source';
import { severities } from '../../../../../controllers/overview/components/last-alerts-stat/last-alerts-stat';
import { getCore } from '../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { vulnerabilityDetection } from '../../../../../utils/applications';
import NavigationService from '../../../../../react-services/navigation-service';
import { WzLink } from '../../../../../components/wz-link/wz-link';
import { withErrorBoundary } from '../../../../common/hocs';
import { compose } from 'redux';
import { withVulnerabilitiesStateDataSource } from '../../../../../components/overview/vulnerabilities/common/hocs/validate-vulnerabilities-states-index-pattern';

const VulsPanelContent = ({ agent }) => {
  const {
    dataSource,
    isLoading: isDataSourceLoading,
    fetchData,
  } = useDataSource<tParsedIndexPattern, PatternDataSource>({
    DataSource: VulnerabilitiesDataSource,
    repository: new VulnerabilitiesDataSourceRepository(),
  });

  const [isLoading, setIsLoading] = useState(true);
  const [severityStats, setSeverityStats] = useState(null);
  const [topPackagesData, setTopPackagesData] = useState([]);

  const fetchSeverityStatsData = async () => {
    const data = await fetchData({
      aggs: {
        severity: {
          terms: {
            field: 'vulnerability.severity',
            size: 5,
            order: {
              _count: 'desc',
            },
          },
        },
      },
    });
    setSeverityStats(data.aggregations.severity.buckets);
  };

  const fetchTopPackagesData = async () => {
    fetchData({
      aggs: {
        package: {
          terms: {
            field: 'package.name',
            size: 5,
            order: {
              _count: 'desc',
            },
          },
        },
      },
    }).then(results => {
      setTopPackagesData(results.aggregations.package.buckets);
    });
  };

  useEffect(() => {
    if (isDataSourceLoading) {
      return;
    }
    setIsLoading(true);
    Promise.all([fetchSeverityStatsData(), fetchTopPackagesData()])
      .catch(error => {
        // ToDo: Handle error
        console.error(error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isDataSourceLoading, agent.id]);

  const getSeverityValue = severity => {
    const value =
      severityStats?.find(v => v.key.toUpperCase() === severity.toUpperCase())
        ?.doc_count || '0';
    return value ? `${value} ${severity}` : '0';
  };

  const renderSeverityStats = (severity, index) => {
    const severityLabel = severities[severity].label;
    const severityColor = severities[severity].color;
    return (
      <EuiFlexItem key={index}>
        <EuiPanel paddingSize='s'>
          <EuiFlexGroup className='h-100' gutterSize='none' alignItems='center'>
            <EuiFlexItem>
              <WzLink
                appId={vulnerabilityDetection.id}
                path={`/overview?tab=vuls&tabView=dashboard&agentId=${
                  agent.id
                }&_g=${PatternDataSourceFilterManager.filtersToURLFormat([
                  PatternDataSourceFilterManager.createFilter(
                    FILTER_OPERATOR.IS,
                    `vulnerability.severity`,
                    severityLabel,
                    dataSource?.indexPattern?.id,
                  ),
                ])}`}
                style={{ color: severityColor }}
              >
                <VulsSeverityStat
                  value={`${getSeverityValue(severityLabel)}`}
                  color={severityColor}
                  isLoading={isLoading || isDataSourceLoading}
                />
              </WzLink>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiFlexItem>
    );
  };

  return (
    <EuiFlexGroup paddingSize='none'>
      <EuiFlexItem grow={2}>
        <EuiFlexGroup direction='column' gutterSize='s' responsive={false}>
          {Object.keys(severities).reverse().map(renderSeverityStats)}
        </EuiFlexGroup>
      </EuiFlexItem>
      <EuiFlexItem grow={3}>
        <VulsTopPackageTable
          agentId={agent.id}
          items={topPackagesData}
          indexPatternId={dataSource?.indexPattern.id}
        />
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};

const PanelWithVulnerabilitiesState = compose(
  withErrorBoundary,
  withVulnerabilitiesStateDataSource,
)(VulsPanelContent);

const VulsPanel = ({ agent }) => {
  return (
    <Fragment>
      <EuiPanel paddingSize='m'>
        <EuiText size='xs'>
          <EuiFlexGroup
            className='wz-section-sca-euiFlexGroup'
            responsive={false}
          >
            <EuiFlexItem grow={false}>
              <EuiTitle size='xs'>
                <h2>Vulnerability Detection</h2>
              </EuiTitle>
            </EuiFlexItem>
            <EuiFlexItem grow={false}>
              <RedirectAppLinks application={getCore().application}>
                <EuiToolTip
                  position='top'
                  content='Open Vulnerability Detection'
                >
                  <EuiButtonIcon
                    iconType='popout'
                    color='primary'
                    className='EuiButtonIcon'
                    href={NavigationService.getInstance().getUrlForApp(
                      vulnerabilityDetection.id,
                    )}
                    aria-label='Open Vulnerability Detection'
                  />
                </EuiToolTip>
              </RedirectAppLinks>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiText>
        <EuiSpacer size='s' />
        <PanelWithVulnerabilitiesState agent={agent} />
      </EuiPanel>
    </Fragment>
  );
};

export default VulsPanel;
