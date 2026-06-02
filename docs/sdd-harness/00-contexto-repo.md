# 00 - Contexto real do repositorio

## Escopo
Este documento registra o estado real do repositorio NailFlow na branch `Sprint-10-piloto-estabilizacao`.

Fonte operacional desta geracao: `C:\Users\ariel\Documents\Projects\nailflow-s10`.

Observacao de destino: o documento de instrucoes cita `docs/sdd/` como local canonico, mas a instrucao do usuario pediu `docs/sdd-harness/`. Estes artefatos foram gerados em `docs/sdd-harness/`.

## Secao A - Stack e estrutura

### Versoes reais
Fonte vencedora: `package.json`.

| Item | Valor real | Evidencia |
|---|---:|---|
| Expo SDK | `~56.0.6` | `package.json` |
| React Native | `0.85.3` | `package.json` |
| React | `19.2.3` | `package.json` |
| Expo Router | `^56.2.7` | `package.json` |
| TypeScript | `~5.9.3` | `package.json` |
| Firebase JS SDK | `^12.13.0` | `package.json` |
| Cloud Functions runtime | `node: 22` | `functions/package.json` |

### Divergencias resolvidas por arquivo de configuracao
- `AGENTS.md` e `prompt.md` indicam Expo SDK `52+`; `package.json` e `docs/adr/ADR-0002-upgrade-expo-sdk-52-56.md` comprovam Expo SDK 56. Fonte vencedora: `package.json`.
- `AGENTS.md`/docs narrativos indicam Node `20+`; `functions/package.json` define `node: 22`. Fonte vencedora: `functions/package.json`.
- A Fase A usa Firebase + Expo conforme `docs/adr/ADR-0001-estrategia-stack-duas-fases.md`. A stack Postgres/NestJS/Next.js aparece como Fase B em `docs/nailflow-infraestrutura.md` e `docs/handoff-fase-b.md`.

### Gerenciador de pacotes
- Raiz: `pnpm`, evidenciado por `pnpm-lock.yaml`, `pnpm-workspace.yaml` e scripts no CI.
- Functions: pacote dentro do workspace, com `package-lock.json` presente e scripts internos usando `npm run` em `functions/package.json`.
- `⚠️ [DIVERGENCIA: functions tem package-lock.json e scripts internos npm, enquanto CI executa pnpm --dir functions]`.

### Estrutura de pastas
Top-level relevante:
- `app/`: rotas Expo Router.
- `src/`: componentes, hooks, providers, schemas, services e stores.
- `functions/`: Cloud Functions TypeScript.
- `docs/`: planejamento, ADRs, guias, release e handoff.
- `.github/workflows/`: CI.
- `.husky/`: gates locais.
- `.maestro/`: flows E2E.
- `scripts/`: seed, Maestro runner e release preflight.

Segundo nivel relevante:
- `app/(auth)`, `app/(admin)`, `app/(nail-technician)`, `app/(owner)`, `app/google-calendar`.
- `src/components`, `src/hooks`, `src/providers`, `src/schemas`, `src/services`, `src/stores`.
- `functions/src/admin`, `functions/src/audit`, `functions/src/auth`, `functions/src/google`, `functions/src/notifications`, `functions/src/salons`, `functions/src/shared`.

### Colecoes Firestore reais
Evidencias: `firestore.rules`, `firestore.indexes.json`, `src/services/**`, `functions/src/**`.

| Colecao | Evidencia principal | Observacao |
|---|---|---|
| `salons` | `firestore.rules`, `src/services/salons/salonService.ts` | Governanca e vinculo com owner |
| `users` | `firestore.rules`, `src/services/users/userService.ts` | RBAC, Google Calendar e notificacoes |
| `clients` | `firestore.rules`, `src/services/clients/clientsService.ts` | CRUD por salao |
| `appointments` | `firestore.rules`, `src/services/appointments/appointmentsService.ts` | Agenda e sync Google |
| `commands` | `firestore.rules`, `src/services/commands/commandsService.ts` | Comandas e financeiro basico |
| `notifications` | `firestore.rules`, `src/services/notifications/inAppNotificationsService.ts` | Central in-app |
| `auditLogs` | `firestore.rules`, `src/services/audit/auditLogService.ts`, `functions/src/audit/write-audit-log.ts` | Leitura apenas super_admin |
| `syncQueue` | `firestore.rules`, `functions/src/google/sync-queue.ts` | Fila de sync |
| `syncQueueDeadLetter` | `firestore.rules`, `firestore.indexes.json` | Dead-letter de sync |

