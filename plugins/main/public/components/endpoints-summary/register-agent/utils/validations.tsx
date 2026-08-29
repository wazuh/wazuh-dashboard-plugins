import { endpointsSummaryI18n } from '../../i18n';

const dw = endpointsSummaryI18n.deployWizard;

export const validateAgentName = (value: any) => {
  if (value.length === 0) {
    return undefined;
  }
  const invalidCharacters = validateCharacters(value);
  if (value.length < 2) {
    return `${dw.validationMinLength}${
      invalidCharacters ? ` ${invalidCharacters}` : ''
    }`;
  }
  return `${invalidCharacters}`;
};

const validateCharacters = (value: any) => {
  const regex = /^[a-z0-9.\-_,]+$/i;
  const invalidCharacters = [
    ...new Set(value.split('').filter(char => !regex.test(char))),
  ];
  if (invalidCharacters.length > 1) {
    return dw.validationInvalidCharacters(invalidCharacters.join(','));
  }
  if (invalidCharacters.length === 1) {
    return dw.validationInvalidCharacter(invalidCharacters[0]);
  }
  return '';
};
