import React, { useState } from 'react';
import classNames from 'classnames';
import { escapeRegExp } from 'lodash';
import { i18n } from '@osd/i18n';
import { FieldIcon } from '../../../../../../src/plugins/opensearch_dashboards_react/public';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { FILTER_OPERATOR } from '../data-source';
import { DocViewTableRowBtnFilterAdd } from './table-row-btn-filter-add';
import { DocViewTableRowBtnFilterRemove } from './table-row-btn-filter-remove';
import { DocViewTableRowBtnFilterExists } from './table-row-btn-filter-exists';
import './doc-viewer.scss';
import { onFilterCellActions } from '../data-grid/filter-cell-actions';
import { Filter } from '../../../../../../src/plugins/data/common';

const COLLAPSE_LINE_LENGTH = 350;
const DOT_PREFIX_RE = /(.).+?\./g;

export type tDocViewerProps = {
  flattened: any;
  formatted: any;
  renderFields: () => {};
  mapping: any;
  indexPattern: any;
  docJSON: any;
  filters: Filter[];
  setFilters: (filters: Filter[]) => void;
  onFilter?: () => void;
  showFilterButtons?: boolean;
};

/**
 * Convert a dot.notated.string into a short
 * version (d.n.string)
 */
export const shortenDottedString = (input: string) =>
  input.replace(DOT_PREFIX_RE, '$1.');

export const getFieldTypeName = (type: string) => {
  switch (type) {
    case 'boolean':
      return i18n.translate('discover.fieldNameIcons.booleanAriaLabel', {
        defaultMessage: 'Boolean field',
      });
    case 'conflict':
      return i18n.translate('discover.fieldNameIcons.conflictFieldAriaLabel', {
        defaultMessage: 'Conflicting field',
      });
    case 'date':
      return i18n.translate('discover.fieldNameIcons.dateFieldAriaLabel', {
        defaultMessage: 'Date field',
      });
    case 'geo_point':
      return i18n.translate('discover.fieldNameIcons.geoPointFieldAriaLabel', {
        defaultMessage: 'Geo point field',
      });
    case 'geo_shape':
      return i18n.translate('discover.fieldNameIcons.geoShapeFieldAriaLabel', {
        defaultMessage: 'Geo shape field',
      });
    case 'ip':
      return i18n.translate('discover.fieldNameIcons.ipAddressFieldAriaLabel', {
        defaultMessage: 'IP address field',
      });
    case 'murmur3':
      return i18n.translate('discover.fieldNameIcons.murmur3FieldAriaLabel', {
        defaultMessage: 'Murmur3 field',
      });
    case 'number':
      return i18n.translate('discover.fieldNameIcons.numberFieldAriaLabel', {
        defaultMessage: 'Number field',
      });
    case 'source':
      // Note that this type is currently not provided, type for _source is undefined
      return i18n.translate('discover.fieldNameIcons.sourceFieldAriaLabel', {
        defaultMessage: 'Source field',
      });
    case 'string':
      return i18n.translate('discover.fieldNameIcons.stringFieldAriaLabel', {
        defaultMessage: 'String field',
      });
    case 'nested':
      return i18n.translate('discover.fieldNameIcons.nestedFieldAriaLabel', {
        defaultMessage: 'Nested field',
      });
    default:
      return i18n.translate('discover.fieldNameIcons.unknownFieldAriaLabel', {
        defaultMessage: 'Unknown field',
      });
  }
};

