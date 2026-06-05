# Sprint 10 - Piloto e Estabilização

## Objetivo
Fechar o escopo de desenvolvimento necessário para preparar o NailFlow para piloto interno, deixando release, governança residual e handoff documental em estado utilizável.

## Entregas de desenvolvimento
- Configuração dinâmica de release com `app.config.ts`.
- Perfis de build/submissão com `eas.json`.
- Preflight versionado para variáveis obrigatórias de app e build.
- Baseline `.env.template` consolidando variáveis do app e das functions.
- Tela de configurações globais do `super_admin` com snapshot de readiness.
- Exportação LGPD migrada para Cloud Function callable com registro em `auditLogs`.
- Documentação operacional de release e handoff da Fase B.

## Itens operacionais fora do repositório
- Geração dos binários no EAS
- Distribuição interna
- Onboarding presencial
- Coleta de feedback do piloto

## Follow-up `fix-tests`

Após a Sprint 10, a branch `fix-tests` foi mergeada em `develop` pelo PR `#13` para estabilizar os testes do APK.

Entregas do follow-up:

- alinhamento de dependências com Expo SDK 56;
- abandono do Expo Go como alvo de teste principal;
- builds Android preview via EAS com `autoIncrement`;
- correção de navegação para evitar `Unmatched Route`;
- melhorias de labels em atalhos de teste;
- publicação de índices Firestore;
- seed ampliado de contas e entidades;
- fallback Firestore para dashboard admin enquanto Functions não estão publicadas.

Pendência externa:

- deploy de Functions bloqueado até o projeto Firebase estar no plano Blaze.

## Critério de encerramento desta sprint
Consideramos a Sprint 10 encerrada no escopo de desenvolvimento quando:
- a configuração de release está versionada;
- os gaps residuais da Sprint 5 estão concluídos;
- a documentação operacional mínima está disponível;
- a esteira local volta a ficar verde.
