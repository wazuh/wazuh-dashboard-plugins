import { PatternDataSourceRepository } from "../pattern-data-source-repository";

const ALERTS_REQUIRED_FIELDS = ['timestamp', 'rule.groups', 'manager.name', 'agent.id'];

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
        return ALERTS_REQUIRED_FIELDS.every(reqField => dataSource._fields.some(field => field.name === reqField));
    }
}