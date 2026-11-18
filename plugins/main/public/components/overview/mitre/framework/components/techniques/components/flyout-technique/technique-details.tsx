import React from 'react';
import { i18n } from '@osd/i18n';
import {
  EuiBadge,
  EuiCallOut,
  EuiDescriptionList,
  EuiFlexGroup,
  EuiFlexItem,
  EuiLink,
  EuiLoadingContent,
  EuiPanel,
  EuiSpacer,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { formatUIDate } from '../../../../../../../../react-services/time-service';
import { useAsyncActionRunOnStart } from '../../../../../../../common/hooks/use_async_action_run_on_start';
import { getMitreResourcesByIds } from '../../../../../lib/get-mitre-resources-by-ids';
import {
  fetchTechniqueFamily,
  MitreItem,
  MitreTechnique,
  resolveCitations,
  TechniqueFamily,
} from './lib/technique';
import { goToIntelligence, IntelligenceResource } from './lib/navigation';
import { TechniqueDescription } from './technique-description';

const NAMES_SHOWN = 3;

const getFirstItems = (resource: string, ids: string[]) =>
  getMitreResourcesByIds<MitreItem>(resource, ids.slice(0, NAMES_SHOWN));

type RelatedItemsProps = {
  resource: IntelligenceResource;
  ids: string[];
  techniqueId: string;
};

/** The count of a related resource, a few of its names and "and N more". */
const RelatedItems = ({ resource, ids, techniqueId }: RelatedItemsProps) => {
  const { data, running } = useAsyncActionRunOnStart<MitreItem[]>(
    getFirstItems,
    [resource, ids],
  );
  const remaining = ids.length - NAMES_SHOWN;

  return (
    <>
      <span>{ids.length}</span>
      {running && ids.length > 0 && <EuiLoadingContent lines={1} />}
      {!running && data && data.length > 0 && (
        <EuiText size='xs'>
          {data.map(item => (
            <div key={item.external_id}>
              <EuiLink
                onClick={() => goToIntelligence(resource, item.external_id)}
              >
                {item.name}
              </EuiLink>
            </div>
          ))}
          {remaining > 0 && (
            <EuiLink
              onClick={() => goToIntelligence('techniques', techniqueId)}
            >
              {i18n.translate(
                'wazuh.mitreAttack.techniqueFlyout.details.andMore',
                {
                  defaultMessage: 'and {count} more',
                  values: { count: remaining },
                },
              )}
            </EuiLink>
          )}
        </EuiText>
      )}
    </>
  );
};

const TechniqueBadge = ({ item }: { item: MitreItem }) => (
  <EuiBadge
    color='hollow'
    onClick={() => goToIntelligence('techniques', item.external_id)}
    onClickAriaLabel={i18n.translate(
      'wazuh.mitreAttack.techniqueFlyout.openTechniqueInIntelligenceTooltip',
      {
        defaultMessage: 'Open {technique} details in the Intelligence section',
        values: { technique: item.external_id },
      },
    )}
  >
    <strong>{item.external_id}</strong> {item.name}
  </EuiBadge>
);

type FamilyProps = {
  data: TechniqueFamily | null;
  error: Error | null;
  running: boolean;
};

const Family = ({ data, error, running }: FamilyProps) => {
  const title = data?.parent
    ? i18n.translate('wazuh.mitreAttack.techniqueFlyout.details.parent', {
        defaultMessage: 'Sub-technique of',
      })
    : i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.details.subtechniques',
        { defaultMessage: 'Sub-techniques' },
      );

  let content;
  if (running) {
    content = <EuiLoadingContent lines={1} />;
  } else if (error) {
    content = (
      <EuiText size='s' color='danger'>
        {i18n.translate(
          'wazuh.mitreAttack.techniqueFlyout.details.subtechniquesError',
          { defaultMessage: 'The sub-techniques could not be loaded.' },
        )}
      </EuiText>
    );
  } else if (data?.parent) {
    content = <TechniqueBadge item={data.parent} />;
  } else if (data?.subtechniques.length) {
    content = (
      <EuiFlexGroup gutterSize='xs' wrap responsive={false}>
        {data.subtechniques.map(item => (
          <EuiFlexItem grow={false} key={item.external_id}>
            <TechniqueBadge item={item} />
          </EuiFlexItem>
        ))}
      </EuiFlexGroup>
    );
  } else {
    content = (
      <EuiText size='s' color='subdued'>
        {i18n.translate(
          'wazuh.mitreAttack.techniqueFlyout.details.noSubtechniques',
          { defaultMessage: 'None' },
        )}
      </EuiText>
    );
  }

  return (
    <div data-test-subj='technique-family'>
      <EuiTitle size='xxs'>
        <h4>{title}</h4>
      </EuiTitle>
      <EuiSpacer size='xs' />
      {content}
    </div>
  );
};

