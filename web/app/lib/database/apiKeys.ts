export async function addApiKey(env: Env, formData: FormData) {
  const { userId, name, provider_id } = Object.fromEntries(formData);
  const { DB, PROXY_URL } = env;

  const record = await DB.prepare(`
    SELECT path FROM Providers WHERE id = ?
  `).bind(provider_id).first();
  if (!record) {
    throw new Error("Provider not found");
  }
  const path = record.path as string;
  const apiKey = crypto.randomUUID();
  const base_url = PROXY_URL + path;
  await DB.prepare(`
    INSERT INTO ApiKeys (user_id, name, provider_id, api_key, base_url)
    VALUES (?, ?, ?, ?, ?)
  `).bind(userId, name ? name : "Made by admin", provider_id, apiKey, base_url).run();
}

export async function toggleApiKey(DB: D1Database, formData: FormData) {
  const { userId, apiKeyId, is_active } = Object.fromEntries(formData);
  await DB.prepare(`
    UPDATE ApiKeys
    SET is_active = ?
    WHERE user_id = ? AND id = ?
  `).bind(is_active.toString() === 'true', userId, apiKeyId).run();
}

export async function deleteApiKey(DB: D1Database, formData: FormData) {
  const { userId, apiKeyId } = Object.fromEntries(formData);
  await DB.prepare(`
    DELETE FROM ApiKeys
    WHERE user_id = ? AND id = ?
  `).bind(userId, apiKeyId).run();
}