const DocViewer = (props: tDocViewerProps) => {
  const [fieldRowOpen, setFieldRowOpen] = useState(
    {} as Record<string, boolean>,
  );
  const {
    flattened,
    formatted,
    mapping,
    indexPattern,
    renderFields,
    docJSON,
    filters,
    setFilters,
    onFilter: onClose,
    showFilterButtons = true,
  } = props;

  const onFilter = (
    field: string,
    operation:
      | FILTER_OPERATOR.IS
      | FILTER_OPERATOR.IS_NOT
      | FILTER_OPERATOR.EXISTS,
    value?: string | string[],
  ) => {
    const _onFilter = onFilterCellActions(
      indexPattern?.id,
      filters,
      setFilters,
    );
    _onFilter(field, operation, value);
    onClose?.();
  };

  return (
    <>
      {flattened && (
        <table className='table table-condensed wzDocViewerTable'>
          <tbody>
            {Object.keys(flattened)
              .sort()
              .map((field, index) => {
                const value = String(formatted[field]);
                const fieldMapping = mapping(field);
                const isCollapsible = value.length > COLLAPSE_LINE_LENGTH;
                const isCollapsed = isCollapsible && !fieldRowOpen[field];
                const valueClassName = classNames({
                  // eslint-disable-next-line @typescript-eslint/naming-convention
                  wzDocViewer__value: true,
                  'truncate-by-height': isCollapsible && isCollapsed,
                });
                const isNestedField =
                  !indexPattern.fields.getByName(field) &&
                  !!indexPattern.fields.getAll().find(patternField => {
                    // We only want to match a full path segment
                    const nestedRootRegex = new RegExp(
                      escapeRegExp(field) + '(\\.|$)',
                    );
                    return nestedRootRegex.test(
                      patternField.subType?.nested?.path ?? '',
                    );
                  });
                const fieldType = isNestedField
                  ? 'nested'
                  : indexPattern.fields.getByName(field)?.type;
                const typeName = getFieldTypeName(String(fieldType));
                const displayName = field;
                const fieldIconProps = { fill: 'none', color: 'gray' };
                const scripted = Boolean(fieldMapping?.scripted);

                return (
                  <tr key={index} data-test-subj={`tableDocViewRow-${field}`}>
                    <td className='wzDocViewer__field'>
                      <EuiFlexGroup
                        alignItems='center'
                        gutterSize='s'
                        responsive={false}
                      >
                        <EuiFlexItem grow={false}>
                          <FieldIcon
                            type={fieldType}
                            label={typeName}
                            scripted={scripted}
                            {...fieldIconProps}
                          />
                        </EuiFlexItem>
                        <EuiFlexItem
                          style={{ maxWidth: '25vw', minWidth: '200px' }}
                        >
                          <span style={{ wordBreak: 'break-all' }}>
                            <b>{displayName}</b>
                          </span>
                        </EuiFlexItem>
                      </EuiFlexGroup>
                    </td>
                    <td>
                      {showFilterButtons && (
                        <div className='wzDocViewer__buttons'>
                          <DocViewTableRowBtnFilterAdd
                            disabled={!fieldMapping || !fieldMapping.filterable}
                            onClick={() =>
                              onFilter(
                                field,
                                FILTER_OPERATOR.IS,
                                flattened[field],
                              )
                            }
                          />
                          <DocViewTableRowBtnFilterRemove
                            disabled={!fieldMapping || !fieldMapping.filterable}
                            onClick={() =>
                              onFilter(
                                field,
                                FILTER_OPERATOR.IS_NOT,
                                flattened[field],
                              )
                            }
                          />
                          <DocViewTableRowBtnFilterExists
                            disabled={!fieldMapping || !fieldMapping.filterable}
                            onClick={() =>
                              onFilter(field, FILTER_OPERATOR.EXISTS)
                            }
                            scripted={fieldMapping && fieldMapping.scripted}
                          />
                        </div>
                      )}
                      {renderFields &&
                      renderFields?.find(
                        (field: string) => field?.id === displayName,
                      ) ? (
                        renderFields
                          ?.find((field: string) => field.id === displayName)
                          .render(flattened[displayName], docJSON)
                      ) : (
                        <div
                          className={valueClassName}
                          data-test-subj={`tableDocViewRow-${field}-value`}
                          /*
                           * Justification for dangerouslySetInnerHTML:
                           * We just use values encoded by our field formatters
                           */
                          // eslint-disable-next-line react/no-danger
                          dangerouslySetInnerHTML={{ __html: value as string }}
                          style={{
                            overflowY: 'auto',
                            wordBreak: 'break-all',
                            width: '100%',
                          }}
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      )}
    </>
  );
};

export default DocViewer;
