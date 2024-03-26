import { PatternDataSource, tFilter } from "../../../index";
import { DATA_SOURCE_FILTER_CONTROLLED_VULNERABILITIES_RULE_GROUP } from '../../../../../../../common/constants';


const VULNERABILITIES_GROUP_KEY = 'rules.group';
const VULNERABILITIES_GROUP_VALUE = 'vulnerability-detector';

export class AlertsVulnerabilitiesDataSource extends PatternDataSource {
    constructor(id: string, title: string) {
        super(id, title);
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
                controlledBy: DATA_SOURCE_FILTER_CONTROLLED_VULNERABILITIES_RULE_GROUP
            },
            query: {
                match: {
                    [VULNERABILITIES_GROUP_KEY]: {
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
            ...super.getFixedFilters(),
        ]
    }
}