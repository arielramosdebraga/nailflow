# Harness de qualidade - NailFlow

Fonte obrigatoria: `docs/sdd-harness/00-contexto-repo.md`.

## 1. Comandos canonicos

Gerenciador principal detectado: `pnpm`.

| Comando exato | O que faz | Quando rodar |
|---|---|---|
| `pnpm lint` | Executa `expo lint` | Local / CI |
| `pnpm typecheck` | Executa `tsc --noEmit` | Local / CI / pre-commit |
| `pnpm test` | Executa `vitest run` | Local / CI |
| `pnpm test:e2e` | Executa `node scripts/run-maestro.mjs` | Local, com Maestro instalado |
| `pnpm --dir functions lint` | Lint das Functions | Local / CI |
| `pnpm --dir functions build` | Build TypeScript das Functions | Local / CI |
| `pnpm release:preflight` | Valida variaveis obrigatorias de release | Antes de build EAS |
| `pnpm build:preview:android` | Build interno Android preview | Release |
| `pnpm build:preview:ios` | Build interno iOS preview | Release |
| `pnpm build:pilot:all` | Build piloto Android/iOS | Release |

`⚠️ [DIVERGENCIA: functions/package.json possui scripts internos com npm run e package-lock.json, apesar do CI usar pnpm --dir functions]`.

## 2. Estrategia de teste real

| Camada | Estado atual | Contagem |
|---|---|---:|
| Unit | Vitest para schemas, services e helpers | 12 arquivos |
| Integracao | Firebase Emulator / rules-unit-testing | 0 arquivos |
| E2E | Maestro smoke auth | 1 flow |

Arquivos unitarios:
- `src/schemas/auth/auth.schema.test.ts`
- `src/schemas/users/user.schema.test.ts`
- `src/schemas/clients/client.schema.test.ts`
- `src/schemas/appointments/appointment.schema.test.ts`
- `src/schemas/commands/command.schema.test.ts`
- `src/services/commands/command-totals.test.ts`
- `src/services/google/googleCalendarService.test.ts`
- `functions/src/google/sync-queue.test.ts`
- `functions/src/notifications/models.test.ts`
- `functions/src/notifications/preferences.test.ts`
- `functions/src/audit/audit-log.schema.test.ts`
- `functions/src/shared/timezone.test.ts`

E2E:
- `.maestro/auth-smoke.yaml`

Lacunas:
- `⚠️ [LACUNA: camada de integracao com Firebase Emulator ausente]`.
- `⚠️ [LACUNA: flows E2E ausentes para agenda, comandas, notificacoes, Google Calendar, auditoria e LGPD]`.

## 3. Cobertura

META:
- `⚠️ [LACUNA: vitest.config.ts nao define coverage.thresholds]`.

ATUAL:
- `⚠️ [LACUNA: coverage/coverage-summary.json ausente]`.

GAP:
- `⚠️ [LACUNA: nao e possivel calcular META - ATUAL sem thresholds e sem coverage-summary.json]`.

Recomendacao acionavel:
- Adicionar script `test:coverage` com Vitest coverage.
- Configurar thresholds em `vitest.config.ts`.
- Fazer CI falhar quando cobertura atual ficar abaixo da meta.

## 4. Matriz CA para teste

