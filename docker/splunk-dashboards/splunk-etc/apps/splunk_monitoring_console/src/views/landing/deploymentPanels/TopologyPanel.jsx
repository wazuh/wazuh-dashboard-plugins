import { gettext } from '@splunk/ui-utils/i18n';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import Link from '@splunk/react-ui/Link';
import Tooltip from '@splunk/react-ui/Tooltip';
import WaitSpinner from '@splunk/react-ui/WaitSpinner';
import SearchJob from '@splunk/search-job';
import { createURL } from '@splunk/splunk-utils/url';
import { GeneralUtils } from '@splunk/swc-mc';
import './TopologyPanel.pcss';

class TopologyPanel extends Component {
    static propTypes = {
        appLocal: PropTypes.shape({
            entry: PropTypes.shape({
                content: PropTypes.shape({
                    get: PropTypes.func.isRequired,
                }),
            }),
        }).isRequired,
        indexes: PropTypes.number.isRequired,
        indexerClustering: PropTypes.shape({}).isRequired,
    };

    constructor(props, context) {
        super(props, context);

        this.baseDmcAssetsSearch = SearchJob.create({
            search:
                `| inputlookup dmc_assets
                | join type=outer host
                    [ rest splunk_server=* /services/server/info
                     | fields host version]`,
        }, {
            app: 'splunk_monitoring_console',
        });

        this.state = {
            indexes: (GeneralUtils.normalizeBoolean(this.props.appLocal.entry.content.get('configured')) ?
                undefined : this.props.indexes),
            indexers: undefined,
            indexerVersions: undefined,
            searchHeads: undefined,
            searchHeadVersions: undefined,
            clusterMasters: undefined,
            clusterMasterVersions: undefined,
            licenseMasters: undefined,
            licenseMasterVersions: undefined,
            deploymentServers: undefined,
            deploymentServerVersions: undefined,
        };
    }

