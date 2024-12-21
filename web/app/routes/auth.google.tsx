import { type LoaderFunction, redirect } from '@remix-run/cloudflare';
import { hasUserSession } from '~/lib/authHelper';
import { getGoogleAuthUrl } from '~/lib/oauthProviders';

export const loader: LoaderFunction = async ({ context, request }) => {
  if (await hasUserSession(request)) {
    return redirect("/");
  };
  const { env } =  context.cloudflare;
  const url = getGoogleAuthUrl(env);
  return redirect(url);
};