import { EuiPanel, EuiFlexGroup, EuiFlexItem, EuiText, EuiToolTip, EuiButtonIcon, EuiSpacer, EuiLink, EuiTitle } from '@elastic/eui';
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
    VulnerabilitiesDataSource
} from '../../../data-source';
import { severities } from '../../../../../controllers/overview/components/last-alerts-stat/last-alerts-stat';
import { getCore, getDataPlugin } from '../../../../../kibana-services';
import { RedirectAppLinks } from '../../../../../../../../src/plugins/opensearch_dashboards_react/public';
import { vulnerabilityDetection } from '../../../../../utils/applications';
import { WAZUH_MODULES } from '../../../../../../common/wazuh-modules';
import NavigationService from '../../../../../react-services/navigation-service';


export default function VulsPanel({ agent }) {

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
                    }
                }
            }
        });
        setSeverityStats(data.aggregations.severity.buckets);
    }

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
                }
            }
        }).then(results => {
            setTopPackagesData(results.aggregations.package.buckets);
        })
    }


    useEffect(() => {
        if (isDataSourceLoading) {
            return;
        }
        Promise.all([fetchSeverityStatsData(), fetchTopPackagesData()])
            .then(() => setIsLoading(false))
            .catch((error) => {
                setIsLoading(false);
            });
    }, [isDataSourceLoading, agent.id]);

    const getSeverityValue = (severity) => {
        const value = severityStats?.find((v) => v.key.toUpperCase() === severity.toUpperCase())?.doc_count || '-';
        return value ? `${value} ${severity}` : '-';
    }

    const goToVulnerabilityDashboardWithSeverityFilterURL = async (severity, indexPatternId) => {
        const filters = [
            PatternDataSourceFilterManager.createFilter(
                FILTER_OPERATOR.IS,
                `vulnerability.severity`,
                severity,
                indexPatternId,
            ),
        ];
        const url = NavigationService.getInstance().getUrlForApp(
            vulnerabilityDetection.id,
            {
                path: `tab=vuls&tabView=dashboard&agentId=${agent.id
                    }&_g=${PatternDataSourceFilterManager.filtersToURLFormat(filters)}`,
            },
        );

        return url;
    }

    const renderSeverityStats = (severity, index) => {
        const severityLabel = severities[severity].label;
        const severityColor = severities[severity].color;
        return (<EuiFlexItem key={index}>
            <EuiPanel paddingSize='s' >
                <EuiLink
                    href={NavigationService.getInstance().getUrlForApp(
                        vulnerabilityDetection.id,
                        {
                            path: `tab=vuls&tabView=dashboard&agentId=${agent.id
                                }&_g=${PatternDataSourceFilterManager.filtersToURLFormat([
                                    PatternDataSourceFilterManager.createFilter(
                                        FILTER_OPERATOR.IS,
                                        `vulnerability.severity`,
                                        severityLabel,
                                        dataSource?.indexPattern?.id,
                                    ),
                                ])}`
                        },
                    )}
                    style={{ color: severityColor }}
                >
                    <VulsSeverityStat
                        value={`${getSeverityValue(severityLabel)}`}
                        color={severityColor}
                        isLoading={isLoading || isDataSourceLoading}
                    />
                </EuiLink>
            </EuiPanel>
        </EuiFlexItem>)
    }

    return <Fragment>
        <EuiPanel paddingSize='m'>
            <EuiText size='xs'>
                <EuiFlexGroup className='wz-section-sca-euiFlexGroup'>
                    <EuiFlexItem grow={false}>
                        <RedirectAppLinks application={getCore().application}>
                            <EuiTitle size='xs'>
                                <h2>Vulnerability Detection</h2>
                            </EuiTitle>
                        </RedirectAppLinks>
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
            </EuiText>
            <EuiFlexGroup paddingSize="none">
                <EuiFlexItem grow={2}>
                    <EuiFlexGroup wrap direction='column' gutterSize='s'>
                        {Object.keys(severities).reverse().map(renderSeverityStats)}
                    </EuiFlexGroup>
                </EuiFlexItem>
                <EuiFlexItem grow={3}>
                    <VulsTopPackageTable agentId={agent.id} items={topPackagesData} indexPatternId={dataSource?.indexPattern.id} />
                </EuiFlexItem>
            </EuiFlexGroup>
        </EuiPanel >
    </Fragment >
}