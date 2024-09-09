import {
  IndexPatternsService,
  IndexPattern,
} from '../../../../../../../src/plugins/data/public';
import {
  tDataSourceSelector,
  tDataSourceRepository,
  tParsedIndexPattern,
  PatternDataSourceSelector,
  PatternDataSource,
  tFilter,
} from '../index';

const mockedGetFilters = jest.fn().mockReturnValue([]);

class DataSourceMocked implements PatternDataSource {
  constructor(
    public id: string,
    public title: string,
  ) {
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
  getFields = mockedGetFilters;
  getFixedFilters = mockedGetFilters;
  getFetchFilters = mockedGetFilters;
  toJSON(): tParsedIndexPattern {
    return {
      id: this.id,
      title: this.title,
    } as tParsedIndexPattern;
  }
  getClusterManagerFilters = mockedGetFilters;
  getPinnedAgentFilter = mockedGetFilters;
  getExcludeManagerFilter = mockedGetFilters;
  getAllowAgentsFilter = mockedGetFilters;
}

class ExampleRepository implements tDataSourceRepository<tParsedIndexPattern> {
  getDefault = jest.fn();
  setDefault = jest.fn();
  get = jest.fn();
  getAll = jest.fn();
}

const createListPatternsMocked = (qty: number) => {
  const list: DataSourceMocked[] = [];
  for (let i = 0; i < qty; i++) {
    list.push(new DataSourceMocked(`id ${i.toString()}`, `title ${i}`));
  }
  return list;
};

let repository = new ExampleRepository();
let mockedList = createListPatternsMocked(3);

describe('PatternDataSourceSelector', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should return ERROR when the selector not receive a repository', () => {
      try {
        new PatternDataSourceSelector(mockedList, null as any);
      } catch (error) {
        expect(error.message).toBe('Data source repository is required');
      }
    });

    it('should return ERROR when the selector not receive a valid repository', () => {
      try {
        new PatternDataSourceSelector([], new ExampleRepository());
      } catch (error) {
        expect(error.message).toBe('Data sources list is required');
      }
    });
  });

  describe('existsDataSource', () => {
    it('should return TRUE when the data source exists', async () => {
      jest
        .spyOn(repository, 'get')
        .mockResolvedValue({ id: '1', name: 'DataSource 1' });
      const selector = new PatternDataSourceSelector(mockedList, repository);
      const result = await selector.existsDataSource('1');
      expect(result).toBe(true);
      expect(repository.get).toHaveBeenCalledTimes(1);
    });

    it('should return FALSE when the data source does not exist', async () => {
      jest.spyOn(repository, 'get').mockResolvedValue(null);
      const selector = new PatternDataSourceSelector(mockedList, repository);
      const result = await selector.existsDataSource('fake-id');
      expect(result).toBe(false);
      expect(repository.get).toHaveBeenCalledTimes(1);
    });

    it('should throw ERROR when not receive an id', async () => {
      jest.spyOn(repository, 'get').mockResolvedValue(null);
      try {
        let selector = new PatternDataSourceSelector(mockedList, repository);
        await selector.existsDataSource(null as any);
      } catch (error) {
        expect(error.message).toBe(
          'Error checking data source. ID is required',
        );
      }
    });
  });

  describe('getFirstValidDataSource', () => {
    it('should return the first valid data source from the repository', async () => {
      jest
        .spyOn(repository, 'get')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(true);
      let selector = new PatternDataSourceSelector(mockedList, repository);
      const result = await selector.getFirstValidDataSource();
      expect(result).toEqual(mockedList[1]);
      expect(repository.get).toHaveBeenCalledTimes(2);
    });

    it('should throw an error when no valid data source is found', async () => {
      jest
        .spyOn(repository, 'get')
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      let selector = new PatternDataSourceSelector(mockedList, repository);
      try {
        await selector.getFirstValidDataSource();
      } catch (error) {
        expect(error.message).toBe('No valid data sources found');
      }
    });
  });

  describe('getAllDataSources', () => {
    it('should return all data sources from the repository when the map is empty', async () => {
      let selector = new PatternDataSourceSelector(mockedList, repository);
      const result = await selector.getAllDataSources();
      expect(result).toEqual(mockedList);
    });
  });

  describe('getDataSource', () => {
    it('should return the selected data source from the repository', async () => {
      jest.spyOn(repository, 'getDefault').mockResolvedValue(mockedList[0]);
      let selector = new PatternDataSourceSelector(mockedList, repository);
      const result = await selector.getSelectedDataSource();
      expect(result.id).toEqual(mockedList[0].id);
      expect(repository.getDefault).toHaveBeenCalledTimes(1);
    });

    it('should return the first data source when the repository does not have a selected data source', async () => {
      jest.spyOn(repository, 'getDefault').mockResolvedValue(null);
      let selector = new PatternDataSourceSelector(mockedList, repository);
      // mock spyon existsDataSource method to return 2 times differents values
      jest
        .spyOn(selector, 'existsDataSource')
        .mockResolvedValueOnce(false)
        .mockResolvedValueOnce(true);
      jest.spyOn(selector, 'selectDataSource').mockResolvedValue();
      const result = await selector.getSelectedDataSource();
      expect(result.id).toEqual(mockedList[1].id);
      expect(repository.getDefault).toHaveBeenCalledTimes(1);
      expect(selector.existsDataSource).toHaveBeenCalledTimes(2);
      expect(selector.selectDataSource).toHaveBeenCalledTimes(1);
    });
  });

  describe('selectDataSource', () => {
    it('should select a data source by ID when exists', async () => {
      jest.spyOn(repository, 'setDefault').mockResolvedValue(true);
      let selector = new PatternDataSourceSelector(mockedList, repository);
      await selector.selectDataSource('id 1');
      expect(repository.setDefault).toHaveBeenCalledTimes(1);
      expect(repository.setDefault).toHaveBeenCalledWith({
        id: 'id 1',
        title: 'title 1',
      });
    });

    it('should throw an error when selecting a non-existing data source', async () => {
      jest.spyOn(repository, 'getAll').mockResolvedValue([]);
      try {
        let selector = new PatternDataSourceSelector(mockedList, repository);
        await selector.selectDataSource('fake id');
      } catch (error) {
        expect(error.message).toBe('Data source not found');
      }
    });
  });
});
