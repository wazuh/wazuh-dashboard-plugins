import React from 'react';
import {
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiText,
  EuiIcon,
  EuiSpacer,
  EuiLoadingSpinner,
  // @ts-ignore
} from '@elastic/eui';
import { ModelPredictResponse } from '../modules/model/domain/types';

interface ModelTestResultProps {
  isLoading: boolean;
  response: ModelPredictResponse | null;
  error: string | null;
  modelName: string;
}

export const TEST_PROMPT = 'Hello!';

export const ModelTestResult = ({
  isLoading,
  response,
  error,
  modelName,
}: ModelTestResultProps) => {
  const renderStatus = () => {
    if (isLoading) {
      return (
        <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiLoadingSpinner size='s' />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size='s' color='subdued'>
              Testing model connection...
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }

    if (error) {
      return (
        <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiIcon type='cross' color='danger' />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size='s' color='danger'>
              <strong>Test Failed</strong>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }

    if (response) {
      return (
        <EuiFlexGroup alignItems='center' gutterSize='s' responsive={false}>
          <EuiFlexItem grow={false}>
            <EuiIcon type='check' color='success' />
          </EuiFlexItem>
          <EuiFlexItem grow={false}>
            <EuiText size='s' color='success'>
              <strong>Test Successful</strong>
            </EuiText>
          </EuiFlexItem>
        </EuiFlexGroup>
      );
    }

    return null;
  };

  const renderUserMessage = () => (
    <EuiPanel paddingSize='m' color='subdued' hasShadow={false}>
      <EuiFlexGroup alignItems='flexStart' gutterSize='m' responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiIcon type='user' size='l' color='#6DCCB1' />
        </EuiFlexItem>
        <EuiFlexItem>
          <EuiFlexGroup direction='column' gutterSize='xs'>
            <EuiFlexItem>
              <EuiText size='s'>
                <strong>User</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiText size='s'>{TEST_PROMPT}</EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiFlexItem>
      </EuiFlexGroup>
    </EuiPanel>
  );

  const renderAssistantMessage = () => {
    if (isLoading) {
      return (
        <EuiPanel paddingSize='m' color='plain' hasShadow={false}>
          <EuiFlexGroup
            alignItems='flex-start'
            gutterSize='m'
            responsive={false}
          >
            <EuiFlexItem grow={false}>
              <EuiIcon type='brain' size='l' color='#7B68EE' />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFlexGroup direction='column' gutterSize='xs'>
                <EuiFlexItem>
                  <EuiText size='s'>
                    <strong>{modelName}</strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiFlexGroup
                    alignItems='center'
                    gutterSize='s'
                    responsive={false}
                  >
                    <EuiFlexItem grow={false}>
                      <EuiLoadingSpinner size='s' />
                    </EuiFlexItem>
                    <EuiFlexItem grow={false}>
                      <EuiText size='s' color='subdued'>
                        Thinking...
                      </EuiText>
                    </EuiFlexItem>
                  </EuiFlexGroup>
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      );
    }

    if (response && response.inference_results?.[0]?.output?.[0]?.dataAsMap) {
      const dataAsMap = response.inference_results[0].output[0].dataAsMap;

      // Handle different response formats
      let content = '';
      if (dataAsMap.choices?.[0]?.message?.content) {
        // OpenAI-style format
        content = dataAsMap.choices[0].message.content;
      } else if (dataAsMap.content?.[0]?.text) {
        // Claude-style format
        content = dataAsMap.content[0].text;
      }

      const usage = dataAsMap.usage;

      if (!content) {
        return null;
      }

      return (
        <EuiPanel paddingSize='m' color='plain' hasShadow={false}>
          <EuiFlexGroup
            alignItems='flex-start'
            gutterSize='m'
            responsive={false}
          >
            <EuiFlexItem grow={false}>
              <EuiIcon type='brain' size='l' color='#7B68EE' />
            </EuiFlexItem>
            <EuiFlexItem>
              <EuiFlexGroup direction='column' gutterSize='xs'>
                <EuiFlexItem>
                  <EuiText size='s'>
                    <strong>{modelName}</strong>
                  </EuiText>
                </EuiFlexItem>
                <EuiFlexItem>
                  <EuiText size='s'>{content}</EuiText>
                </EuiFlexItem>
                {usage && (
                  <EuiFlexItem>
                    <EuiSpacer size='xs' />
                    <EuiText size='xs' color='subdued'>
                      {usage.prompt_tokens !== undefined &&
                      usage.completion_tokens !== undefined &&
                      usage.total_tokens !== undefined
                        ? // OpenAI format
                          `Tokens: ${usage.prompt_tokens} prompt + ${usage.completion_tokens} completion = ${usage.total_tokens} total`
                        : usage.input_tokens !== undefined &&
                          usage.output_tokens !== undefined
                        ? // Claude format
                          `Tokens: ${usage.input_tokens} input + ${
                            usage.output_tokens
                          } output = ${
                            usage.input_tokens + usage.output_tokens
                          } total`
                        : 'Token usage information available'}
                    </EuiText>
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      );
    }

    return null;
  };

  return (
    <EuiFlexGroup direction='column' gutterSize='m'>
      {/* Status Header */}
      <EuiFlexItem>
        <EuiPanel paddingSize='m' color='subdued' hasShadow={false}>
          <EuiFlexGroup direction='column' gutterSize='s'>
            <EuiFlexItem>
              <EuiText size='s'>
                <strong>Model Connection Test</strong>
              </EuiText>
            </EuiFlexItem>
            <EuiFlexItem>{renderStatus()}</EuiFlexItem>
          </EuiFlexGroup>
        </EuiPanel>
      </EuiFlexItem>

      {/* Chat Messages */}
      <EuiFlexItem>
        <EuiFlexGroup direction='column' gutterSize='s'>
          <EuiFlexItem>{renderUserMessage()}</EuiFlexItem>
          <EuiFlexItem>{renderAssistantMessage()}</EuiFlexItem>
        </EuiFlexGroup>
      </EuiFlexItem>

      {/* Error Display */}
      {error && (
        <EuiFlexItem>
          <EuiPanel paddingSize='m' color='danger' hasShadow={false}>
            <EuiFlexGroup
              alignItems='flex-start'
              gutterSize='s'
              responsive={false}
            >
              <EuiFlexItem grow={false}>
                <EuiIcon type='alert' color='danger' />
              </EuiFlexItem>
              <EuiFlexItem>
                <EuiFlexGroup direction='column' gutterSize='xs'>
                  <EuiFlexItem>
                    <EuiText size='s' color='danger'>
                      <strong>Test Failed</strong>
                    </EuiText>
                  </EuiFlexItem>
                  <EuiFlexItem>
                    <EuiText size='s'>
                      <strong>Error details:</strong> {error}
                    </EuiText>
                  </EuiFlexItem>
                </EuiFlexGroup>
              </EuiFlexItem>
            </EuiFlexGroup>
          </EuiPanel>
        </EuiFlexItem>
      )}

      {/* Test Information */}
      <EuiFlexItem>
        <EuiPanel paddingSize='s' color='subdued' hasShadow={false}>
          <EuiText size='xs' color='subdued'>
            <p>
              <EuiIcon type='iInCircle' size='s' /> This test sends a simple
              greeting message to verify the model is responding correctly.
            </p>
          </EuiText>
        </EuiPanel>
      </EuiFlexItem>
    </EuiFlexGroup>
  );
};
