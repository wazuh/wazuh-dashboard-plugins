import type { MissingFieldsReport } from '../../../common/saved-objects-missing-fields';
import { getSavedObjectsClient } from '../index-patterns';
import type { InitializationTaskRunContext } from '../types';
import { findScannedObjects, scanMissingFields } from './scan-missing-fields';

// The details list every object; the message keeps to the first ones.
const MAX_LISTED_OBJECTS = 20;

function describeReport(report: MissingFieldsReport): string {
  const fields = report.missing
    .map(({ field, usedIn }) => `${field} (${usedIn.join(', ')})`)
    .join(', ');

  return `- ${report.type} [${report.title}] on index pattern [${report.indexPatternTitle}]: ${fields}`;
}

export function buildMissingFieldsMessage(
  reports: MissingFieldsReport[],
): string {
  const listed = reports.slice(0, MAX_LISTED_OBJECTS).map(describeReport);
  const hidden = reports.length - listed.length;

  if (hidden > 0) {
    listed.push(
      `- ${hidden} more. Export the health check data to see them all.`,
    );
  }

  const summary =
    reports.length === 1
      ? 'A visualization or saved search uses fields its index pattern does not have, so its panel loads empty.'
      : `${reports.length} visualizations and saved searches use fields their index pattern does not have, so their panels load empty.`;

  return `${summary}\n\n${listed.join('\n')}`;
}

/** Warns about the visualizations and saved searches that use fields their index pattern lacks. */
export const initializationTaskCreatorSavedObjectsMissingFields = ({
  taskName,
}: {
  taskName: string;
}) => ({
  name: taskName,
  async run(ctx: InitializationTaskRunContext) {
    ctx.logger.debug('Starting check of the fields used by saved objects');

    try {
      const scope = ctx.context.scope ?? 'internal';
      const savedObjectsClient = getSavedObjectsClient(ctx.context, scope);
      const reports = await scanMissingFields(
        await findScannedObjects(savedObjectsClient),
        savedObjectsClient,
      );

      if (!reports.length) {
        ctx.logger.debug('Every saved object uses existing fields');
        return ctx.taskResult.ok([]);
      }

      const message = buildMissingFieldsMessage(reports);
      ctx.logger.warn(message);

      return ctx.taskResult.warning(message, reports);
    } catch (error) {
      const message = `Error checking the fields used by saved objects: ${
        error instanceof Error ? error.message : String(error)
      }`;

      ctx.logger.error(message);
      throw new Error(message, { cause: error });
    }
  },
});
