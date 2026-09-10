import { tOperatingSystem } from '../config/os-commands-definitions';
import { MintedEnrollmentToken } from '../../../../services/enrollment-tokens';

interface RegisterAgentData {
  icon: string;
  title: tOperatingSystem['name'];
  hr: boolean;
  architecture: tOperatingSystem['architecture'][];
}

interface CheckboxGroupComponentProps {
  data: string[];
  cardIndex: number;
  selectedOption: string | undefined;
  onOptionChange: (optionId: string) => void;
  onChange: (id: string) => void;
}

/* The token the wizard deploys with: either one it just minted or one the
operator kept from an earlier mint and pasted back in. Only a minted one carries
metadata -- a stored token is just its text, so its lifetime, its address and
how many enrollments it has left cannot be shown or re-checked here. The
manager is what rejects an expired or exhausted one, at enrollment time. */
type EnrollmentToken =
  | ({ source: 'generated' } & MintedEnrollmentToken)
  | { source: 'existing'; token: string };

export type { RegisterAgentData, CheckboxGroupComponentProps, EnrollmentToken };
