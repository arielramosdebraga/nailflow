# Sprint 12 - Profissional: relatorios, perfil e acabamento pt-BR

## Objetivo

Concluir a experiencia da profissional (`nail_technician`) prevista nos prototipos de `docs/screens/manicure.html`, entregando as telas de `Relatorios` e `Perfil` com base nas colecoes e services ja existentes no app, sem introduzir fluxo novo de autenticacao ou dependencia de backend nao publicado.

## Por que esta sprint vem primeiro

- fecha a navegacao que hoje ainda esta incompleta para a profissional;
- reaproveita dados que ja existem em `appointments`, `commands`, `notifications` e `users`;
- reduz o retrabalho das proximas sprints ao consolidar copy pt-BR, padrao visual e componentes compartilhaveis antes das telas do owner.

## Escopo proposto

### 1. Tela `Relatorios`

- Criar rota dedicada da profissional para `Relatorios`.
- Exibir indicadores pessoais com recorte por periodo usando dados ja disponiveis no cliente:
  - atendimentos do periodo;
  - faturamento em comandas fechadas da profissional;
  - ticket medio;
  - distribuicao basica por status ou periodo.
- Reaproveitar hooks e services existentes, evitando query direta em tela.

### 2. Tela `Perfil`

- Criar rota dedicada da profissional para `Perfil`.
- Exibir dados de conta e operacao sem alterar o fluxo de autenticacao:
  - nome e e-mail;
  - papel/perfil;
  - status do Google Calendar;
  - atalhos para notificacoes e preferencias ja existentes.
- Priorizar leitura e edicao segura apenas de campos sustentados pelo modelo atual.

### 3. Revisao completa de textos pt-BR da area da profissional

- Corrigir acentuacao, concordancia e padrao de texto visivel ao usuario.
- Revisar labels, titulos, mensagens de vazio, loading, erro e sucesso.
- Garantir consistencia com o restante do app e com os prototipos aprovados.

## Fora de escopo

- novo fluxo de seguranca, senha, 2FA ou recuperacao de conta;
- novas colecoes Firestore;
- dependencia de Functions publicadas;
- alteracoes estruturais em Expo ou navegacao global fora da area da profissional.

## Dependencias tecnicas

- `useAppointments`, `useCommands`, `useNotifications` e sessao autenticada;
- componentes e shell visual consolidados na Sprint 11;
- RBAC atual sem mudanca de regras.

## Paralelizacao recomendada

- trilha 1: agregacoes e hooks dos indicadores de `Relatorios`;
- trilha 2: layout e composicao das telas `Relatorios` e `Perfil`;
- trilha 3: auditoria de copy pt-BR e cobertura de testes.

## Criterios de aceite

- a profissional consegue navegar para `Relatorios` e `Perfil` sem rotas quebradas;
- as metricas usam apenas dados do escopo da profissional logada;
- nenhum texto visivel da area da profissional fica sem acento ou com termos inconsistentes;
- `typecheck`, `lint` e `test` executam com sucesso ao final da implementacao.

## Riscos e mitigacoes

- Risco: ausencia de dados suficientes para algum card do prototipo.
- Mitigacao: usar estados vazios claros e manter o dashboard baseado em agregacoes que ja existem hoje.

- Risco: tentativa de incluir edicao de perfil fora do que o modelo atual suporta.
- Mitigacao: restringir a sprint a leitura e ajustes seguros, separando qualquer evolucao de identidade para sprint futura.

## Proximos passos apos aprovacao

1. Abrir implementacao em branch propria da sprint.
2. Distribuir em tarefas paralelas de dados, UI e revisao de textos.
3. Consolidar validacoes obrigatorias e ajustar a descricao do PR com o escopo realmente entregue.
