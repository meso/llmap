import { Hono } from 'hono';
import { Context } from 'hono';

type ResponseJson = {
  data?: [{
    // OpenAI properties
    usage?: {
      prompt_tokens: number;
      completion_tokens: number;  
    },
  }],
  usage?: {
    // OpenAI properties
    prompt_tokens?: number;
    completion_tokens?: number;

    // Anthropic Claude properties
    input_tokens?: number;
    output_tokens?: number;
  },
}

const app = new Hono<{ Bindings: Env }>();

// Cursor が OpenAI API Key の Verify 時にこのリクエストを送る
app.on('OPTIONS', ['/v1/chat/completions', '/v1/models'], async (c: Context<{ Bindings: Env }>) => {

  const response = await fetch(`https://api.openai.com${c.req.path}`, {
    method: c.req.method,
    headers: c.req.header(),
    body: await c.req.text()
  });

  return response;
});

// Cursor が OpenAI API Key の Verify 時に GET /v1/models リクエストを送るため
app.get('/v1/models', async (c: Context<{ Bindings: Env }>) => {
  const { DB } = c.env;

  // リクエストからヘッダーにある認証情報を取得
  const headers = c.req.header();
  const apikey = headers['authorization']?.split(' ')[1];
  if (!apikey) {
    return c.text('API Key is missing', { status: 401 });
  }

  const result = await DB.prepare(
    `SELECT Providers.api_key, Providers.base_url, ApiKeys.id
     FROM ApiKeys
     JOIN Providers ON ApiKeys.provider_id = Providers.id
     WHERE ApiKeys.api_key = ? AND ApiKeys.is_active = 1 AND Providers.is_active = 1;`
  ).bind(apikey).first();
  if (!result) {
    return c.text('API Key is not found', { status: 401 });
  }
  
  const realApiKey = result.api_key as string;
  const baseUrl = result.base_url as string;
  const targetUrl = baseUrl + c.req.path;
  headers["authorization"] = "Bearer " + realApiKey;
  headers['host'] = new URL(baseUrl).host;

  const response = await fetch(targetUrl, {
    method: c.req.method,
    headers: headers,
  });

  return response;
});

app.post('/*', async (c: Context<{ Bindings: Env }>) => {
  const { DB } = c.env;

  // リクエストからヘッダーにある認証情報を取得
  const headers = c.req.header();
  const headerKeys: Record<string, string | undefined> = {
    'authorization': headers['authorization']?.split(' ')[1],
    'x-api-key': headers['x-api-key'],
    'x-google-api-key': headers['x-google-api-key']
  };

  let apikey = '';
  let headerKey = '';

  for (const [key, value] of Object.entries(headerKeys)) {
    if (value) {
      apikey = value;
      headerKey = key;
      break;
    }
  }
  if (!apikey) {
    return c.text('API Key is missing', { status: 401 });
  }

  const result = await DB.prepare(
    `SELECT Providers.api_key, Providers.base_url, ApiKeys.id
     FROM ApiKeys
     JOIN Providers ON ApiKeys.provider_id = Providers.id
     WHERE ApiKeys.api_key = ? AND ApiKeys.is_active = 1 AND Providers.is_active = 1;`
  ).bind(apikey).first();
  if (!result) {
    return c.text('API Key is not found', { status: 401 });
  }

  const ApiKeyId = result.id as number;
  const realApiKey = result.api_key as string;
  const baseUrl = result.base_url as string;
  const targetUrl = baseUrl + c.req.path;
  headers[headerKey] = (headerKey === "authorization" ? "Bearer " : "") + realApiKey;
  headers['host'] = new URL(baseUrl).host;

  const response = await fetch(targetUrl, {
    method: c.req.method,
    headers: headers,
    body: await c.req.text()
  });

  const responseBody = await response.text();
  await updateUsage(DB, ApiKeyId, responseBody);

  return c.text(responseBody, { status: response.status, headers: response.headers });
});

async function updateUsage(DB: D1Database, api_key_id: number, responseBody: string) {
  if (responseBody.startsWith('data:')) return;
  const res = JSON.parse(responseBody) as ResponseJson;
  let input_tokens = 0, output_tokens = 0;
  if (res.usage?.input_tokens && res.usage.output_tokens) {
    input_tokens = res.usage.input_tokens;
    output_tokens = res.usage.output_tokens;
  }
  if (res.usage?.prompt_tokens && res.usage.completion_tokens) {
    input_tokens = res.usage.prompt_tokens;
    output_tokens = res.usage.completion_tokens;
  }
  if (res.data && res.data.length > 0) {
    for (const data of res.data) {
      if (data.usage?.prompt_tokens && data.usage.completion_tokens) {
        input_tokens += data.usage.prompt_tokens;
        output_tokens += data.usage.completion_tokens;
      }
    }
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const result = await DB.prepare(
    `UPDATE MonthlyUsage 
     SET input_tokens = input_tokens + ?, output_tokens = output_tokens + ? 
     WHERE api_key_id = ? AND year = ? AND month = ?;`
  ).bind(input_tokens, output_tokens, api_key_id, year, month, ).run();

  if (result.meta.changes === 0) {
    await DB.prepare(
      `INSERT INTO MonthlyUsage (api_key_id, year, month, input_tokens, output_tokens) 
       VALUES (?, ?, ?, ?, ?);`
    ).bind(api_key_id, year, month, input_tokens, output_tokens).run();
  }
}


export default app;
