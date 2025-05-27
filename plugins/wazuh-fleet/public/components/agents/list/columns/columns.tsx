import { DataGridColumn } from '../../../common/data-grid/types';
import { standardColumnIds } from './agent-fields';
import { createAgentTableColumns } from './column-factory';

// Combine special and standard columns
export const agentsTableColumns: DataGridColumn[] = createAgentTableColumns(standardColumnIds);

// export agentFields;
