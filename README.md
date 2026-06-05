# NailFlow

Aplicativo mobile para gestao de salao, com foco em autenticacao segura, agenda, clientes, comandas, notificacoes e operacao do dia a dia.

## Visao geral

- Plataforma: Expo SDK 56 + React Native
- Backend: Firebase Auth, Firestore e Cloud Functions
- Arquitetura: Expo Router + `services` + `hooks` + schemas Zod
- Interface: portugues (pt-BR)
- Testes do piloto: APK/development build, nao Expo Go

## Status atual

- Sprint 0 a Sprint 10 concluidas no escopo de desenvolvimento.
- Branch `fix-tests` mergeada em `develop` em 05/06/2026 via PR `#13`.
- APK Android preview gerado e finalizado no EAS para testes internos.
- Indices Firestore publicados no ambiente de testes.
- Seed de contas e entidades de teste disponivel.
- Deploy de Cloud Functions bloqueado ate o projeto Firebase estar no plano Blaze.

Pendencia externa principal:

- Sem Blaze, Functions nao publicam; isso limita 2FA real, Google Calendar real, LGPD callable, triggers, schedulers e parte das notificacoes/backend.

## Stack principal

- Expo `~56.0.8`
- React Native `0.85.3`
- React `19.2.3`
- Expo Router `^56.2.8`
- TypeScript `~6.0.3`
- NativeWind
- Zustand
- TanStack Query
- React Hook Form + Zod
- Firebase JS SDK `^12.13.0`
- React Native Firebase `^24.0.0`
- Cloud Functions Node `22`

Antes de mudancas estruturais em Expo, consulte a documentacao versionada:

- https://docs.expo.dev/versions/v56.0.0/

## Pre-requisitos

- Node.js 22.13.x ou superior dentro da faixa suportada pelo Expo SDK 56.
- pnpm 9.x, alinhado ao CI e ao lockfile.
- JDK 21 LTS.
- Android Studio com Android SDK/API 36 para build local/emulador.
- Conta EAS para builds remotas.
- Firebase CLI no PATH para deploy e `pnpm test:integration`.
- Projeto Firebase configurado.

## Ambiente

Copie o template versionado e preencha os valores reais localmente:

```bash
cp .env.template .env
```

No Windows PowerShell:

```powershell
Copy-Item .env.template .env
```

Regras:

- `.env` nao deve ser versionado.
- `.env.template` e o baseline sem segredos.
- Credenciais admin locais ficam em `secrets/` ou em `GOOGLE_APPLICATION_CREDENTIALS`.
- Nunca exponha valores reais de Firebase, Google, service account ou tokens em commits/docs/logs.

## Instalar dependencias

```bash
pnpm install
```

## Desenvolvimento

```bash
pnpm start
pnpm android
pnpm ios
pnpm web
```

Observacao:

- `pnpm start` abre o servidor Expo, mas o piloto nao deve ser validado pelo Expo Go.
- Use APK EAS ou development build para recursos nativos/push.

## Build Android de teste

```bash
pnpm release:preflight
pnpm build:preview:android
```

Build Android preview de referencia:

- ID: `95bf855a-29e4-447c-9caf-4d4865358d2a`
- Status: `FINISHED`
- Commit: `7da07de`
- `appBuildVersion`: `3`
- URL: `https://expo.dev/accounts/guhzynhuh/projects/nailflow/builds/95bf855a-29e4-447c-9caf-4d4865358d2a`

Perfis EAS disponiveis:

- `development`: build interna com development client.
- `preview`: build interna para APK/testes Android.
- `pilot`: build interna para rodada de piloto.
- `production`: build/submissao para lojas.

Todos usam `autoIncrement: true`.

## Qualidade e testes

Obrigatorio apos mudancas:

```bash
pnpm typecheck
pnpm lint
pnpm test
```

Complementar:

