# Sprint 4 - Comandas e Painel do Salon Owner (Kickoff)

## Objetivo
Implementar o fluxo de comandas e os painéis operacionais/financeiros para `salon_owner`, com visibilidade consolidada da operação do salão.

## Escopo planejado
- 4.1 commandsService + hooks
- 4.2 Listagem de comandas
- 4.3 Abertura/edição de comanda
- 4.4 Fechamento de comanda
- 4.5 Dashboard do salon owner
- 4.6 Gestão de nail technicians
- 4.7 Visão consolidada de agendas
- 4.8 Relatório financeiro básico

## Critérios de aceite
- Comanda fechada não pode ser reaberta sem fluxo administrativo.
- Dono do salão visualiza todas as agendas vinculadas ao salão.
- Indicadores financeiros básicos consistentes com os dados de comandas.

## Estratégia de execução
1. Modelar schemas de comanda e agregações financeiras.
2. Implementar service e hooks com foco em consistência de estado.
3. Construir telas para owner com filtros e estados de loading/erro/vazio.
4. Endurecer regras de Firestore para escopo por salão e papel.

## Checklist de kickoff
- [x] Branch criada no padrão `Sprint-X-descricao-curta`
- [x] Escopo de sprint documentado
- [ ] Implementação iniciada por tarefa com commits pequenos
- [ ] Validações (lint, typecheck, test) antes de PR