    componentDidMount() {
        if (GeneralUtils.normalizeBoolean(this.props.appLocal.entry.content.get('configured'))) {
            this.indexesJob = SearchJob.create({
                search:
                    `| rest splunk_server_group=dmc_group_indexer splunk_server_group="*"
                        /services/data/indexes datatype=all
                    | join title splunk_server type=outer
                        [rest splunk_server_group=dmc_group_indexer splunk_server_group="*"
                         /services/data/indexes-extended datatype=all]
                    | \`dmc_exclude_indexes\`
                    | eval elapsedTime = now() - strptime(minTime,"%Y-%m-%dT%H:%M:%S%z")
                    | eval dataAge = ceiling(elapsedTime / 86400)
                    | eval indexSizeGB = if(currentDBSizeMB >= 1 AND totalEventCount >=1, currentDBSizeMB/1024, null())
                    | eval maxSizeGB = maxTotalDataSizeMB / 1024
                    | eval sizeUsagePerc = indexSizeGB / maxSizeGB * 100
                    | stats dc(title) as numIndexes`,
            }, {
                app: 'splunk_monitoring_console',
            });

            this.indexesJob.getResults().subscribe((results) => {
                const indexes = results.results[0] ? results.results[0].numIndexes : '0';
                this.setState({
                    indexes,
                });
            });
        }

        this.indexersJob = this.baseDmcAssetsSearch.getResults &&
            this.baseDmcAssetsSearch.getResults({
                search: '| stats count(eval(search_group="dmc_group_indexer")) as num_indexers',
            }).subscribe((results) => {
                const indexers = results.results[0] ? results.results[0].num_indexers : '0';
                this.setState({
                    indexers,
                });
            });

        this.indexerVersionsJob = this.baseDmcAssetsSearch.getResults &&
            this.baseDmcAssetsSearch.getResults({
                search: '| stats count(eval(search_group="dmc_group_indexer")) as num_indexers by version',
            }).subscribe((results) => {
                const indexerVersions = results.results.map(result => (
                    {
                        num_indexers: result.num_indexers,
                        version: result.version,
                    }));
                this.setState({
                    indexerVersions,
                });
            });

        this.searchHeadsJob = this.baseDmcAssetsSearch.getResults &&
            this.baseDmcAssetsSearch.getResults({
                search: '| stats count(eval(search_group="dmc_group_search_head")) as num_search_heads',
            }).subscribe((results) => {
                const searchHeads = results.results[0] ? results.results[0].num_search_heads : '0';
                this.setState({
                    searchHeads,
                });
            });

        this.searchHeadVersionsJob = this.baseDmcAssetsSearch.getResults &&
            this.baseDmcAssetsSearch.getResults({
                search: '| stats count(eval(search_group="dmc_group_search_head")) as num_search_heads by version',
            }).subscribe((results) => {
                const searchHeadVersions = results.results.map(result => (
                    {
                        num_search_heads: result.num_search_heads,
                        version: result.version,
                    }));
                this.setState({
                    searchHeadVersions,
                });
            });

        this.clusterMastersJob = this.baseDmcAssetsSearch.getResults &&
            this.baseDmcAssetsSearch.getResults({
                search: '| stats count(eval(search_group="dmc_group_cluster_master")) as num_cluster_masters',
            }).subscribe((results) => {
                const clusterMasters = results.results[0] ? results.results[0].num_cluster_masters : '0';
                this.setState({
                    clusterMasters,
                });
            });

        this.clusterMasterVersionsJob = this.baseDmcAssetsSearch.getResults &&
            this.baseDmcAssetsSearch.getResults({
                search:
                    '| stats count(eval(search_group="dmc_group_cluster_master")) as num_cluster_masters by version',
            }).subscribe((results) => {
                const clusterMasterVersions = results.results.map(result => (
                    {
                        num_cluster_masters: result.num_cluster_masters,
                        version: result.version,
                    }));
                this.setState({
                    clusterMasterVersions,
                });
            });

        this.licenseMastersJob = this.baseDmcAssetsSearch.getResults &&
            this.baseDmcAssetsSearch.getResults({
                search: '| stats count(eval(search_group="dmc_group_license_master")) as num_license_masters',
            }).subscribe((results) => {
                const licenseMasters = results.results[0] ? results.results[0].num_license_masters : '0';
                this.setState({
                    licenseMasters,
                });
            });

        this.licenseMasterVersionsJob = this.baseDmcAssetsSearch.getResults &&
            this.baseDmcAssetsSearch.getResults({
                search:
                    '| stats count(eval(search_group="dmc_group_license_master")) as num_license_masters by version',
            }).subscribe((results) => {
                const licenseMasterVersions = results.results.map(result => (
                    {
                        num_license_masters: result.num_license_masters,
                        version: result.version,
                    }));
                this.setState({
                    licenseMasterVersions,
                });
            });

        this.deploymentServerJob = this.baseDmcAssetsSearch.getResults &&
            this.baseDmcAssetsSearch.getResults({
                search: '| stats count(eval(search_group="dmc_group_deployment_server")) as num_deployment_servers',
            }).subscribe((results) => {
                const deploymentServers = results.results[0] ? results.results[0].num_deployment_servers : '0';
                this.setState({
                    deploymentServers,
                });
            });

        this.deploymentServerVersionsJob = this.baseDmcAssetsSearch.getResults &&
            this.baseDmcAssetsSearch.getResults({
                search:
                    `| stats count(eval(search_group="dmc_group_deployment_server"))
                        as num_deployment_servers by version`,
            }).subscribe((results) => {
                const deploymentServerVersions = results.results.map(result => (
                    {
                        num_deployment_servers: result.num_deployment_servers,
                        version: result.version,
                    }));
                this.setState({
                    deploymentServerVersions,
                });
            });
    }