`⚠️ [DIVERGENCIA: instrucoes citam 8 colecoes oficiais, mas o repositorio tambem usa syncQueueDeadLetter]`.

### Indices compostos
Fonte: `firestore.indexes.json`.

| Collection group | Campos |
|---|---|
| `appointments` | `salonId + startTime`, `manicureId + startTime`, `clientId + startTime` |
| `clients` | `salonId + name`, `salonId + lastVisit desc` |
| `commands` | `salonId + createdAt desc`, `salonId + status + createdAt desc`, `salonId + manicureId + createdAt desc`, `salonId + clientId + createdAt desc`, `salonId + appointmentId + createdAt desc` |
| `notifications` | `userId + createdAt desc`, `userId + read + createdAt desc` |
| `auditLogs` | `userId + timestamp desc`, `targetId + timestamp desc` |
| `syncQueue` | `userId + status` |
| `syncQueueDeadLetter` | `status + failedAt desc`, `userId + failedAt desc` |

### Features por sprint
Fonte canonica de status: `docs/planejamento.md`.

| Sprint | Tema | Status real |
|---|---|---|
| 0 | Setup e fundacao tecnica | Concluida; pendencias absorvidas na Sprint 2 |
| 1 | Auth e RBAC | Concluida; 2FA administrativo finalizado na Sprint 2 |
| 2 | Modelagem, clientes, 2FA e CI | Concluida |
| 3 | Agenda e atendimentos | Concluida |
| 4 | Comandas e painel owner | Concluida |
| 5 | Super admin e auditoria | Concluida; pendencias finalizadas na Sprint 10 |
| 6 | Google OAuth e sync App para Google | Concluida |
| 7 | Sync Google para App e reconciliacao | Concluida |
| 8 | Notificacoes | Concluida |
| 9 | Testes, performance e refinamentos | Concluida |
| 10 | Piloto e estabilizacao | Concluida no escopo de desenvolvimento; operacao do piloto pendente fora do codigo |

### RBAC ativo
Papeis canonicos no produto:
- `super_admin`
- `salon_owner`
- `nail_technician`

Legado ainda aceito/normalizado:
- `manicure`

Evidencias:
- `src/schemas/users/user.schema.ts` normaliza `manicure` para `nail_technician`.
- `functions/src/shared/user-context.ts` ainda aceita `manicure`.
- `firestore.rules` ainda permite `manicure` em `isNailTechnician()`.
- Existem campos internos `manicureId` em appointments/commands/sync.

`⚠️ [DIVERGENCIA: papel canonico e nail_technician, mas nomes legados manicure/manicureId ainda existem como compatibilidade interna]`.

### Documentos de planejamento
- `docs/planejamento.md`
- `docs/AGENTS.md`
- `docs/adr/ADR-0001-estrategia-stack-duas-fases.md`
- `docs/adr/ADR-0002-upgrade-expo-sdk-52-56.md`
- `docs/guia-de-uso-piloto.md`
- `docs/release-operacional.md`
- `docs/handoff-fase-b.md`
- `docs/TODO.md`
- `docs/nailflow-infraestrutura.md`

## Secao B - Harness

### Scripts reais da raiz
Fonte: `package.json`.

| Script | Comando exato |
|---|---|
| `start` | `expo start` |
| `android` | `expo start --android` |
| `ios` | `expo start --ios` |
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
| `lint` | `expo lint` |
| `lint-staged` | `lint-staged` |
| `format` | `prettier --check .` |
| `typecheck` | `tsc --noEmit` |
| `test` | `vitest run` |
| `test:e2e` | `node scripts/run-maestro.mjs` |
| `seed:test-accounts` | `node scripts/seed-test-accounts.mjs` |
| `prepare` | `husky` |

### Scripts reais das Functions
Fonte: `functions/package.json`.

