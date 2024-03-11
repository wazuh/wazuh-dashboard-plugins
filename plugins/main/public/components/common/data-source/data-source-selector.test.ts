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

    it('should return ERROR when the selector not receive a repository', () => {
        try {
            new DataSourceSelector(null as any, factory);
        }catch(error){
            expect(error.message).toBe('Data source repository is required');
        }
    })

    it('should return ERROR when the selector not receive a valid repository', () => {
        try {
            new DataSourceSelector({} as any, factory);
        }catch(error){
            expect(error.message).toBe('Invalid data source factory');
        }
    })


    it('should return ERROR when the selector not receive a factory', () => {
        try {
            new DataSourceSelector(repository, null as any);
        }catch(error){
            expect(error.message).toBe('Data source factory is required');
        }
    })

    it('should return ERROR when the selector not receive a valid factory', () => {
        try {
            new DataSourceSelector(repository, {} as any);
        }catch(error){
            expect(error.message).toBe('Invalid data source factory');
        }
    })

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
        const result = await dataSourceSelector.getSelectedDataSource();
        expect(result.id).toEqual(dataSourcesMocked[0].id);
        expect(repository.getDefault).toHaveBeenCalledTimes(1);
        expect(repository.getAll).toHaveBeenCalledTimes(1);
    })

    it.skip('should select a data source by ID when exists', async () => {
        const dataSourceId = '1';
        jest.spyOn(repository, 'get').mockResolvedValue({ id: dataSourceId, name: 'Selected DataSource' });
        await dataSourceSelector.selectDataSource(dataSourceId);
        const result = await dataSourceSelector.getSelectedDataSource();
        expect(result.id).toEqual(dataSourceId);
        expect(repository.setDefault).toHaveBeenCalledWith({ id: dataSourceId, name: 'Selected DataSource' });
    });

    it.skip('should throw an error when selecting a non-existing data source', async () => {
        const dataSourceId = '999';
        jest.spyOn(repository, 'get').mockResolvedValue(null);
        await expect(dataSourceSelector.selectDataSource(dataSourceId)).rejects.toThrowError('Data source not found');
    });

    it.skip('should throw an error when selecting a data source with an invalid ID', async () => {
        const dataSourceId = '';
        await expect(dataSourceSelector.selectDataSource(dataSourceId)).rejects.toThrowError('Invalid data source ID');
    });

    it.skip('should return all data sources from the repository when the map is empty', () => {
        
    })

    it('should return all data sources from the map when was loaded previously', () => {

    })

    it('should return all data sources from the repository when the map is empty', () => {

    })

})