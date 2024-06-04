import {
    PatternDataSourceFilterManager,
    tParsedIndexPattern,
    tFilter,
    tFilterManager,
    PatternDataSource
} from '../index';
import store from '../../../../redux/store';
import { DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT, DATA_SOURCE_FILTER_CONTROLLED_EXCLUDE_SERVER, AUTHORIZED_AGENTS } from '../../../../../common/constants';
import { IndexPatternsService, IndexPattern } from '../../../../../../../src/plugins/data/public';
import { getDataPlugin } from '../../../../kibana-services';

jest.mock('../../../../redux/store', () => ({
    getState: jest.fn().mockReturnValue({
        appStateReducers: {
        }
    }),
}));

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

const createFilter = (id: string, value: string, index: string): tFilter => {
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

// mocked tFilterManager

const mockedFilterManager: tFilterManager = {
    getFilters: jest.fn().mockReturnValue([]),
    setFilters: jest.fn(),
    addFilters: jest.fn(),
    getUpdates$: jest.fn(),
}


describe('PatternDataSourceFilterManager', () => {

    beforeEach(() => {
        jest.clearAllMocks();
        mockedGetFilters.mockClear();
        
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

        it('should use the received filter manager instead the global filter manager (getDataPlugin) when receive an filter manager', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            new PatternDataSourceFilterManager(dataSource, [], mockedFilterManager);
            expect(mockedFilterManager.getFilters).toHaveBeenCalledTimes(1);
            expect(getDataPlugin().query.filterManager.getFilters).not.toHaveBeenCalled();
        })

        it('should filter the filters received in the constructor then no keep the filters with different index and merge with the fixed filters', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const filterDifIndex = createFilter('agent.id', '1', 'different filter');
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            new PatternDataSourceFilterManager(dataSource, [filterDifIndex], mockedFilterManager);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledTimes(1);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledWith([fixedFilter]);
        })

        it('should filter the filters received in the constructor then no keep the filters with meta.controlledBy property (with same index)', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const filterSameIndexControlled = createFilter('agent.id', '1', 'my-index');
            filterSameIndexControlled.meta.controlledBy = DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT;
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            new PatternDataSourceFilterManager(dataSource, [filterSameIndexControlled], mockedFilterManager);
            expect(mockedFilterManager.setFilters).not.toHaveBeenCalledWith([filterSameIndexControlled]);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledWith([fixedFilter]);
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
            new PatternDataSourceFilterManager(dataSource, [filterSameIndexControlled], mockedFilterManager);
            expect(mockedFilterManager.setFilters).not.toHaveBeenCalledWith([filterSameIndexControlled]);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledWith([fixedFilter]);
        })


        it('should filter the filters received in the constructor and keep the filters with the same index and merge with the fixed ', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const sameIndexFilter = createFilter('agent.id', '1', 'my-index');
            const fixedFilter = createFilter('agent.id', '2', 'my-index');
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            new PatternDataSourceFilterManager(dataSource, [sameIndexFilter], mockedFilterManager);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledTimes(1);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledWith([fixedFilter, sameIndexFilter]);
        });
    })

    describe('getFilters', () => {
        it('should return the filters with the fixed filters included defined in data source', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            fixedFilter.meta.controlledBy = DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT;
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            new PatternDataSourceFilterManager(dataSource, [], mockedFilterManager);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledTimes(1);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledWith([fixedFilter]);
        })

        it('should return the filters merged the fixed filters included defined in data source', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            fixedFilter.meta.controlledBy = DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT;
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            const sameIndexFilter = createFilter('agent.id', '1', 'my-index');
            new PatternDataSourceFilterManager(dataSource, [sameIndexFilter], mockedFilterManager);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledTimes(1);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledWith([fixedFilter, sameIndexFilter]);
        })

        it('should return only the fixed filters when receives invalid filters', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const fixedFilter = createFilter('agent.id', '1', 'my-index');
            jest.spyOn(dataSource, 'getFixedFilters').mockReturnValue([fixedFilter]);
            const anotherIndexFilter = createFilter('agent.id', '1', 'another-index');
            new PatternDataSourceFilterManager(dataSource, [anotherIndexFilter], mockedFilterManager);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledTimes(1);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledWith([fixedFilter]);
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
            new PatternDataSourceFilterManager(dataSource, [], mockedFilterManager);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledTimes(1);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledWith([fixedFilter]);
        });

    })

    describe('getFetchFilters', () => {
        it('should return the filters to fetch the data from the data source', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const storedFilter = createFilter('agent.id', '1', 'my-index');
            storedFilter.meta.controlledBy = DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT;
            jest.spyOn(dataSource, 'getFetchFilters').mockReturnValue([storedFilter]);
            const filterManager = new PatternDataSourceFilterManager(dataSource, [], mockedFilterManager);
            jest.spyOn(filterManager, 'getFilters').mockReturnValue([]);
            const filters = filterManager.getFetchFilters();
            expect(filters).toEqual([storedFilter]);
        })


    })

    describe('setFilters', () => {
        it('should remove the hidden filters from the filters received after initialize', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const filterManager = new PatternDataSourceFilterManager(dataSource, [], mockedFilterManager);
            const hiddenFilter = createFilter('agent.id', '1', 'my-index');
            hiddenFilter.meta.controlledBy = DATA_SOURCE_FILTER_CONTROLLED_EXCLUDE_SERVER;
            filterManager.setFilters([hiddenFilter]);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledTimes(2);
            expect(mockedFilterManager.setFilters).toHaveBeenLastCalledWith([]);
        })

        it('should remove the second filter received when recevies two filters with the same controlledBy value', () => {
            const dataSource = new DataSourceMocked('my-index', 'my-title');
            const filterManager = new PatternDataSourceFilterManager(dataSource, [], mockedFilterManager);
            const hiddenFilter = createFilter('agent.id', '1', 'my-index');
            hiddenFilter.meta.controlledBy = DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT;
            const hiddenFilter2 = createFilter('agent.id', '2', 'my-index');
            hiddenFilter2.meta.controlledBy = DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT;
            filterManager.setFilters([hiddenFilter, hiddenFilter2]);
            expect(mockedFilterManager.setFilters).toHaveBeenCalledTimes(2);
            expect(mockedFilterManager.setFilters).toHaveBeenLastCalledWith([hiddenFilter]);
        })
    })


    describe('wazuh filters', () => {
        it('should return the filters to fetch the data merging the filters stored and the excluded manager filter', () => {
            (store.getState as jest.Mock).mockReturnValue(
                {
                    appConfig: {
                        data: {
                            hideManagerAlerts: true
                        }
                    }
                });
            const filter = PatternDataSourceFilterManager.getExcludeManagerFilter('index-title');
            expect(filter.length).toBe(1);
            expect(filter[0].meta.controlledBy).toBe(DATA_SOURCE_FILTER_CONTROLLED_EXCLUDE_SERVER);

        })

        it('should return the filters to fetch the data merging the filters stored without the excluded manager filter when is not defined', () => {
            (store.getState as jest.Mock).mockReturnValue(
                {
                    appConfig: {
                        data: {
                        }
                    }
                });
            const filter = PatternDataSourceFilterManager.getExcludeManagerFilter('index-title');
            expect(filter.length).toBe(0);
        })

        it('should return the filters to fetch the data merging the filters stored and the allowed agents filter', () => {
            (store.getState as jest.Mock).mockReturnValue(
                {
                    appStateReducers: {
                        allowedAgents: ['001']
                    }
                });
            const filter = PatternDataSourceFilterManager.getAllowAgentsFilter('index-title');
            expect(filter.length).toBe(1);
            expect(filter[0].meta.controlledBy).toBe(AUTHORIZED_AGENTS);
        })

        it('should return the filters to fetch the data merging the filters stored without the allowed agents filter when is not defined', () => {
            (store.getState as jest.Mock).mockReturnValue(
                {
                    appStateReducers: {
                    }
                });
            const filter = PatternDataSourceFilterManager.getAllowAgentsFilter('index-title');
            expect(filter.length).toBe(0);
        })

        // FIXME:
        it.skip('should return the fixed filters merged with the pinned agent filter when correspond', () => {
            // mock store.getState
            (store.getState as jest.Mock).mockReturnValue(
                {
                    appStateReducers: {
                        currentAgentData: {
                            id: '001'
                        }
                    }
                });
            const filter = PatternDataSourceFilterManager.getPinnedAgentFilter('index-title');
            expect(filter.length).toBe(1);
            expect(filter[0].meta.controlledBy).toBe(DATA_SOURCE_FILTER_CONTROLLED_PINNED_AGENT);
        });

        // FIXME:
        it.skip('should return only the fixed filters from the data source when the pinned agent filter is not defined', () => {
            // mock store.getState
            (store.getState as jest.Mock).mockReturnValue(
                {
                    appStateReducers: {
                    }
                });
            const filter = PatternDataSourceFilterManager.getPinnedAgentFilter('index-title');
            expect(filter.length).toBe(0);
        })

    })

    it.only('should return a filter transformed to the URL format', () => {
        const filter = createFilter('agent.id', '1', 'my-index');
        const URLFilter = PatternDataSourceFilterManager.filterToURLFormat(filter);
        console.log('filter', URLFilter);
    })


})