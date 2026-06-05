# 00 - Contexto real do repositorio

## Escopo

Este documento registra o estado real do repositorio NailFlow apos o merge da branch `fix-tests` em `develop`.

Fonte operacional:

- Workspace: `C:\Users\ariel\Documents\Projects\nailflow`
- Branch base remota: `origin/develop`
- PR de estabilizacao mais recente: `#13`, mergeado em 05/06/2026
- Build Android preview mais recente conhecida: `95bf855a-29e4-447c-9caf-4d4865358d2a`

## Secao A - Stack e estrutura

### Versoes reais

Fonte vencedora: `package.json`, `functions/package.json` e Expo SDK 56.

| Item | Valor real | Evidencia |
|---|---:|---|
| Expo SDK | `~56.0.8` | `package.json` |
| React Native | `0.85.3` | `package.json` |
| React | `19.2.3` | `package.json` |
| Expo Router | `^56.2.8` | `package.json` |
| TypeScript | `~6.0.3` | `package.json` |
| Firebase JS SDK | `^12.13.0` | `package.json` |
| React Native Firebase | `^24.0.0` | `package.json` |
| Cloud Functions runtime | `node: 22` | `functions/package.json` |
| Firebase Admin | `^13.6.0` | `functions/package.json` |
| Firebase Functions | `^7.0.0` | `functions/package.json` |

### Config Expo/EAS

Fonte: `app.config.ts`, `app.json`, `eas.json`.

- `app.config.ts` e a configuracao efetiva.
- Nome: `NailFlow`.
- Slug: `nailflow`.
- Versao: `1.0.0`.
- Scheme: `nailflow`.
- `runtimeVersion.policy`: `appVersion`.
- `experiments.typedRoutes`: `true`.
- Plugins: `expo-router`, `expo-secure-store`, `expo-notifications`.
- Perfis EAS: `development`, `preview`, `pilot`, `production`.
- `appVersionSource`: `remote`.
- `autoIncrement`: `true` nos perfis de build.

### Gerenciador de pacotes

- Raiz: `pnpm`, com `pnpm-lock.yaml` e `pnpm-workspace.yaml`.
- Functions: possui `package-lock.json` e scripts internos com `npm run`.
- CI executa functions via `pnpm --dir functions`.

Essa diferenca e documentada como excecao operacional, nao como bloqueio.

### Estrutura de pastas

- `app/`: rotas Expo Router.
- `src/`: componentes, hooks, providers, schemas, services, stores e utils.
- `functions/`: Cloud Functions TypeScript.
- `docs/`: planejamento, ADRs, guias, release, SDD harness e handoffs.
- `.github/workflows/`: CI.
- `.husky/`: hooks locais.
- `.maestro/`: flows E2E smoke.
- `scripts/`: seed, Maestro runner e release preflight.

Rotas principais:

- `app/(auth)`: login, cadastro, recuperacao, 2FA, documentos legais.
- `app/(admin)`: dashboard, saloes, usuarios, auditoria, logs, settings, LGPD, notificacoes.
- `app/(owner)`: dashboard, agenda, comandas, profissionais, notificacoes.
- `app/(nail-technician)`: agenda, atendimentos, clientes, Google Calendar, notificacoes.
- `app/google-calendar`: retorno OAuth.

### RBAC ativo

Roles canonicas:

- `super_admin`
- `salon_owner`
- `nail_technician`

Legado aceito:

- `manicure`

Evidencias:

- `src/schemas/users/user.schema.ts` normaliza `manicure` para `nail_technician`.
- `functions/src/shared/user-context.ts` aceita legado.
- `firestore.rules` ainda permite legado em helpers.
- Campos internos `manicureId` permanecem em agenda/comandas/sync.

### Colecoes Firestore reais

Evidencias: `firestore.rules`, `firestore.indexes.json`, `src/services/**`, `functions/src/**`.

| Colecao | Uso |
|---|---|
| `salons` | Governanca e vinculo com owner |
| `users` | RBAC, 2FA, Google Calendar e notificacoes |
| `clients` | Clientes por salao |
| `appointments` | Agenda, atendimento e sync Google |
| `commands` | Comandas e financeiro basico |
| `notifications` | Central in-app |
| `auditLogs` | Auditoria administrativa |
| `syncQueue` | Fila de sync Google |
| `syncQueueDeadLetter` | Falhas recorrentes de sync |

`syncQueueDeadLetter` e collection operacional oficializada por ADR.

### Indices compostos

Fonte: `firestore.indexes.json`.

O arquivo possui indices para:

