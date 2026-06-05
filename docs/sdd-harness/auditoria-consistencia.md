# Auditoria de consistencia - NailFlow

Fonte obrigatoria: `docs/sdd-harness/00-contexto-repo.md`.

## Resumo executivo

O repositorio esta consistente com a Fase A e com a estabilizacao pos-Sprint 10, mas ainda existem pendencias operacionais relevantes: deploy de Functions bloqueado por Blaze, integracao fora do CI, E2E ainda em nivel smoke e alguns pontos documentais/legados que exigem cuidado em evolucoes futuras.

## Achados atuais

| ID | Categoria | Achado | Severidade | Evidencia | Recomendacao |
|---|---|---|---|---|---|
| AUD-001 | Backend | Deploy de Functions bloqueado sem Firebase Blaze | Alta | erro da Firebase CLI, docs de release | Decidir Blaze; depois publicar Functions |
| AUD-002 | CI | `pnpm test:integration` existe, mas nao roda no CI | Media | `.github/workflows/ci.yml` | Adicionar job/step de integracao quando a esteira suportar emuladores |
| AUD-003 | E2E | Maestro cobre smoke, nao jornadas completas do piloto | Media | `.maestro/*.yaml` | Expandir para jornadas por perfil |
| AUD-004 | Coverage | Coverage gate existe, mas thresholds sao baixos | Media | `vitest.config.ts` | Subir thresholds por modulo conforme cobertura amadurecer |
| AUD-005 | Nomenclatura | `nail_technician` e canonico, mas `manicure`/`manicureId` continuam como legado | Media | schemas, rules, functions | Manter compatibilidade documentada ate migracao dedicada |
| AUD-006 | Pacotes | Raiz usa pnpm; Functions mantem `package-lock.json` e scripts com `npm run` | Baixa | `functions/package.json`, `functions/package-lock.json` | Padronizar futuramente ou manter excecao documentada |
| AUD-007 | Storage | App tem dependencias Firebase Storage, mas `storage.rules` nao esta versionado | Baixa | `package.json`, `firebase.json` | Versionar rules se Storage passar a ser usado diretamente |
| AUD-008 | Google Calendar | SLA de sync real nao tem medicao automatizada | Media | specs/harness | Criar teste/E2E ou observabilidade apos Functions publicadas |
| AUD-009 | Release | `gh` nao esta instalado localmente | Baixa | ambiente local | Usar GitHub web/plugin ou instalar `gh` se for necessario atualizar PR via CLI |

## Achados resolvidos desde auditoria anterior

| Tema | Estado atual |
|---|---|
| Expo SDK antigo em docs principais | Atualizado para SDK 56 |
| Node Functions antigo | Atualizado para Node 22 |
| `syncQueueDeadLetter` ausente | Documentado como collection operacional |
| Teste de 2FA/TOTP | Existe `functions/src/auth/totp-callables.test.ts` |
| Teste de conflito de agenda | Existe `src/services/appointments/conflictValidation.test.ts` |
| Teste de reabertura de comanda | Existe `src/services/commands/command-reopen.test.ts` |
| Teste de LGPD callable | Existe `functions/src/admin/export-lgpd-data.integration.test.ts` |
| Coverage ausente | `test:coverage` e thresholds existem |
| Emuladores ausentes | `firebase.json` declara Auth/Firestore/Functions/UI |
| Integracao ausente | `pnpm test:integration` existe |

## Status dos gates G1-G7

| Gate | Status | Evidencia |
|---|---|---|
| G1 | Parcial | CAs criticos principais possuem testes, mas ainda ha gaps E2E/rules |
| G2 | Cumprido gradual | `vitest.config.ts` possui thresholds e CI roda coverage |
| G3 | Parcial | Unit, integracao e E2E existem; integracao/E2E fora do CI |
| G4 | Cumprido | CI roda qualidade e build de Functions |
| G5 | Parcial | Emulador e testes existem localmente; nao rodam no CI |
| G6 | Parcial | Smoke Maestro existe; jornadas completas pendentes |
| G7 | Cumprido | Husky/lint-staged/typecheck |

## Top riscos para o piloto

1. Functions nao publicadas impedem 2FA real, Google Calendar, LGPD callable, triggers e schedulers.
2. Testes manuais ainda sao necessarios para validar APK em aparelho real.
3. Integracao Firebase fora do CI pode deixar regressao de rules/callables passar.
4. E2E smoke nao cobre todos os passos de usuarios reais.
5. Legado `manicureId` pode confundir novas implementacoes se nao for respeitado.

## Proximos passos sugeridos

- Ativar Blaze somente com decisao do owner e alertas de billing configurados.
- Publicar Functions e revalidar fluxos dependentes.
- Adicionar `pnpm test:integration` ao CI.
- Transformar smoke Maestro em jornadas completas por perfil.
- Criar plano de migracao futura para `manicureId` -> `nailTechnicianId`, se o custo justificar.
