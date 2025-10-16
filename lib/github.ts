import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.GITHUB_OWNER!;
const repo = process.env.GITHUB_REPO!;

export async function createBranch(branchName: string): Promise<void> {
  try {
    // Get the main branch reference
    const { data: mainBranch } = await octokit.git.getRef({
      owner,
      repo,
      ref: 'heads/main',
    });

    // Create new branch from main
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: mainBranch.object.sha,
    });

    console.log(`Created GitHub branch: ${branchName}`);
  } catch (error: any) {
    console.error('GitHub createBranch error:', error);
    throw new Error(`Failed to create GitHub branch: ${error.message}`);
  }
}

export async function commitFiles(
  branchName: string,
  files: Array<{ path: string; content: string }>,
  message: string
): Promise<void> {
  try {
    // Get the current commit SHA
    const { data: ref } = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
    });

    const commitSha = ref.object.sha;

    // Get the commit to get the tree SHA
    const { data: commit } = await octokit.git.getCommit({
      owner,
      repo,
      commit_sha: commitSha,
    });

    const treeSha = commit.tree.sha;

    // Create blobs for each file
    const blobs = await Promise.all(
      files.map(async (file) => {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64',
        });
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        };
      })
    );

    // Create new tree
    const { data: newTree } = await octokit.git.createTree({
      owner,
      repo,
      base_tree: treeSha,
      tree: blobs,
    });

    // Create new commit
    const { data: newCommit } = await octokit.git.createCommit({
      owner,
      repo,
      message,
      tree: newTree.sha,
      parents: [commitSha],
      author: {
        name: 'Fungi Bot',
        email: 'bot@fungi.app',
      },
    });

    // Update branch reference
    await octokit.git.updateRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
      sha: newCommit.sha,
    });

    console.log(`Committed ${files.length} files to ${branchName}`);
  } catch (error: any) {
    console.error('GitHub commitFiles error:', error);
    throw new Error(`Failed to commit files: ${error.message}`);
  }
}

export async function createPullRequest(
  branchName: string,
  title: string,
  body: string
): Promise<{ prNumber: number; url: string }> {
  try {
    const { data: pr } = await octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head: branchName,
      base: 'main',
    });

    // Add labels
    await octokit.issues.addLabels({
      owner,
      repo,
      issue_number: pr.number,
      labels: ['prototype', 'needs-review'],
    });

    console.log(`Created PR #${pr.number}: ${pr.html_url}`);

    return {
      prNumber: pr.number,
      url: pr.html_url,
    };
  } catch (error: any) {
    console.error('GitHub createPullRequest error:', error);
    throw new Error(`Failed to create pull request: ${error.message}`);
  }
}

export async function deleteBranch(branchName: string): Promise<void> {
  try {
    await octokit.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branchName}`,
    });

    console.log(`Deleted GitHub branch: ${branchName}`);
  } catch (error: any) {
    console.error('GitHub deleteBranch error:', error);
    // Don't throw - branch might already be deleted
  }
}

