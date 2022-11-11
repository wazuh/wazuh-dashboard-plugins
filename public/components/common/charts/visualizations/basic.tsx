import React, { useCallback, useState } from "react";
import { ChartLegend } from "./legend";
import { ChartDonut, ChartDonutProps } from '../charts/donut';
import { EuiEmptyPrompt, EuiFlexGroup, EuiFlexItem, EuiLoadingChart, EuiText, EuiSelect, EuiSpacer } from '@elastic/eui';
import { useAsyncActionRunOnStart } from "../../hooks";

export type VisualizationBasicProps = ChartDonutProps & {
  type: 'donut',
  size: number | string | { width: number | string, height: number | string }
  showLegend?: boolean
  isLoading?: boolean
  noDataTitle?: string
  noDataMessage?: string | (() => React.node)
  errorTitle?: string
  errorMessage?: string | (() => React.node)
  error?: { message: string }
}

const chartTypes = {
  'donut': ChartDonut
};

/**
 * Render a visualization. Basic component. It is a controlled component that can render
 * loading status, no data, error or the chart.
 */
export const VisualizationBasic = ({
  data,
  showLegend,
  isLoading,
  size,
  type,
  noDataTitle = 'No data',
  noDataMessage,
  errorTitle = 'Error',
  errorMessage,
  error
}: VisualizationBasicProps) => {
  const { width, height } = typeof size === 'object' ? size : { width: size, height: size };

  let visualization = null;

  if (isLoading) {
    visualization = (
      <div style={{ textAlign: "center", width, height, position: 'relative' }}>
        <EuiLoadingChart size="xl" style={{ top: '50%', transform: 'translate(-50%, -50%)', position: 'absolute' }} />
      </div>
    )
  } else if (errorMessage || error?.message) {
    visualization = (
      <EuiEmptyPrompt
        iconType="alert"
        title={<h4>{errorTitle}</h4>}
        body={errorMessage || error?.message}
      />
    )
  } else if (!data || (Array.isArray(data) && !data.length)) {
    visualization = (
      <EuiEmptyPrompt
        iconType="stats"
        title={<h4>{noDataTitle}</h4>}
        body={typeof noDataMessage === 'function' ? noDataMessage() : noDataMessage}
      />
    )
  } else {
    const Chart = chartTypes[type];
    const chartFlexStyle = {
      alignItems: 'flex-end',
      paddingRight: '1em'
    }
    const legendFlexStyle = {
      height: '100%',
      paddingLeft: '1em'
    }
    visualization = (
      <EuiFlexGroup responsive={false} style={{ height: '100%' }} gutterSize='none'>
        <EuiFlexItem style={chartFlexStyle}>
          <Chart data={data} />
        </EuiFlexItem>
        {showLegend && (
          <EuiFlexItem style={legendFlexStyle}>
            <ChartLegend
              data={data.map(({ color, ...rest }) => ({ ...rest, labelColor: color, color: 'text' }))}
            />
          </EuiFlexItem>
        )}
      </EuiFlexGroup>
    )
  }

  return (
    <div style={{ width, height }}>
      {visualization}
    </div>
  )

}

type VisualizationBasicWidgetProps = VisualizationBasicProps & {
  onFetch: (...dependencies) => any[]
  onFetchDependencies?: any[]
}

/**
 * Component that fetch the data and renders the visualization using the visualization basic component
 */
export const VisualizationBasicWidget = ({ onFetch, onFetchDependencies, ...rest }: VisualizationBasicWidgetProps) => {
  const { running, ...restAsyncAction } = useAsyncActionRunOnStart(onFetch, onFetchDependencies);

  return <VisualizationBasic {...rest} {...restAsyncAction} isLoading={running} />
}

type VisualizationBasicWidgetSelectorProps = VisualizationBasicWidgetProps & {
  selectorOptions: { value: any, text: string }[]
  title?: string
  onFetchExtraDependencies?: any[]
}

/**
 * Renders a visualization that has a selector to change the resource to fetch data and display it. Use the visualization basic. 
 */
export const VisualizationBasicWidgetSelector = ({ selectorOptions, title, onFetchExtraDependencies, ...rest }: VisualizationBasicWidgetSelectorProps) => {
  const [selectedOption, setSelectedOption] = useState(selectorOptions[0].value);

  const onChange = useCallback((e) => setSelectedOption(e.target.value));

  return (
    <>
      <EuiFlexGroup
        className="embPanel__header" gutterSize='none'
      >
        <EuiFlexItem>
          {title && (
            <h2 className="embPanel__title wz-headline-title">
              <EuiText size="xs"><h2>{title}</h2></EuiText>
            </h2>
          )}
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiSelect style={{ fontSize: '0.793rem' }}
            compressed={true}
            options={selectorOptions}
            value={selectedOption}
            onChange={onChange}
            aria-label="Select options"
          />
        </EuiFlexItem>
      </EuiFlexGroup>
      <EuiSpacer size='s' />
      <VisualizationBasicWidget
        {...rest}
        {...(rest.noDataMessage ?
          {
            noDataMessage: typeof rest.noDataMessage === 'function' ?
              rest.noDataMessage(selectedOption, selectorOptions.find(option => option.value === selectedOption))
              : rest.noDataMessage
          }
          : {}
        )}
        onFetchDependencies={[selectedOption, ...(onFetchExtraDependencies || [])]}
      />
    </>
  )
}