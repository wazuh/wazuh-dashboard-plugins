import { getAgentManagement } from '../../../../../plugin-services';
import { getAgents } from './get-agents';

// Mock the plugin services
jest.mock('../../../../../plugin-services', () => ({
  getAgentManagement: jest.fn(),
}));

describe('getAgents', () => {
  const mockParams = { limit: 10, offset: 0 };
  const mockSetGetAgentsStatus = jest.fn();
  const mockSetGetAgentsError = jest.fn();
  const mockGetAll = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mocks
    (getAgentManagement as jest.Mock).mockReturnValue({
      getAll: mockGetAll,
    });
  });

  test('should return agent results on successful API call', async () => {
    // Mock successful API response
    const mockAgents = {
      hits: [
        {
          agent: {
            id: '001',
            name: 'agent1',
            status: 'active',
          },
        },
        {
          agent: {
            id: '002',
            name: 'agent2',
            status: 'disconnected',
          },
        },
      ],
    };

    mockGetAll.mockResolvedValueOnce(mockAgents);

    // Call the function
    const result = await getAgents({
      params: mockParams,
      setGetAgentsStatus: mockSetGetAgentsStatus,
      setGetAgentsError: mockSetGetAgentsError,
    });

    // Verify the API was called with the correct parameters
    expect(mockGetAll).toHaveBeenCalledWith(mockParams);

    // Verify the function returns the expected results
    expect(result).toEqual(mockAgents.hits);

    // Verify status and error functions were not called
    expect(mockSetGetAgentsStatus).not.toHaveBeenCalled();
    expect(mockSetGetAgentsError).not.toHaveBeenCalled();
  });

  test('should handle API errors correctly', async () => {
    // Mock API error
    const mockError = new Error('API error');

    mockGetAll.mockRejectedValueOnce(mockError);

    // Call the function
    const result = await getAgents({
      params: mockParams,
      setGetAgentsStatus: mockSetGetAgentsStatus,
      setGetAgentsError: mockSetGetAgentsError,
    });

    // Verify the API was called with the correct parameters
    expect(mockGetAll).toHaveBeenCalledWith(mockParams);

    // Verify the function returns undefined on error
    expect(result).toBeUndefined();
  });

  test('should pass different parameters to the API', async () => {
    // Mock successful API response
    const mockAgents = {
      hits: [
        {
          agent: {
            id: '001',
            name: 'agent1',
            status: 'active',
          },
        },
      ],
    };

    mockGetAll.mockResolvedValueOnce(mockAgents);

    const customParams = {
      limit: 5,
      offset: 10,
      q: 'status=active',
    };

    // Call the function with different parameters
    await getAgents({
      params: customParams,
      setGetAgentsStatus: mockSetGetAgentsStatus,
      setGetAgentsError: mockSetGetAgentsError,
    });

    // Verify the API was called with the correct parameters
    expect(mockGetAll).toHaveBeenCalledWith(customParams);
  });
});
