# Auditoria de consistencia - NailFlow

Fonte obrigatoria: `docs/sdd-harness/00-contexto-repo.md` e artefatos em `docs/sdd-harness/`.

## Resumo executivo
O repositorio esta consistente com a conclusao de desenvolvimento da Fase A, mas o harness ainda nao cumpre todos os gates definidos. Os maiores riscos sao ausencia de coverage gate, ausencia de integracao com Firebase Emulator, E2E parcial, criterios criticos sem teste e divergencias documentais/legadas que podem confundir manutencao futura.

## Tabela de achados

| ID | Categoria | Achado | Gate | Severidade | Evidencia | Recomendacao |
|---|---|---|---|---|---|---|
| AUD-001 | Versoes | Docs narrativos citam Expo SDK 52+, mas stack real e Expo `~56.0.6` | - | Media | `package.json`, `docs/adr/ADR-0002-upgrade-expo-sdk-52-56.md` | Atualizar docs narrativos que ainda citam SDK antigo |
| AUD-002 | Runtime | Docs narrativos citam Node 20+, mas Functions usam Node `22` | - | Media | `functions/package.json` | Padronizar documentacao operacional para Node 22 |
| AUD-003 | Dados | Instrucoes citam 8 colecoes oficiais, mas existe `syncQueueDeadLetter` | - | Media | `firestore.rules`, `firestore.indexes.json` | Oficializar `syncQueueDeadLetter` ou documentar como excecao |
| AUD-004 | Nomenclatura | `nail_technician` e canonico, mas `manicure`/`manicureId` ainda existem | - | Media | `src/schemas/users/user.schema.ts`, `firestore.rules`, `functions/src/shared/user-context.ts` | Manter como legado documentado ou planejar migracao |
| AUD-005 | Pacotes | Raiz usa pnpm; Functions tem package-lock e scripts internos npm | - | Baixa | `pnpm-lock.yaml`, `functions/package-lock.json`, `functions/package.json` | Decidir padrao unico ou documentar motivo da excecao |
| AUD-006 | CA sem teste | 2FA sem TOTP valido nao tem teste especifico | G1 | Alta | `docs/sdd-harness/harness.md` | Criar teste unitario/callable para fluxo TOTP |
| AUD-007 | CA sem teste | Isolamento por salao nao tem teste de rules/emulador | G1/G5 | Alta | `firestore.rules`, ausencia de integration tests | Criar tests com Firebase Emulator/rules-unit-testing |
| AUD-008 | CA sem teste | Conflito de agenda nao tem teste especifico | G1 | Alta | `src/services/appointments/conflictValidation.ts` | Criar teste unitario para conflictValidation |
| AUD-009 | CA sem teste | Comanda fechada nao reabre sem admin sem teste especifico | G1 | Alta | `src/services/commands/**` | Criar teste de regra de negocio/permissao |
| AUD-010 | CA sem teste | Exportacao LGPD nao tem teste de callable | G1 | Alta | `functions/src/admin/export-lgpd-data.ts` | Criar teste unitario/integracao da callable |
| AUD-011 | Coverage | Nao ha META de cobertura | G2 | Alta | `vitest.config.ts` | Definir thresholds |
| AUD-012 | Coverage | Nao ha coverage atual medido | G2 | Alta | ausencia de `coverage/coverage-summary.json` | Criar script coverage e publicar summary |
| AUD-013 | CI | CI nao possui coverage gate | G2 | Alta | `.github/workflows/ci.yml` | Adicionar step que falha abaixo da meta |
| AUD-014 | Piramide | Camada de integracao ausente | G3 | Alta | ausencia de `*.integration.test.ts` | Criar suite de integracao com emulator |
| AUD-015 | Functions | Functions nao sao testadas contra emulador | G5 | Media | `.github/workflows/ci.yml`, `firebase.json` | Configurar emuladores e rodar no CI |
| AUD-016 | E2E | Maestro cobre apenas auth smoke | G6 | Media | `.maestro/auth-smoke.yaml` | Criar flows para agenda, comandas, notificacoes, Google e admin |
| AUD-017 | Release | Preflight de release nao tem teste automatizado | - | Baixa | `scripts/release-preflight.mjs` | Criar teste de script ou modularizar validador |

## Status dos gates G1-G7

| Gate | Status | Evidencia |
|---|---|---|
| G1 | Nao cumprido parcialmente | Criterios criticos sem teste em `docs/sdd-harness/harness.md` |
| G2 | Nao cumprido | `vitest.config.ts` sem thresholds e CI sem coverage |
| G3 | Nao cumprido | Sem camada de integracao |
| G4 | Cumprido | `.github/workflows/ci.yml` |
| G5 | Nao cumprido | Sem Firebase Emulator tests |
| G6 | Parcial | `.maestro/auth-smoke.yaml` cobre apenas auth |
| G7 | Cumprido | `.husky/pre-commit`, `.lintstagedrc.cjs` |

## Top 5 riscos
1. Falta de teste automatizado para criterios criticos de seguranca e RBAC.
2. Sem coverage gate, regressao de cobertura nao bloqueia PR.
3. Sem teste de integracao, regras Firestore nao sao comprovadas automaticamente.
4. E2E nao cobre fluxos principais do piloto.
5. Legado `manicure` pode gerar confusao em evolucoes futuras.

## Boas praticas sugeridas
- `SUGESTAO`: criar `test:coverage` e thresholds graduais.
- `SUGESTAO`: adicionar suite `integration` separada para Firestore Rules e Functions callables.
- `SUGESTAO`: expandir Maestro por fluxo do `docs/guia-de-uso-piloto.md`.
- `SUGESTAO`: criar ADR curta para permanencia temporaria de `manicureId`.
- `SUGESTAO`: padronizar o gerenciador das Functions ou documentar a excecao.
