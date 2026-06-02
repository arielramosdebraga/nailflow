# Sprint 3 - Agenda e Atendimentos (Kickoff)

## Objetivo
Implementar o fluxo de agenda e atendimentos com validação de conflito de horários, respeitando RBAC e isolamento por salão.

## Escopo planejado
- 3.1 appointmentsService
- 3.2 Hooks useAppointments
- 3.3 Calendário mês/semana/dia
- 3.4 Home da nail technician
- 3.5 Criar/Editar atendimento
- 3.6 Detalhe do atendimento
- 3.7 Validação de conflitos
- 3.8 Estados de atendimento
- 3.9 Regras Firestore de appointments

## Critérios de aceite
- Atendimento criado refletido em tela em menos de 1 segundo.
- Conflito de horário bloqueado no fluxo de criação/edição.
- Agenda com carregamento em menos de 2 segundos para volume inicial do piloto.

## Estratégia de execução
1. Modelar schema Zod de appointments antes da UI.
2. Implementar service e hooks com testes unitários de regras de conflito.
3. Construir telas com estados de loading, vazio e erro.
4. Endurecer regras de Firestore para escopo por salão e papel.

## Checklist de kickoff
- [x] Branch criada no padrão `Sprint-X-descricao-curta`
- [x] Escopo de sprint documentado
- [ ] Implementação iniciada por tarefa com commits pequenos
- [ ] Validações (lint, typecheck, test) antes de PR