| Script | Comando exato |
|---|---|
| `lint` | `eslint src --max-warnings=0` |
| `build` | `tsc` |
| `build:watch` | `tsc --watch` |
| `serve` | `npm run build && firebase emulators:start --only functions` |
| `shell` | `npm run build && firebase functions:shell` |
| `start` | `npm run shell` |
| `deploy` | `firebase deploy --only functions` |
| `logs` | `firebase functions:log` |

### Config de teste
Fonte: `vitest.config.ts`.

- Ambiente: `node`.
- Alias: `@` para `./src`.
- Exclude: `functions/lib/**`, `node_modules/**`, `.expo/**`, `dist/**`.
- `setupFiles`: nao configurado.
- `include`: nao configurado explicitamente.
- Coverage provider: nao configurado.
- Coverage thresholds: nao configurados.

META de cobertura:
- `⚠️ [LACUNA: vitest.config.ts nao define coverage.thresholds]`.

### Cobertura atual
- `coverage/coverage-summary.json`: ausente.
- `⚠️ [LACUNA: rodar comando de coverage para medir cobertura ATUAL]`.
- O repositorio tambem nao possui script dedicado de coverage em `package.json`.

### Testes existentes por camada

Unitarios Vitest (12 arquivos):
- Auth/RBAC: `src/schemas/auth/auth.schema.test.ts`
- Users/RBAC: `src/schemas/users/user.schema.test.ts`
- Clientes: `src/schemas/clients/client.schema.test.ts`
- Agenda/appointments: `src/schemas/appointments/appointment.schema.test.ts`
- Comandas: `src/schemas/commands/command.schema.test.ts`, `src/services/commands/command-totals.test.ts`
- Google Calendar: `src/services/google/googleCalendarService.test.ts`, `functions/src/google/sync-queue.test.ts`
- Notificacoes: `functions/src/notifications/models.test.ts`, `functions/src/notifications/preferences.test.ts`
- Auditoria: `functions/src/audit/audit-log.schema.test.ts`
- Shared/timezone: `functions/src/shared/timezone.test.ts`

Integracao:
- Nenhum arquivo `*.integration.test.ts` encontrado.
- Nenhuma evidencia de `@firebase/rules-unit-testing`.
- `⚠️ [LACUNA: camada de integracao com emulador Firebase ausente]`.

E2E:
- `.maestro/auth-smoke.yaml`: cobre tela de login, cadastro, politica de privacidade, termos e recuperacao de senha.
- `scripts/run-maestro.mjs`: runner de `maestro test .maestro`.

### CI real
Fonte: `.github/workflows/ci.yml`.

