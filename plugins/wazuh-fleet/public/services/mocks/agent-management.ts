export const deleteAgent = (documentId: string | string[]): Promise<any> =>
  new Promise((resolve, reject) => {
    // Simulate API delay
    setTimeout(() => {
      // Simulate random success/error (50% success rate)
      if (Math.random() > 0.5) {
        resolve({
          status: 200,
          body: {
            message: `Agent${Array.isArray(documentId) ? 's' : ''} deleted successfully`,
            data: {
              affected_items: Array.isArray(documentId)
                ? documentId
                : [documentId],
              failed_items: [],
              total_affected_items: Array.isArray(documentId)
                ? documentId.length
                : 1,
              total_failed_items: 0,
            },
          },
        });
      } else {
        reject({
          status: 500,
          body: {
            message: 'Error deleting agent(s)',
            error: 1,
            data: {
              affected_items: [],
              failed_items: Array.isArray(documentId)
                ? documentId
                : [documentId],
              total_affected_items: 0,
              total_failed_items: Array.isArray(documentId)
                ? documentId.length
                : 1,
            },
          },
        });
      }
    }, 1000); // 500ms delay
  });

export const editName = (agentId: string, newName: string): Promise<any> =>
  new Promise((resolve, reject) => {
    // Simulate API delay
    setTimeout(() => {
      // Simulate random success/error (50% success rate)
      if (Math.random() > 0.5) {
        resolve({
          status: 200,
          body: {
            message: `Renamed agent ${agentId} successfully to ${newName}`,
            data: {
              affected_items: [agentId],
              failed_items: [],
              total_affected_items: 1,
              total_failed_items: 0,
            },
          },
        });
      } else {
        reject({
          status: 500,
          body: {
            message: `Error renaming agent ${agentId} to ${newName}`,
            error: 1,
            data: {
              affected_items: [],
              failed_items: [agentId],
              total_affected_items: 0,
              total_failed_items: 1,
            },
          },
        });
      }
    }, 1000); // 500ms delay
  });

export const removeGroups = (
  agentId: string | string[],
  groupIds: string | string[],
): Promise<any> =>
  new Promise((resolve, reject) => {
    // Simulate API delay
    setTimeout(() => {
      // Simulate random success/error (50% success rate)
      if (Math.random() > 0.5) {
        resolve({
          status: 200,
          data: {
            message: `Removed successfully to agent`,
            error: null,
            data: {
              affected_items: [
                {
                  _id: agentId,
                  _source: { agent: { groups: groupIds, name: 'agent' } },
                },
              ],
              failed_items: [],
              total_affected_items: Array.isArray(agentId) ? agentId.length : 1,
              total_failed_items: 0,
            },
          },
        });
      } else if (Math.random() > 0.8) {
        resolve({
          status: 400,
          data: {
            message: 'Error removing groups agent(s)',
            error: 1,
            data: {
              affected_items: [],
              failed_items: [
                {
                  groups: groupIds,
                  error: { code: Math.floor(Math.random() * 9000) + 1000 },
                },
              ],
              total_affected_items: 0,
              total_failed_items: Array.isArray(agentId) ? agentId.length : 1,
            },
          },
        });
      } else {
        reject({
          status: 500,
          data: {
            message: 'Error removing groups agent(s)',
            error: 1,
            data: {
              affected_items: [],
              failed_items: [
                {
                  groups: groupIds,
                  error: { code: Math.floor(Math.random() * 9000) + 1000 },
                },
              ],
              total_affected_items: 0,
              total_failed_items: Array.isArray(agentId) ? agentId.length : 1,
            },
          },
        });
      }
    }, 1000); // 500ms delay
  });

export const addGroups = async (
  documentId: string | string[],
  groupIds: string | string[],
) => {
  try {
    return await removeGroups(documentId, groupIds);
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const upgradeAgent = (
  agentId: string[],
  version: string,
): Promise<any> =>
  new Promise(resolve => {
    // Simulate API delay
    setTimeout(() => {
      // Simulate random success/error (50% success rate)
      if (Math.random() > 0.5) {
        resolve({
          status: 200,
          data: {
            message: `Upgrade successfully`,
            error: null,
            data: {
              affected_items: [
                {
                  _id: agentId,
                  _source: {
                    agent: { name: 'agent' },
                    task_id: '1234',
                    version: version,
                  },
                },
              ],
              failed_items: [],
              total_affected_items: Array.isArray(agentId) ? agentId.length : 1,
              total_failed_items: 0,
            },
          },
        });
      } else {
        resolve({
          status: 400,
          data: {
            message: 'Error upgrade agent(s)',
            error: 1,
            data: {
              affected_items: [],
              failed_items: [
                {
                  _id: agentId,
                  error: {
                    code: Math.floor(Math.random() * 9000) + 1000,
                    message: 'Upgrade error',
                    remedation: 'Retry',
                  },
                },
              ],
              total_affected_items: 0,
              total_failed_items: 4,
            },
          },
        });
      }
    }, 1000); // 500ms delay
  });
