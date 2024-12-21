```
npm install
wrangler d1 create llmap_database
wrangler d1 execute llmap_database --file=../migrations/schema.sql
npm run dev
```

```
wrangler d1 create llmap_database --remote
wrangler d1 execute llmap_database --file=../migrations/schema.sql --remote
npm run deploy
```
