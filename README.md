# data-migration-system
データを移行するためのシステム（プロトタイプ）

## システムの起動方法

### 前提条件

以下がインストールされていることを確認してください。

- Docker
- Docker Compose

### 起動手順

1. プロジェクトのルートディレクトリで以下を実行します。

```bash
docker compose up -d
```

2. コンテナ内に入って以下を実行します。

```bash
npm install
npm run dev
```

3. `localhost:3003`にアクセスしてください。
