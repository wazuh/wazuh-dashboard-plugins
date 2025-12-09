import { INDEX_PATTERN_EVENTS_REQUIRED_FIELDS } from '../../../../../../common/constants';
import {
  ErrorDataSourceNotFound,
  ErrorDataSourceAlertsSelect,
} from '../../../../../utils/errors';
import { PatternDataSourceFactory } from '../pattern-data-source-factory';
import {
  PatternDataSourceRepository,
  tParsedIndexPattern,
} from '../pattern-data-source-repository';
import { EventsDataSource } from './events-data-source';
import { get } from 'lodash';
import store from '../../../../../redux/store';
import { AppState } from '../../../../../react-services/app-state';

export class EventsDataSourceRepository extends PatternDataSourceRepository {
  constructor() {
    super();
  }

  async getAll() {
    let indexPatterns = await super.getAll();

    // Filter out ignored index patterns from app config
    const ignoreIndexPatterns =
      store.getState().appConfig?.data?.['ip.ignore'] || [];
    if (ignoreIndexPatterns?.length > 0) {
      const fieldsToCheck = ['id', 'attributes.title']; // search in these attributes
      indexPatterns = indexPatterns.filter(indexPattern =>
        fieldsToCheck.every(
          field => !ignoreIndexPatterns.includes(get(indexPattern, field)),
        ),
      );
    }
    // Filter only events index patterns
    return indexPatterns.filter(this.checkIfEventsIndexPattern);
  }

  async get(id: string) {
    const dataSource = await super.get(id);
    if (this.checkIfEventsIndexPattern(dataSource)) {
      return dataSource;
    } else {
      throw new Error('Events index pattern not found');
    }
  }

  /**
   * Validate if the data source is an events index pattern
   * The events index pattern must have the following fields:
   * - timestamp
   * - wazuh.integration.decoders
   * - wazuh.cluster.node
   * - agent.id
   *
   * @param dataSource
   * @returns boolean
   */
  checkIfEventsIndexPattern(dataSource): boolean {
    return INDEX_PATTERN_EVENTS_REQUIRED_FIELDS.every(reqField =>
      dataSource._fields.some(field => field.name === reqField),
    );
  }

  async getDefault(dataSources): Promise<tParsedIndexPattern | null> {
    const storedIndexPatternId = await this.getStoreIndexPatternId();

    if (!storedIndexPatternId) {
      throw new ErrorDataSourceAlertsSelect(
        `No index pattern selected for events. Make sure a compatible index pattern exists and select it. This wasn't applied correctly or needs to be re-selected.`,
      );
    }
    const dataSource = dataSources.find(
      ({ id }) => id === storedIndexPatternId,
    );

    if (!dataSource) {
      throw new ErrorDataSourceNotFound(
        `Index pattern [id: ${storedIndexPatternId}] not found. Check if it exists or create one in Dashboard Management. If no matching indices are available, data collection may be disabled or failing.`,
        { indexPatternId: storedIndexPatternId },
      );
    }

    return dataSource;
  }

  setDefault(dataSource: tParsedIndexPattern): void {
    // No-op: Index pattern is now obtained from configuration, not stored in cookies
    return;
  }

  async getStoreIndexPatternId(): Promise<string> {
    return await AppState.getCurrentPattern();
  }
}
