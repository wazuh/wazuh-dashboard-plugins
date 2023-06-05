import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';
import { useRegisterAgentCommands } from './use-register-agent-commands';
import { tOperatingSystem } from '../core/types';

describe('useRegisterAgentCommands hook', () => {
  it('should return installCommand and startCommand null when the hook is initialized', () => {
    const {
      result: {
        current: { installCommand, startCommand },
      },
    } = renderHook(() => useRegisterAgentCommands({}));
    expect(installCommand).toBe('');
    expect(startCommand).toBe('');
  });

  it('should return ERROR when get installCommand and the OS received is NOT valid', () => {
    const {
      result: {
        current: { installCommand, selectOS },
      },
    } = renderHook(() => useRegisterAgentCommands({}));
    try {
      selectOS({
        name: 'linux',
        architecture: 'x64',
        extension: 'deb',
      });
    } catch (error) {
      if (error instanceof Error)
        expect(error.message).toContain('No OS option found for');
    }
  });

  it.skip('should change the commands when the OS is selected successfully', async () => {
    const hookResult = renderHook(() => useRegisterAgentCommands<tOperatingSystem>({}));
    const { selectOS, installCommand, startCommand } =
      hookResult.result.current;

    act(() => {
      selectOS({
        name: 'windows',
        architecture: 'x64',
        extension: 'msi',
      });
    });
    expect(installCommand).toBe('sds');
    expect(startCommand).toBe('dsds');
  });
});
