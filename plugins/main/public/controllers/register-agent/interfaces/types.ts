import { tOperatingSystem } from '../config/os-commands-definitions';

interface RegisterAgentData {
  icon: string;
  title: tOperatingSystem['name'];
  hr: boolean;
  architecture: tOperatingSystem['architecture'][]
}

interface CheckboxGroupComponentProps {
  data: string[];
  cardIndex: number;
  selectedOption: string | undefined;
  onOptionChange: (optionId: string) => void;
  onChange: (id: string) => void;
}

export type { RegisterAgentData, CheckboxGroupComponentProps };
