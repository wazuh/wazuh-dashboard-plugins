import { 
    PatternDataSourceFilterManager, 
    tParsedIndexPattern,
    tDataSource, 
    tSearchParams, 
    tFilter, 
    PatternDataSource } from '../index';
import store from '../../../../redux/store';
import { DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT } from '../../../../../common/constants';
import { IndexPatternsService, IndexPattern } from '../../../../../../../src/plugins/data/public';

jest.mock('../../../../redux/store', () => ({
    getState: jest.fn().mockReturnValue({
        appStateReducers: {
        }
    })
}));

let mockedGetFilters = jest.fn().mockReturnValue([]);
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

const createFilter = (id: string, value: string, index: string) => {
    return {
        meta: {
            index: index,
            negate: false,
            disabled: false,
            alias: null,
            type: 'phrase',
            key: id,
            value: value,
            params: {
                query: value,
                type: 'phrase',
            },
        },
        query: {
            match: {
                [id]: value,
            },
        },
        $state: {
            store: 'appState',
        },
    } as tFilter;
}


describe('PatternDataSourceFilterManager', () => {

    beforeEach(() => {
        jest.clearAllMocks();
    })

    describe('constructor', () => {
        it('should initialize the data source filter manager', () => {
            const filterManager = new PatternDataSourceFilterManager(new DataSourceMocked('my-id', 'my-title'), []);
            expect(filterManager).toBeDefined();
        })

        it('should return ERROR when the data source is not defined', () => {
            try {
                new PatternDataSourceFilterManager(null as any, []);
            } catch (error) {
                expect(error.message).toBe('Data source is required');
            }
        })

        it('should filter the filters received in the constructor then no keep the filters with different index and merge with the fixed filters', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const filterDifIndex = createFilter('agent.id', '1', 'different filter');
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            const filterManager = new PatternDataSourceFilterManager(dataSource, [filterDifIndex]);
            expect(filterManager.getFilters()).not.toContainEqual(filterDifIndex);
            expect(filterManager.getFilters()).toContainEqual(fixedFilter);
        })

        it('should filter the filters received in the constructor then no keep the filters with meta.controlledBy property (with same index)', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const filterSameIndexControlled = createFilter('agent.id', '1', 'my-index');
            filterSameIndexControlled.meta.controlledBy = DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT;
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            const filterManager = new PatternDataSourceFilterManager(dataSource, [filterSameIndexControlled]);
            expect(filterManager.getFilters()).not.toContainEqual(filterSameIndexControlled);
            expect(filterManager.getFilters()).toEqual([fixedFilter]);
        })

        it('should filter the filters received in the constructor then no keep the filters with $state.isImplicit property (with same index)', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const filterSameIndexControlled = createFilter('agent.id', '1', 'my-index');
            filterSameIndexControlled.$state = {
                ...filterSameIndexControlled.$state,
                // isImplicit' does not exist in type 'FilterState'
                // @ts-ignore                
                isImplicit: true
            }
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            const filterManager = new PatternDataSourceFilterManager(dataSource, [filterSameIndexControlled]);
            expect(filterManager.getFilters()).not.toContainEqual(filterSameIndexControlled);
            expect(filterManager.getFilters()).toContainEqual(fixedFilter);
        })


        it('should filter the filters received in the constructor and keep the filters with the same index and merge with the fixed ', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const sameIndexFilter = createFilter('agent.id', '1', 'my-index');
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            const filterManager = new PatternDataSourceFilterManager(dataSource, [sameIndexFilter]);
            expect(filterManager.getFilters()).toEqual([sameIndexFilter, fixedFilter]);
        });


    })

    describe('getFilters', () => {
        it('should return the filters with the fixed filters included defined in data source', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            const filterManager = new PatternDataSourceFilterManager(dataSource, []);
            const filters = filterManager.getFilters();
            expect(filters).toEqual([fixedFilter]);
        })

        it('should return the filters merged the fixed filters included defined in data source', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            const sameIndexFilter = createFilter('agent.id', '1', 'my-index');
            const filterManager = new PatternDataSourceFilterManager(dataSource, [sameIndexFilter]);
            const filters = filterManager.getFilters();
            expect(filters).toEqual([fixedFilter, sameIndexFilter]);
        })

        it('should return only the fixed filters when receives invalid filters', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            const anotherIndexFilter = createFilter('agent.id', '1', 'another-index');
            const filterManager = new PatternDataSourceFilterManager(dataSource, [anotherIndexFilter]);
            const filters = filterManager.getFilters();
            expect(filters).toEqual([fixedFilter]);
            expect(filters).not.toContainEqual(anotherIndexFilter);
        })

    })

    describe('getFixedFilters', () => {
        it('should return the fixed filters defined in the data source', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            (store.getState as jest.Mock).mockReturnValue(
                {
                    appStateReducers: {
                    }
                });
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            const filterManager = new PatternDataSourceFilterManager(dataSource, []);
            const filters = filterManager.getFixedFilters();
            expect(filters).toContainEqual(fixedFilter);
            expect(dataSource.getFixedFilters).toHaveBeenCalledTimes(1);
        });

        it('should return the fixed filters merged with the pinned agent filter when correspond', () => {
            // mock store.getState
            (store.getState as jest.Mock).mockReturnValue(
                {
                    appStateReducers: {
                        currentAgentData: {
                            id: '001'
                        }
                    }
                });
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            const filterManager = new PatternDataSourceFilterManager(dataSource, []);
            const filters = filterManager.getFixedFilters();
            const agentPinnedFilter = filterManager.getPinnedAgentFilter();
            expect(filters).toContainEqual(fixedFilter);
            expect(filters).toEqual([fixedFilter, ...agentPinnedFilter]);
        });

        it('should return only the fixed filters from the data source when the pinned agent filter is not defined', () => {
            // mock store.getState
            (store.getState as jest.Mock).mockReturnValue(
                {
                    appStateReducers: {
                    }
                });
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            const filterManager = new PatternDataSourceFilterManager(dataSource, []);
            const filters = filterManager.getFixedFilters();
            expect(filters).toContainEqual(fixedFilter);
            expect(filters).not.toContainEqual(filterManager.getPinnedAgentFilter());
        })

    })

    describe('getFetchFilters', () => {
        it('should return the filters to fetch the data from the data source merging filters', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const storedFilter = createFilter('agent.id', '1', 'my-index');

            const filterManager = new PatternDataSourceFilterManager(dataSource, []);
            jest.spyOn(filterManager, 'getFilters').mockReturnValue([storedFilter]);  
        })

        it('should return the filters to fetch the data merging the filters stored and the excluded manager filter', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const storedFilter = createFilter('agent.id', '1', 'my-index');
            (store.getState as jest.Mock).mockReturnValue(
                {
                    appConfig: {
                        data: {
                            hideManagerAlerts: true
                        }
                    }
                });
            const filterManager = new PatternDataSourceFilterManager(dataSource, [storedFilter]);
            const excludeManager = filterManager.getExcludeManagerFilter();
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([]);
            const filters = filterManager.getFetchFilters();
            expect(filters).toEqual([storedFilter, ...excludeManager]);
        })

        it('should return the filters to fetch the data merging the filters stored without the excluded manager filter when is not defined', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const storedFilter = createFilter('agent.id', '1', 'my-index');
            (store.getState as jest.Mock).mockReturnValue(
                {
                    appConfig: {
                        data: {
                        }
                    }
                });
            const filterManager = new PatternDataSourceFilterManager(dataSource, [storedFilter]);
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([]);
            const filters = filterManager.getFetchFilters();
            expect(filters).toEqual([storedFilter]);
        })

        it('should return the filters to fetch the data merging the filters stored and the allowed agents filter', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const storedFilter = createFilter('agent.id', '1', 'my-index');
            (store.getState as jest.Mock).mockReturnValue(
                {
                    appStateReducers: {
                        allowedAgents: ['001']
                    }
                });
            const filterManager = new PatternDataSourceFilterManager(dataSource, [storedFilter]);
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([]);
            const allowedAgents = filterManager.getAllowAgentsFilter();
            const filters = filterManager.getFetchFilters();
            expect(filters).toEqual([storedFilter, ...allowedAgents]);
        })

        it('should return the filters to fetch the data merging the filters stored without the allowed agents filter when is not defined', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const storedFilter = createFilter('agent.id', '1', 'my-index');
            (store.getState as jest.Mock).mockReturnValue(
                {
                    appStateReducers: {
                    }
                });
            const filterManager = new PatternDataSourceFilterManager(dataSource, [storedFilter]);
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([]);
            const filters = filterManager.getFetchFilters();
            expect(filters).toEqual([storedFilter]);
        })
    })
})