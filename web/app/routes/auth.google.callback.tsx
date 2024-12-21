import { type LoaderFunction, redirect } from '@remix-run/cloudflare';
import { getGoogleUser } from '~/lib/oauthProviders';
import { createSession } from 'app/sessions';

export const loader: LoaderFunction = async ({ request, context }) => {
  const url = new URL(request.url);
  const { DB } = context.cloudflare.env;
  
  const code = url.searchParams.get('code');

  if (!code) {
    return redirect('/login');
  }

  const googleUser = await getGoogleUser(code, context.cloudflare.env);
  if (!googleUser || !googleUser.email) {
    return redirect('/login');
  }

  // ユーザーが既に存在するか確認
  const existingUserQuery = await DB.prepare(`
    SELECT u.id
    FROM Users u
    JOIN OAuthProviders op ON u.id = op.user_id
    WHERE u.email = ? AND op.provider = 'google'
  `).bind(googleUser.email).first<{id: number}>();

  let user: number;
  if (!existingUserQuery) {
    // Users テーブルにレコードがないか確認
    const userCountQuery = await DB.prepare(`
      SELECT COUNT(*) as count FROM Users
    `).first<{ count: number }>();

    const isAdmin = userCountQuery?.count === 0;

    // 新しいユーザーを作成
    const insertUserQuery = await DB.prepare(`
      INSERT INTO Users (name, email, is_admin) VALUES (?, ?, ?)
    `).bind(googleUser.name, googleUser.email, isAdmin).run();

    const userId = insertUserQuery.meta.last_row_id;

    await DB.prepare(`
      INSERT INTO OAuthProviders (user_id, provider, oauth_id) VALUES (?, 'google', ?)
    `).bind(userId, googleUser.sub).run();

    user = userId;
  } else {
    user = existingUserQuery.id;
  }

  const session = await createSession(user);
  return redirect('/', {
    headers: {
      'Set-Cookie': session,
    },
  });
};