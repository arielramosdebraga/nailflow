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
  - governança principal de `super_admin` entregue na Sprint 9
  - pendências residuais finalizadas na Sprint 10
- Sprint 6: concluída
- Sprint 7: concluída
- Sprint 8: concluída
- Sprint 9: concluída
- Sprint 10: concluída no escopo de desenvolvimento
  - readiness de release com `app.config.ts`, `eas.json` e preflight versionados
  - configurações globais do `super_admin`
  - exportação LGPD via Cloud Function com trilha de auditoria
  - documentação operacional de release, piloto e handoff da Fase B

Observação:
- A execução operacional do piloto continua manual: gerar builds no EAS, distribuir internamente, conduzir onboarding e coletar feedback em campo.
- Em outras palavras: 100% do desenvolvimento versionado no repositório foi concluído; o que resta é execução operacional do piloto.

Para detalhes completos, consulte:
- [docs/planejamento.md](./docs/planejamento.md)
- [docs/AGENTS.md](./docs/AGENTS.md)
- [docs/guia-de-uso-piloto.md](./docs/guia-de-uso-piloto.md)
- [docs/release-operacional.md](./docs/release-operacional.md)
- [docs/handoff-fase-b.md](./docs/handoff-fase-b.md)

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
EXPO_PUBLIC_FUNCTIONS_HEALTH_URL=
EXPO_OWNER=
NAILFLOW_IOS_BUNDLE_IDENTIFIER=app.nailflow.mobile
NAILFLOW_ANDROID_PACKAGE=app.nailflow.mobile
NAILFLOW_IOS_BUILD_NUMBER=1
NAILFLOW_ANDROID_VERSION_CODE=1
```

Observações:
- Não versione arquivos sensíveis.
- Credenciais de admin local devem ficar em `secrets/` (ignorado por Git).
- Use [`.env.example`](./.env.example) como baseline único para app e functions.

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
pnpm test:e2e
```

Observação:
- `pnpm test:e2e` executa os fluxos Maestro versionados em `.maestro/`.
- A execução local depende da CLI do Maestro instalada no ambiente.

## Scripts úteis

Seed de contas de teste:

```bash
pnpm seed:test-accounts
```

Release e distribuição:

```bash
pnpm release:preflight
pnpm release:env:pull:preview
pnpm build:preview:android
pnpm build:preview:ios
pnpm build:pilot:all
pnpm build:production:all
pnpm submit:production:ios
pnpm submit:production:android
```

## Cloud Functions

As funções ficam em [`functions/`](./functions) e podem ser operadas pelo workspace com `pnpm`.

```bash
pnpm --dir functions lint
pnpm --dir functions build
pnpm --dir functions serve
```

### Variáveis de ambiente das Functions (Sprints 6 e 7)

Defina no ambiente das funções:

```env
GOOGLE_CALENDAR_CLIENT_ID=
GOOGLE_CALENDAR_CLIENT_SECRET=
GOOGLE_CALENDAR_REDIRECT_URI=
GOOGLE_TOKEN_ENCRYPTION_SECRET=
GOOGLE_CALENDAR_STATE_TTL_SECONDS=600
GOOGLE_CALENDAR_WEBHOOK_URL=
GOOGLE_CALENDAR_WATCH_TOKEN_SECRET=
GOOGLE_CALENDAR_WATCH_RENEW_AHEAD_SECONDS=21600
GOOGLE_CALENDAR_RECONCILE_LOOKBACK_DAYS=90
SUPER_ADMIN_ALLOWLIST=
TOTP_ISSUER=NailFlow
SCHEDULER_TIMEZONE=America/Sao_Paulo
TEST_ACCOUNT_PASSWORD=
```

Deploy de functions:

```bash
pnpm --dir functions deploy
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
