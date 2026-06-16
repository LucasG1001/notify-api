# Notify API

API genérica de notificações para **Telegram**, reaproveitável por qualquer projeto. Cada projeto consumidor é cadastrado com o **token do bot** e o **chat_id** de destino, e envia mensagens bonitas com **banner no topo, legenda em HTML e botões inline**. As notificações são persistidas no PostgreSQL com status e suporte a reenvio (retry).

## Arquitetura

```
Projeto consumidor → Notify API (REST) → Telegram Bot API (sendPhoto/sendMessage)
                          ↓
                     PostgreSQL (projects, notifications)
```

- **Entrega:** Telegram Bot API. O token do bot e o `chat_id` ficam no próprio projeto.
- **Contrato genérico:** o cliente envia campos neutros (`title`, `description`, `image`, `url`, `fields`, `buttons`) e a API monta o `sendPhoto`/`sendMessage` (legenda HTML + `inline_keyboard`).
- **Autenticação:** API key por projeto (header `x-api-key`); rotas administrativas usam `x-admin-key`.
- **Confiabilidade:** envio síncrono com retry/backoff, respeitando o rate limit do Telegram (`429` / `retry-after`).

Stack: Node + Express 5 + TypeScript (strict, ESM) + PostgreSQL (`pg`) + Zod. Mesmas convenções do projeto `media`.

## Desenvolvimento

```bash
cp .env.example .env        # configure DATABASE_URL e ADMIN_API_KEY
npm install
npm run dev                 # http://localhost:3334
```

A migração roda automaticamente no startup (criação/alteração idempotente das tabelas).

### Build e produção

```bash
npm run build               # tsc → dist/
npm start                   # node dist/server.js
```

### Docker

```bash
docker compose up --build   # sobe Postgres + API
```

## Variáveis de ambiente

| Variável        | Descrição                                   |
| --------------- | ------------------------------------------- |
| `DATABASE_URL`  | string de conexão PostgreSQL                |
| `PORT`          | porta HTTP (default `3334`)                 |
| `ADMIN_API_KEY` | chave para gerenciar projetos (rotas admin) |

> O **token do bot** e o **chat_id** do Telegram **não** ficam em variáveis de ambiente — são por projeto, informados no cadastro (`POST /api/projects`).

## Autenticação

- **Rotas administrativas** (`/api/projects`): header `x-admin-key: <ADMIN_API_KEY>`.
- **Rotas de projeto** (`/api/notifications`): header `x-api-key: <api key do projeto>`.

A API key do projeto é exibida **apenas uma vez** (na criação ou ao rotacionar) — guarde-a com segurança. Internamente só armazenamos o hash SHA-256 da key. O token do bot é guardado em texto puro (necessário para chamar o Telegram) e nunca é retornado nas listagens.

## Como obter token e chat_id

1. Fale com [@BotFather](https://t.me/BotFather) → `/newbot` → copie o **token**.
2. Adicione o bot como **admin** no seu canal/grupo de avisos.
3. `chat_id`: use `@nome_do_canal` (canal público) ou o id numérico (ex.: `-1001234567890`) para canal/grupo privado.

## Endpoints

### Projetos (admin)

| Método   | Rota                          | Descrição                                  |
| -------- | ----------------------------- | ------------------------------------------ |
| `POST`   | `/api/projects`               | Cria projeto; retorna a API key em claro   |
| `GET`    | `/api/projects`               | Lista projetos (sem expor o token do bot)  |
| `PUT`    | `/api/projects/:id`           | Atualiza nome/token/chat_id/ativo          |
| `POST`   | `/api/projects/:id/rotate-key`| Gera nova API key                          |
| `DELETE` | `/api/projects/:id`           | Remove projeto (cascata nas notificações)  |

Corpo do cadastro: `{ name, telegramBotToken, telegramChatId }` (todos obrigatórios).

### Notificações (por projeto)

| Método | Rota                          | Descrição                                       |
| ------ | ----------------------------- | ----------------------------------------------- |
| `POST` | `/api/notifications`          | Envia notificação                               |
| `GET`  | `/api/notifications`          | Histórico (filtros: `status`, `type`, `limit`)  |
| `GET`  | `/api/notifications/:id`      | Detalhe                                         |
| `POST` | `/api/notifications/:id/retry`| Reenvia uma notificação que falhou              |

Corpo do envio (payload genérico):

```jsonc
{
  "type": "anime-adicionado",      // rótulo opcional (filtro/histórico)
  "title": "Título em negrito",    // title OU description é obrigatório
  "description": "Texto da legenda",
  "image": "https://.../banner.jpg", // se presente → sendPhoto (banner no topo)
  "url": "https://...",            // vira um link "Abrir" na legenda
  "fields": [                       // viram linhas "nome: valor" na legenda
    { "name": "Status", "value": "Em exibição" }
  ],
  "buttons": [                      // viram inline_keyboard (2 por linha)
    { "text": "🎥 Trailer", "url": "https://youtube.com/watch?v=..." }
  ]
}
```

## Exemplo de uso (curl)

```bash
# 1. Criar projeto (admin) — guarde a apiKey retornada
curl -X POST http://localhost:3334/api/projects \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "media-tracker",
    "telegramBotToken": "8681672789:AA...",
    "telegramChatId": "-1004290285771"
  }'

# 2. Enviar uma notificação bonita
curl -X POST http://localhost:3334/api/notifications \
  -H "x-api-key: ntf_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "anime-adicionado",
    "title": "Frieren: Beyond Journey'\''s End",
    "description": "Episódio 1 disponível.",
    "image": "https://example.com/banner.jpg",
    "url": "https://anilist.co",
    "fields": [
      { "name": "Status", "value": "Em exibição" },
      { "name": "Nota", "value": "9.0/100" }
    ],
    "buttons": [
      { "text": "🎥 Trailer", "url": "https://youtube.com/watch?v=abc" }
    ]
  }'
```
