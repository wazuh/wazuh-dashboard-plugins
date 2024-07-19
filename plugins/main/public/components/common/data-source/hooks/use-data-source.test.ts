import { useDataSource } from './use-data-source';
import { renderHook } from '@testing-library/react-hooks';
import { 
    tDataSourceRepository,
    tFilter, 
    PatternDataSource, 
    tParsedIndexPattern 
} from '../index';
import { IndexPatternsService, IndexPattern } from '../../../../../../../src/plugins/data/common';

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
        query: {
            filterManager: {
                getFilters: jest.fn().mockReturnValue([]),
                setFilters: jest.fn(),
                getUpdates$: jest.fn().mockReturnValue({
                    subscribe: jest.fn()
                })
            }
        }
    }),
}));

const mockedGetFilters = jest.fn().mockReturnValue([]);

class DataSourceMocked implements PatternDataSource {
    constructor(public id: string, public title: string) {
        this.id = id;
        this.title = title;
    }
    fields: any[];
    patternService: IndexPatternsService;
    indexPattern: IndexPattern;
    defaultFixedFilters: tFilter[];
    filters: tFilter[];
    init = jest.fn();
    select = jest.fn();
    fetch = jest.fn();
    getFilters = mockedGetFilters;
    setFilters = jest.fn();
    getFields = mockedGetFilters
    getFixedFilters = mockedGetFilters
    getFetchFilters = mockedGetFilters
    toJSON(): tParsedIndexPattern {
        return {
            id: this.id,
            title: this.title,
        } as tParsedIndexPattern;
    }
    getClusterManagerFilters = mockedGetFilters
    getPinnedAgentFilter = mockedGetFilters
    getExcludeManagerFilter = mockedGetFilters
    getAllowAgentsFilter = mockedGetFilters
}

class ExampleRepository implements tDataSourceRepository<tParsedIndexPattern> {
    getDefault = jest.fn();
    setDefault = jest.fn();
    get = jest.fn();
    getAll = jest.fn();
}

describe('useDataSource hook', () => {

    it('shoudl throw ERROR when the repository is not defined', () => {
       
        try {
            renderHook(() => useDataSource({
                DataSource: DataSourceMocked,
                repository: undefined as any
            }));
        } catch(error){
            expect(error).toBeDefined();
            expect(error.message).toBe('DataSource and repository are required');
        }
        
    })

    it('should throw ERROR when the DataSource is not defined', () => {
       
        try {
            renderHook(() => useDataSource({
                DataSource: undefined as any,
                repository: new ExampleRepository()
            }));
        } catch(error){
            expect(error).toBeDefined();
            expect(error.message).toBe('DataSource and repository are required');
        }
        
    })

    // FIXME: 
    it.skip('should initialize the hook with only receiving the dataSource and repository', async () => {
        const repository = new ExampleRepository();
        const indexMocked = {
            id: 'test',
            title: 'Test'
        }
        jest.spyOn(repository, 'getAll').mockResolvedValueOnce([indexMocked]);
        jest.spyOn(repository, 'getDefault').mockResolvedValueOnce(indexMocked);
        const { result, waitForNextUpdate } = renderHook(() => useDataSource({
            DataSource: DataSourceMocked,
            repository
        }));
        // wait for the promise to resolve
        await waitForNextUpdate();
        expect(result.current.isLoading).toBeFalsy();
        expect(result.current.dataSource).toBeDefined();
        expect(result.current.dataSource?.id).toBe('test');
        expect(result.current.dataSource?.title).toBe('Test');
    })


})
