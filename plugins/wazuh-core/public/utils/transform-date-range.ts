import dateMath from '@elastic/datemath';
import { TimeRange } from 'src/plugins/data/public';
import { getForceNow } from '../services/query-manager/search-service';

export function transformDateRange(dateRange: TimeRange) {
  return {
    from: dateMath.parse(dateRange.from).toISOString(),
    to: dateMath
      .parse(dateRange.to, { roundUp: true, forceNow: getForceNow() })
      .toISOString(),
  };
}