```bash
pnpm format
pnpm test:coverage
pnpm test:integration
pnpm test:e2e
pnpm --dir functions lint
pnpm --dir functions build
npx expo-doctor
```

Notas:

- `pnpm test:integration` usa Firebase Emulator.
- A Firebase CLI precisa estar instalada/disponivel como `firebase`.
- `pnpm test:e2e` usa Maestro e depende de ambiente mobile preparado.
- Rode `npx expo-doctor` ao mudar Expo, dependencias, EAS, configs nativas ou build.

Scripts EAS uteis:

```bash
pnpm release:env:pull:preview
pnpm release:env:pull:production
pnpm build:preview:ios
pnpm build:pilot:all
pnpm build:production:all
pnpm submit:production:ios
pnpm submit:production:android
```

## Seed de dados de teste

```bash
pnpm seed:test-accounts
```

Pre-requisitos:

- `.env` com `EXPO_PUBLIC_FIREBASE_PROJECT_ID` apontando para o projeto correto.
- Credencial Admin local em `secrets/firebase/firebase-adminsdk*.json`, ou `GOOGLE_APPLICATION_CREDENTIALS` apontando para a credencial.
- Rodar somente no Firebase de teste/piloto autorizado, porque o script cria/atualiza Auth e Firestore.

Contas criadas/atualizadas:

| Perfil | E-mail | Role |
|---|---|---|
| Profissional | `manicure.teste@nailflow.app` | `nail_technician` |
| Dono do salao | `owner.teste@nailflow.app` | `salon_owner` |
| Admin global | `admin.teste@nailflow.app` | `super_admin` |

Senha padrao:

```text
Nailflow@123
```

ou `TEST_ACCOUNT_PASSWORD`.

O seed tambem cria salao, cliente, atendimento, comandas, notificacoes, audit log e dead-letter de sync.

## Firebase

Deploy de indices:

```bash
npx firebase-tools deploy --only firestore:indexes --project nailflow-8776c
```

Deploy de Functions:

```bash
npx firebase-tools deploy --only functions --project nailflow-8776c
```

Importante:

- Cloud Functions exigem Firebase Blaze.
- Sem Blaze, o deploy falha ao tentar habilitar APIs como Cloud Build/Artifact Registry.
- Nao ativar Blaze automaticamente; e decisao de billing do owner.

## Estrutura de pastas

```text
app/
  (auth)/
  (nail-technician)/
  (owner)/
  (admin)/
  google-calendar/

src/
  components/
  hooks/
  providers/
  schemas/
  services/
  stores/
  styles/
  types/
  utils/

functions/
  src/

tests/
  integration/

docs/
scripts/
```

Arquivos de configuracao como `app.config.ts`, `eas.json`, `firebase.json`, `metro.config.js`, `tailwind.config.js`, `vitest*.config.ts` e `tsconfig.json` permanecem na raiz por exigencia das ferramentas.

## Documentacao principal

- [docs/AGENTS.md](./docs/AGENTS.md)
- [docs/handoff-desenvolvimento.md](./docs/handoff-desenvolvimento.md)
- [docs/guia-de-uso-piloto.md](./docs/guia-de-uso-piloto.md)
- [docs/release-operacional.md](./docs/release-operacional.md)
- [docs/sdd-harness/00-contexto-repo.md](./docs/sdd-harness/00-contexto-repo.md)
- [docs/sdd-harness/harness.md](./docs/sdd-harness/harness.md)

## Fluxo Git

- Commits semanticos em portugues.
- Corpo obrigatorio com `O que foi feito:` e `Por que foi feito:`.
- PR sempre para `develop`.
- PRs devem ter descricao atualizada a cada commit relevante.

## Seguranca

- Nunca versionar segredos.
- Aplicar menor privilegio nas regras Firestore.
- Revisar rules/indexes ao alterar entidades ou consultas.
- Em auth/RBAC/2FA, priorizar seguranca e menor escopo.
