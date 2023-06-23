interface RegisterAgentData {
  icon: string;
  title: string;
  hr: boolean;
  architecture: string[];
}

interface CheckboxGroupComponentProps {
  data: string[];
  cardIndex: number;
  selectedOption: string | undefined;
  onOptionChange: (optionId: string) => void;
  onChange: (id: string) => void;
}

export type { RegisterAgentData, CheckboxGroupComponentProps };
