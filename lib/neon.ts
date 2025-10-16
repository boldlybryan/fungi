const NEON_API_BASE = 'https://console.neon.tech/api/v2';

const neonApiKey = process.env.NEON_API_KEY!;
const projectId = process.env.NEON_PROJECT_ID!;
const parentBranchId = process.env.NEON_PARENT_BRANCH_ID!;

interface NeonBranch {
  id: string;
  name: string;
  parent_id?: string;
  created_at: string;
}

interface NeonEndpoint {
  id: string;
  host: string;
  connection_uri?: string;
}

interface NeonCreateBranchResponse {
  branch: NeonBranch;
  endpoints: NeonEndpoint[];
  connection_uris: Array<{
    connection_uri: string;
    connection_parameters: {
      database: string;
      host: string;
      password: string;
      role: string;
    };
  }>;
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

    const data = await response.json() as NeonCreateBranchResponse;
    const branch = data.branch;

    console.log(`Created Neon database branch: ${branch.id}`);

    // Extract connection string from the response
    let connectionString: string;
    
    if (data.connection_uris && data.connection_uris.length > 0) {
      // Use the first connection URI from the response
      connectionString = data.connection_uris[0].connection_uri;
    } else if (data.endpoints && data.endpoints.length > 0 && data.endpoints[0].connection_uri) {
      // Fallback to endpoint connection URI
      connectionString = data.endpoints[0].connection_uri;
    } else {
      // If neither is available, fetch from endpoints API
      connectionString = await getDatabaseConnectionString(branch.id);
    }

    return {
      branchId: branch.id,
      connectionString,
    };
  } catch (error: any) {
    console.error('Neon createDatabaseBranch error:', error);
    throw new Error(`Failed to create database branch: ${error.message}`);
  }
}

export async function getDatabaseConnectionString(branchId: string): Promise<string> {
  try {
    // Fetch endpoints for the branch
    const response = await fetch(
      `${NEON_API_BASE}/projects/${projectId}/branches/${branchId}/endpoints`,
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
    const endpoints = data.endpoints as NeonEndpoint[];
    
    if (!endpoints || endpoints.length === 0) {
      throw new Error('No endpoints found for branch');
    }

    // Get the primary endpoint (usually the first one)
    const endpoint = endpoints[0];
    
    // Build connection string manually if not provided
    // Format: postgresql://[role]:[password]@[host]/[database]?sslmode=require
    // We'll need to get the database name and credentials from the parent connection
    const parentConnString = process.env.DATABASE_URL!;
    const match = parentConnString.match(/postgresql:\/\/([^:]+):([^@]+)@[^\/]+\/([^?]+)/);
    
    if (!match) {
      throw new Error('Could not parse parent database connection string');
    }
    
    const [, role, password, database] = match;
    const connectionString = `postgresql://${role}:${password}@${endpoint.host}/${database}?sslmode=require`;
    
    return connectionString;
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

