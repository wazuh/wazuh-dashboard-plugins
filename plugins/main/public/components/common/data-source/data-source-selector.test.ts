import { DataSourceSelector } from './pattern-data-source-selector';
import { DataSourceRepository } from './data-source-repository';
import { tDataSource } from './data-source';

describe('DataSourceSelector', () => {
    it('should return ERROR when the handler not receive a valid factory', () => {
        try {
            new DataSourceSelector({} as any);
        }catch(error){
            expect(error.message).toBe('Invalid data source factory');
        }
    })

    it('should return ERROR when the handler not receive a factory', () => {
        try {
            new DataSourceSelector(null as any);
        }catch(error){
            expect(error.message).toBe('Data source factory is required');
        }
    })

    it('should create a new data source handler when receive a valid factory', () => {
        class ExampleFactory implements DataSourceRepository {
            get(id: string): Promise<tDataSource> {
                throw new Error('Method not implemented.');
            }
            getAll(): Promise<tDataSource[]> {
                throw new Error('Method not implemented.');
            }
            validateAll(dataSources: tDataSource[]): boolean {
                throw new Error('Method not implemented.');
            }
            validate(dataSource: tDataSource): boolean {
                throw new Error('Method not implemented.');
            }
            
        }

        const dataSourceService = new DataSourceSelector(new ExampleFactory());
        expect(dataSourceService).toBeTruthy();
    })
})