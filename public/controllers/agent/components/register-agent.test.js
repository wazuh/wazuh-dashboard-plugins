import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { RegisterAgent } from '../components/register-agent'

// mocked getErrorOrchestrator
const mockedGetErrorOrchestrator = {
    handleError: jest.fn(),
  };
  
  jest.mock('../../../react-services/common-services', () => {
    return {
      getErrorOrchestrator: () => mockedGetErrorOrchestrator,
    };
  });

describe('RegisterAgent', () => {
  it('mount - RegisterAgent', async() => {
    const getWazuhVersion = jest.fn();
    const getCurrentApiAddress = jest.fn();
    const addNewAgent = jest.fn();
    const reload = jest.fn();

    const props = {
      hasAgents: true,
      getWazuhVersion,
      getCurrentApiAddress,
      addNewAgent,
      reload,
    };
    const { debug } = render(<RegisterAgent {...props} />);  
        debug()
  });
});