- Gatilhos: `push`, `pull_request`.
- Job: `quality`.
- Runner: `ubuntu-latest`.
- Node: `22`.
- pnpm action: versao `9`.
- Passos: checkout, setup pnpm, setup Node, `pnpm install --no-frozen-lockfile`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm --dir functions lint`, `pnpm --dir functions build`.
- CI nao executa E2E Maestro.
- CI nao sobe emulador Firebase.
- CI nao possui coverage gate.

### Gates locais
Fonte: `.husky/pre-commit` e `.lintstagedrc.cjs`.

- Pre-commit:
  - `pnpm lint-staged`
  - `pnpm typecheck`
- Lint-staged:
  - `functions/src/**/*.{js,ts}` -> `npm --prefix functions run lint`
  - `*.{js,jsx,ts,tsx,mjs,cjs}` -> `pnpm exec eslint --max-warnings=0 --no-warn-ignored --ignore-pattern functions/**`
- Pre-push: nao encontrado.

### Firebase emulator
Fonte: `firebase.json`.

- Firestore rules/indexes configurados.
- Functions source configurado.
- Emuladores explicitamente configurados: nenhum.
- `functions/package.json` possui `serve` com `firebase emulators:start --only functions`.
- `⚠️ [LACUNA: firebase.json nao declara emuladores firestore/auth/functions com portas]`.

### Release preflight
Fontes: `scripts/release-preflight.mjs`, `eas.json`, `.env.example`, `app.config.ts`.

- `release:preflight` valida variaveis publicas Firebase e identifiers mobile.
- `eas.json` possui perfis `development`, `preview`, `pilot`, `production`.
- `.env.example` lista variaveis de app, EAS, Google Calendar e Functions.
- `app.config.ts` define `name`, `slug`, `version`, `scheme`, identifiers iOS/Android, build numbers, assets, runtimeVersion e `extra.eas.projectId` quando informado.

## Secao C - Matriz CA para teste

| Feature | Criterio de aceite | Teste(s) que cobre | Camada | Coberto? |
|---|---|---|---|---|
| Auth/RBAC/2FA | Nao-autenticado redireciona para login | `⚠️ [LACUNA: teste automatizado especifico nao encontrado]` | - | Nao |
| Auth/RBAC/2FA | 2FA bloqueia sem TOTP valido | `⚠️ [LACUNA: teste automatizado especifico nao encontrado]` | - | Nao |
| Auth/RBAC/2FA | Cadastro/login e telas legais visiveis | `.maestro/auth-smoke.yaml` | E2E | Sim |
| Clientes | Schemas validam dados de cliente | `src/schemas/clients/client.schema.test.ts` | Unit | Sim |
| Clientes | Isolamento por salao validado | `⚠️ [LACUNA: teste de regras Firestore/emulador ausente]` | - | Nao |
| Agenda | Conflito de horario bloqueado | `⚠️ [LACUNA: teste automatizado especifico de conflictValidation nao encontrado]` | - | Nao |
| Agenda | Schema de appointment valida campos | `src/schemas/appointments/appointment.schema.test.ts` | Unit | Sim |
| Comandas | Calculos financeiros corretos | `src/services/commands/command-totals.test.ts` | Unit | Sim |
| Comandas | Comanda fechada nao reabre sem admin | `⚠️ [LACUNA: teste automatizado especifico nao encontrado]` | - | Nao |
| Google Calendar | Sync queue e retries basicos | `functions/src/google/sync-queue.test.ts` | Unit | Sim |
| Google Calendar | App -> Google em menos de 10s | `⚠️ [LACUNA: medicao automatizada ausente]` | - | Nao |
| Google Calendar | Google -> App em menos de 10s | `⚠️ [LACUNA: teste E2E/integracao ausente]` | - | Nao |
| Notificacoes | Preferencias de notificacao | `functions/src/notifications/preferences.test.ts` | Unit | Sim |
| Notificacoes | Badge em tempo real e push <5s | `⚠️ [LACUNA: E2E/medicao ausente]` | - | Nao |
| Auditoria/LGPD | Audit log schema valido | `functions/src/audit/audit-log.schema.test.ts` | Unit | Sim |
| Auditoria/LGPD | Exportacao LGPD via super_admin | `⚠️ [LACUNA: teste callable/exportLgpdData ausente]` | - | Nao |
| Release | Variaveis obrigatorias de build detectadas | `⚠️ [LACUNA: teste automatizado do preflight ausente]` | - | Nao |

## Secao D - Status dos gates DoD

| Gate | Status | Evidencia |
|---|---|---|
| G1 - CA critico com >= 1 teste | Parcial / Nao cumprido | Matriz CA -> teste acima mostra criterios sem teste |
| G2 - Coverage gate no CI | Nao cumprido | `.github/workflows/ci.yml` nao possui coverage gate; `vitest.config.ts` nao define thresholds |
| G3 - Piramide Unit + Integracao + E2E | Nao cumprido | Unitarios e Maestro existem; integracao com emulador ausente |
| G4 - CI em PR com lint/typecheck/test/build | Cumprido | `.github/workflows/ci.yml` roda lint, typecheck, test, functions lint e functions build em `pull_request` |
| G5 - Functions vs emulador | Sem evidencia / Nao cumprido | Nao ha testes de integracao com emulador Firebase |
| G6 - E2E fluxos do piloto | Parcial / Nao cumprido | `.maestro/auth-smoke.yaml` cobre auth; demais fluxos de `docs/guia-de-uso-piloto.md` nao tem flows |
| G7 - Gates locais | Cumprido | `.husky/pre-commit` roda `pnpm lint-staged` e `pnpm typecheck` |
