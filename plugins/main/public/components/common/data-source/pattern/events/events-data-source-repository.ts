import { INDEX_PATTERN_EVENTS_REQUIRED_FIELDS } from '../../../../../../common/constants';
import { AppState } from '../../../../../react-services';
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
    const storedIndexPatternId = this.getStoreIndexPatternId();

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
    if (!dataSource) {
      throw new Error('Index pattern is required');
    }
    AppState.setCurrentPattern(dataSource.id);
  }

  getStoreIndexPatternId(): string {
    return AppState.getCurrentPattern();
  }

  async setupDefault(dataSources): Promise<void> {
    if (!this.getStoreIndexPatternId()) {
      const [dataSource] = dataSources;

      if (!dataSource) {
        throw new Error('No compatible index patterns found.');
      }

      AppState.setCurrentPattern(dataSource.id);
    }
  }
}

/* WORKAROUND: This is a workaround to ensure the default events index pattern is set when the app starts.
  Multiple UI views depend on the events index pattern is created. This method try to set the cookie
  where the events index pattern ID is stored.

  This logic could be moved to another service.
*/
export async function EventsDataSourceSetup() {
  const selectedIndexPatternId = AppState.getCurrentPattern();

  const factory = new PatternDataSourceFactory();
  const repository = new EventsDataSourceRepository();

  const dataSources = await factory.createAll(
    EventsDataSource,
    await repository.getAll(),
  );

  // Check if the selected index pattern Id in cookie exists and skip
  if (
    selectedIndexPatternId &&
    dataSources.find(({ id }) => id === selectedIndexPatternId)
  ) {
    return;
  }

  await repository.setupDefault(dataSources);
}
