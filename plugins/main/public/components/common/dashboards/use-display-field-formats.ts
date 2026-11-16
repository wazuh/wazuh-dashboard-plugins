import { useEffect, useRef } from 'react';
import { FieldFormatInstanceType } from '../../../../../../src/plugins/data/public';
import { getDataPlugin } from '../../../kibana-services';

/** Format of each field, by field name: the format type and its params. */
export type DisplayFieldFormats = Record<
  string,
  { type: FieldFormatInstanceType; params?: Record<string, unknown> }
>;

interface FormattableIndexPattern {
  fieldFormatMap: Record<string, unknown>;
}

/**
 * Sets the formats of some fields of an index pattern, in memory only.
 *
 * A format type the registry does not hold yet is registered first: the visualizations serialize
 * the format of a field and look it up again by its id. It is registered here, not in the setup of
 * the plugin, so its code stays in the bundle of the application.
 * @param indexPattern index pattern the panels read, the instance the index pattern service caches
 * @param formats format of each field
 * @returns a function that puts back the formats the fields had before
 */
export function applyDisplayFieldFormats(
  indexPattern: FormattableIndexPattern,
  formats: DisplayFieldFormats,
) {
  const previous = Object.keys(formats).map(
    field => [field, indexPattern.fieldFormatMap[field]] as const,
  );

  const { fieldFormats } = getDataPlugin();

  for (const [field, { type, params }] of Object.entries(formats)) {
    if (!fieldFormats.getType(type.id)) {
      fieldFormats.register([type]);
    }
    indexPattern.fieldFormatMap[field] = fieldFormats.getInstance(
      type.id,
      params,
    );
  }

  return () => {
    for (const [field, format] of previous) {
      if (format) {
        indexPattern.fieldFormatMap[field] = format;
      } else {
        delete indexPattern.fieldFormatMap[field];
      }
    }
  };
}

/**
 * Applies field formats to the index pattern of a dashboard while the dashboard is mounted.
 *
 * The visualizations of the dashboard get the index pattern from the same cache, so they render
 * the fields with these formats. The formats are applied while rendering, before the panels load,
 * and removed on unmount, so other views of the index pattern keep theirs and the formats never
 * reach the saved object when another view saves the index pattern.
 * @param indexPattern index pattern of the data source
 * @param formats format of each field, nothing to apply when undefined
 */
export function useDisplayFieldFormats(
  indexPattern?: FormattableIndexPattern,
  formats?: DisplayFieldFormats,
) {
  const applied = useRef<{
    indexPattern: FormattableIndexPattern;
    restore: () => void;
  }>();

  if (
    indexPattern &&
    formats &&
    Object.keys(formats).length &&
    applied.current?.indexPattern !== indexPattern
  ) {
    applied.current?.restore();
    applied.current = {
      indexPattern,
      restore: applyDisplayFieldFormats(indexPattern, formats),
    };
  }

  useEffect(
    () => () => {
      applied.current?.restore();
      applied.current = undefined;
    },
    [],
  );
}