- `appointments`
- `clients`
- `commands`
- `notifications`
- `users`
- `auditLogs`
- `syncQueue`
- `syncQueueDeadLetter`

Consultas novas devem ser revisadas contra `firestore.indexes.json` antes de merge.

### Funcoes exportadas

Fonte: `functions/src/index.ts`.

- `health`
- `onUserCreated`
- `createSalon`
- `exportLgpdData`
- `getGlobalDashboard`
- `getTotpStatus`
- `beginTotpEnrollment`
- `confirmTotpEnrollment`
- `verifyTotpCode`
- `getGoogleCalendarStatus`
- `beginGoogleCalendarConnection`
- `completeGoogleCalendarConnection`
- `refreshGoogleCalendarWatch`
- `onAppointmentCreatedSyncGoogleCalendar`
- `onAppointmentUpdatedSyncGoogleCalendar`
- `onAppointmentDeletedSyncGoogleCalendar`
- `receiveGoogleCalendarWatchWebhook`
- `onGoogleCalendarSyncQueueCreated`
- `renewGoogleCalendarWatchChannels`
- `reconcileGoogleCalendarAtNight`
- `onAppointmentCreatedNotifyUsers`
- `onAppointmentUpdatedNotifyUsers`
- `onUserGoogleStatusUpdatedNotifyUsers`
- `sendPreReminderNotifications`

Configuracao global:

- Regiao: `southamerica-east1`
- `maxInstances`: `10`

Pendencia real:

- Deploy de Functions bloqueado sem Firebase Blaze.

## Secao B - Scripts e comandos

### Scripts reais da raiz

Fonte: `package.json`.

| Script | Comando |
|---|---|
| `start` | `expo start` |
| `android` | `expo run:android` |
| `ios` | `expo run:ios` |
| `web` | `expo start --web` |
| `release:preflight` | `node scripts/release-preflight.mjs` |
| `release:env:pull:preview` | `npx eas-cli@latest env:pull --environment preview` |
| `release:env:pull:production` | `npx eas-cli@latest env:pull --environment production` |
| `build:preview:android` | `npx eas-cli@latest build --platform android --profile preview` |
| `build:preview:ios` | `npx eas-cli@latest build --platform ios --profile preview` |
| `build:pilot:all` | `npx eas-cli@latest build --platform all --profile pilot` |
| `build:production:all` | `npx eas-cli@latest build --platform all --profile production` |
| `submit:production:ios` | `npx eas-cli@latest submit --platform ios --profile production` |
| `submit:production:android` | `npx eas-cli@latest submit --platform android --profile production` |
| `lint` | `eslint app src scripts --max-warnings=0` |
| `format` | `prettier --check .` |
| `typecheck` | `tsc --noEmit` |
| `test` | `vitest run` |
| `test:coverage` | `vitest run --coverage` |
| `test:integration` | `firebase emulators:exec --only firestore,auth "vitest run --config vitest.integration.config.ts"` |
| `test:e2e` | `node scripts/run-maestro.mjs` |
| `seed:test-accounts` | `node scripts/seed-test-accounts.mjs` |
| `prepare` | `husky` |

### Scripts reais das Functions

Fonte: `functions/package.json`.

| Script | Comando |
|---|---|
| `lint` | `eslint src --max-warnings=0` |
| `build` | `tsc` |
| `build:watch` | `tsc --watch` |
| `serve` | `npm run build && firebase emulators:start --only functions` |
| `shell` | `npm run build && firebase functions:shell` |
| `start` | `npm run shell` |
| `deploy` | `firebase deploy --only functions` |
| `logs` | `firebase functions:log` |

## Secao C - Testes, CI e emuladores

### Unitarios

`pnpm test` roda testes unitarios em `src/**/*.test.ts` e `functions/src/**/*.test.ts`, excluindo `*.integration.test.ts`.

Arquivos unitarios atuais:

- `src/schemas/auth/auth.schema.test.ts`
- `src/schemas/users/user.schema.test.ts`
- `src/schemas/clients/client.schema.test.ts`
- `src/schemas/appointments/appointment.schema.test.ts`
- `src/schemas/audit/audit.schema.test.ts`
- `src/schemas/commands/command.schema.test.ts`
- `src/services/appointments/conflictValidation.test.ts`
- `src/services/commands/command-totals.test.ts`
- `src/services/commands/command-reopen.test.ts`
- `src/services/google/googleCalendarService.test.ts`
- `src/services/notifications/pushNotificationsService.test.ts`
- `functions/src/auth/totp-callables.test.ts`
- `functions/src/google/sync-queue.test.ts`
- `functions/src/notifications/models.test.ts`
- `functions/src/notifications/preferences.test.ts`
- `functions/src/audit/audit-log.schema.test.ts`
- `functions/src/shared/timezone.test.ts`

