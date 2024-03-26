import { DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER, VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER } from '../../../../../../common/constants';
import { FilterHandler } from '../../../../../utils/filter-handler';
import { tFilter } from '../../index';
import { PatternDataSource } from '../pattern-data-source';
import { AppState } from '../../../../../react-services/app-state';

export class VulnerabilitiesDataSource extends PatternDataSource {

    constructor(id: string, title: string) {
        super(id, title);
    }

    getFixedFilters(): tFilter[] {
        return [
            ...super.getFixedFilters(),
        ]
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

}