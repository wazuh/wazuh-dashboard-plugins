import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import { useRegisterAgentCommands } from './use-register-agent-commands';
import { tOperatingSystem } from '../config/types';

import {
  osCommandsDefinitions,
  optionalParamsDefinitions,
} from '../config/os-commands-definitions';

describe('useRegisterAgentCommands hook', () => {
  it('should return installCommand and startCommand null when the hook is initialized', () => {
    const hook = renderHook(() => useRegisterAgentCommands({}));
    expect(hook.result.current.installCommand).toBe('');
    expect(hook.result.current.startCommand).toBe('');
  });

  it('should return ERROR when get installCommand and the OS received is NOT valid', () => {
    const {
      result: {
        current: { selectOS },
      },
    } = renderHook(() => useRegisterAgentCommands({}));
    try {
      act(() => {
        selectOS({
          name: 'linux',
          architecture: 'x64',
          extension: 'deb',
        });
      });
    } catch (error) {
      if (error instanceof Error)
        expect(error.message).toContain('No OS option found for');
    }
  });

  it('should change the commands when the OS is selected successfully', async () => {
    const hook = renderHook(() =>
      useRegisterAgentCommands<tOperatingSystem>({}),
    );
    const { selectOS } = hook.result.current;
    const { result } = hook;

    const optionSelected = osCommandsDefinitions
      .find(os => os.name === 'windows')
      ?.options.find(
        item => item.architecture === 'x86' && item.extension === 'msi',
      );
    const spyInstall = jest.spyOn(optionSelected!, 'installCommand');
    const spyStart = jest.spyOn(optionSelected!, 'startCommand');

    act(() => {
      selectOS({
        name: 'windows',
        architecture: 'x86',
        extension: 'msi',
      });
    });
    expect(result.current.installCommand).not.toBe('');
    expect(result.current.startCommand).not.toBe('');
    expect(spyInstall).toBeCalledTimes(1);
    expect(spyStart).toBeCalledTimes(1);
  });

  it('should return commands empty when set optional params and OS is NOT selected', () => {
    const hook = renderHook(() => useRegisterAgentCommands({}));
    const { setOptionalParams } = hook.result.current;

    act(() => {
      setOptionalParams({
        server_address: 'address',
        agent_group: 'group',
        agent_name: 'name',
        protocol: 'protocol',
        wazuh_password: 'password',
      });
    });

    expect(hook.result.current.installCommand).toBe('');
    expect(hook.result.current.startCommand).toBe('');
  });

  it('should return optional params empty when optional params are not added', () => {
    const hook = renderHook(() => useRegisterAgentCommands({}));
    const { optionalParamsParsed } = hook.result.current;
    expect(optionalParamsParsed).toEqual({});
  });

  it('should return optional params when optional params are added', () => {
    const hook = renderHook(() => useRegisterAgentCommands({}));
    const { setOptionalParams } = hook.result.current;
    const spyServerAddress = jest.spyOn(
      optionalParamsDefinitions.server_address,
      'getParamCommand',
    );
    const spyAgentGroup = jest.spyOn(
      optionalParamsDefinitions.agent_group,
      'getParamCommand',
    );
    const spyAgentName = jest.spyOn(
      optionalParamsDefinitions.agent_name,
      'getParamCommand',
    );
    const spyProtocol = jest.spyOn(
      optionalParamsDefinitions.protocol,
      'getParamCommand',
    );
    const spyWazuhPassword = jest.spyOn(
      optionalParamsDefinitions.wazuh_password,
      'getParamCommand',
    );
    act(() => {
      setOptionalParams({
        server_address: 'address',
        agent_group: 'group',
        agent_name: 'name',
        protocol: 'protocol',
        wazuh_password: 'password',
      });
    });

    expect(spyServerAddress).toBeCalledTimes(1);
    expect(spyAgentGroup).toBeCalledTimes(1);
    expect(spyAgentName).toBeCalledTimes(1);
    expect(spyProtocol).toBeCalledTimes(1);
    expect(spyWazuhPassword).toBeCalledTimes(1);
  });

  it('should update the commands when the OS is selected and optional params are added', () => {
    const hook = renderHook(() => useRegisterAgentCommands({}));
    const { selectOS, setOptionalParams } = hook.result.current;
    const optionSelected = osCommandsDefinitions
      .find(os => os.name === 'windows')
      ?.options.find(
        item => item.architecture === 'x86' && item.extension === 'msi',
      );
    const spyInstall = jest.spyOn(optionSelected!, 'installCommand');
    const spyStart = jest.spyOn(optionSelected!, 'startCommand');

    act(() => {
      selectOS({
        name: 'windows',
        architecture: 'x86',
        extension: 'msi',
      });

      setOptionalParams({
        server_address: 'address',
        agent_group: 'group',
        agent_name: 'name',
        protocol: 'protocol',
        wazuh_password: 'password',
      });
    });

    expect(hook.result.current.installCommand).not.toBe('');
    expect(hook.result.current.startCommand).not.toBe('');
    expect(spyInstall).toBeCalledTimes(2);
    expect(spyStart).toBeCalledTimes(2);
  });
});