Ultima execucao documentada no PR `#13`: `17` arquivos, `71` testes.

### Integracao

`pnpm test:integration` usa Firebase Emulator e `vitest.integration.config.ts`.

Arquivos:

- `tests/integration/firestore.rules.integration.test.ts`
- `functions/src/admin/export-lgpd-data.integration.test.ts`

Emuladores em `firebase.json`:

- Auth: `9099`
- Firestore: `8080`
- Functions: `5001`
- UI: `4000`

### Coverage

`vitest.config.ts` define coverage com provider `v8`, reporters `text` e `json-summary`.

Thresholds atuais graduais:

- statements: `20`
- branches: `10`
- functions: `20`
- lines: `20`

### E2E

Flows Maestro:

- `.maestro/auth-smoke.yaml`
- `.maestro/agenda-smoke.yaml`
- `.maestro/commands-smoke.yaml`
- `.maestro/google-calendar-smoke.yaml`
- `.maestro/notifications-smoke.yaml`
- `.maestro/admin-smoke.yaml`

`pnpm test:e2e` depende da CLI Maestro e de ambiente mobile preparado.

### CI

Fonte: `.github/workflows/ci.yml`.

O CI roda:

- install;
- lint;
- typecheck;
- test;
- coverage;
- functions lint;
- functions build.

O CI ainda nao roda `pnpm test:integration` nem `pnpm test:e2e`.

## Secao D - Firebase e release

### Firebase

`firebase.json` configura:

- Firestore rules;
- Firestore indexes;
- Functions source;
- emuladores Auth/Firestore/Functions/UI.

Deploy de indices:

```bash
npx firebase-tools deploy --only firestore:indexes --project nailflow-8776c
```

Deploy de Functions:

```bash
npx firebase-tools deploy --only functions --project nailflow-8776c
```

Bloqueio conhecido:

- Functions exigem Blaze para habilitar Cloud Build/Artifact Registry.

### Seed

Script: `pnpm seed:test-accounts`.

Cria/atualiza:

- usuarios Auth e docs `users`;
- `salons/salon-teste-001`;
- `clients/client-teste-001`;
- `appointments/appointment-teste-001`;
- duas `commands`;
- tres `notifications`;
- `auditLogs/audit-log-teste-001`;
- `syncQueueDeadLetter/sync-dead-letter-teste-001`.

Credencial admin local:

- `GOOGLE_APPLICATION_CREDENTIALS`, ou
- arquivo `firebase-adminsdk*.json` em `secrets/firebase`.

Nao expor conteudo de credenciais.

### Build EAS

Build Android preview mais recente conhecida:

- ID: `95bf855a-29e4-447c-9caf-4d4865358d2a`
- Status: `FINISHED`
- Commit: `7da07de`
- `appBuildVersion`: `3`

URL:

```text
https://expo.dev/accounts/guhzynhuh/projects/nailflow/builds/95bf855a-29e4-447c-9caf-4d4865358d2a
```

## Secao E - Gates DoD

| Gate | Status atual | Evidencia |
|---|---|---|
| G1 - CA critico com teste | Parcial | Ha testes para 2FA, conflito, reopen, LGPD; ainda ha gaps E2E/rules por fluxo |
| G2 - Coverage gate | Cumprido gradual | `test:coverage` e thresholds existem; thresholds ainda baixos |
| G3 - Piramide Unit + Integracao + E2E | Parcial | Unit/integracao/E2E existem, mas integracao/E2E nao rodam no CI |
| G4 - CI qualidade | Cumprido | CI roda lint/typecheck/test/coverage/functions lint/build |
| G5 - Functions/rules com emulador | Parcial | Testes de integracao existem localmente; nao rodam no CI |
| G6 - E2E fluxos do piloto | Parcial | Flows smoke existem; nao substituem jornada manual completa |
| G7 - Gates locais | Cumprido | Husky/lint-staged/typecheck |

## Secao F - Pendencias reais

- Ativar Blaze se o piloto exigir 2FA, Google Calendar, LGPD callable, triggers e schedulers reais.
- Rodar deploy de Functions apos Blaze.
- Incluir `pnpm test:integration` no CI quando a esteira estiver pronta.
- Evoluir thresholds de coverage.
- Expandir E2E de smoke para jornadas completas.
- Versionar `storage.rules` se Storage passar a ter uso direto relevante.
