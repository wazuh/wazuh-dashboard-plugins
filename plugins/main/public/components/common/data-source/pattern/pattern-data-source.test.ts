import { PatternDataSource } from './pattern-data-source';

describe('PatternDataSource', () => {
    it('should create a new data source handler', () => {
        const dataSourceHandler = new PatternDataSource('id', 'title');
        expect(dataSourceHandler).toEqual({ id: 'id', title: 'title' });
    })
})