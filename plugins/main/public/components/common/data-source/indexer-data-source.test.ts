import { IndexerDataSource } from './indexer-data-source';

describe('IndexerDataSource', () => {
    it('should create a new data source handler', () => {
        const dataSourceHandler = new IndexerDataSource('id', 'title');
        expect(dataSourceHandler).toEqual({ id: 'id', title: 'title' });
    })
})