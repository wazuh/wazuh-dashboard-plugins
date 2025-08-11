import { getCore } from '../../../../../../kibana-services';

const core = getCore();

function convertNumeralToD3Format(numeralFormat: string): string {
  const useThousands: boolean = numeralFormat.includes(',');
  const isPercent: boolean = numeralFormat.includes('%');
  const decimalMatch: RegExpMatchArray | null =
    numeralFormat.match(/\.(0+)?(\[0+\])?/);

  let minDecimals: number = 0;
  let maxDecimals: number = 0;
  let useTrim: boolean = false;

  if (decimalMatch) {
    const fixed: string = decimalMatch[1] || '';
    const optional: string = decimalMatch[2] || '';
    minDecimals = fixed.length;
    maxDecimals = fixed.length + (optional.match(/0/g) || []).length;
    useTrim = optional.length > 0;
  }

  const precision: number = maxDecimals || minDecimals;

  let format: string = '';
  if (useThousands) format += ',';
  format += '.' + precision;

  format += '~f';

  return format;
}

export const decimalFormat = () => {
  let decimalFormat;
  const pattern = core.uiSettings.get('format:percent:defaultPattern');
  decimalFormat = convertNumeralToD3Format(pattern);

  return decimalFormat ?? '.2f';
};

export const checkResultColors = () => {
  const colors = {
    passed: '#209280',
    failed: '#cc5642',
    'Not run': '#6092c0',
    checkScoreColor: core.uiSettings.get('theme:darkMode')
      ? '#dfe5ef'
      : '#333333',
  };

  return colors;
};
