# Notify API

API genérica de notificações para **Discord**, reaproveitável por qualquer projeto. Cada projeto consumidor registra **canais por tipo de notificação** (cada um apontando para uma _webhook_ do Discord) e envia mensagens bonitas com **embeds totalmente customizáveis**. As notificações são persistidas no PostgreSQL com status e suporte a reenvio (retry).

## Arquitetura

```
Projeto consumidor → Notify API (REST) → Webhook do Discord
                          ↓
                     PostgreSQL (projects, channels, notifications)
```

- **Entrega:** webhooks do Discord (sem hospedar bot).
- **Roteamento:** o tipo da notificação resolve o canal/webhook do projeto.
- **Autenticação:** API key por projeto (header `x-api-key`); rotas administrativas usam `x-admin-key`.
- **Confiabilidade:** envio síncrono com retry/backoff e respeito ao rate limit do Discord (`429` / `retry-after`).

Stack: Node + Express 5 + TypeScript (strict, ESM) + PostgreSQL (`pg`) + Zod. Mesmas convenções do projeto `media`.

## Desenvolvimento

```bash
cp .env.example .env        # configure DATABASE_URL e ADMIN_API_KEY
npm install
npm run dev                 # http://localhost:3334
```

A migração roda automaticamente no startup (criação idempotente das tabelas).

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

## Autenticação

- **Rotas administrativas** (`/api/projects`): header `x-admin-key: <ADMIN_API_KEY>`.
- **Rotas de projeto** (`/api/channels`, `/api/notifications`): header `x-api-key: <api key do projeto>`.

A API key do projeto é exibida **apenas uma vez** (na criação ou ao rotacionar) — guarde-a com segurança. Internamente só armazenamos o hash SHA-256.

## Endpoints

### Projetos (admin)

| Método   | Rota                          | Descrição                                  |
| -------- | ----------------------------- | ------------------------------------------ |
| `POST`   | `/api/projects`               | Cria projeto; retorna a API key em claro   |
| `GET`    | `/api/projects`               | Lista projetos                             |
| `POST`   | `/api/projects/:id/rotate-key`| Gera nova API key                          |
| `DELETE` | `/api/projects/:id`           | Remove projeto (cascata em canais)         |

### Canais (por projeto)

| Método   | Rota                | Descrição                              |
| -------- | ------------------- | -------------------------------------- |
| `GET`    | `/api/channels`     | Lista canais do projeto                |
| `POST`   | `/api/channels`     | Cria canal (`409` se `type` duplicado) |
| `PUT`    | `/api/channels/:id` | Atualiza canal                         |
| `DELETE` | `/api/channels/:id` | Remove canal                           |

Campos do canal: `type`, `name`, `webhookUrl`, e defaults opcionais `defaultUsername`, `defaultAvatarUrl`, `defaultColor` (cor decimal do embed).

### Notificações (por projeto)

| Método | Rota                         | Descrição                                  |
| ------ | ---------------------------- | ------------------------------------------ |
| `POST` | `/api/notifications`         | Envia notificação (`type` ou `channelId`)  |
| `GET`  | `/api/notifications`         | Histórico (filtros: `status`, `type`, `channelId`, `limit`) |
| `GET`  | `/api/notifications/:id`     | Detalhe                                    |
| `POST` | `/api/notifications/:id/retry`| Reenvia uma notificação que falhou        |

Corpo do envio: `{ type | channelId, content?, embeds?, username?, avatarUrl? }`. É obrigatório informar `content` **ou** `embeds`. Os defaults do canal preenchem `username`, `avatar_url` e a `color` dos embeds quando ausentes.

## Exemplo de uso (curl)

```bash
# 1. Criar projeto (admin) — guarde a apiKey retornada
curl -X POST http://localhost:3334/api/projects \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "name": "media-tracker" }'

# 2. Criar um canal para o tipo "alerts"
curl -X POST http://localhost:3334/api/channels \
  -H "x-api-key: ntf_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "alerts",
    "name": "Alertas",
    "webhookUrl": "https://discord.com/api/webhooks/123/abc",
    "defaultColor": 5814783,
    "defaultUsername": "Media Tracker"
  }'

# 3. Enviar uma notificação bonita
curl -X POST http://localhost:3334/api/notifications \
  -H "x-api-key: ntf_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "alerts",
    "embeds": [{
      "title": "Novo anime na temporada ✨",
      "description": "Frieren: Beyond Journey's End — episódio 1 disponível.",
      "url": "https://anilist.co",
      "thumbnail": { "url": "https://example.com/cover.jpg" },
      "fields": [
        { "name": "Status", "value": "RELEASING", "inline": true },
        { "name": "Nota", "value": "9.0", "inline": true }
      ],
      "footer": { "text": "Media Tracker" }
    }]
  }'
```
