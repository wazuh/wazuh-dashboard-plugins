import { PatternDataSource } from './pattern-data-source';
import { getDataPlugin } from '../../../../kibana-services';

jest.mock('../../../../kibana-services', () => ({
    ...(jest.requireActual('../../../../kibana-services') as object),
    getDataPlugin: () => ({
        // mock indexPatterns getter
        indexPatterns: {
            get: jest.fn().mockResolvedValue({
                fields: {
                    replaceAll: jest.fn(),
                    map: jest.fn().mockReturnValue([]),
                },
                getScriptedFields: jest.fn().mockReturnValue([]),
            }),
            getFieldsForIndexPattern: jest.fn().mockResolvedValue([]),
            updateSavedObject: jest.fn().mockResolvedValue({}),
        },
    }),
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
        (getDataPlugin().indexPatterns.getFieldsForIndexPattern as jest.Mock).mockResolvedValue([]);
        await patternDataSource.select();
        expect(getDataPlugin().indexPatterns.get).toHaveBeenCalledWith('id');
        expect(getDataPlugin().indexPatterns.getFieldsForIndexPattern).toHaveBeenCalledWith({});
        expect(getDataPlugin().indexPatterns.updateSavedObject).toHaveBeenCalledWith({});

    });
});
