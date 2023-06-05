import React, { useEffect, useState } from 'react';
import { CommandGenerator } from '../core/command-generator/command-generator';
import {
  osCommandsDefinitions as defaultOSCommands,
  optionalParamsDefinitions as defaultOptionalParams,
} from '../core/commands-definitions';
import {
  IOSDefinition,
  IOperationSystem,
  IOptionalParameters,
  tOptionalParams,
} from '../core/types';

interface IUseRegisterCommandsProps {
  osDefinitions?: IOSDefinition[];
  optionalParamsDefinitions?: tOptionalParams;
}

interface IUseRegisterCommandsOutput<T> {
  selectOS: (params: T) => void;
  setOptionalParams: (params: IOptionalParameters) => void;
  installCommand: string;
  startCommand: string;
}
// generic hook
export function useRegisterAgentCommands<T extends IOperationSystem>(props: IUseRegisterCommandsProps): IUseRegisterCommandsOutput<T> {
  const { osDefinitions, optionalParamsDefinitions } = props;
  // command generator settings
  const wazuhVersion = '4.4';
  const osCommands = osDefinitions || defaultOSCommands;
  const optionalParams = optionalParamsDefinitions || defaultOptionalParams;
  const commandGenerator = new CommandGenerator(
    osCommands,
    optionalParams,
    wazuhVersion,
  );

  const [osSelected, setOsSelected] = useState<T | null>(null);
  const [optionalParamsValues, setOptionalParamsValues] = useState<
    IOptionalParameters | {}
  >({});
  const [installCommand, setInstallCommand] = useState('');
  const [startCommand, setStartCommand] = useState('');

  const generateCommands = () => {
    if (!osSelected) return;
    if (osSelected) {
      commandGenerator.selectOS(osSelected);
    }
    if (optionalParamsValues) {
      commandGenerator.addOptionalParams(
        optionalParamsValues as IOptionalParameters,
      );
    }
    const installCommand = commandGenerator.getInstallCommand();
    const startCommand = commandGenerator.getStartCommand();
    setInstallCommand(installCommand);
    setStartCommand(startCommand);
  }

  useEffect(() => {
    generateCommands();
  }, [osSelected, optionalParamsValues]);

  const selectOS = (params: T) => {
    commandGenerator.selectOS(params);
    setOsSelected(params);
  };

  const setOptionalParams = (params: IOptionalParameters) => {
    if (!osSelected) return;
    if (osSelected) {
      commandGenerator.selectOS(osSelected);
    }
    commandGenerator.addOptionalParams(params);
    setOptionalParamsValues(params);
  };

  console.log('installCommand', installCommand);

  return {
    selectOS,
    setOptionalParams,
    installCommand: installCommand,
    startCommand: startCommand,
  }
};
