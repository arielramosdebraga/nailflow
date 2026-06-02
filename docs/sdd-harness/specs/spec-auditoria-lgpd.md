# Spec - Auditoria e LGPD

Fonte obrigatoria: `docs/sdd-harness/00-contexto-repo.md`.

## 1. Objetivo
Permitir governanca administrativa com logs de auditoria e exportacao LGPD, mantendo acesso restrito ao `super_admin`.

## 2. User stories
- Como `super_admin`, quero consultar logs de auditoria para investigar acoes sensiveis.
- Como `super_admin`, quero gerar exportacao LGPD para atender solicitacoes iniciais.
- Como responsavel pelo piloto, quero registrar exportacoes para rastreabilidade.

## 3. Regras de negocio
1. Apenas `super_admin` le `auditLogs`.
2. Escrita direta em `auditLogs` e bloqueada pelo Firestore.
3. Exportacao LGPD deve ocorrer via Cloud Function callable.
4. Geracao de exportacao deve registrar auditoria.
5. Exportacao atual e administrativa, sem self-service por titular.

## 4. Criterios de aceite
- CA-01: `super_admin` acessa logs de auditoria.
- CA-02: Usuario nao super_admin nao acessa `auditLogs`.
- CA-03: Schema de audit log valida entradas.
- CA-04: Exportacao LGPD retorna pacote com usuarios, saloes e logs.
- CA-05: Exportacao LGPD registra `lgpd.export.generated` em `auditLogs`.

## 5. Casos de borda
- Usuario sem role.
- Usuario autenticado sem permissao.
- Firestore indisponivel.
- Exportacao grande acima do limite atual.
- Falha ao gravar audit log da exportacao.

## 6. Escopo fora
- Exportacao self-service por titular.
- Anonimizacao/exclusao automatizada.
- Portal web de compliance.

## 7. Rastreabilidade
| Camada | Arquivos |
|---|---|
| UI | `app/(admin)/admin/lgpd-export.tsx`, `app/(admin)/admin/settings.tsx`, `app/(admin)/admin/dashboard.tsx` |
| Hooks | `src/hooks/audit/useAuditLogs.ts`, `src/hooks/admin/useReleaseReadiness.ts` |
| Services | `src/services/audit/auditLogService.ts`, `src/services/admin/lgpdExportService.ts` |
| Schemas | `src/schemas/audit/audit-log.schema.ts`, `src/schemas/admin/lgpd-export.schema.ts` |
| Functions | `functions/src/audit/**`, `functions/src/admin/export-lgpd-data.ts` |
| Rules | `firestore.rules` |
| Testes | `functions/src/audit/audit-log.schema.test.ts` |

## 8. Lacunas de teste
- `⚠️ [LACUNA: teste callable/exportLgpdData ausente]`.
- `⚠️ [LACUNA: teste de rules/emulador para leitura exclusiva super_admin ausente]`.
- `⚠️ [LACUNA: E2E de exportacao LGPD ausente]`.
