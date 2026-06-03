# Sprint 7 - Sync Google->App e Reconciliação (Kickoff)

## Objetivo
Implementar o fluxo de entrada Google->App com webhook, sincronização incremental, fila de processamento e rotinas automáticas de reconciliação.

## Escopo planejado
- 7.1 Watch channel (webhook)
- 7.2 HTTP function para receber webhooks
- 7.3 Sync incremental via syncToken
- 7.4 Mapeamento Google -> Firestore
- 7.5 Last-write-wins
- 7.6 Renovação automática de webhooks
- 7.7 Reconciliação diária
- 7.8 Fila de sincronização (`syncQueue`)
- 7.9 Tratamento de token revogado/expirado

## Critérios de aceite
- Alterações no Google devem refletir no app sem intervenção manual.
- Sincronização incremental deve usar e persistir `syncToken`.
- Falhas de autenticação Google devem marcar conexão como expirada e exigir reconexão.
- Rotinas de renovação/reconciliação devem ser executáveis por agendamento.

## Checklist de kickoff
- [x] Branch criada no padrão `Sprint-X-descricao-curta`
- [x] Escopo da sprint documentado
- [ ] Implementação segmentada em commits pequenos
- [ ] Validações finais (lint, typecheck, test) antes do PR
