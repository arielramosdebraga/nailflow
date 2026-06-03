# Handoff Fase B

## Escopo entregue na Fase A
- App Expo/React Native com autenticação, RBAC, agenda, comandas e operação básica do salão.
- Governança `super_admin` com listagens administrativas, logs de auditoria, notificações, configurações globais e exportação LGPD.
- Integração Google Calendar com OAuth, watch channels, fila de sync e notificações operacionais.
- Base de testes com lint, typecheck, unitários e smoke E2E via Maestro.
- Preparação de release com `app.config.ts`, `eas.json`, preflight e documentação operacional.

## Premissas para continuidade
- Firebase segue como backend principal da Fase A.
- O modelo de dados atual prioriza simplicidade e menor risco para o piloto.
- As roles ativas no domínio são `super_admin`, `salon_owner` e `nail_technician`.

## Pendências não operadas no repositório
- Executar builds EAS reais com credenciais finais.
- Distribuir binários internos para o piloto.
- Conduzir onboarding presencial e consolidar feedback de campo.
- Acionar hotfix bucket somente após feedback real do piloto.

## Dívidas técnicas controladas
- CRUD administrativo completo de salões e usuários ainda pode evoluir além das listagens atuais.
- Exportação LGPD está pronta para uso administrativo, mas ainda sem fluxo self-service por titular.
- `pnpm test:e2e` depende da CLI do Maestro instalada no ambiente executor.
- O backend de functions segue com engine `node 22`; o ambiente local precisa respeitar isso para evitar ruído de tooling.

## Recomendação de entrada da Fase B
1. Consolidar métricas reais do piloto e abrir backlog por evidência.
2. Priorizar melhorias de governança e automações operacionais que surgirem no uso.
3. Reavaliar evolução de arquitetura apenas depois de dados concretos de retenção, volume e suporte.
