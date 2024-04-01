import { PatternDataSourceRepository, tSavedObjectResponse } from './pattern-data-source-repository';
import { tDataSource } from '../data-source';

import { GenericRequest } from '../../../../react-services/generic-request';
jest.mock('../../../../react-services/generic-request');
import { AppState } from '../../../../react-services/app-state';
jest.mock('../../../../react-services/app-state');

jest.mock('../../../../kibana-services', () => ({
    ...(jest.requireActual('../../../../kibana-services') as object),
    getHttp: jest.fn().mockReturnValue({
        basePath: {
            get: () => {
                return 'http://localhost:5601';
            },
            prepend: url => {
                return `http://localhost:5601${url}`;
            },
        },
    }),
    getCookies: jest.fn().mockReturnValue({
        set: (name, value, options) => {
            return true;
        },
        get: () => {
            return '{}';
        },
        remove: () => {
            return;
        },
    }),
    getUiSettings: jest.fn().mockReturnValue({
        get: name => {
            return true;
        },
    }),
}));

const mockedSavedObject = {
    data: {
        attributes: {
            title: 'test-pattern-title',
            fields: '[{"name":"timestamp","type":"date","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true}]',
        },
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
    }
} as tSavedObjectResponse;

function createMockedSavedObjectListResponse(list: { id: string, title: string }[]): tSavedObjectResponse[] {
    return list.map(item => {
        return {
            data: {
                attributes: {
                    title: item.title,
                    fields: '[{"name":"timestamp","type":"date","count":0,"scripted":false,"searchable":true,"aggregatable":true,"readFromDocValues":true}]',
                },
                id: item.id,
                migrationVersion: {
                    'index-pattern': '7.10.0',
                },
                namespace: ['default'],
                references: [],
                score: 0,
                type: 'index-pattern',
                updated_at: '2021-08-23T14:05:54.000Z',
                version: 'WzIwMjEsM',
            }
        } as tSavedObjectResponse;
    });

}

describe('PatternDataSourceRepository', () => {
    let repository: PatternDataSourceRepository;

    beforeEach(() => {
        repository = new PatternDataSourceRepository();
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should create a new instance', () => {
        expect(repository).toBeInstanceOf(PatternDataSourceRepository);
    });

    it('should return a pattern by id', async () => {
        const mockId = 'test-pattern-id';
        const mockTitle = 'test-pattern-title';
        const expectedResponse = {
            data: {
                ...mockedSavedObject.data,
                id: mockId,
                attributes: {
                    ...mockedSavedObject.data.attributes,
                    title: mockTitle,
                }
            }
        };
        const mockRequest = jest.fn().mockResolvedValue(expectedResponse);
        GenericRequest.request = mockRequest;

        const result = await repository.get(mockId) as tDataSource;

        expect(result.id).toEqual(expectedResponse.data.id);
        expect(result.title).toEqual(expectedResponse.data.attributes.title);
        expect(result._fields).toEqual(JSON.parse(expectedResponse.data.attributes.fields));
    });

    it('should return an ERROR when the request throw an error', async () => {
        const id = 'not-exists';
        const expectedError = new Error(`Error 404 or any other error in response`);
        const mockRequest = jest.fn().mockRejectedValue(expectedError);
        GenericRequest.request = mockRequest;

        await expect(repository.get(id)).rejects.toThrow(`Error getting index pattern: ${expectedError.message}`);
    });

    it('should return an ERROR when the response not return a saved object data', async () => {
        const id = 'test-id';
        const expectedResponse = {
        };
        const mockRequest = jest.fn().mockResolvedValue(expectedResponse);
        GenericRequest.request = mockRequest;
        try {
            await repository.get(id);
        } catch (error) {
            expect(error.message).toBe(`Error getting index pattern: Index pattern "${id}" not found`);
        }
    });


    it('should return an ERROR when the request not return and id or a title', async () => {
        const id = 'test-id';
        const expectedResponse = {
            data: {
                ...mockedSavedObject.data,
                id: null,
                attributes: {
                    ...mockedSavedObject.data.attributes,
                    title: null,
                }
            }
        };
        const mockRequest = jest.fn().mockResolvedValue(expectedResponse);
        GenericRequest.request = mockRequest;
        try {
            await repository.get(id);
        } catch (error) {
            expect(error.message).toBe('Error getting index pattern: Invalid index pattern data');
        }
    });

    it('should return all the index patterns', async () => {
        const listOfMockedPatterns = createMockedSavedObjectListResponse([
            { id: 'id-1', title: 'title-1' },
            { id: 'id-2', title: 'title-2' },
            { id: 'id-3', title: 'title-3' },
        ]);

        const mockRequest = jest.fn().mockResolvedValue(listOfMockedPatterns);
        GenericRequest.request = mockRequest;
        const result = await repository.getAll();
        // check if the response have the same id and title and exists the _fields property
        result.forEach((item, index) => {
            expect(item.id).toBe(listOfMockedPatterns[index].data.id);
            expect(item.title).toBe(listOfMockedPatterns[index].data.attributes.title);
            expect(item._fields).toBeDefined();
        });

    });

    it('should return ERROR when the getAll request throw an error ', async () => {
        const expectedError = new Error('Error 404 or any other error in response');
        const mockRequest = jest.fn().mockRejectedValue(expectedError);
        GenericRequest.request = mockRequest;

        await expect(repository.getAll()).rejects.toThrow(`Error getting index patterns: ${expectedError.message}`);
    });

    it('should parse index pattern data', () => {
        const mockedIndexPatternData = {
            ...mockedSavedObject.data,
            id: 'test-pattern-id',
            attributes: {
                ...mockedSavedObject.data.attributes,
                title: 'test-pattern-title',
            }
        }
        const result = repository.parseIndexPattern(mockedIndexPatternData);
        expect(result.id).toEqual(mockedIndexPatternData.id);
        expect(result.title).toEqual(mockedIndexPatternData.attributes.title);
        expect(result._fields).toBeDefined();
    });

    it('should set default pattern in storage', async () => {
        const mockedIndexPattern = {
            ...mockedSavedObject.data,
            id: 'test-id',
            attributes: {
                ...mockedSavedObject.data.attributes,
                title: 'test-title',
            }
        }
        const parsedIndexPatternData = repository.parseIndexPattern(mockedIndexPattern);
        await repository.setDefault(parsedIndexPatternData);
        expect(AppState.setCurrentPattern).toHaveBeenCalledWith(mockedIndexPattern.id);
    });

    it('should return ERROR when not receive an index pattern to setting like default', async () => {
        try {
            repository.setDefault(null as any)
        }catch(error){ 
            expect(error.message).toBe('Index pattern is required');
        }
    });

    it('should return default index pattern stored', async () => {
        AppState.getCurrentPattern = jest.fn().mockReturnValue('test-pattern-id');
        const mockedDefaultIndexPattern = {
            data: {
                ...mockedSavedObject.data,
                id: 'test-pattern-id',
                attributes: {
                    ...mockedSavedObject.data.attributes,
                    title: 'test-pattern-title',
                }
            }
        }
        const mockRequest = jest.fn().mockResolvedValue(mockedDefaultIndexPattern);
        GenericRequest.request = mockRequest;
        const result = await repository.getDefault();
        // mock the get method to return the current pattern
        expect(result.id).toEqual('test-pattern-id');
    });

    it('should return an ERROR when default index pattern is not saved in storage', async () => {
        AppState.getCurrentPattern = jest.fn().mockReturnValue(null);
        try {
            await repository.getDefault();
        }catch(error){
            expect(error.message).toBe('No default pattern set');
        }
    });
});
