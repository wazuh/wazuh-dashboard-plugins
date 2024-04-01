import { PatternDataSourceFactory } from './pattern-data-source-factory';
import { PatternDataSource } from '../';
import { tDataSource } from '../data-source';
import { tParsedIndexPattern } from './pattern-data-source-repository';

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
    select: (): Promise<void> => Promise.resolve()
};

describe('PatternDataSourceFactory', () => {
    let factory: PatternDataSourceFactory;

    beforeEach(() => {
        factory = new PatternDataSourceFactory();
    });

    it('should create a single pattern data source', () => {
        const createdItem = factory.create(mockedItem);
        expect(createdItem).toBeInstanceOf(PatternDataSource);
    });

    it('should create an array of pattern data sources', () => {
        const items: PatternDataSource[] = [mockedItem];
        const createdItems = factory.createAll(items);
        expect(createdItems).toBeInstanceOf(Array);
        expect(createdItems.length).toBe(items.length);
        createdItems.forEach((createdItem, index) => {
            expect(createdItem).toBeInstanceOf(PatternDataSource);
        });
    });
});
