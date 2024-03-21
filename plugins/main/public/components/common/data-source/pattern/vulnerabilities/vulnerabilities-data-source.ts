import { tFilter } from '../../search-params-builder';
import { PatternDataSource } from '../pattern-data-source';

import { AppState } from '../../../../../react-services/app-state';
import { FilterHandler } from '../../../../../utils/filter-handler';
import { VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER, DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER } from '../../../../../../common/constants';

const VULNERABILITIES_GROUP_KEY = 'rules.group';
const VULNERABILITIES_GROUP_VALUE = 'vulnerability-detector';

export class VulnerabilitiesDataSource extends PatternDataSource {

    constructor(id: string, title: string) {
        super(id, title);
    }

    getClusterManagerFilters() {
        const filterHandler = new FilterHandler();
        const isCluster = AppState.getClusterInfo().status == 'enabled';
        const managerFilter = filterHandler.managerQuery(
            isCluster
                ? AppState.getClusterInfo().cluster
                : AppState.getClusterInfo().manager,
            true,
            VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER[
            AppState.getClusterInfo().status
            ],
        );
        managerFilter.meta.index = this.id;
        managerFilter.meta.controlledBy = DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER;
        managerFilter.$state = {
            store: 'appState'
        }
        return [managerFilter] as tFilter[];
    }

    getRuleGroupsFilter() {
        return [{
            meta: {
                removable: false, // used to hide the close icon in the filter
                index: this.id,
                negate: false,
                disabled: false,
                alias: null,
                type: 'phrase',
                key: VULNERABILITIES_GROUP_KEY,
                value: VULNERABILITIES_GROUP_VALUE,
                params: {
                    query: VULNERABILITIES_GROUP_VALUE,
                    type: 'phrase',
                },
                controlledBy: 'wazuh' // or concatenate with the index name
            },
            query: {
                match: {
                    'rules.group': {
                        query: VULNERABILITIES_GROUP_VALUE,
                        type: 'phrase',
                    }
                },
            },
            $state: {
                store: 'appState',
            },
        } as tFilter];
    }

    getFixedFilters(): tFilter[] {
        return [
            ...this.getClusterManagerFilters(),
        ]
    }

}