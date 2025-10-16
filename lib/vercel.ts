const VERCEL_API_BASE = 'https://api.vercel.com';

const vercelToken = process.env.VERCEL_TOKEN!;
const projectId = process.env.VERCEL_PROJECT_ID!;
const teamId = process.env.VERCEL_TEAM_ID;

function getHeaders() {
  return {
    Authorization: `Bearer ${vercelToken}`,
    'Content-Type': 'application/json',
  };
}

function getTeamQuery() {
  return teamId ? `?teamId=${teamId}` : '';
}

export async function setEnvironmentVariable(
  branchName: string,
  key: string,
  value: string
): Promise<void> {
  try {
    const response = await fetch(
      `${VERCEL_API_BASE}/v10/projects/${projectId}/env${getTeamQuery()}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          key,
          value,
          type: 'encrypted',
          target: ['preview'],
          gitBranch: branchName,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${response.status} ${error}`);
    }

    console.log(`Set Vercel env var ${key} for branch ${branchName}`);
  } catch (error: any) {
    console.error('Vercel setEnvironmentVariable error:', error);
    throw new Error(`Failed to set environment variable: ${error.message}`);
  }
}

export async function getDeploymentStatus(
  branchName: string
): Promise<{ status: string; url?: string }> {
  try {
    const response = await fetch(
      `${VERCEL_API_BASE}/v6/deployments${getTeamQuery()}&projectId=${projectId}&gitBranch=${branchName}&limit=1`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel API error: ${response.status} ${error}`);
    }

    const data = await response.json();
    
    if (data.deployments && data.deployments.length > 0) {
      const deployment = data.deployments[0];
      return {
        status: deployment.state, // BUILDING, READY, ERROR, CANCELED
        url: deployment.url ? `https://${deployment.url}` : undefined,
      };
    }

    return { status: 'NOT_FOUND' };
  } catch (error: any) {
    console.error('Vercel getDeploymentStatus error:', error);
    throw new Error(`Failed to get deployment status: ${error.message}`);
  }
}

export async function getPreviewUrl(branchName: string): Promise<string | null> {
  try {
    const { status, url } = await getDeploymentStatus(branchName);
    
    if (status === 'READY' && url) {
      return url;
    }
    
    return null;
  } catch (error: any) {
    console.error('Vercel getPreviewUrl error:', error);
    return null;
  }
}

export async function deleteEnvironmentVariable(
  branchName: string,
  envId: string
): Promise<void> {
  try {
    const response = await fetch(
      `${VERCEL_API_BASE}/v9/projects/${projectId}/env/${envId}${getTeamQuery()}`,
      {
        method: 'DELETE',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Failed to delete Vercel env var: ${error}`);
      // Don't throw - env var might already be deleted
      return;
    }

    console.log(`Deleted Vercel env var for branch ${branchName}`);
  } catch (error: any) {
    console.error('Vercel deleteEnvironmentVariable error:', error);
    // Don't throw - env var might already be deleted
  }
}

