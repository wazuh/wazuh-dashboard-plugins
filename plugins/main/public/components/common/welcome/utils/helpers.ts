import { PercentFormat } from '../../../../../../../src/plugins/data/common';
import { getCore } from '../../../../kibana-services';

export const decimalFormat = () => {
  const pattern =
    getCore().uiSettings.get('format:percent:defaultPattern') ?? '0,0.[00]%';

  const decimalFormat = new PercentFormat({
    pattern: pattern,
    fractional: true,
  });
  return decimalFormat;
};
