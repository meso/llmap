# LLMAP: LLM Api Proxy

LLM の API キーを利用するアプリケーション（eg. Cursor）を社内利用する場合に、API キーをどう管理するか問題を解決するツールです。

- API キーを全社員共通にすると、退職者がでたら払い出し直して全員設定し直し → めんどくさい
- API キーを一人ひとり個別に払い出す → 管理役が大変
- 全員が LLM API の管理画面にアクセスできる → 事故が怖い

というわけで、APIへのリクエストをプロキシーしつつ、社員個別に社内用のAPIキーを発行するツールとなります。

## やりたいこと

1. 社員が個別に社内APIキーの発行ができる（リクエストができる）
    - OAuth 2.0 でログインする（Google, Microsoft, GitHub, Slack）
2. LLM API へのリクエストを、APIキーを本物に書き換えてプロキシーし、レスポンスをそのまま返す
    - Stream 系はちょっとどうなるかわからんので後回し
3. 管理者が、任意のユーザーの社内APIキーを disable にする
4. 社員別の利用Token数の確認
5. Deploy to Workers ボタンで誰でも Cloudflare にデプロイできる
6. まずは OpenAI と Azure OpenAI Service と Claude と Gemini に対応する

## 構成
- proxy が Proxy を担う Workers のコード（Hono ベース）
- web が画面を担う Pages のコード（Remix ベース）

## 初回 Deploy
1. このリポジトリを fork する
1. Cloudflare のコンソール上でアカウントIDを確認し、fork したリポジトリの Actions の Repository secrets として登録する（CF_ACCOUNT_ID）
1. Cloudflare のコンソール上で Cloudflare Workers の編集権限のテンプレートに D1 の編集権限を加えた API トークンを発行し、同じく secrets として登録する（CF_API_TOKEN）
1. GitHub Actions の Deploy workflow を実行する（２分半ぐらい）
1. Cloudflare に llmap プロジェクトができてプロダクションで Deploy が完了しているので、ドメインを確認する
1. Google Cloud のコンソール上で新しいプロジェクトを作成し、Google Auth Platform のクライアントで OAuth 2.0 クライアントを作成
1. Google Cloud の作成したクライアントの「承認済みの JavaScript 生成元」に「https://そのドメイン」を、「承認済みのリダイレクト URI」に「https://そのドメイン/auth/google/callback を登録する」
1. Cloudflare の llmap プロジェクトの設定の「変数とシークレット」で、上記の「https://そのドメイン/auth/google/callback」を登録する（GOOGLE_CALLBACK_URL）
1. Google Cloud で作成した OAuth 2.0 クライアントのクライアントIDとクライアントシークレットを、Cloudflare の llmap プロジェクトの設定の「変数とシークレット」で登録する（GOOGLE_CLIENT_IDとGOOGLE_CLIENT_SECRET）
