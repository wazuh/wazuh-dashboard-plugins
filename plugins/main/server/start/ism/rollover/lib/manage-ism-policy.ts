export async function createISMPolicy({ opensearchClient }, { _id, policy }) {
  try {
    return await opensearchClient.callAsInternalUser('wzISM.createPolicy', {
      policyId: _id,
      body: JSON.stringify(policy),
    });
  } catch (error) {
    throw new Error(`Error creating ISM policy [${_id}]`);
  }
}

export async function updateISMPolicy(
  { opensearchClient },
  { _id, policy, ifSeqNo, ifPrimaryTerm },
) {
  try {
    return await opensearchClient.callAsInternalUser('wzISM.putPolicy', {
      policyId: _id,
      body: JSON.stringify(policy),
      ifSeqNo,
      ifPrimaryTerm,
    });
  } catch (error) {
    throw new Error(`Error updating ISM policy [${_id}]`);
  }
}
