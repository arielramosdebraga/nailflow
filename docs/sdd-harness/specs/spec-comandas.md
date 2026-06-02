# Spec - Comandas

Fonte obrigatoria: `docs/sdd-harness/00-contexto-repo.md`.

## 1. Objetivo
Controlar comandas do salao, incluindo abertura, edicao, calculo financeiro, fechamento e visualizacao pelo owner.

## 2. User stories
- Como `salon_owner`, quero abrir e fechar comandas para controlar faturamento.
- Como `nail_technician`, quero vincular comanda ao atendimento para registrar servicos.
- Como `salon_owner`, quero visualizar resumo financeiro para acompanhar o dia.

## 3. Regras de negocio
1. Comanda pertence a um `salonId`.
2. Comanda pode referenciar cliente, profissional e atendimento.
3. Totais financeiros devem ser calculados de forma deterministica.
4. Comanda fechada nao deve reabrir sem permissao administrativa.
5. Consultas devem respeitar RBAC e isolamento por salao.

## 4. Criterios de aceite
- CA-01: Criar comanda valida persiste em `commands`.
- CA-02: Editar itens recalcula totais corretamente.
- CA-03: Fechar comanda bloqueia reabertura indevida.
- CA-04: Owner visualiza resumo financeiro.
- CA-05: Schema de command rejeita dados invalidos.

## 5. Casos de borda
- Item com valor invalido.
- Comanda sem cliente.
- Comanda vinculada a atendimento inexistente.
- Edicao concorrente.
- Usuario fora do salao tentando ler/alterar comanda.

## 6. Escopo fora
- Pagamentos integrados.
- Emissao fiscal.
- Split financeiro avancado.

## 7. Rastreabilidade
| Camada | Arquivos |
|---|---|
| UI | `app/(owner)/owner/commands/**`, `app/(owner)/owner/dashboard.tsx` |
| Components | `src/components/features/commands/**` |
| Hooks | `src/hooks/commands/**` |
| Services | `src/services/commands/**` |
| Schemas | `src/schemas/commands/**` |
| Testes | `src/schemas/commands/command.schema.test.ts`, `src/services/commands/command-totals.test.ts` |

## 8. Lacunas de teste
- `⚠️ [LACUNA: teste automatizado especifico de comanda fechada nao reabrir sem admin nao encontrado]`.
- `⚠️ [LACUNA: teste de rules/emulador para permissoes de comanda ausente]`.
- `⚠️ [LACUNA: E2E de abrir/editar/fechar comanda ausente]`.
