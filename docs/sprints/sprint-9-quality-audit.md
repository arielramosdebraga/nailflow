# Sprint 9 - Auditoria de Qualidade e Performance

## Objetivo
Consolidar um baseline técnico para estabilidade do app antes da Sprint 10 (piloto).

## Baseline de validações automáticas
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm --dir functions lint`
- `pnpm --dir functions build`

## Itens de auditoria
1. Testes unitários:
- Cobertura de regras críticas de negócio (auth, agenda, notificações, sync).
- Cobertura de utilitários de Cloud Functions sem dependência de rede.

2. Performance de queries:
- Revisar consultas com filtros compostos e limites.
- Revisar leituras contínuas (`onSnapshot`) em telas principais.

3. Robustez de UX:
- Estados de loading/erro/vazio em dashboards e fluxos críticos.
- Revisão de acessibilidade básica (labels e botões interativos).

4. Sincronização e resiliência:
- Validar resolução de conflitos (`last-write-wins`) com testes dedicados.
- Validar sync incremental com cenários de atualização em lote.
- Garantir idempotência em triggers de sincronização.
- Executar teste de carga para manter critério de aceite de sync `< 10s`.
- Confirmar reconciliação das 3h considerando `settings.timezone`.
- Definir política de retries/backoff + dead-letter para `syncQueue`.
- Registrar estratégia de TTL para notificações antigas (90 dias).

## Resultado parcial (início da Sprint 9)
- Adicionados testes unitários para preferências de notificações em Cloud Functions.
- Adicionados testes para normalização de role e defaults de notificações no schema de usuário.
- Próximo passo: expandir cenários E2E e revisão de performance em fluxos críticos.

## Plano de fechamento documental da Sprint 9
- [ ] Cobrir testes de conflitos `last-write-wins`.
- [ ] Cobrir testes de sync incremental.
- [ ] Cobrir testes de idempotência dos triggers.
- [ ] Executar medição de carga e anexar evidência de sync `< 10s`.
- [ ] Validar reconciliação agendada às 3h com timezone do salão/usuário.
- [ ] Documentar política de retries/backoff e dead-letter da `syncQueue`.
- [ ] Implementar ou registrar plano de TTL de notificações (90 dias).
