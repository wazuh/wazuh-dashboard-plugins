import { tDataSource } from "../data-source";
import { DataSourceRepository } from "../data-source-repository";
import { PatternDataSource } from "./pattern-data-source";
import { GenericRequest } from '../../../../react-services/generic-request';
import { AppState } from '../../../../react-services';

/*
{
    attributes: {
        fields: "[{\"name\":\"_id\",\"type\":\"string\",\"esTypes\":[\"_id\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"_index\",\"type\":\"string\",\"esTypes\":[\"_index\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":false},{\"name\":\"_score\",\"type\":\"number\",\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"_source\",\"type\":\"_source\",\"esTypes\":[\"_source\"],\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"_type\",\"type\":\"string\",\"searchable\":false,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"cluster.name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"configSum\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"configSum.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"configSum\"}}},{\"name\":\"dateAdd\",\"type\":\"date\",\"esTypes\":[\"date\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"disconnection_time\",\"type\":\"date\",\"esTypes\":[\"date\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"group\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"group.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"group\"}}},{\"name\":\"group_config_status\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"group_config_status.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"group_config_status\"}}},{\"name\":\"host\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"id\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"ip\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"lastKeepAlive\",\"type\":\"date\",\"esTypes\":[\"date\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"manager\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"manager.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"manager\"}}},{\"name\":\"mergedSum\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"mergedSum.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"mergedSum\"}}},{\"name\":\"name\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"node_name\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"node_name.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"node_name\"}}},{\"name\":\"os.arch\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.arch.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.arch\"}}},{\"name\":\"os.build\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.build.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.build\"}}},{\"name\":\"os.major\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.major.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.major\"}}},{\"name\":\"os.minor\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.minor.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.minor\"}}},{\"name\":\"os.name\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.name.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.name\"}}},{\"name\":\"os.platform\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.platform.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.platform\"}}},{\"name\":\"os.uname\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.uname.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.uname\"}}},{\"name\":\"os.version\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"os.version.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"os.version\"}}},{\"name\":\"registerIP\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"registerIP.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"registerIP\"}}},{\"name\":\"status\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"status_code\",\"type\":\"number\",\"esTypes\":[\"long\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"timestamp\",\"type\":\"date\",\"esTypes\":[\"date\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true},{\"name\":\"version\",\"type\":\"string\",\"esTypes\":[\"text\"],\"searchable\":true,\"aggregatable\":false,\"readFromDocValues\":false},{\"name\":\"version.keyword\",\"type\":\"string\",\"esTypes\":[\"keyword\"],\"searchable\":true,\"aggregatable\":true,\"readFromDocValues\":true,\"subType\":{\"multi\":{\"parent\":\"version\"}}}]"
        title: "wazuh-monitoring-*"
    },
    id: 'wazuh-monitoring-*;
    migrationVersion: {
        index-pattern: '7.6.0'
    },
    namespace: ['default'],
    references: [],
    score: 0,
    type: "index-pattern"
    updated_at: "2024-01-09T16:37:31.020Z"
    version: "WzQsMV0="
}
*/

export type tSavedObjectResponse = {
    data: {
        attributes: {
            fields: string;
            title: string;
        };
        id: string;
        migrationVersion: {
            'index-pattern': string;
        };
        namespace: string[];
        references: any[];
        score: number;
        type: string;
        updated_at: string;
        version: string;
    }
}

export type tParsedIndexPattern = {
    attributes: {
        fields: string;
        title: string;
    };
    title: string;
    id: string;
    migrationVersion: {
        'index-pattern': string;
    };
    namespace: string[];
    references: any[];
    score: number;
    type: string;
    updated_at: string;
    version: string;
    _fields: any[];
    //ToDo: make sure that the following properties are not required
    select: () => Promise<void>
}

export class PatternDataSourceRepository implements DataSourceRepository {
    async get(id: string): Promise<tDataSource> {
        try {
            const savedObjectResponse = await GenericRequest.request(
                'GET',
                `/api/saved_objects/index-pattern/${id}?fields=title&fields=fields`,
            ) as tSavedObjectResponse;

            const indexPatternData = (savedObjectResponse || {}).data;
            if(!indexPatternData){
                throw new Error(`Index pattern "${id}" not found`);
            }
            const parsedIndexPatternData = this.parseIndexPattern(indexPatternData);
            if (!parsedIndexPatternData.title || !parsedIndexPatternData.id) {
                throw new Error(`Invalid index pattern data`);
            }
            return parsedIndexPatternData;
        } catch (error) {
            throw new Error(`Error getting index pattern: ${error.message}`);
        }
    }
    async getAll(): Promise<tDataSource[]> {
        try {
            const savedObjects = await GenericRequest.request(
                'GET',
                `/api/saved_objects/_find?type=index-pattern&fields=title&fields=fields&per_page=9999`,
            );
            const indexPatterns = ((savedObjects || {}).data || {}).saved_objects || [];
            return indexPatterns.map(this.parseIndexPattern);
        } catch (error) {
            throw new Error(`Error getting index patterns: ${error.message}`);
        }
    }

    parseIndexPattern(indexPatternData): tParsedIndexPattern {
        const title = ((indexPatternData || {}).attributes || {}).title;
        const id = (indexPatternData || {}).id;    
        return {
            ...indexPatternData,
            id: id,
            title: title,
            _fields: indexPatternData?.attributes?.fields
                ? JSON.parse(indexPatternData.attributes.fields)
                : [],
        };
    }
    
    setDefault(dataSource: tDataSource): Promise<void> {
        if(!dataSource){
            throw new Error('Index pattern is required');
        }
        AppState.setCurrentPattern(dataSource.id);
        return Promise.resolve();
    }
    getDefault(): Promise<tDataSource | null> | tDataSource | null {
        const currentPattern = AppState.getCurrentPattern();
        if(!currentPattern){
            return null;
        }
        return this.get(currentPattern);
    }

}
