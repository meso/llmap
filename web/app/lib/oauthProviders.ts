import { decodeIdToken, generateCodeVerifier, generateState, Google } from 'arctic';

let google: Google | null = null;
let codeVerifier: string | null = null;

const initializeGoogleClient = (env: Env) => {
  if (!google) {
    google = new Google(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      env.GOOGLE_CALLBACK_URL
    );
    codeVerifier = generateCodeVerifier();
  }
};

export const getGoogleAuthUrl = (env: Env): string => {
  initializeGoogleClient(env);
  const state = generateState();
  const scope = ['profile', 'email'];
  return google!.createAuthorizationURL(state, codeVerifier!, scope).toString();
};

export const getGoogleUser = async (code: string, env: Env) => {
  initializeGoogleClient(env);
  const tokens = await google!.validateAuthorizationCode(code, codeVerifier!);
  const claims = decodeIdToken(tokens.idToken()) as { sub: string, email: string; name: string };
  return claims;
};