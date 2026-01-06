import { getIronSession } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  githubToken?: string;
}

// Validate session secret is set
const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret || sessionSecret.length < 32) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_SECRET must be set and at least 32 characters long in production');
  }
  console.warn('⚠️  WARNING: SESSION_SECRET not set or too short. Using insecure default for development only.');
}

const sessionOptions = {
  password: sessionSecret || 'insecure-default-for-development-only-change-me',
  cookieName: 'comments_session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession() {
  const cookieStore = cookies();
  // getIronSession returns a promise when used with Next.js cookies()
  // @ts-ignore - iron-session types may not reflect promise return in Next.js context
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);
  return session;
}

