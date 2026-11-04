import React from 'react';
import { i18n } from '@osd/i18n';
import moment from 'moment';
import {
  Axis,
  BarSeries,
  Chart,
  Position,
  ScaleType,
  Settings,
} from '@elastic/charts';
import {
  EUI_CHARTS_THEME_DARK,
  EUI_CHARTS_THEME_LIGHT,
} from '@elastic/eui/dist/eui_charts_theme';
import type { CatalogHistogramBucket } from '../../../../common/cti-catalog';
import { getCore } from '../../../plugin-services';
import { numberFormat } from './catalog-shared';

const CHART_HEIGHT = 200;

/**
 * Records first seen per month: shows the feed keeps receiving new indicators.
 * One series, so the panel title names it and there is no legend.
 */
export const FirstSeenChart: React.FC<{
  buckets: CatalogHistogramBucket[];
}> = ({ buckets }) => {
  const darkMode = Boolean(getCore().uiSettings?.get('theme:darkMode'));
  const theme = (darkMode ? EUI_CHARTS_THEME_DARK : EUI_CHARTS_THEME_LIGHT)
    .theme;
  const seriesName = i18n.translate(
    'wazuhCheckUpdates.ctiCatalog.indicators.histogram.series',
    { defaultMessage: 'Records first seen' },
  );

  return (
    <div
      style={{ height: CHART_HEIGHT }}
      data-test-subj='ctiCatalogFirstSeenChart'
    >
      <Chart>
        <Settings
          theme={theme}
          showLegend={false}
          tooltip={{
            headerFormatter: ({ value }) => moment(value).format('MMMM YYYY'),
          }}
        />
        <Axis
          id='month'
          position={Position.Bottom}
          tickFormat={value => moment(value).format('MMM YY')}
        />
        <Axis
          id='count'
          position={Position.Left}
          ticks={4}
          tickFormat={value => numberFormat.format(Number(value))}
        />
        <BarSeries
          id='firstSeen'
          name={seriesName}
          data={buckets}
          xScaleType={ScaleType.Time}
          yScaleType={ScaleType.Linear}
          xAccessor='date'
          yAccessors={['count']}
        />
      </Chart>
    </div>
  );
};
