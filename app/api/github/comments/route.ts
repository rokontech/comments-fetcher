import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// Validate and sanitize input
function validateGitHubIdentifier(value: string): string | null {
  if (!value || typeof value !== 'string') {
    return null;
  }
  // GitHub usernames/repo names: alphanumeric, hyphens, underscores, dots
  // Max length: 39 characters (GitHub limit)
  const validPattern = /^[a-zA-Z0-9._-]{1,39}$/;
  if (!validPattern.test(value)) {
    return null;
  }
  return value;
}

function validatePRNumber(value: unknown): number | null {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;
  if (typeof num !== 'number' || !Number.isInteger(num) || num <= 0 || num > 2147483647) {
    return null;
  }
  return num;
}

export async function POST(request: NextRequest) {
  try {
    // Limit request body size (1MB max)
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const session = await getSession();
    
    if (!session.githubToken) {
      return NextResponse.json(
        { error: 'No token found. Please authenticate first.' },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { owner, repo, prNumber } = body;

    // Validate and sanitize inputs
    const validatedOwner = validateGitHubIdentifier(owner);
    const validatedRepo = validateGitHubIdentifier(repo);
    const validatedPRNumber = validatePRNumber(prNumber);

    if (!validatedOwner || !validatedRepo || !validatedPRNumber) {
      return NextResponse.json(
        { error: 'Invalid parameters. Owner and repo must be valid GitHub identifiers, PR number must be a positive integer.' },
        { status: 400 }
      );
    }

    // Construct URL with validated inputs (already safe, but encode for extra safety)
    const apiUrl = `https://api.github.com/repos/${encodeURIComponent(validatedOwner)}/${encodeURIComponent(validatedRepo)}/pulls/${validatedPRNumber}/comments`;

    // Fetch comments from GitHub API (server-side only) with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(apiUrl, {
        signal: controller.signal,
        headers: {
          'Authorization': `token ${session.githubToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'comments-fetcher'
        }
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        await response.json().catch(() => ({}));

        if (response.status === 401) {
          // Token might be invalid, clear it
          session.githubToken = undefined;
          await session.save();
          return NextResponse.json(
            { error: 'Authentication failed. Please check your token.' },
            { status: 401 }
          );
        } else if (response.status === 404) {
          return NextResponse.json(
            { error: 'Pull request not found. Please verify the repository and PR number.' },
            { status: 404 }
          );
        } else if (response.status === 403) {
          return NextResponse.json(
            { error: 'Access forbidden. Token may not have permission.' },
            { status: 403 }
          );
        }

        return NextResponse.json(
          { error: 'GitHub API error. Please try again later.' },
          { status: response.status }
        );
      }

      const comments = await response.json();

      // Validate response is an array
      if (!Array.isArray(comments)) {
        return NextResponse.json(
          { error: 'Invalid response from GitHub API' },
          { status: 500 }
        );
      }

      // Map comments to expected format
      const formattedComments = comments
        .filter((comment: { user?: unknown }) => comment && typeof comment === 'object' && comment.user)
        .map((comment: { path?: string; body?: string; line?: number; original_line?: number; user?: { login?: string }; created_at?: string }) => ({
          path: comment.path || '',
          body: comment.body || '',
          line: comment.line || comment.original_line,
          user: {
            login: comment.user?.login || 'unknown'
          },
          created_at: comment.created_at || ''
        }));

      return NextResponse.json({
        comments: formattedComments,
        total: formattedComments.length,
      });
    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        return NextResponse.json(
          { error: 'Request timeout. Please try again.' },
          { status: 504 }
        );
      }
      throw fetchError;
    }
  } catch (error: unknown) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments. Please try again.' },
      { status: 500 }
    );
  }
}

