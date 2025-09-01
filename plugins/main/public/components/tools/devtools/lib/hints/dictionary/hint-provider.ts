import type { EditorLike, EditorGroup } from '../../types/editor';
import type { DevToolsModel, HintItem } from './types';
import { buildHintContext } from './context';
import type { HintStrategy } from './strategies/hint-strategy';
import {
  BodyHintStrategy,
  FallbackHintStrategy,
  RequestLineHintStrategy,
} from './strategies';

export interface HintProviderDeps {
  analyzeGroups: (editor: EditorLike) => EditorGroup[];
  calculateWhichGroup: (
    editor: EditorLike,
    firstTime?: boolean,
    groups?: EditorGroup[],
  ) => EditorGroup | null;
  logError: (context: string, error: any) => void;
  getModel: () => DevToolsModel | undefined;
}

export class DictionaryHintProvider {
  private strategies: HintStrategy[];

  constructor(
    private readonly deps: HintProviderDeps,
    strategies?: HintStrategy[],
  ) {
    // Default strategies order defines priority
    this.strategies = strategies || [
      new RequestLineHintStrategy(),
      new BodyHintStrategy(),
      new FallbackHintStrategy(),
    ];
  }

  private getModel(): DevToolsModel {
    return this.deps.getModel() || [];
  }

  /**
   * Build list of hints for the current editor context.
   * Delegates to pluggable strategies to keep responsibilities focused.
   */
  buildHints(
    editor: EditorLike,
    line: string,
    word: string,
  ): Array<HintItem | string> {
    const model = this.getModel();
    const groups = this.deps.analyzeGroups(editor);
    const currentGroup = this.deps.calculateWhichGroup(
      editor,
      undefined,
      groups,
    );

    const context = buildHintContext(
      editor,
      line,
      word,
      model,
      groups,
      currentGroup,
    );

    // Run the first strategy that can handle the context and returns hints
    for (const strategy of this.strategies) {
      try {
        if (!strategy.canHandle(context)) continue;
        const result = strategy.getHints(context);
        if (Array.isArray(result) && result.length) return result;
      } catch (err) {
        this.deps.logError('dictionaryHint.strategy', err);
      }
    }

    // If no strategy produced output, return empty list as a safe default
    return [];
  }
}
