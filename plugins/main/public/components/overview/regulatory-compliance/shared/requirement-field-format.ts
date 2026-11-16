import { i18n } from '@osd/i18n';
import { FieldFormat } from '../../../../../../../src/plugins/data/public';
import { DisplayFieldFormats } from '../../../common/dashboards/use-display-field-formats';
import {
  getFrameworkDefinition,
  getRequirementCodeLabel,
} from '../../../../../common/compliance-requirements/frameworks';

/**
 * Format of the requirement field of a compliance framework: each value of the
 * findings followed by the name of the requirement it belongs to, so the charts
 * name the requirements instead of listing their numbers only.
 *
 * A dashboard of the module applies it while it is shown
 * (`displayFieldFormats` of `createDashboard`).
 */
export class RequirementFieldFormat extends FieldFormat {
  static id = 'wz_compliance_requirement';
  static title = i18n.translate(
    'wazuh.regulatoryCompliance.requirementFieldFormat.title',
    { defaultMessage: 'Compliance requirement' },
  );
  // No field type, so the index pattern management does not offer it: it only
  // makes sense with the framework the module sets in its params.
  static fieldType = [];

  textConvert = (value: unknown) =>
    typeof value === 'string'
      ? getRequirementCodeLabel(this.param('section'), value)
      : String(value ?? '');
}

/**
 * Formats a compliance dashboard applies while it is shown: the requirement
 * field of the framework named with `RequirementFieldFormat`.
 * @param section id of the framework module
 * @returns the format of each field, by field name
 */
export function getRequirementFieldFormats(
  section: string,
): DisplayFieldFormats {
  const field = getFrameworkDefinition(section)?.field;

  return field
    ? { [field]: { type: RequirementFieldFormat, params: { section } } }
    : {};
}
