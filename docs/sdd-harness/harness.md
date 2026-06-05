# Harness de qualidade - NailFlow

Fonte obrigatoria: `docs/sdd-harness/00-contexto-repo.md`.

## 1. Comandos canonicos

Gerenciador principal: `pnpm`.

| Comando | O que faz | Quando rodar |
|---|---|---|
| `pnpm typecheck` | TypeScript sem emitir arquivos | Sempre apos mudancas |
| `pnpm lint` | ESLint em `app`, `src` e `scripts` | Sempre apos mudancas |
| `pnpm test` | Unitarios Vitest | Sempre apos mudancas |
| `pnpm test:coverage` | Unitarios com cobertura V8 | Antes de PR / CI |
| `pnpm test:integration` | Firebase Emulator + testes de integracao | Rules, callables, seguranca |
| `pnpm test:e2e` | Smoke Maestro | Antes de build/piloto quando ambiente permitir |
| `pnpm --dir functions lint` | Lint das Functions | Mudancas em Functions |
| `pnpm --dir functions build` | Build TypeScript das Functions | Mudancas em Functions/backend |
| `pnpm release:preflight` | Valida variaveis de release | Antes de build EAS |
| `pnpm build:preview:android` | Gera APK Android interno | Testes Android |
| `npx expo-doctor` | Valida stack Expo | Mudancas em Expo/deps/build |

## 2. Estrategia de teste real

| Camada | Estado atual | Observacao |
|---|---|---|
| Unit | Presente | Schemas, services e helpers de Functions |
| Coverage | Presente | Thresholds graduais em `vitest.config.ts` |
| Integracao | Presente localmente | Firebase Emulator; ainda fora do CI |
| E2E | Presente como smoke | Maestro cobre fluxos principais de forma leve |
| Manual APK | Necessario | Fluxos do piloto ainda exigem validacao manual |

## 3. Testes unitarios

Arquivos cobertos por `pnpm test`:

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

Ultima evidencia no PR `#13`: `17` arquivos, `71` testes.

## 4. Integracao Firebase

Comando:

```bash
pnpm test:integration
```

Arquivos:

- `tests/integration/firestore.rules.integration.test.ts`
- `functions/src/admin/export-lgpd-data.integration.test.ts`

Emuladores:

- Auth `9099`
- Firestore `8080`
- Functions `5001`
- UI `4000`

Limite atual:

- Existe localmente, mas nao roda no CI.

## 5. Coverage

Comando:

```bash
pnpm test:coverage
```

Configuracao atual:

- provider: `v8`;
- reporters: `text`, `json-summary`;
- thresholds:
  - statements `20`;
  - branches `10`;
  - functions `20`;
  - lines `20`.

Esses thresholds sao deliberadamente graduais. Aumentar conforme fluxos criticos ganharem cobertura.

## 6. E2E Maestro

Comando:

```bash
pnpm test:e2e
```

Flows:

- `auth-smoke.yaml`
- `agenda-smoke.yaml`
- `commands-smoke.yaml`
- `google-calendar-smoke.yaml`
- `notifications-smoke.yaml`
- `admin-smoke.yaml`

Limites:

- depende da CLI Maestro;
- depende de app instalado/servidor preparado;
- cobre smoke, nao jornada completa de piloto.

## 7. Matriz CA para teste

| Feature | Criterio | Evidencia automatizada | Status |
|---|---|---|---|
| Auth/RBAC | Schemas e role legado | `auth.schema.test.ts`, `user.schema.test.ts` | Coberto |
| 2FA | TOTP callable e codigos invalidos | `totp-callables.test.ts` | Coberto unitario |
| Clientes | Schema de cliente | `client.schema.test.ts` | Coberto |
| Clientes | Isolamento por salao | `tests/integration/firestore.rules.integration.test.ts` | Parcial |
| Agenda | Schema de atendimento | `appointment.schema.test.ts` | Coberto |
| Agenda | Conflito de horario | `conflictValidation.test.ts` | Coberto |
| Comandas | Totais financeiros | `command-totals.test.ts` | Coberto |
| Comandas | Reabertura de comanda fechada | `command-reopen.test.ts` | Coberto |
| Google Calendar | Service e sync queue | `googleCalendarService.test.ts`, `sync-queue.test.ts` | Coberto unitario |
| Google Calendar | Sync real App <-> Google | - | Pendente por Functions/deploy/E2E |
| Notificacoes | Preferencias/modelos/push service | `preferences.test.ts`, `models.test.ts`, `pushNotificationsService.test.ts` | Coberto unitario |
| Auditoria/LGPD | Schema e exportacao callable | `audit-log.schema.test.ts`, `export-lgpd-data.integration.test.ts` | Coberto parcial |
| Release | Preflight | - | Pendente teste dedicado |

## 8. CI

Workflow: `.github/workflows/ci.yml`.

Roda:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm test:coverage`
- `pnpm --dir functions lint`
- `pnpm --dir functions build`

Nao roda ainda:

- `pnpm test:integration`
- `pnpm test:e2e`
- `npx expo-doctor`

## 9. Gates

| Gate | Estado | Proximo passo |
|---|---|---|
| G1 - CAs criticos testados | Parcial | Mapear gaps restantes por rules/E2E |
| G2 - Coverage gate | Cumprido gradual | Subir thresholds progressivamente |
| G3 - Unit + Integracao + E2E | Parcial | Levar integracao ao CI |
| G4 - CI qualidade | Cumprido | Manter verde |
| G5 - Functions/rules em emulador | Parcial | Rodar no CI |
| G6 - E2E piloto | Parcial | Transformar smoke em jornadas reais |
| G7 - Gates locais | Cumprido | Avaliar pre-push se necessario |

## 10. Preflight de release

Checklist executavel:

1. Preencher `.env` com base em `.env.template`.
2. Rodar `pnpm release:preflight`.
3. Rodar `pnpm typecheck`.
4. Rodar `pnpm lint`.
5. Rodar `pnpm test`.
6. Rodar `pnpm test:coverage`.
7. Rodar `pnpm --dir functions build`.
8. Rodar `npx expo-doctor`.
9. Gerar build com perfil EAS adequado.
10. Testar APK conforme `docs/guia-de-uso-piloto.md`.
