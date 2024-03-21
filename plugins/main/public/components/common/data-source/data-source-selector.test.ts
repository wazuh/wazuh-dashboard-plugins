import { DataSourceSelector } from './data-source-selector';
import { DataSourceRepository } from './data-source-repository';
import { tDataSourceFactory } from './data-source-factory';
import { tDataSource } from './data-source';

class ExampleRepository implements DataSourceRepository {
    getDefault = jest.fn();
    setDefault = jest.fn();
    get = jest.fn();
    getAll = jest.fn();
}

class ExampleFactory implements tDataSourceFactory {
    create = jest.fn();
    createAll = jest.fn();
}

let repository;
let factory;
let dataSourceSelector;

const dataSourcesMocked: tDataSource[] = [
    { id: '1', title: 'DataSource 1', select: (): Promise<void> => Promise.resolve() },
    { id: '2', title: 'DataSource 2', select: (): Promise<void> => Promise.resolve() },
    { id: '3', title: 'DataSource 3', select: (): Promise<void> => Promise.resolve() },
];

describe('DataSourceSelector', () => {

    beforeEach(() => {
        repository = new ExampleRepository();
        factory = new ExampleFactory();
        dataSourceSelector = new DataSourceSelector(repository, factory);
    });

    describe('constructor', () => {
        it('should return ERROR when the selector not receive a repository', () => {
            try {
                new DataSourceSelector(null as any, factory);
            } catch (error) {
                expect(error.message).toBe('Data source repository is required');
            }
        })

        it('should return ERROR when the selector not receive a valid repository', () => {
            try {
                new DataSourceSelector({} as any, factory);
            } catch (error) {
                expect(error.message).toBe('Invalid data source factory');
            }
        })


        it('should return ERROR when the selector not receive a factory', () => {
            try {
                new DataSourceSelector(repository, null as any);
            } catch (error) {
                expect(error.message).toBe('Data source factory is required');
            }
        })

        it('should return ERROR when the selector not receive a valid factory', () => {
            try {
                new DataSourceSelector(repository, {} as any);
            } catch (error) {
                expect(error.message).toBe('Invalid data source factory');
            }
        })


    })

    describe('existsDataSource', () => {
        it('should return TRUE when the data source exists', async () => {
            jest.spyOn(repository, 'get').mockResolvedValue({ id: '1', name: 'DataSource 1' });
            const result = await dataSourceSelector.existsDataSource('1');
            expect(result).toBe(true);
            expect(repository.get).toHaveBeenCalledTimes(1);
        });

        it('should return FALSE when the data source does not exist', async () => {
            jest.spyOn(repository, 'get').mockResolvedValue(null);
            const result = await dataSourceSelector.existsDataSource('fake-id');
            expect(result).toBe(false);
            expect(repository.get).toHaveBeenCalledTimes(1);
        });
    })

    describe('getFirstValidDataSource', () => {
        it('should return the first valid data source from the repository', async () => {
            jest.spyOn(repository, 'getAll').mockResolvedValue([]);
            jest.spyOn(factory, 'createAll').mockResolvedValue(dataSourcesMocked);
            jest.spyOn(dataSourceSelector, 'existsDataSource').mockReturnValueOnce(false).mockReturnValueOnce(true);
            const result = await dataSourceSelector.getFirstValidDataSource();
            expect(result).toEqual(dataSourcesMocked[1]);
            expect(repository.getAll).toHaveBeenCalledTimes(1);
            expect(factory.createAll).toHaveBeenCalledTimes(1);
            expect(dataSourceSelector.existsDataSource).toHaveBeenCalledTimes(2);
        });

        it('should throw an error when no valid data source is found', async () => {
            jest.spyOn(repository, 'getAll').mockResolvedValue([]);
            jest.spyOn(factory, 'createAll').mockResolvedValue(dataSourcesMocked);
            jest.spyOn(dataSourceSelector, 'existsDataSource').mockReturnValue(false);
            try {
                await dataSourceSelector.getFirstValidDataSource();
            } catch (error) {
                expect(error.message).toBe('No valid data sources found');
            }
        });
    })

    describe('getAllDataSources', () => {
        it('should return all data sources from the repository when the map is empty', async () => {
            jest.spyOn(repository, 'getAll').mockResolvedValue([]);
            jest.spyOn(factory, 'createAll').mockResolvedValue(dataSourcesMocked);
            const result = await dataSourceSelector.getAllDataSources();
            expect(result).toEqual(dataSourcesMocked);
        });

        it('should return all data sources from the map when was loaded previously', async () => {
            jest.spyOn(repository, 'getAll').mockResolvedValue([]);
            jest.spyOn(factory, 'createAll').mockResolvedValue(dataSourcesMocked);
            await dataSourceSelector.getAllDataSources();
            const result = await dataSourceSelector.getAllDataSources();
            expect(result).toEqual(dataSourcesMocked);
            expect(factory.createAll).toHaveBeenCalledTimes(1);
            expect(repository.getAll).toHaveBeenCalledTimes(1);
        });
    })

    describe('getDataSource', () => {

        it('should return the selected data source from the repository', async () => {
            const dataSourceId = '1';
            jest.spyOn(repository, 'getDefault').mockResolvedValue({ id: dataSourceId, name: 'Selected DataSource' });
            const result = await dataSourceSelector.getSelectedDataSource();
            expect(result.id).toEqual(dataSourceId);
            expect(repository.getDefault).toHaveBeenCalledTimes(1);
        });

        it('should return the first data source when the repository does not have a selected data source', async () => {
            jest.spyOn(repository, 'getDefault').mockResolvedValue(null);
            jest.spyOn(repository, 'getAll').mockResolvedValue([]);
            jest.spyOn(factory, 'createAll').mockResolvedValue(dataSourcesMocked);
            // mock spyon existsDataSource method to return 2 times differents values
            jest.spyOn(dataSourceSelector, 'existsDataSource').mockReturnValueOnce(false).mockReturnValueOnce(true);
            jest.spyOn(dataSourceSelector, 'selectDataSource').mockResolvedValue(true);
            const result = await dataSourceSelector.getSelectedDataSource();
            expect(result.id).toEqual(dataSourcesMocked[1].id);
            expect(repository.getDefault).toHaveBeenCalledTimes(1);
            expect(repository.getAll).toHaveBeenCalledTimes(1);
            expect(factory.createAll).toHaveBeenCalledTimes(1);
            expect(dataSourceSelector.existsDataSource).toHaveBeenCalledTimes(2);
            expect(dataSourceSelector.selectDataSource).toHaveBeenCalledTimes(1);
        })

    })

    describe('selectDataSource', () => {

        it('should select a data source by ID when exists', async () => {
            jest.spyOn(repository, 'getAll').mockResolvedValue([]);
            jest.spyOn(factory, 'createAll').mockResolvedValue(dataSourcesMocked);
            jest.spyOn(repository, 'setDefault').mockResolvedValue(true);
            await dataSourceSelector.selectDataSource('1');
            expect(repository.setDefault).toHaveBeenCalledTimes(1);
            expect(repository.setDefault).toHaveBeenCalledWith(dataSourcesMocked[0]);
        });

        it('should throw an error when selecting a non-existing data source', async () => {
            jest.spyOn(repository, 'getAll').mockResolvedValue([]);
            jest.spyOn(factory, 'createAll').mockResolvedValue(dataSourcesMocked);
            try {
                await dataSourceSelector.selectDataSource('fake-id');
            } catch (error) {
                expect(error.message).toBe('Data source not found');
            }
        });
    })
})