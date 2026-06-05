# Handoff Fase B

## Escopo entregue na Fase A

- App Expo/React Native com autenticacao, RBAC, agenda, clientes, comandas e operacao basica do salao.
- Governanca `super_admin` com dashboard, saloes, usuarios, logs de auditoria, notificacoes, configuracoes e exportacao LGPD.
- Integracao Google Calendar implementada em codigo via OAuth, watch channels, fila de sync, webhook, reconciliacao e notificacoes operacionais.
- Base de testes com lint, typecheck, unitarios, coverage, integracao Firebase local e smoke E2E via Maestro.
- Preparacao de release com `app.config.ts`, `eas.json`, preflight e docs operacionais.
- APK Android interno gerado por EAS para testes de piloto.

## Estado operacional ao encerrar a Fase A

- Sprint 10 foi incorporada em `develop`.
- PR `#13` (`fix-tests`) foi mergeado em `develop` em 05/06/2026.
- Ultima build Android preview conhecida esta finalizada no EAS.
- Expo Go foi descartado como alvo de testes; usar APK/development build.
- Indices Firestore foram publicados no projeto de testes.
- Seed de contas e entidades de teste foi executado.
- Deploy de Functions esta bloqueado ate o Firebase estar no plano Blaze.

## Premissas para continuidade

- Firebase segue como backend principal da Fase A.
- A Fase B so deve migrar arquitetura depois de evidencias reais do piloto.
- As roles canonicas sao `super_admin`, `salon_owner` e `nail_technician`.
- `manicure` e `manicureId` permanecem como legado/compatibilidade tecnica ate migracao dedicada.
- A stack PostgreSQL/NestJS/Next.js descrita em `docs/nailflow-infraestrutura.md` e alvo futuro, nao requisito imediato do piloto.

## Pendencias externas ao repositorio

- Decidir se o projeto Firebase `nailflow-8776c` sera atualizado para Blaze.
- Se Blaze for ativado, publicar Functions e validar 2FA, Google Calendar, LGPD, triggers e schedulers.
- Distribuir APK para usuarios do piloto.
- Conduzir onboarding presencial/remoto.
- Coletar feedback real por perfil.
- Definir backlog de Fase B com base em evidencias de uso.

## Dividas tecnicas controladas

- E2E Maestro cobre fluxos smoke, mas ainda nao substitui teste manual completo do piloto.
- `pnpm test:integration` existe, mas nao roda no CI atual.
- Coverage gate existe com thresholds graduais baixos; deve subir conforme a base estabilizar.
- `functions/` usa `package-lock.json` e scripts internos com `npm`, enquanto a raiz usa `pnpm`.
- Cloud Functions so serao comprovadas em ambiente real apos deploy em projeto Blaze.
- Storage e usado por dependencias do app, mas `storage.rules` ainda nao esta versionado.

## Recomendacao de entrada da Fase B

1. Fechar validacao do APK atual com os tres perfis seedados.
2. Decidir Blaze antes de testar backend completo.
3. Publicar Functions e repetir smoke de 2FA/Google/LGPD.
4. Consolidar bugs e friccoes em backlog priorizado.
5. Evoluir arquitetura apenas depois de metricas reais de uso, suporte e volume.
