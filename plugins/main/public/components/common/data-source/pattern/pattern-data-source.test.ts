import { PatternDataSource } from './pattern-data-source';

jest.mock('../../../../kibana-services', () => ({
    ...(jest.requireActual('../../../../kibana-services') as object),
    getDataPlugin: jest.fn(),
}));

describe('PatternDataSource', () => {
    it('should create a new data source handler', () => {
        const patternDataSource = new PatternDataSource('id', 'title');
        expect(patternDataSource).toEqual({ id: 'id', title: 'title' });
    });

    it('should have the correct id', () => {
        const patternDataSource = new PatternDataSource('id', 'title');
        expect(patternDataSource.id).toEqual('id');
    });

    it('should have the correct title', () => {
        const patternDataSource = new PatternDataSource('id', 'title');
        expect(patternDataSource.title).toEqual('title');
    });

    it.skip('should select the data source', async () => {
        const patternDataSource = new PatternDataSource('id', 'title');
        const spy = jest.spyOn(patternDataSource, 'select');
        //  mock getDataPlugin().indexPatterns.get 
        
    });
});
