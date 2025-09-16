import { AppState } from '../../../../../react-services';
import { PatternDataSourceFactory } from '../pattern-data-source-factory';
import {
  PatternDataSourceRepository,
  tParsedIndexPattern,
} from '../pattern-data-source-repository';
import { AlertsDataSource } from './alerts-data-source';

const ALERTS_REQUIRED_FIELDS = [
  'timestamp',
  'rule.groups',
  'manager.name',
  'agent.id',
];

export class AlertsDataSourceRepository extends PatternDataSourceRepository {
  constructor() {
    super();
  }

  async getAll() {
    const indexPatterns = await super.getAll();
    // FIXME: this should take into account the ip.ignore setting to filter the index patterns
    return indexPatterns.filter(this.checkIfAlertsIndexPattern);
  }

  async get(id: string) {
    const dataSource = await super.get(id);
    if (this.checkIfAlertsIndexPattern(dataSource)) {
      return dataSource;
    } else {
      throw new Error('Alerts index pattern not found');
    }
  }

  /**
   * Validate if the data source is an alerts index pattern
   * The alerts index pattern must have the following fields:
   * - timestamp
   * - rule.groups
   * - manager.name
   * - agent.id
   *
   * @param dataSource
   * @returns boolean
   */
  checkIfAlertsIndexPattern(dataSource): boolean {
    return ALERTS_REQUIRED_FIELDS.every(reqField =>
      dataSource._fields.some(field => field.name === reqField),
    );
  }

  async getDefault(dataSources): Promise<tParsedIndexPattern | null> {
    const storedIndexPatternId = this.getStoreIndexPatternId();

    if (!storedIndexPatternId) {
      throw new Error(
        'There is no selected index pattern for alerts. Ensure there is a compatible index pattern and select it using the index pattern selector. The index pattern selector is only available when there are multiple compatibles index patterns. If there is only a compatible index pattern, the selector is not visible, and it could indicate the index pattern was not selected due to some error or you could need to select it.',
      );
    }
    const dataSource = dataSources.find(
      ({ id }) => id === storedIndexPatternId,
    );

    if (!dataSource) {
      throw new Error(
        `Index pattern with ID [${storedIndexPatternId}] not found. Review if you have at least one index pattern with this configuration. You can create the index patterns from Dashboard Management application if there are matching indices. If there are no matching indices, this could indicate the data collection is disabled or there is a problem in the collection or ingestion.`,
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

/* WORKAROUND: This is a workaround to ensure the default alerts index pattern is set when the app starts.
  Multiple UI views depend on the alerts index pattern is created. This method try to set the cookie
  where the alerts index pattern ID is stored.

  This logic could be moved to another service.
*/
export async function AlertsDataSourceSetup() {
  const selectedIndexPatternId = AppState.getCurrentPattern();

  const factory = new PatternDataSourceFactory();
  const repository = new AlertsDataSourceRepository();

  const dataSources = await factory.createAll(
    AlertsDataSource,
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
