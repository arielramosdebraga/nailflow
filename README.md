# NailFlow

Aplicativo mobile (iOS e Android) para gestão de salão, com foco em autenticação segura, agenda e operação do dia a dia.

## Visão geral

- Plataforma: React Native + Expo
- Backend: Firebase (Auth, Firestore, Functions)
- Arquitetura: Expo Router + camada `services` + `hooks` + schemas Zod
- Idioma da interface: português (pt-BR)

## Status atual do projeto

- Sprint 0: concluída
- Sprint 1: concluída
- Sprint 2: concluída
  - modelagem e CRUD de clientes
  - 2FA (TOTP) para `super_admin` e `salon_owner`
  - Cloud Function `createSalon`
  - setup funcional básico de FCM/Storage
  - Husky + lint-staged + CI (lint/typecheck/test)
- Sprint 3: concluída
- Sprint 4: concluída
- Sprint 5: concluída
- Sprint 6: em andamento (Google Calendar OAuth + sync App->Google)

Para detalhes completos, consulte:
- [docs/planejamento.md](./docs/planejamento.md)
- [docs/AGENTS.md](./docs/AGENTS.md)

## Stack principal

- Expo SDK 56
- React Native 0.85
- TypeScript (strict)
- Expo Router
- NativeWind
- Zustand
- TanStack Query
- React Hook Form + Zod
- Firebase JS SDK + Cloud Functions

## Pré-requisitos

- Node.js 22+
- pnpm 10+
- Expo Go (Android/iOS) para testes rápidos
- Projeto Firebase configurado

## Configuração de ambiente

Crie um arquivo `.env` na raiz com as variáveis:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=
EXPO_PUBLIC_FIREBASE_PROJECT_ID=
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
EXPO_PUBLIC_FIREBASE_APP_ID=
EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID=
EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=
EXPO_PUBLIC_GOOGLE_CALENDAR_BEGIN_CALLABLE=beginGoogleCalendarConnection
EXPO_PUBLIC_GOOGLE_CALENDAR_CONFIRM_CALLABLE=completeGoogleCalendarConnection
EXPO_PUBLIC_EAS_PROJECT_ID=
```

Observações:
- Não versione arquivos sensíveis.
- Credenciais de admin local devem ficar em `secrets/` (ignorado por Git).

## Executando o app

Instalação:

```bash
pnpm install
```

Subir servidor de desenvolvimento:

```bash
pnpm start
```

Outros alvos:

```bash
pnpm android
pnpm ios
pnpm web
```

## Qualidade e testes

```bash
pnpm lint
pnpm typecheck
pnpm test
```

## Scripts úteis

Seed de contas de teste:

```bash
pnpm seed:test-accounts
```

## Cloud Functions

As funções ficam em [`functions/`](./functions) e usam `npm` no pacote local.

```bash
cd functions
npm install
npm run build
npm run serve
```

### Variáveis de ambiente das Functions (Sprint 6)

Defina no ambiente das funções:

```env
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=
GOOGLE_TOKEN_ENCRYPTION_SECRET=
GOOGLE_CALENDAR_STATE_TTL_SECONDS=600
```

Deploy de functions:

```bash
npm run deploy
```

## Estrutura de pastas (resumo)

```text
app/
  (auth)/
  (nail-technician)/
  (owner)/
  (admin)/

src/
  components/
  hooks/
  providers/
  schemas/
  services/
  stores/

functions/
docs/
scripts/
```

## Fluxo Git adotado

- Branch por sprint
- Commits semânticos (Conventional Commits) em português
- PR sempre para `develop`
- Nome de branch de sprint: `Sprint-X-descricao-curta`

## Segurança

- Nunca versionar segredos
- Aplicar princípio do menor privilégio nas regras do Firestore
- Em mudanças de auth/RBAC, validar impacto em regras e claims

---

Em caso de dúvida de arquitetura ou processo, usar `docs/AGENTS.md` como referência principal de execução.
