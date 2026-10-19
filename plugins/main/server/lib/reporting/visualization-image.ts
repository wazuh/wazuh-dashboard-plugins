const PNG_DATA_URI_REGEX = /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/;

/**
 * Check that a report visualization image is a base64-encoded PNG data URI, the
 * format the reporting client produces with dom-to-image.
 */
export function isVisualizationImageDataURI(value: unknown): value is string {
  return typeof value === 'string' && PNG_DATA_URI_REGEX.test(value);
}
