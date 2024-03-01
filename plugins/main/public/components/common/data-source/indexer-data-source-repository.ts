import { tDataSource } from "./data-source";
import { DataSourceRepository } from "./data-source-repository";
import { IndexerDataSource } from "./indexer-data-source";
import { GenericRequest } from '../../../react-services/generic-request';

export class IndexerDataSourceRepository implements DataSourceRepository {

    async get(id: string): Promise<tDataSource> {
        try {
            const indexPatternData = await GenericRequest.request(
                'GET',
                `/api/saved_objects/index-pattern/${id}?fields=title&fields=fields`,
            );
            const parsedIndexPatternData = parseIndexPattern(indexPatternData);
            if (!parsedIndexPatternData.title || !parsedIndexPatternData.id) {
                throw new Error('Index pattern not found');
            }
            return parsedIndexPatternData;
        } catch (error) {
            throw new Error(`Error getting data source: ${error.message}`);
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
            throw new Error(`Error getting data source: ${error.message}`);
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
