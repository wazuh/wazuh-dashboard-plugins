import { DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER, VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER } from '../../../../../../common/constants';
import { tFilter, PatternDataSourceFilterManager } from '../../index';
import { AppState } from '../../../../../react-services/app-state';
import { PatternDataSource } from '../pattern-data-source';

export class VulnerabilitiesDataSource extends PatternDataSource {

    constructor(id: string, title: string) {
        super(id, title);
    }

    getFixedFilters(): tFilter[] {
        return [
            ...this.getClusterManagerFilters(),
            ...super.getFixedFilters(),
        ]
    }

    getClusterManagerFilters() {
        return PatternDataSourceFilterManager.getClusterManagerFilters(this.title, 
            DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER,
            VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER[
                AppState.getClusterInfo().status
            ],
        );   
    }

}