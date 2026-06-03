# Sprint 8 - Sistema de Notificações (Kickoff)

## Objetivo
Implementar o sistema completo de notificações do NailFlow com central in-app, badge, preferências por usuário, não perturbe e lembretes pré-atendimento.

## Escopo planejado
- 8.1 `expo-notifications` + FCM
- 8.2 Persistência de `fcmTokens` por usuário
- 8.3 Helper de envio de push
- 8.4 Tipos de notificação da Fase A
- 8.5 Central com sino e badge
- 8.6 Marcar como lida e ações rápidas por item
- 8.7 Configurações de notificações por usuário
- 8.8 Não perturbe + lembrete configurável
- 8.9 Lembretes pré-atendimento

## Critérios de aceite
- Usuário visualiza notificações in-app com indicador de não lidas.
- Preferências de notificação impactam geração e entrega.
- Não perturbe bloqueia push em janela configurada.
- Lembrete pré-atendimento é gerado automaticamente por agenda.

## Checklist de kickoff
- [x] Branch criada no padrão `Sprint-X-descricao-curta`
- [x] Escopo documentado
- [ ] Implementação segmentada em commits pequenos
- [ ] Validações finais antes de PR
