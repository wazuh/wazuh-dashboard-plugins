export { GroupingService } from './grouping-service';
import type { EditorGroup, EditorLike } from '../types/editor';
import { GroupingService } from './grouping-service';

// Backward-compatible function exports using the service under the hood.
const defaultService = new GroupingService();

/**
 * Split the current buffer into request groups (method + path + optional JSON body).
 */
export function analyzeGroups(editor: EditorLike): EditorGroup[] {
  return defaultService.parseGroups(editor);
}

/**
 * Choose which group is active based on the cursor position and place action buttons.
 */
export function calculateWhichGroup(
  editor: EditorLike,
  firstTime = false,
  groups: EditorGroup[] = [],
): EditorGroup | null {
  return defaultService.selectActiveGroup(editor, firstTime, groups);
}

/**
 * Mark the given group as active by highlighting its lines.
 */
export function highlightGroup(editor: EditorLike, group?: EditorGroup) {
  return defaultService.highlightGroup(editor, group);
}

/**
 * Validate JSON structure for all groups and render error widgets.
 */
export function checkJsonParseError(
  editor: EditorLike,
  groups: EditorGroup[] = [],
) {
  return defaultService.validateJson(editor, groups);
}
