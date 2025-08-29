import { ExcludedIntelliSenseTriggerKeys } from '../excluded-devtools-autocomplete-keys';
import { AppState, GenericRequest } from '../../../../react-services';
import { DEV_TOOLS_INITIAL_BUFFER } from '../initial-buffer';
import {
  analyzeGroups,
  calculateWhichGroup,
  checkJsonParseError,
  highlightGroup,
} from './grouping';
import { ensureAutocompleteCommand, registerDictionaryHint } from './hints';
import { setupDynamicHeight, setupResizableColumns } from './layout';
import { UI_LOGGER_LEVELS } from '../../../../../common/constants';
import {
  UI_ERROR_SEVERITIES,
  UIErrorLog,
  UIErrorSeverity,
  UILogLevel,
} from '../../../../react-services/error-orchestrator/types';
import { getErrorOrchestrator } from '../../../../react-services/common-services';

/**
 * Configure input/output CodeMirror editors: behavior, content, events and layout.
 * Also loads the API routes for autocompletion into `editorInput.model`.
 */
export async function initEditors(editorInput: any, editorOutput: any) {
  // Sizes
  editorInput.setSize('auto', '100%');
  editorOutput.setSize('auto', '100%');

  // Autocomplete on keyup (except excluded keys)
  editorInput.on('keyup', function (cm: any, e: any) {
    if (!ExcludedIntelliSenseTriggerKeys[(e.keyCode || e.which).toString()]) {
      cm.execCommand('autocomplete', null, {
        completeSingle: false,
      });
    }
  });

  // Initialize buffer value
  const currentState = AppState.getCurrentDevTools();
  if (!currentState) {
    AppState.setCurrentDevTools(DEV_TOOLS_INITIAL_BUFFER);
    editorInput.getDoc().setValue(DEV_TOOLS_INITIAL_BUFFER);
  } else {
    editorInput.getDoc().setValue(currentState);
  }

  // Hints & autocomplete
  ensureAutocompleteCommand();
  registerDictionaryHint(editorInput);

  // Widgets holder & model placeholder
  editorInput.__widgets = [];
  editorInput.model = [];

  // Change & cursor events
  editorInput.on('change', () => {
    const groups = analyzeGroups(editorInput);
    const currentState = editorInput.getValue().toString();
    AppState.setCurrentDevTools(currentState);
    const currentGroup = calculateWhichGroup(editorInput, undefined, groups);
    if (currentGroup) {
      const hasWidget = editorInput.__widgets.filter(
        (item: any) => item.start === currentGroup.start,
      );
      if (hasWidget.length) editorInput.removeLineWidget(hasWidget[0].widget);
      setTimeout(() => checkJsonParseError(editorInput), 150);
    }
  });

  editorInput.on('cursorActivity', () => {
    const groups = analyzeGroups(editorInput);
    const currentGroup = calculateWhichGroup(editorInput, undefined, groups);
    highlightGroup(editorInput, currentGroup as any);
    checkJsonParseError(editorInput, groups);
  });

  // Place initial highlight
  const groups = analyzeGroups(editorInput);
  const currentGroup = calculateWhichGroup(editorInput, undefined, groups);
  highlightGroup(editorInput, currentGroup as any);

  // Resizable columns + dynamic size behavior
  setupResizableColumns(window.document);
  setupDynamicHeight(window);

  // Load available routes for autocompletion
  try {
    const response = await GenericRequest.request('GET', '/api/routes', {});
    editorInput.model = !response.error ? response.data : [];
  } catch (error: any) {
    editorInput.model = [];

    const options: UIErrorLog = {
      context: `getAvailableMethods`,
      level: UI_LOGGER_LEVELS.ERROR as UILogLevel,
      severity: UI_ERROR_SEVERITIES.UI as UIErrorSeverity,
      error: {
        error: error as Error,
        message: (error as Error).message || (error as string),
        title: (error as Error).name,
      },
    };
    getErrorOrchestrator().handleError(options);
  }
}
