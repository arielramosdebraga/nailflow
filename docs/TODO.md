# TODO Operacional

## Agora

- [ ] Validar APK Android preview finalizado no aparelho real.
- [ ] Testar perfis `nail_technician`, `salon_owner` e `super_admin` com dados seedados.
- [ ] Registrar bugs encontrados em nova branch/PR, se houver.
- [ ] Decidir se Firebase `nailflow-8776c` sera atualizado para Blaze.
- [ ] Se Blaze for ativado, publicar Functions e validar 2FA, Google Calendar, LGPD, triggers e schedulers.

## A cada alteracao

- [ ] Rodar `pnpm typecheck`.
- [ ] Rodar `pnpm lint`.
- [ ] Rodar `pnpm test`.
- [ ] Rodar `npx expo-doctor` quando houver mudanca Expo/build/dependencias.
- [ ] Rodar `pnpm --dir functions build` quando houver mudanca em Functions ou docs operacionais de backend.
- [ ] Atualizar docs quando a mudanca afetar contexto, ambiente, comandos, entidades ou fluxo de teste.

## A cada commit com PR aberto

- [ ] Commit semantico em portugues.
- [ ] Corpo do commit com:
  - `O que foi feito:`
  - `Por que foi feito:`
- [ ] Push da branch.
- [ ] Atualizar descricao do PR com alteracoes, validacoes, riscos, pendencias e builds.
- [ ] Revisar se a descricao do PR ainda esta consistente com o estado real.

## Piloto

- [ ] Distribuir APK para usuarios autorizados.
- [ ] Conduzir onboarding por perfil.
- [ ] Coletar feedback por fluxo: login, agenda, clientes, comandas, notificacoes, admin.
- [ ] Separar bug real de bloqueio de ambiente/backend.
- [ ] Priorizar backlog de Fase B por evidencia.
