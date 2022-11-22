import { buttonsConfig } from '../../config';
import { renderGroupBtnsContent } from '../../services';

/**
 *
 * @param OS
 * @param version
 * @param architecture
 */
 export const getArchitectureStepContent = (
    title: string,
    state: any,
    onChange: (field: string, value: string) => void,
  ) => {
    const { os, version } = state;
  
    if (!version) {
      // hide step
      return false;
    }
  
    const handleOnchange = (value: string) => {
      onChange('architecture', value);
    };
  
    const buttons = buttonsConfig.find(button => button.id === os)
      ?.architectureBtns || [];

    return renderGroupBtnsContent({
      title,
      buttons,
      defaultValue: state.architecture,
      onChange: handleOnchange,
    });
  };
  