import React, { useRef, useState } from 'react';
import {
  EuiButton,
  EuiCallOut,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { WzRequest } from '../../../../react-services/wz-request';

interface AIAnalysisTabProps {
  index: string;
  id: string;
}

const AI_ANALYSIS_ERROR =
  'AI analysis is unavailable. Check the backend connection and try again.';

export const AIAnalysisTab = ({ index, id }: AIAnalysisTabProps) => {
  const [analysis, setAnalysis] = useState<string>();
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const requestInFlight = useRef(false);

  const analyzeAlert = async () => {
    if (requestInFlight.current) {
      return;
    }

    requestInFlight.current = true;
    setIsLoading(true);
    setHasError(false);
    setAnalysis(undefined);

    try {
      const response = await WzRequest.genericReq(
        'POST',
        '/api/ai/analyze-alert',
        { index, id },
        { shouldRetry: false, checkCurrentApiIsUp: false },
      );
      const result = response?.data;

      if (
        result?.ok !== true ||
        typeof result.analysis !== 'string' ||
        !result.analysis.trim()
      ) {
        throw new Error('Invalid AI analysis response');
      }

      setAnalysis(result.analysis);
    } catch {
      setHasError(true);
    } finally {
      requestInFlight.current = false;
      setIsLoading(false);
    }
  };

  return (
    <EuiFlexGroup direction='column' alignItems='flexStart' gutterSize='m'>
      <EuiFlexItem grow={false}>
        <EuiText size='s'>
          Request an AI explanation of this selected security alert.
        </EuiText>
        <EuiSpacer size='m' />
        <EuiButton
          onClick={analyzeAlert}
          isLoading={isLoading}
          isDisabled={isLoading}
        >
          Analyze alert
        </EuiButton>
      </EuiFlexItem>

      {isLoading && (
        <EuiFlexItem grow={false}>
          <EuiText size='s'>Analyzing alert…</EuiText>
        </EuiFlexItem>
      )}

      {hasError && (
        <EuiFlexItem>
          <EuiCallOut
            color='danger'
            iconType='alert'
            title={AI_ANALYSIS_ERROR}
          />
        </EuiFlexItem>
      )}

      {analysis !== undefined && (
        <EuiFlexItem>
          <EuiPanel paddingSize='m'>
            <EuiTitle size='s'>
              <h3>Analysis</h3>
            </EuiTitle>
            <EuiSpacer size='s' />
            <EuiText size='s'>
              <pre style={{ whiteSpace: 'pre-wrap' }}>{analysis}</pre>
            </EuiText>
          </EuiPanel>
        </EuiFlexItem>
      )}
    </EuiFlexGroup>
  );
};
