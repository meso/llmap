import { Provider } from "../types";

export async function getProviders(DB: D1Database, is_active?: boolean) {
  const providersQuery = await DB.prepare(`
    SELECT id, name, api_key, base_url, is_active
    FROM Providers
    ${is_active ? 'WHERE is_active = 1' : ''}
  `).all<Provider>();

  const providers = providersQuery.results.map((provider) => ({
    id: provider.id as number,
    name: provider.name as string,
    api_key: provider.api_key as string,
    base_url: provider.base_url as string,
    is_active: Boolean(provider.is_active),
  } as Provider));

  return providers;
}
