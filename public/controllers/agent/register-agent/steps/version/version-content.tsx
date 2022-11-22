import { buttonsConfig, VersionBtn } from '../../config';
import { renderGroupBtnsContent } from '../../services';
/**
 *
 * @param OS
 * @param version
 * @param architecture
 */
 export const getVersionStepContent = (
    title: string,
    state: any,
    onChange: (field: string, value: string) => void,
  ) => {
    const { os, version } = state;
    if (!os) {
      // hide step
      return false;
    }
  
    const handleOnchange = (value: string) => {
      onChange('version', value);
    };
  
    const buttons = buttonsConfig.find(button => button.id === os)?.versionsBtns;
    if (!buttons) {
      console.error('No buttons found for OS', os);
      return false;
    }
  
    const versionBtn = buttons?.filter(
      button => button.id === version,
    ) as VersionBtn[];
  
    if (versionBtn?.length && versionBtn[0].afterContent) {
      return renderGroupBtnsContent({
        title,
        buttons,
        afterContent: versionBtn[0].afterContent,
        defaultValue: state.version,
        onChange: handleOnchange,
      });
    } else {
      return renderGroupBtnsContent({
        title,
        buttons,
        defaultValue: state.version,
        onChange: handleOnchange,
      });
    }
  };
  