import { AppState } from '../../../../../react-services';
import { PatternDataSourceRepository } from '../pattern-data-source-repository';

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

  getStoreIndexPatternId(): string {
    return AppState.getCurrentPattern();
  }
}
