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

// Helper function to build connection string from host
async function buildConnectionString(host: string): Promise<string> {
  const parentConnString = process.env.DATABASE_URL!;
  const match = parentConnString.match(/postgresql:\/\/([^:]+):([^@]+)@[^\/]+\/([^?]+)/);
  
  if (!match) {
    throw new Error('Could not parse parent database connection string');
  }
  
  const [, role, password, database] = match;
  return `postgresql://${role}:${password}@${host}/${database}?sslmode=require`;
}

// Helper function to sleep
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Get connection string for a branch by getting parent endpoint details
async function getConnectionStringForBranch(branchId: string): Promise<string> {
  try {
    console.log(`Getting connection string for branch ${branchId} using parent branch`);
    
    // Fetch parent branch details to get its endpoint
    const parentResponse = await fetch(
      `${NEON_API_BASE}/projects/${projectId}/branches/${parentBranchId}/endpoints`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${neonApiKey}`,
        },
      }
    );

    if (!parentResponse.ok) {
      console.log('Could not fetch parent endpoints, using DATABASE_URL as fallback');
      return process.env.DATABASE_URL!;
    }

    const parentData = await parentResponse.json();
    const parentEndpoints = parentData.endpoints as NeonEndpoint[];
    
    if (!parentEndpoints || parentEndpoints.length === 0) {
      console.log('No parent endpoints found, using DATABASE_URL as fallback');
      return process.env.DATABASE_URL!;
    }

    // Use the parent endpoint's host to construct connection string
    const parentEndpoint = parentEndpoints[0];
    console.log(`Using parent endpoint: ${parentEndpoint.host}`);
    
    // Build connection string with parent endpoint host
    // Neon will route to the correct branch data automatically
    const connectionString = await buildConnectionString(parentEndpoint.host);
    
    return connectionString;
  } catch (error: any) {
    console.error('Error getting connection string for branch:', error);
    // Fallback to using the parent DATABASE_URL
    console.log('Falling back to DATABASE_URL');
    return process.env.DATABASE_URL!;
  }
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
    console.log('Neon API response:', JSON.stringify(data, null, 2));

    // Extract connection string from the response
    let connectionString: string;
    
    if (data.connection_uris && data.connection_uris.length > 0) {
      // Use the first connection URI from the response
      console.log('Using connection_uri from create response');
      connectionString = data.connection_uris[0].connection_uri;
    } else if (data.endpoints && data.endpoints.length > 0) {
      // Get the endpoint and construct connection string
      console.log('Using endpoint from create response');
      const endpoint = data.endpoints[0];
      connectionString = await buildConnectionString(endpoint.host);
    } else {
      // Neon branches share the parent endpoint by default
      // Use parent connection string with branch routing
      console.log('Using parent endpoint with branch routing');
      connectionString = await getConnectionStringForBranch(branch.id);
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
  // Retry logic - endpoints might not be ready immediately
  const maxRetries = 5;
  const retryDelay = 2000; // 2 seconds
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Fetching endpoints for branch ${branchId} (attempt ${attempt}/${maxRetries})`);
      
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
      console.log(`Endpoints response (attempt ${attempt}):`, JSON.stringify(data, null, 2));
      
      const endpoints = data.endpoints as NeonEndpoint[];
      
      if (!endpoints || endpoints.length === 0) {
        if (attempt < maxRetries) {
          console.log(`No endpoints yet, waiting ${retryDelay}ms before retry...`);
          await sleep(retryDelay);
          continue;
        }
        throw new Error('No endpoints found for branch after all retries');
      }

      // Get the primary endpoint (usually the first one)
      const endpoint = endpoints[0];
      console.log(`Found endpoint: ${endpoint.host}`);
      
      // Build connection string using helper
      const connectionString = await buildConnectionString(endpoint.host);
      
      return connectionString;
    } catch (error: any) {
      if (attempt === maxRetries) {
        console.error('Neon getDatabaseConnectionString error:', error);
        throw new Error(`Failed to get connection string: ${error.message}`);
      }
      // Continue to next retry
      console.log(`Error on attempt ${attempt}: ${error.message}`);
      await sleep(retryDelay);
    }
  }
  
  throw new Error('Failed to get connection string after all retries');
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

