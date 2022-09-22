import { fireEvent, render, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
// import {jest} from '@jest/globals'
import React from 'react';
import { Inventory } from './inventory'
import * as _ from 'lodash'
import { createGetterSetter } from '../../../utils/create-getter-setter';
import { ErrorOrchestratorService } from '../../../react-services/error-orchestrator/error-orchestrator.service';


describe('SCA Inventory Test', () => {
    // mocked getErrorOrchestrator
const mockedGetErrorOrchestrator = {
    handleError: jest.fn(),
  };

  jest.mock('../../../react-services/common-services', () => {
    return {
        getErrorOrchestrator: () => mockedGetErrorOrchestrator,
    };
  });
    // const mockGet = jest.fn();
    // const mockSet = jest.fn();
    // jest.mock('../../../react-services/error-orchestrator/error-orchestrator.service');
    // jest.mock('../../../utils/create-getter-setter');
    it('should render correctly', async () => {
        const spyReactConsoleError = jest.spyOn(console, 'error');
        spyReactConsoleError.mockImplementation(() => {});
        const onClickRow = jest.fn()
        const props= {
            agent: {
                agentPlatform:"linux",
                configSum:"ab73af41699f13fdd81903b5f23d8d00",
                dateAdd: "2022-09-01T15:40:06+00:00",
                group: ['default'],
                group_config_status: "synced",
                id: "001",
                ip: "172.18.0.5",
                lastKeepAlive: "2022-09-21T23:47:35+00:00",
                manager: "wazuh_manager_filebeat_sources_cmake-4.4-7.10.2",
                mergedSum: "4a8724b20dee0124ff9656783c490c4e",
                name: "wazuh_agent_ubuntu_sources_cmake-4.4",
                node_name: "manager-node",
                os: {arch: 'x86_64', codename: 'Bionic Beaver', major: '18', minor: '04', name: 'Ubuntu'},
                registerIP: "any",
                status: "active",
                version: "Wazuh v4.4.0",
            },
            onClickRow,
            withoutDashboard: true
        } 
        // try {

            const { asFragment, debug } = render(<Inventory {...props} />);
        debug()

            await waitFor(() => expect(asFragment()).toMatchSnapshot());
            // await waitFor(() => expect(createGetterSetter).toHaveBeenCalledTimes(1))
            // await waitFor(() => expect(ErrorOrchestratorService).toHaveBeenCalledTimes(1))
        // } catch(error) {
        //     console.log(error)
        // }
        // expect(asFragment()).toMatchSnapshot();
        // const { debug } = render(<Inventory {...props} />);  

})
});