| Feature | Criterio de aceite | Teste(s) que cobre | Camada | Coberto? |
|---|---|---|---|---|
| Auth/RBAC/2FA | Nao-autenticado redireciona para login | `⚠️ [LACUNA]` | - | Nao |
| Auth/RBAC/2FA | 2FA bloqueia sem TOTP valido | `⚠️ [LACUNA]` | - | Nao |
| Auth/RBAC/2FA | Cadastro/login e telas legais visiveis | `.maestro/auth-smoke.yaml` | E2E | Sim |
| Clientes | Schemas validam dados de cliente | `src/schemas/clients/client.schema.test.ts` | Unit | Sim |
| Clientes | Isolamento por salao validado | `⚠️ [LACUNA: rules-unit-testing ausente]` | - | Nao |
| Agenda | Conflito de horario bloqueado | `⚠️ [LACUNA]` | - | Nao |
| Agenda | Schema de appointment valida campos | `src/schemas/appointments/appointment.schema.test.ts` | Unit | Sim |
| Comandas | Calculos financeiros corretos | `src/services/commands/command-totals.test.ts` | Unit | Sim |
| Comandas | Comanda fechada nao reabre sem admin | `⚠️ [LACUNA]` | - | Nao |
| Google Calendar | Sync queue e retries basicos | `functions/src/google/sync-queue.test.ts` | Unit | Sim |
| Google Calendar | App -> Google em menos de 10s | `⚠️ [LACUNA: medicao ausente]` | - | Nao |
| Google Calendar | Google -> App em menos de 10s | `⚠️ [LACUNA: integracao/E2E ausente]` | - | Nao |
| Notificacoes | Preferencias de notificacao | `functions/src/notifications/preferences.test.ts` | Unit | Sim |
| Notificacoes | Badge em tempo real e push <5s | `⚠️ [LACUNA]` | - | Nao |
| Auditoria/LGPD | Audit log schema valido | `functions/src/audit/audit-log.schema.test.ts` | Unit | Sim |
| Auditoria/LGPD | Exportacao LGPD via super_admin | `⚠️ [LACUNA: teste callable/exportLgpdData ausente]` | - | Nao |
| Release | Variaveis obrigatorias de build detectadas | `⚠️ [LACUNA: teste do preflight ausente]` | - | Nao |

## 5. Emulador Firebase

Estado real:
- `firebase.json` configura `firestore.rules`, `firestore.indexes.json` e `functions.source`.
- Nao declara bloco `emulators`.
- `functions/package.json` possui `serve`: `npm run build && firebase emulators:start --only functions`.

Lacunas:
- `⚠️ [LACUNA: sem emuladores Firestore/Auth/Functions declarados com portas]`.
- `⚠️ [LACUNA: sem testes de rules-unit-testing]`.
- `⚠️ [LACUNA: CI nao sobe emulador Firebase]`.

Passo sugerido:
- Configurar `firebase.json` com emuladores.
- Criar testes `*.integration.test.ts` para rules e callables criticas.
- Adicionar job/step de integracao no CI.

## 6. Gates

| Gate | Estado real | Evidencia |
|---|---|---|
| G1 | Parcial / nao cumprido | Matriz CA -> teste possui criterios sem teste |
| G2 | Nao cumprido | Sem thresholds em `vitest.config.ts`; sem coverage gate em CI |
| G3 | Nao cumprido | Unit + E2E existem; integracao ausente |
| G4 | Cumprido | `.github/workflows/ci.yml` roda lint, typecheck, test, functions lint/build em PR |
| G5 | Nao cumprido | Sem teste contra emulador Firebase |
| G6 | Parcial / nao cumprido | `.maestro/auth-smoke.yaml` cobre auth; demais fluxos do piloto sem flow |
| G7 | Cumprido | `.husky/pre-commit` roda `pnpm lint-staged` e `pnpm typecheck` |

## 7. Pre-flight de release

Checklist executavel:
1. Preencher variaveis em `.env` com base em `.env.example`.
2. Rodar `pnpm release:preflight`.
3. Rodar `pnpm lint`.
4. Rodar `pnpm typecheck`.
5. Rodar `pnpm test`.
6. Rodar `pnpm --dir functions lint`.
7. Rodar `pnpm --dir functions build`.
8. Gerar build com perfil EAS adequado.
9. Rodar smoke E2E com `pnpm test:e2e` em ambiente com Maestro instalado.

Perfis EAS:
- `development`
- `preview`
- `pilot`
- `production`

## 8. Lacunas de harness

| Severidade | Gate | Lacuna | Recomendacao |
|---|---|---|---|
| Alta | G1 | Criterios criticos sem teste automatizado | Mapear cada CA para unit/integracao/E2E |
| Alta | G2 | Sem coverage thresholds e sem coverage gate | Definir META e adicionar CI gate |
| Alta | G3/G5 | Sem integracao com Firebase Emulator | Criar `*.integration.test.ts` e configurar emuladores |
| Media | G6 | E2E cobre apenas auth | Criar flows Maestro para piloto |
| Media | G2 | Coverage atual nao medido | Criar script `test:coverage` e gerar summary |
| Baixa | G7 | Sem pre-push | Avaliar pre-push para testes mais caros |
