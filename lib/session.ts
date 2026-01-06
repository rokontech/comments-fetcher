import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  githubToken?: string;
}

// Get session options with lazy validation
// Validation only happens when getSession() is called at runtime, not during build
function getSessionOptions() {
  const sessionSecret = process.env.SESSION_SECRET;
  
  // Check if we're in a build phase
  // NEXT_PHASE is set by Next.js during build: 'phase-production-build' or 'phase-development-build'
  // During build, we allow missing SESSION_SECRET to avoid build failures
  // The secret will be validated at actual runtime when requests are made
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                       process.env.NEXT_PHASE === 'phase-development-build';
  
  if (!sessionSecret || sessionSecret.length < 32) {
    // Only throw error in production runtime, not during build
    if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
      throw new Error('SESSION_SECRET must be set and at least 32 characters long in production');
    }
    // Warn in development runtime (not during build)
    if (process.env.NODE_ENV !== 'production' && !isBuildPhase) {
      console.warn('⚠️  WARNING: SESSION_SECRET not set or too short. Using insecure default for development only.');
    }
  }

  return {
    password: sessionSecret || 'insecure-default-for-development-only-change-me',
    cookieName: 'comments_session',
    cookieOptions: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  };
}

export async function getSession() {
  const cookieStore = cookies();
  const sessionOptions = getSessionOptions();
  // getIronSession returns a promise when used with Next.js cookies()
  // @ts-ignore - iron-session types may not reflect promise return in Next.js context
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

