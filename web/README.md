# LLMAP web

## Deployment

First, install dependencies and create your D1 database 

```sh
npm install
wrangler d1 create llmap_database
```

Copy `database_id` to wrangler.toml file

```sh
npm run build
```

Then, deploy your app to Cloudflare Pages:

```sh
wrangler d1 execute llmap_database --file ../migrations/schema.sql --remote
npm run deploy
```

Setup your Environment Variables on settings of your Cloudflare Workers & Pages dashboard

```
GOOGLE_CLIENT_ID: 
GOOGLE_CLIENT_SECRET: 
GOOGLE_CALLBACK_URL: https://<base_url>/auth/google/callback
```
