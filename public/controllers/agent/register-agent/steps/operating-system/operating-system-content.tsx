import { buttonsConfig } from '../../config';
import { renderGroupBtnsContent } from '../../services';

/**
 *
 * @param OS
 * @param version
 * @param architecture
 */
export const getOSStepContent = (
  title: string,
  state: any,
  onChange: (field: string, value: string) => void,
) => {
  const buttons = buttonsConfig.map(button => ({
    id: button.id,
    label: button.label,
  }));

  const handleOnchange = (value: string) => {
    onChange('os', value);
  };

  return renderGroupBtnsContent({
    title,
    buttons,
    defaultValue: state.os,
    onChange: handleOnchange,
  });
};
