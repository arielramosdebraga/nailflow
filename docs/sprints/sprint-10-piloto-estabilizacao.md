# Sprint 10 - Piloto e Estabilização

## Objetivo
Fechar o escopo de desenvolvimento necessário para preparar o NailFlow para piloto interno, deixando release, governança residual e handoff documental em estado utilizável.

## Entregas de desenvolvimento
- Configuração dinâmica de release com `app.config.ts`.
- Perfis de build/submissão com `eas.json`.
- Preflight versionado para variáveis obrigatórias de app e build.
- Baseline `.env.example` consolidando variáveis do app e das functions.
- Tela de configurações globais do `super_admin` com snapshot de readiness.
- Exportação LGPD migrada para Cloud Function callable com registro em `auditLogs`.
- Documentação operacional de release e handoff da Fase B.

## Itens operacionais fora do repositório
- Geração dos binários no EAS
- Distribuição interna
- Onboarding presencial
- Coleta de feedback do piloto

## Critério de encerramento desta sprint
Consideramos a Sprint 10 encerrada no escopo de desenvolvimento quando:
- a configuração de release está versionada;
- os gaps residuais da Sprint 5 estão concluídos;
- a documentação operacional mínima está disponível;
- a esteira local volta a ficar verde.