type TechniqueDetailsProps = {
  techniqueId: string;
  technique?: MitreTechnique;
  isLoading: boolean;
  error?: Error | null;
};

export const TechniqueDetails = ({
  techniqueId,
  technique,
  isLoading,
  error,
}: TechniqueDetailsProps) => {
  const family = useAsyncActionRunOnStart(fetchTechniqueFamily, [techniqueId]);

  if (isLoading) {
    return (
      <>
        <EuiLoadingContent lines={3} />
        <EuiLoadingContent lines={3} />
      </>
    );
  }

  if (error || !technique) {
    return (
      <EuiCallOut
        color='danger'
        iconType='alert'
        size='s'
        title={i18n.translate(
          'wazuh.mitreAttack.techniqueFlyout.errorFetchingTechnique',
          { defaultMessage: 'Error obtaining the requested technique' },
        )}
      >
        {error?.message}
      </EuiCallOut>
    );
  }

  const listItems = [
    {
      title: i18n.translate('wazuh.mitreAttack.techniqueFlyout.details.id', {
        defaultMessage: 'ID',
      }),
      description: technique.external_id,
    },
    {
      title: i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.details.version',
        { defaultMessage: 'Version' },
      ),
      description: technique.mitre_version || '-',
    },
    {
      title: i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.details.created',
        { defaultMessage: 'Created' },
      ),
      description: technique.created_time
        ? formatUIDate(technique.created_time)
        : '-',
    },
    {
      title: i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.details.modified',
        { defaultMessage: 'Last modified' },
      ),
      description: technique.modified_time
        ? formatUIDate(technique.modified_time)
        : '-',
    },
    {
      title: i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.details.mitigations',
        { defaultMessage: 'Mitigations' },
      ),
      description: (
        <RelatedItems
          resource='mitigations'
          ids={technique.mitigations || []}
          techniqueId={techniqueId}
        />
      ),
    },
    {
      title: i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.details.groups',
        {
          defaultMessage: 'Used by groups',
        },
      ),
      description: (
        <RelatedItems
          resource='groups'
          ids={technique.groups || []}
          techniqueId={techniqueId}
        />
      ),
    },
    {
      title: i18n.translate(
        'wazuh.mitreAttack.techniqueFlyout.details.software',
        { defaultMessage: 'Software' },
      ),
      description: (
        <RelatedItems
          resource='software'
          ids={technique.software || []}
          techniqueId={techniqueId}
        />
      ),
    },
    ...(family.data?.parent
      ? []
      : [
          {
            title: i18n.translate(
              'wazuh.mitreAttack.techniqueFlyout.details.subtechniques',
              { defaultMessage: 'Sub-techniques' },
            ),
            description: family.data ? family.data.subtechniques.length : '-',
          },
        ]),
  ];

  return (
    <>
      {Boolean(technique.deprecated) && (
        <>
          <EuiCallOut
            color='warning'
            iconType='alert'
            size='s'
            title={i18n.translate(
              'wazuh.mitreAttack.techniqueFlyout.details.deprecated',
              { defaultMessage: 'This technique is deprecated.' },
            )}
          />
          <EuiSpacer size='m' />
        </>
      )}
      <EuiFlexGroup gutterSize='l'>
        <EuiFlexItem grow={3}>
          {technique.description && (
            <TechniqueDescription
              id={`technique-description-${techniqueId}`}
              markdown={resolveCitations(
                technique.description,
                technique.references,
              )}
            />
          )}
          <EuiSpacer size='m' />
          <Family {...family} />
        </EuiFlexItem>
        <EuiFlexItem grow={2}>
          <EuiPanel color='subdued' paddingSize='m' hasShadow={false}>
            <EuiDescriptionList
              compressed
              type='responsiveColumn'
              listItems={listItems}
            />
          </EuiPanel>
        </EuiFlexItem>
      </EuiFlexGroup>
    </>
  );
};
