import React from 'react';
import { getUiSettings } from '../../../kibana-services';
import { WAZUH_AGENTS_OS_TYPE } from '../../../../common/constants';

import windowsDarkSVG from '../../../assets/images/themes/dark/windows-icon.svg';
import windowsLightSVG from '../../../assets/images/themes/light/windows-icon.svg';
import linuxDarkSVG from '../../../assets/images/themes/dark/linux-icon.svg';
import linuxLightSVG from '../../../assets/images/themes/light/linux-icon.svg';
import macDarkSVG from '../../../assets/images/themes/dark/mac-icon.svg';
import macLightSVG from '../../../assets/images/themes/light/mac-icon.svg';

interface WzIconProps {
  type: WAZUH_AGENTS_OS_TYPE;
  alt?: string;
  style?: React.CSSProperties;
  className?: string;
  forceMode?: 'dark' | 'light';
}

const iconsOS = {
  [WAZUH_AGENTS_OS_TYPE.WINDOWS]: {
    dark: windowsDarkSVG,
    light: windowsLightSVG,
  },
  [WAZUH_AGENTS_OS_TYPE.LINUX]: {
    dark: linuxDarkSVG,
    light: linuxLightSVG,
  },
  [WAZUH_AGENTS_OS_TYPE.DARWIN]: {
    dark: macDarkSVG,
    light: macLightSVG,
  },
};

export default function WzIconSVG({
  type,
  alt,
  style,
  className,
  forceMode,
}: WzIconProps) {
  const darkMode =
    typeof forceMode !== 'undefined'
      ? forceMode === 'dark'
      : getUiSettings()?.get('theme:darkMode');
  const iconSet = iconsOS[type as keyof typeof iconsOS];
  if (!iconSet) return null;

  return (
    <img
      src={darkMode ? iconSet.dark : iconSet.light}
      alt={alt || `${type} icon`}
      style={style}
      className={className}
    />
  );
}
