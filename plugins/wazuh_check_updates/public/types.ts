import { NavigationPublicPluginStart } from '../../../src/plugins/navigation/public';
import { UpdateBarProps } from './components/updateBar';

export interface WazuhCheckUpdatesPluginSetup {
}
// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface WazuhCheckUpdatesPluginStart {
  UpdateBar: (props: UpdateBarProps) => JSX.Element | null
}

export interface AppPluginStartDependencies {
  navigation: NavigationPublicPluginStart;
}
