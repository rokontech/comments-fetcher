import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';

// Store token securely in server-side session
export async function POST(request: NextRequest) {
  try {
    // Limit request body size
    const contentType = request.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      return NextResponse.json(
        { error: 'Content-Type must be application/json' },
        { status: 400 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      );
    }

    // Validate token format and length
    // GitHub tokens: ghp_* (40 chars) or github_pat_* (various lengths)
    if (token.length < 20 || token.length > 500) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    if (!token.startsWith('ghp_') && !token.startsWith('github_pat_')) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 400 }
      );
    }

    const session = await getSession();
    session.githubToken = token;
    await session.save();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error storing token:', error);
    return NextResponse.json(
      { error: 'Failed to store token' },
      { status: 500 }
    );
  }
}

// Get token status (without exposing the actual token)
export async function GET() {
  try {
    const session = await getSession();
    return NextResponse.json({
      hasToken: !!session.githubToken,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to check token' },
      { status: 500 }
    );
  }
}

// Delete token
export async function DELETE() {
  try {
    const session = await getSession();
    session.githubToken = undefined;
    await session.save();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: 'Failed to delete token' },
      { status: 500 }
    );
  }
}

