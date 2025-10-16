const NEON_API_BASE = 'https://console.neon.tech/api/v2';

const neonApiKey = process.env.NEON_API_KEY!;
const projectId = process.env.NEON_PROJECT_ID!;
const parentBranchId = process.env.NEON_PARENT_BRANCH_ID!;

interface NeonBranch {
  id: string;
  name: string;
  connection_uri: string;
}

export async function createDatabaseBranch(
  branchName: string
): Promise<{ branchId: string; connectionString: string }> {
  try {
    const response = await fetch(
      `${NEON_API_BASE}/projects/${projectId}/branches`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${neonApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          branch: {
            name: branchName,
            parent_id: parentBranchId,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Neon API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    const branch = data.branch as NeonBranch;

    console.log(`Created Neon database branch: ${branch.id}`);

    return {
      branchId: branch.id,
      connectionString: branch.connection_uri || await getDatabaseConnectionString(branch.id),
    };
  } catch (error: any) {
    console.error('Neon createDatabaseBranch error:', error);
    throw new Error(`Failed to create database branch: ${error.message}`);
  }
}

export async function getDatabaseConnectionString(branchId: string): Promise<string> {
  try {
    const response = await fetch(
      `${NEON_API_BASE}/projects/${projectId}/branches/${branchId}/connection_uri`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${neonApiKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Neon API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.uri;
  } catch (error: any) {
    console.error('Neon getDatabaseConnectionString error:', error);
    throw new Error(`Failed to get connection string: ${error.message}`);
  }
}

export async function deleteDatabaseBranch(branchId: string): Promise<void> {
  try {
    const response = await fetch(
      `${NEON_API_BASE}/projects/${projectId}/branches/${branchId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${neonApiKey}`,
        },
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to delete Neon branch: ${error}`);
      // Don't throw - branch might already be deleted
      return;
    }

    console.log(`Deleted Neon database branch: ${branchId}`);
  } catch (error: any) {
    console.error('Neon deleteDatabaseBranch error:', error);
    // Don't throw - branch might already be deleted
  }
}

