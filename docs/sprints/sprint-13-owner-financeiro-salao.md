# Sprint 13 - Owner: financeiro, salao e gestao operacional

## Objetivo

Concluir as telas operacionais da area de `salon_owner` previstas em `docs/screens/salao.html`, entregando `Financeiro` e `Salao` com foco em leitura, consolidacao e configuracoes seguras sustentadas pelo modelo atual, sem acoplar a sprint a criacao de novas contas de profissionais.

## Por que esta sprint vem antes do onboarding

- o owner ja possui dashboard, agenda, comandas e equipe, mas ainda sem as telas dedicadas de operacao previstas no prototipo;
- a maior parte do valor aqui usa `commands`, `appointments`, `users` e `salons` que ja existem;
- separar a camada operacional do fluxo de onboarding evita desenhar UI em cima de uma estrategia de identidade ainda nao fechada.

## Escopo proposto

### 1. Tela `Financeiro`

- Criar rota dedicada de `Financeiro` para owner.
- Consolidar indicadores do salao por periodo com base em comandas:
  - faturamento bruto;
  - valores do salao e repasse por profissional;
  - resumo semanal ou mensal;
  - detalhamento operacional por profissional.
- Priorizar calculos derivados do modelo atual, sem introduzir billing SaaS.

### 2. Tela `Salao`

- Criar rota dedicada de `Salao` ou configuracoes operacionais do salao.
- Exibir dados e preferencias que ja podem ser sustentados hoje:
  - identificacao do salao;
  - resumo operacional;
  - informacoes de contato ou contexto;
  - configuracoes suportadas pelo modelo atual.
- Tratar campos ainda nao persistidos como futura evolucao, sem simular escrita inexistente.

### 3. Evolucao da tela de equipe

- Refinar `manicures/index` para aproximar do prototipo e suportar melhor leitura gerencial.
- Exibir sinais operacionais por profissional:
  - agenda do dia ou da semana;
  - comandas e faturamento;
  - estado de integracao quando disponivel.
- Preparar pontos de extensao visuais para onboarding futuro sem assumir implementacao de cadastro agora.

## Fora de escopo

- criacao de conta Auth para nova manicure pelo owner;
- fluxo de convite, senha temporaria ou troca de sessao;
- cobranca SaaS, planos, cupons ou suporte administrativo;
- novas colecoes ou mudancas sensiveis em regras sem necessidade comprovada.

## Dependencias tecnicas

- dados existentes em `commands`, `appointments`, `users` e `salons`;
- componentes e linguagem visual consolidados nas sprints anteriores;
- definicao anterior da Sprint 12 para manter consistencia de copy e de componentes informativos.

## Paralelizacao recomendada

- trilha 1: agregacoes e cards de `Financeiro`;
- trilha 2: tela `Salao` e composicao das secoes operacionais;
- trilha 3: refinamentos da tela de equipe, copy pt-BR e testes.

## Criterios de aceite

- owner consegue acessar `Financeiro` e `Salao` sem rotas vazias;
- dados financeiros ficam limitados ao salao atual e sem misturar escopos globais;
- a tela de equipe passa a refletir melhor indicadores por profissional;
- a sprint nao introduz fluxo inseguro de criacao de usuario;
- `typecheck`, `lint` e `test` executam com sucesso ao final da implementacao.

## Riscos e mitigacoes

- Risco: parte do prototipo sugere configuracoes que ainda nao possuem persistencia no modelo atual.
- Mitigacao: implementar primeiro leitura e estados seguros, documentando explicitamente o que depende de evolucao de schema.

- Risco: tentativa de incluir `Nova manicure` junto do owner operacional.
- Mitigacao: separar onboarding para sprint seguinte, quando a estrategia de identidade puder ser fechada sem impacto na sessao do owner.

## Proximos passos apos aprovacao

1. Implementar `Financeiro` e `Salao` em branch propria de execucao.
2. Paralelizar agregacoes financeiras, UI operacional e evolucao da equipe.
3. Reavaliar ao final da sprint quais lacunas persistem para onboarding e validacao final.
