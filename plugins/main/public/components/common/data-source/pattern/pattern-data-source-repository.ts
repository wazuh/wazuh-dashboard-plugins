import { tDataSource } from "../data-source";
import { DataSourceRepository } from "../data-source-repository";
import { PatternDataSource } from "./pattern-data-source";
import { GenericRequest } from '../../../../react-services/generic-request';
import { AppState } from '../../../../react-services';

export class PatternDataSourceRepository implements DataSourceRepository {
    setDefault(dataSource: tDataSource): Promise<void> {
        if(!dataSource){
            throw new Error('Data source is required');
        }
        AppState.setCurrentPattern(dataSource.id);
        return Promise.resolve();
    }
    getDefault(): Promise<tDataSource> {
        const currentPattern = AppState.getCurrentPattern();
        // the AppState returns the title
        if(!currentPattern){
            throw new Error('No default pattern set');
        }
        return this.get(currentPattern);
    }

    async get(id: string): Promise<tDataSource> {
        try {
            const savedObjectResponse = await GenericRequest.request(
                'GET',
                `/api/saved_objects/index-pattern/${id}?fields=title&fields=fields`,
            );

            const indexPatternData = (savedObjectResponse || {}).data;
            if(!indexPatternData){
                throw new Error(`Index pattern "${id}" not found`);
            }
            const parsedIndexPatternData = this.parseIndexPattern(indexPatternData);
            if (!parsedIndexPatternData.title || !parsedIndexPatternData.id) {
                throw new Error(`Index pattern "${id}" not found`);
            }
            return parsedIndexPatternData;
        } catch (error) {
            throw new Error(`Error getting index pattern "${id}": ${error.message}`);
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
            throw new Error(`Error getting index pattern: ${error.message}`);
        }
    }

    parseIndexPattern(indexPatternData): tDataSource {
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

    




}
