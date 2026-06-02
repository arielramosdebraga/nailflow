# Sprint 5 - Super Admin e Auditoria (Kickoff)

## Objetivo
Implementar visão administrativa global, trilha de auditoria e controles de sessão para `super_admin`.

## Escopo planejado
- 5.1 Dashboard global
- 5.2 Gestão de salões
- 5.3 Gestão de usuários
- 5.4 Helper de auditLogs
- 5.5 Instrumentação de ações sensíveis
- 5.6 Tela de logs
- 5.7 Sessão administrativa de 1h
- 5.8 Configurações globais
- 5.9 Exportação LGPD

## Critérios de aceite
- Logs de auditoria com ator, ação, alvo e timestamp.
- Leitura de `auditLogs` restrita ao `super_admin`.
- Sessão admin expira com 1h de inatividade.

## Estratégia de execução
1. Definir contrato de audit log (schema, service e regras).
2. Instrumentar ações críticas em auth, usuários e salões.
3. Implementar interfaces administrativas com filtros e paginação.
4. Ajustar políticas de sessão e proteção de rotas administrativas.

## Checklist de kickoff
- [x] Branch criada no padrão `Sprint-X-descricao-curta`
- [x] Escopo de sprint documentado
- [ ] Implementação iniciada por tarefa com commits pequenos
- [ ] Validações (lint, typecheck, test) antes de PR
