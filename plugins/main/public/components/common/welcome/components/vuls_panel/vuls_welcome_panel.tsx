import React from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiToolTip,
  EuiButtonIcon,
  EuiSpacer,
} from '@elastic/eui';
import { VulsTopPackageTable } from '../top_packages_table';
import VulsSeverityStat from '../vuls_severity_stat/vuls_severity_stat';
import {
  PatternDataSourceFilterManager,
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
import {
  withDataSourceFetch,
  withErrorBoundary,
} from '../../../../common/hocs';
import { compose } from 'redux';
import { withVulnerabilitiesStateDataSource } from '../../../../../components/overview/vulnerabilities/common/hocs/validate-vulnerabilities-states-index-pattern';
import { formatUINumber } from '../../../../../react-services/format-number';
import { Typography } from '../../../typography/typography';

const VulsPanelContentInitiation = compose(
  withDataSourceFetch({
    DataSource: VulnerabilitiesDataSource,
    DataSourceRepositoryCreator: VulnerabilitiesDataSourceRepository,
    nameProp: 'dataSource',
    mapRequestParams() {
      return {
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
      };
    },
    mapResponse(response) {
      return {
        severity: response?.aggregations?.severity?.buckets || [],
        package: response?.aggregations?.package?.buckets || [],
      };
    },
  }),
)(({ agent, dataSourceAction, dataSource: dataSourceInitiation }) => {
  const { dataSource } = dataSourceInitiation;
  const { severity: severityStats = [], package: topPackagesData = [] } =
    dataSourceAction?.data || {};
  const getSeverityValue = severity => {
    const value =
      severityStats?.find(v => v.key.toUpperCase() === severity.toUpperCase())
        ?.doc_count || '0';
    return value ? `${formatUINumber(value)} ${severity}` : '0';
  };
  const renderSeverityStats = (severity, index) => {
    const severityLabel = severities[severity].label;
    const severityColor = severities[severity].color;
    return (
      <EuiFlexItem key={index}>
        <EuiPanel paddingSize='m'>
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
                  isLoading={dataSourceAction.running}
                  textAlign='left'
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
});

const PanelWithVulnerabilitiesState = compose(
  withErrorBoundary,
  withVulnerabilitiesStateDataSource,
)(VulsPanelContentInitiation);

const VulsPanel = ({ agent }) => {
  return (
    <EuiPanel paddingSize='m'>
      <EuiFlexGroup className='wz-section-sca-euiFlexGroup' responsive={false}>
        <EuiFlexItem grow={false}>
          <Typography level='section'>Vulnerability Detection</Typography>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <RedirectAppLinks application={getCore().application}>
            <EuiToolTip position='top' content='Open Vulnerability Detection'>
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
      <EuiSpacer size='m' />
      <PanelWithVulnerabilitiesState agent={agent} />
    </EuiPanel>
  );
};

export default VulsPanel;
