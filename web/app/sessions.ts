import { createCookieSessionStorage } from '@remix-run/cloudflare';

const { getSession, commitSession, destroySession } = createCookieSessionStorage({
  cookie: {
    name: '__session',
    secrets: ['your-secret'],
    sameSite: 'lax',
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
  },
});

export { getSession, commitSession, destroySession };

export const createSession = async (userId: number): Promise<string> => {
  const session = await getSession();
  session.set('user', userId);
  return commitSession(session);
};