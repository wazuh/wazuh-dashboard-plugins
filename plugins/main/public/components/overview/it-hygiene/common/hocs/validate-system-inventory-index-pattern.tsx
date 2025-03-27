import { webDocumentationLink } from '../../../../../../common/services/web_documentation';
import { EuiLink } from '@elastic/eui';
import {
  ensureIndexPatternIsCreated,
  ERROR_NO_INDICES_FOUND,
  withIndexPatternFromSettingDataSource,
  withMapErrorPromptErrorEnsureIndexPattern,
} from '../../../../common/hocs';

const errorPromptTypes = {
  [ERROR_NO_INDICES_FOUND]: {
    title: () => 'System inventory could be disabled or has a problem',
    body: (props: { error: { message: React.ReactNode } }) => (
      <>
        <p>{props.error.message}</p>
        <p>
          If the system inventory is enabled, then this could be caused by an
          error in: server side, server-indexer connection, indexer side, index
          creation, index data, index pattern name misconfiguration or user
          permissions related to read the inventory indices.
        </p>
        <p>
          Please, review the server and indexer logs. Also, you can check the{' '}
          <EuiLink
            href={webDocumentationLink(
              'user-manual/capabilities/system-inventory/index.html',
            )}
            target='_blank'
            rel='noopener noreferrer'
            external
          >
            system inventory documentation.
          </EuiLink>
        </p>
      </>
    ),
  },
  default: {
    title: ({ title }: { title: string }) => title,
    body: ({ message }: { message: string }) => <p>{message}</p>,
  },
};

export const withSystemInventoryDataSource =
  withIndexPatternFromSettingDataSource({
    indexPatternSetting: 'system_inventory.pattern',
    validate: ensureIndexPatternIsCreated(),
    ErrorComponent: withMapErrorPromptErrorEnsureIndexPattern(errorPromptTypes),
  });
