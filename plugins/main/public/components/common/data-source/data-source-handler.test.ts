import { DataSourceHandler } from './data-source-handler';
import { DataSourceFactory } from './data-source-factory';

describe('DataSourceHandler', () => {
    it('should return ERROR when the handler not receive a valid factory', () => {
        try {
            new DataSourceHandler({} as any);
        }catch(error){
            expect(error.message).toBe('Invalid data source factory');
        }
    })

    it('should return ERROR when the handler not receive a factory', () => {
        try {
            new DataSourceHandler(null as any);
        }catch(error){
            expect(error.message).toBe('Data source factory is required');
        }
    })

    it('should create a new data source handler when receive a valid factory', () => {
        class ExampleFactory extends DataSourceFactory {
            validateDataSources(dataSources: any): boolean {
                throw new Error("Method not implemented.");
            }
            createDataSources(): any {
                throw new Error("Method not implemented.");
            }
            getDataSources(): any {
                return [];
            }
        }

        const dataSourceHandler = new DataSourceHandler(new ExampleFactory());
        expect(dataSourceHandler).toBeTruthy();
    })
})