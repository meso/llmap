import { AppLoadContext, redirect } from "@remix-run/cloudflare";
import { getSession } from "~/sessions";


export async function hasUserSession(request: Request) {
  const session = await getSession(request.headers.get("Cookie"));
  const userId: number = session?.get("user");
  return userId !== undefined;
}

export async function requireUser(context: AppLoadContext , request: Request) {
  const { DB } = context.cloudflare.env;

  const session = await getSession(request.headers.get("Cookie"));
  const userId: number = session?.get("user");
  if (!userId) {
    throw redirect("/login");
  }

  const existingUserQuery = await DB.prepare(`
    SELECT is_admin FROM Users WHERE id = ?
  `).bind(userId).first<{ is_admin: boolean }>();
  if (!existingUserQuery) {
    throw redirect("/login");
  }

  return { userId, isAdmin: existingUserQuery.is_admin };
}

export async function requireAdmin(context: AppLoadContext , request: Request) {
  const { DB } = context.cloudflare.env;

  const session = await getSession(request.headers.get("Cookie"));
  const userId: number = session?.get("user");
  if (!userId) {
    throw redirect("/login");
  }

  const existingUserQuery = await DB.prepare(`
    SELECT is_admin FROM Users WHERE id = ?
  `).bind(userId).first<{is_admin: boolean}>();
  if (!existingUserQuery || !existingUserQuery.is_admin) {
    throw redirect("/login");
  }

  return userId;
}