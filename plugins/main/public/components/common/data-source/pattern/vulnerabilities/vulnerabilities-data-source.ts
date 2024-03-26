import { tFilter } from '../../index';
import { PatternDataSource } from '../pattern-data-source';

import { AppState } from '../../../../../react-services/app-state';
import { FilterHandler } from '../../../../../utils/filter-handler';
import { VULNERABILITY_IMPLICIT_CLUSTER_MODE_FILTER, DATA_SOURCE_FILTER_CONTROLLED_CLUSTER_MANAGER } from '../../../../../../common/constants';

export class VulnerabilitiesDataSource extends PatternDataSource {

    constructor(id: string, title: string) {
        super(id, title);
    }

    getFixedFilters(): tFilter[] {
        return [
            ...super.getFixedFilters(),
        ]
    }

}