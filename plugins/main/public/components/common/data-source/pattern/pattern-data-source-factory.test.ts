import { tDataSource, tParsedIndexPattern, PatternDataSourceFactory, PatternDataSource } from '../index';

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


const mockedItem: tParsedIndexPattern = { 
    attributes: {
        title: 'test-pattern-title',
        fields: '[{"name":"timestamp","type":"date","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true}]',
    },
    title: 'test-pattern-title',
    id: 'test-pattern-id',
    migrationVersion: {
        'index-pattern': '7.10.0',
    },
    namespace: ['default'],
    references: [],
    score: 0,
    type: 'index-pattern',
    updated_at: '2021-08-23T14:05:54.000Z',
    version: 'WzIwMjEsM',
    _fields: [],
};

describe('PatternDataSourceFactory', () => {
    let factory: PatternDataSourceFactory;

    beforeEach(() => {
        factory = new PatternDataSourceFactory();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    })

    it('should create a single pattern data source', async () => {
        // spy is init method PatternDataSource is called
        jest.spyOn(PatternDataSource.prototype, 'init').mockResolvedValueOnce();
        const createdItem = await factory.create(PatternDataSource , mockedItem);
        expect(createdItem.id).toBe(mockedItem.id);
        expect(createdItem.title).toBe(mockedItem.title);
    });

    it('should create a instance of pattern data source', async () => {
        const createdItem = await factory.create(PatternDataSource, mockedItem);
        expect(createdItem).toBeInstanceOf(PatternDataSource);
        expect(createdItem.id).toBe(mockedItem.id);
        expect(createdItem.title).toBe(mockedItem.title);
    })

    it('should call the init method of pattern data source', async () => {
        const initSpy = jest.spyOn(PatternDataSource.prototype, 'init');
        await factory.create(PatternDataSource, mockedItem);
        expect(initSpy).toHaveBeenCalledTimes(1);
    })

    it('should create an array of pattern data sources', async () => {
        const items: tParsedIndexPattern[] = [mockedItem, mockedItem, mockedItem];
        const createdItems = await factory.createAll(PatternDataSource, items);
        expect(createdItems).toBeInstanceOf(Array);
        expect(createdItems.length).toBe(items.length);
        createdItems.forEach((createdItem) => {
            expect(createdItem).toBeInstanceOf(PatternDataSource);
        });
    });
});
