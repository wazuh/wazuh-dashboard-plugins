import { parseInterval } from 'ui/utils/parse_interval';
import { i18n } from '@kbn/i18n';
import dateMath from '@elastic/datemath';
const GTE_INTERVAL_RE = new RegExp(
  `^>=([\\d\\.]*\\s*(${dateMath.units.join('|')}))$`
);

export function validateInterval(bounds, panel, maxBuckets) {
  const { interval } = panel;
  const { min, max } = bounds;
  // No need to check auto it will return around 100
  if (!interval) return;
  if (interval === 'auto') return;
  const greaterThanMatch = interval.match(GTE_INTERVAL_RE);
  if (greaterThanMatch) return;
  const duration = parseInterval(interval);
  if (duration) {
    const span = max.valueOf() - min.valueOf();
    const buckets = Math.floor(span / duration.asMilliseconds());
    if (buckets > maxBuckets) {
      throw new Error(
        i18n.translate(
          'tsvb.validateInterval.notifier.maxBucketsExceededErrorMessage',
          {
            defaultMessage:
              'Max buckets exceeded: {buckets} is greater than {maxBuckets}, try a larger time interval in the panel options.',
            values: { buckets, maxBuckets }
          }
        )
      );
    }
  }
}
