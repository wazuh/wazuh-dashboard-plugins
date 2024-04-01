import { tDataSource } from "../data-source";
import { DataSourceRepository } from "../data-source-repository";
import { GenericRequest } from '../../../../react-services/generic-request';
import { AppState } from '../../../../react-services';

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
