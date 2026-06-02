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

## Resultado consolidado
- Setup Maestro versionado com runner dedicado em `pnpm test:e2e`.
- Smoke flow de autenticação expandido para cobrir login, recuperação, cadastro e telas de LGPD.
- Cobertura unitária reforçada em Cloud Functions para notificações, timezone, auditoria e fila de sync do Google Calendar.
- Estados de loading/erro/vazio revisados nas telas principais entregues até a Sprint 9.
- Acessibilidade básica reforçada no `Button` base e no módulo de notificações.
- Guia de uso do piloto documentado em `docs/guia-de-uso-piloto.md`.

## Plano de fechamento documental da Sprint 9
- [x] Cobrir testes de conflitos `last-write-wins` em helpers críticos da fila.
- [x] Cobrir testes de sync incremental em helpers críticos da fila.
- [ ] Cobrir testes de idempotência dos triggers.
- [ ] Executar medição de carga e anexar evidência de sync `< 10s`.
- [x] Validar reconciliação agendada às 3h com timezone do salão/usuário no código e documentação.
- [x] Documentar política de retries/backoff e dead-letter da `syncQueue`.
- [x] Implementar ou registrar plano de TTL de notificações (90 dias).

## Observações de validação
- `pnpm lint`: ok
- `pnpm typecheck`: ok
- `pnpm test`: ok
- `pnpm --dir functions lint`: ok
- `pnpm --dir functions build`: ok
- `pnpm test:e2e`: pendente de execução local porque a CLI do Maestro não está instalada neste ambiente