    componentWillUnmount() {
        if (this.indexesJob) {
            this.indexesJob.unsubscribe();
        }
        if (this.indexersJob) {
            this.indexerJob.unsubscribe();
        }
        if (this.indexerVersionsJob) {
            this.indexerVersionsJob.unsubscribe();
        }
        if (this.searchHeadsJob) {
            this.searchHeadsJob.unsubscribe();
        }
        if (this.searchHeadVersionsJob) {
            this.searchHeadVersionsJob.unsubscribe();
        }
        if (this.clusterMastersJob) {
            this.clusterMastersJob.unsubscribe();
        }
        if (this.clusterMasterVersionsJob) {
            this.clusterMasterVersionsJob.unsubscribe();
        }
        if (this.licenseMastersJob) {
            this.licenseMastersJob.unsubscribe();
        }
        if (this.licenseMasterVersionsJob) {
            this.licenseMasterVersionsJob.unsubscribe();
        }
        if (this.deploymentServerJob) {
            this.deploymentServerJob.unsubscribe();
        }
        if (this.deploymentServerVersionsJob) {
            this.deploymentServerVersionsJob.unsubscribe();
        }
    }

    render() {
        const {
            appLocal,
            indexerClustering,
        } = this.props;

        const {
            indexes,
            indexers,
            indexerVersions,
            searchHeads,
            searchHeadVersions,
            clusterMasters,
            clusterMasterVersions,
            licenseMasters,
            licenseMasterVersions,
            deploymentServers,
            deploymentServerVersions,
        } = this.state;

        const renderWaitSpiner = () => {
            if (typeof indexes === 'undefined' ||
                typeof indexers === 'undefined' ||
                typeof indexerVersions === 'undefined' ||
                typeof searchHeads === 'undefined' ||
                typeof searchHeadVersions === 'undefined' ||
                typeof clusterMasters === 'undefined' ||
                typeof clusterMasterVersions === 'undefined' ||
                typeof licenseMasters === 'undefined' ||
                typeof licenseMasterVersions === 'undefined' ||
                typeof deploymentServers === 'undefined' ||
                typeof deploymentServerVersions === 'undefined'
            ) {
                return (
                    <div className="topologyMiniCard">
                        <WaitSpinner size="medium" />
                    </div>
                );
            }
            return null;
        };

        const getIndexesURL = () => (
            GeneralUtils.normalizeBoolean(appLocal.entry.content.get('configured')) ?
                createURL(
                    'app/splunk_monitoring_console/indexes_and_volumes_deployment',
                    {
                        'form.datatype': 'datatype=all',
                        'form.group': '*',
                    },
                ) :
                createURL('manager/splunk_monitoring_console/data/indexes')
        );

        const tooltipText = gettext('Current Splunk Enterprise version. Click to run upgrade-related health checks.');

        return (
            <div
                data-test-name="deployment-topology-card"
                className="topologyCard"
            >
                <div
                    className="topologyCardHeader"
                />
                <div className="topologyCardBody">
                    <div className="topologyDetails">

                        {renderWaitSpiner()}

                        {
                            indexers > 0 && indexerVersions &&
                            GeneralUtils.normalizeBoolean(appLocal.entry.content.get('configured')) ?
                            (
                                <div className="topologyMiniCard">
                                    <Link
                                        className="topologyMiniCardNum"
                                        to={createURL(
                                            'app/splunk_monitoring_console/monitoringconsole_instances',
                                            { group: 'dmc_group_indexer' },
                                        )}
                                    >
                                        {indexers}
                                    </Link>
                                    <br />
                                    <div className="topologyLabel">
                                        { indexers > 1 ? gettext('Indexers') : gettext('Indexer') }
                                    </div>
                                    {indexerVersions.map(version => (
                                        <div
                                            className="topologyVersion"
                                            data-test-name="topology-indexer-version"
                                            key={version.version}
                                        >
                                            <div className="topologyVersionLabel">
                                                <Tooltip content={tooltipText}>
                                                    <Link
                                                        to={createURL(
                                                            'app/splunk_monitoring_console/monitoringconsole_check',
                                                            {
                                                                tag: 'pre_upgrade_check',
                                                                group: 'dmc_group_indexer',
                                                            },
                                                        )}
                                                        openInNewContext
                                                    >
                                                        {version.version}
                                                    </Link>
                                                </Tooltip>
                                            </div>
                                            <div className="topologyVersionCount">{version.num_indexers}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : null
                        }

                        {
                            searchHeads > 0 && searchHeadVersions &&
                            GeneralUtils.normalizeBoolean(appLocal.entry.content.get('configured')) ?
                            (
                                <div className="topologyMiniCard">
                                    <Link
                                        className="topologyMiniCardNum"
                                        to={createURL(
                                            'app/splunk_monitoring_console/monitoringconsole_instances',
                                            { group: 'dmc_group_search_head' },
                                        )}
                                    >
                                        {searchHeads}
                                    </Link>
                                    <br />
                                    <div className="topologyLabel">
                                        { searchHeads > 1 ? gettext('Search Heads') : gettext('Search Head') }
                                    </div>
                                    {searchHeadVersions.map(version => (
                                        <div
                                            className="topologyVersion"
                                            data-test-name="topology-searchhead-version"
                                            key={version.version}
                                        >
                                            <div className="topologyVersionLabel">
                                                <Tooltip content={tooltipText}>
                                                    <Link
                                                        to={createURL(
                                                            'app/splunk_monitoring_console/monitoringconsole_check',
                                                            {
                                                                tag: 'pre_upgrade_check',
                                                                group: 'dmc_group_search_head',
                                                            },
                                                        )}
                                                        openInNewContext
                                                    >
                                                        {version.version}
                                                    </Link>
                                                </Tooltip>
                                            </div>
                                            <div className="topologyVersionCount">{version.num_search_heads}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : null
                        }

                        {
                            clusterMasters > 0 && clusterMasterVersions &&
                            GeneralUtils.normalizeBoolean(appLocal.entry.content.get('configured')) ?
                            (
                                <div className="topologyMiniCard">
                                    <Link
                                        className="topologyMiniCardNum"
                                        to={createURL(
                                            'app/splunk_monitoring_console/monitoringconsole_instances',
                                            { group: 'dmc_group_cluster_master' },
                                        )}
                                    >
                                        {clusterMasters}
                                    </Link>
                                    <br />
                                    <div className="topologyLabel">
                                        { clusterMasters > 1 ? gettext('Cluster Managers') : gettext('Cluster Manager') }
                                    </div>
                                    {clusterMasterVersions.map(version => (
                                        <div
                                            className="topologyVersion"
                                            data-test-name="topology-clustermaster-version"
                                            key={version.version}
                                        >
                                            <div className="topologyVersionLabel">
                                                <Tooltip content={tooltipText}>
                                                    <Link
                                                        to={createURL(
                                                            'app/splunk_monitoring_console/monitoringconsole_check',
                                                            {
                                                                tag: 'pre_upgrade_check',
                                                                group: 'dmc_group_cluster_master',
                                                            },
                                                        )}
                                                        openInNewContext
                                                    >
                                                        {version.version}
                                                    </Link>
                                                </Tooltip>
                                            </div>
                                            <div className="topologyVersionCount">{version.num_cluster_masters}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : null
                        }

                        {
                            licenseMasters > 0 && licenseMasterVersions &&
                            GeneralUtils.normalizeBoolean(appLocal.entry.content.get('configured')) ?
                            (
                                <div className="topologyMiniCard">
                                    <Link
                                        className="topologyMiniCardNum"
                                        to={createURL(
                                            'app/splunk_monitoring_console/monitoringconsole_instances',
                                            { group: 'dmc_group_license_master' },
                                        )}
                                    >
                                        {licenseMasters}
                                    </Link>
                                    <br />
                                    <div className="topologyLabel">
                                        { licenseMasters > 1 ? gettext('License Managers') : gettext('License Manager') }
                                    </div>
                                    {licenseMasterVersions.map(version => (
                                        <div
                                            className="topologyVersion"
                                            data-test-name="topology-licensemaster-version"
                                            key={version.version}
                                        >
                                            <div className="topologyVersionLabel">
                                                <Tooltip content={tooltipText}>
                                                    <Link
                                                        to={createURL(
                                                            'app/splunk_monitoring_console/monitoringconsole_check',
                                                            {
                                                                tag: 'pre_upgrade_check',
                                                                group: 'dmc_group_license_master',
                                                            },
                                                        )}
                                                        openInNewContext
                                                    >
                                                        {version.version}
                                                    </Link>
                                                </Tooltip>
                                            </div>
                                            <div className="topologyVersionCount">{version.num_license_masters}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : null
                        }

                        {
                            deploymentServers > 0 && deploymentServerVersions &&
                            GeneralUtils.normalizeBoolean(appLocal.entry.content.get('configured')) ?
                            (
                                <div className="topologyMiniCard">
                                    <Link
                                        className="topologyMiniCardNum"
                                        to={createURL(
                                            'app/splunk_monitoring_console/monitoringconsole_instances',
                                            { group: 'dmc_group_deployment_server' },
                                        )}
                                    >
                                        {deploymentServers}
                                    </Link>
                                    <br />
                                    <div className="topologyLabel">
                                        { deploymentServers > 1 ?
                                            gettext('Deployment Servers') : gettext('Deployment Server')
                                        }
                                    </div>
                                    {deploymentServerVersions.map(version => (
                                        <div
                                            className="topologyVersion"
                                            data-test-name="topology-deploymentserver-version"
                                            key={version.version}
                                        >
                                            <div className="topologyVersionLabel">
                                                <Tooltip content={tooltipText}>
                                                    <Link
                                                        to={createURL(
                                                            'app/splunk_monitoring_console/monitoringconsole_check',
                                                            {
                                                                tag: 'pre_upgrade_check',
                                                                group: 'dmc_group_deployment_server',
                                                            },
                                                        )}
                                                        openInNewContext
                                                    >
                                                        {version.version}
                                                    </Link>
                                                </Tooltip>
                                            </div>
                                            <div className="topologyVersionCount">{version.num_deployment_servers}</div>
                                        </div>
                                    ))}
                                </div>
                            ) : null
                        }

                        {
                            indexes > 0 ?
                            (
                                <div className="topologyMiniCard">
                                    <Link
                                        className="topologyMiniCardNum"
                                        to={getIndexesURL()}
                                    >
                                        {indexes}
                                    </Link>
                                    <br />
                                    <div className="topologyLabel">
                                        { indexes > 1 ? gettext('Indexes') : gettext('Index') }
                                    </div>
                                </div>
                            ) : null
                        }
                    </div>

                    <div className="topologyRow">
                        <div className="topologyLabel">{gettext('Indexer Clustering')}</div>
                        <div className="topologyLabel topologyResult">
                            {
                                indexerClustering.entry.content.changed.disabled ?
                                    gettext('Disable') : gettext('Enable')
                            }
                        </div>
                    </div>

                    {
                        indexerClustering.entry.content.changed.disabled ? null :
                        (
                            <div className="topologyRow">
                                <div className="topologyLabel">{gettext('Replication Factor')}</div>
                                <div className="topologyMiniCardNum">
                                    {indexerClustering.entry.content.changed.replication_factor}
                                </div>
                            </div>
                        )
                    }

                    {
                        indexerClustering.entry.content.changed.disabled ? null :
                        (
                            <div className="topologyRow">
                                <div className="topologyLabel">{gettext('Search Factor')}</div>
                                <div className="topologyMiniCardNum">
                                    {indexerClustering.entry.content.changed.search_factor}
                                </div>
                            </div>
                        )
                    }
                </div>
            </div>
        );
    }
}

export default TopologyPanel;
