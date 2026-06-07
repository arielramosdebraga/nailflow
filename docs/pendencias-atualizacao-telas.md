# Pendências da Atualização de Telas

> Última atualização: 06/06/2026  
> Contexto: fechamento das sprints 12, 13 e 14 com base em `docs/screens/*` e no protótipo `prototipos.html`

## Resumo executivo

As três sprints de execução ligadas à atualização principal de telas foram concluídas em código:

- Sprint 12: profissional (`Relatórios`, `Perfil` e revisão pt-BR)
- Sprint 13: owner (`Financeiro`, `Salão` e evolução da equipe)
- Sprint 14: onboarding seguro de equipe, validação final e separação do backlog admin

No estado atual:

- as rotas principais de profissional e owner previstas no piloto estão implementadas;
- o owner já consegue iniciar o cadastro seguro de uma nova profissional sem trocar a sessão;
- os itens admin fora do piloto foram consolidados em backlog separado;
- a validação final continua dependendo de build real para conferência operacional em campo, mas o repositório ficou fechado tecnicamente.

## O que foi concluído

### Sprint 12

- telas `Relatórios` e `Perfil` da profissional concluídas;
- revisão principal de copy pt-BR aplicada na área operacional da profissional;
- base de hooks e serviços estabilizada para leitura do perfil e agregados.

### Sprint 13

- tela `Financeiro` do owner implementada com resumo do salão e leitura por profissional;
- tela `Salão` implementada com visão operacional segura do salão atual;
- tela de equipe evoluída com indicadores operacionais e financeiros.

### Sprint 14

- fluxo `Nova profissional` implementado ponta a ponta com callable backend dedicada;
- contrato do app alinhado para não enviar `salonId`, `role` nem senha pelo cliente;
- trigger `onUserCreated` ajustado para preservar dados/claims existentes do onboarding;
- backlog admin removido do escopo operacional do piloto e documentado separadamente.

## Validação final do repositório

Checklist técnico obrigatório ao final da execução:

- `pnpm typecheck`
- `pnpm lint`
- `pnpm test`
- `pnpm --dir functions lint`
- `pnpm --dir functions build`

Checklist funcional mínimo esperado:

- owner acessa equipe e enxerga CTA de `Nova profissional`;
- owner conclui o formulário sem trocar a própria sessão;
- lista de profissionais é invalidada após sucesso;
- mensagens deixam claro que a profissional deve usar `Esqueci minha senha` no login para definir o acesso;
- backlog admin continua fora da navegação operacional do piloto.

## Pendências que continuam fora do código

- validação manual em build real por perfil;
- distribuição interna do binário do piloto;
- onboarding presencial/remoto e coleta de feedback;
- decisões de produto e backend para SaaS admin, billing, suporte e planos.

## Referências

- `docs/sprints/sprint-13-owner-financeiro-salao.md`
- `docs/sprints/sprint-14-onboarding-validacao-admin.md`
- `docs/backlog-admin-piloto.md`
