import React from 'react';
import useObservable from 'react-use/lib/useObservable';
import { EuiButton, EuiEmptyPrompt } from '@elastic/eui';
import { getCore } from '../../../kibana-services';

const DefaultMissingRequiredChecks = ({
  missingSuccessChecks,
  refresh,
  checks,
}: {
  checks: any[];
  missingSuccessChecks: string[];
  refresh: () => void;
}) => (
  <EuiEmptyPrompt
    iconType='alert'
    title={<h2>Some checks are not successful</h2>}
    body={
      <div>
        <span>Required checks to be healthy: </span>
        <div>
          {missingSuccessChecks.reduce((acc, text, idx) => {
            if (idx > 0) {
              acc.push(<div key={`sep-${idx}`}></div>);
            }
            acc.push(<div key={`code-${text}-${idx}`}>- {text}</div>);
            return acc;
          }, [])}
        </div>
      </div>
    }
    actions={
      <EuiButton color='primary' fill onClick={refresh}>
        Refresh
      </EuiButton>
    }
  />
);
/**
 * HOC that requires a list of healthy checks from the health check core service, if some of them are not healthy then this render a prompt, else render the wrapperd component
 * @param checkRequirements
 * @param MissingRequirementsComponent
 * @returns
 */
export const withHealthCheckChecks =
  (
    checkRequirements,
    MissingRequirementsComponent = DefaultMissingRequiredChecks,
  ) =>
  WrappedComponent =>
  props => {
    const { checks } = useObservable(
      getCore().healthCheck.status$,
      getCore().healthCheck.status$.getValue(),
    );

    const missingSuccessChecks = checkRequirements.filter(key =>
      checks.some(({ name, result }) => name === key && result !== 'success'),
    );

    if (missingSuccessChecks.length) {
      return (
        <MissingRequirementsComponent
          missingSuccessChecks={missingSuccessChecks}
          checks={checks}
          refresh={getCore().healthCheck.client.internal.run}
        />
      );
    }

    return <WrappedComponent {...props} />;
  };
