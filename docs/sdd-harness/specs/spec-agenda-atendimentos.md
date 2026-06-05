# Spec - Agenda e Atendimentos

Fonte obrigatoria: `docs/sdd-harness/00-contexto-repo.md`.

## 1. Objetivo
Permitir que profissionais e saloes gerenciem atendimentos com agenda, validacao de conflito, estados operacionais e integracao com comandas e Google Calendar.

## 2. User stories
- Como `nail_technician`, quero criar e editar atendimentos para organizar minha agenda diaria.
- Como `salon_owner`, quero ver a agenda consolidada do salao para acompanhar operacao.
- Como `super_admin`, quero consultar atendimentos quando necessario para suporte e governanca.

## 3. Regras de negocio
1. Atendimento pertence a um `salonId`.
2. Atendimento possui profissional via campo interno `manicureId`.
3. Conflitos de horario para o mesmo profissional devem ser bloqueados.
4. Consultas devem respeitar isolamento por salao e RBAC.
5. Alteracoes relevantes podem acionar sync Google.

## 4. Criterios de aceite
- CA-01: Criar atendimento valido persiste na colecao `appointments`.
- CA-02: Editar atendimento valido atualiza a agenda.
- CA-03: Conflito de horario para a mesma profissional e bloqueado.
- CA-04: Schema de appointment rejeita dados invalidos.
- CA-05: Agenda carrega por salao/profissional usando indices compostos.

## 5. Casos de borda
- Atendimento sem `salonId`.
- Atendimento sem profissional.
- Horario final antes do inicio.
- Reagendamento concorrente.
- Usuario tentando acessar atendimento de outro salao.

## 6. Escopo fora
- Agenda web da Fase B.
- Motor avancado de disponibilidade.
- Recorrencia complexa.

## 7. Rastreabilidade
| Camada | Arquivos |
|---|---|
| UI | `app/(nail-technician)/nail-technician/agenda.tsx`, `app/(owner)/owner/agenda/index.tsx`, `app/(nail-technician)/nail-technician/appointments/**` |
| Hooks | `src/hooks/appointments/**` |
| Services | `src/services/appointments/appointmentsService.ts`, `src/services/appointments/conflictValidation.ts` |
| Schemas | `src/schemas/appointments/**` |
| Functions | `functions/src/google/appointment-triggers.ts`, `functions/src/notifications/triggers.ts` |
| Testes | `src/schemas/appointments/appointment.schema.test.ts`, `src/services/appointments/conflictValidation.test.ts`, `.maestro/agenda-smoke.yaml` |

## 8. Lacunas de teste
- `⚠️ [LACUNA: teste de rules/emulador para isolamento completo de appointments por salao/profissional ausente]`.
- `⚠️ [LACUNA: E2E completo de criar/editar/cancelar atendimento ausente; existe apenas smoke]`.
