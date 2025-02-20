import { TOperatingSystem } from '../config/os-commands-definitions';

interface EnrollAgentData {
  icon: string;
  title: TOperatingSystem['name'];
  hr: boolean;
  architecture: TOperatingSystem['architecture'][];
}

interface CheckboxGroupComponentProps {
  data: string[];
  cardIndex: number;
  selectedOption: string | undefined;
  onOptionChange: (optionId: string) => void;
  onChange: (id: string) => void;
}

export type { EnrollAgentData, CheckboxGroupComponentProps };
