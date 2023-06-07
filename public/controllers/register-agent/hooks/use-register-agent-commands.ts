import React, { useEffect, useState } from 'react';
import { CommandGenerator } from '../core/register-commands/command-generator/command-generator';
import {
  osCommandsDefinitions as defaultOSCommands,
  optionalParamsDefinitions as defaultOptionalParams,
} from '../config/os-commands-definitions';
import {
  IOSDefinition,
  IOperationSystem,
  IOptionalParameters,
  tOptionalParams,
} from '../core/register-commands/types';

interface IUseRegisterCommandsProps {
  osDefinitions?: IOSDefinition[];
  optionalParamsDefinitions?: tOptionalParams;
}

interface IUseRegisterCommandsOutput<T> {
  selectOS: (params: T) => void;
  setOptionalParams: (params: IOptionalParameters) => void;
  installCommand: string;
  startCommand: string;
  optionalParamsParsed: IOptionalParameters | {};
}


/**
 * Custom hook that generates install and start commands based on the selected OS and optional parameters.
 * 
 * @template T - The type of the selected OS.
 * @param {IUseRegisterCommandsProps} props - The properties to configure the command generator.
 * @returns {IUseRegisterCommandsOutput<T>} - An object containing the generated commands and methods to update the selected OS and optional parameters.
 */
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
  const [optionalParamsParsed, setOptionalParamsParsed] = useState<IOptionalParameters | {}>({});
  const [installCommand, setInstallCommand] = useState('');
  const [startCommand, setStartCommand] = useState('');

  
  /**
   * Generates the install and start commands based on the selected OS and optional parameters.
   * If no OS is selected, the method returns early without generating any commands.
   * The generated commands are then set as state variables for later use.
   */
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


  /**
   * Sets the selected OS for the command generator and updates the state variables accordingly.
   * 
   * @param {T} params - The selected OS to be set.
   * @returns {void}
   */
  const selectOS = (params: T) => {
    commandGenerator.selectOS(params);
    setOsSelected(params);
  };

  /**
   * Sets the optional parameters for the command generator and updates the state variables accordingly.
   * 
   * @param {IOptionalParameters} params - The optional parameters to be set.
   * @returns {void}
   */
  const setOptionalParams = (params: IOptionalParameters): void => {
    commandGenerator.addOptionalParams(params);
    setOptionalParamsValues(params);
    setOptionalParamsParsed(commandGenerator.getOptionalParamsCommands());
  };
  
  return {
    selectOS,
    setOptionalParams,
    installCommand,
    startCommand,
    optionalParamsParsed
  }
};
