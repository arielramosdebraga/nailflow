# Backlog Admin Fora do Piloto

## Objetivo

Separar o que pertence ao futuro produto admin/SaaS do que faz parte da operação do piloto atual.

## Itens fora do escopo operacional atual

- planos e assinaturas;
- billing SaaS;
- cupons e promoções de plataforma;
- suporte operacional centralizado;
- configurações globais dependentes de backend adicional;
- automações administrativas que exigem novos serviços externos;
- painéis financeiros de plataforma.

## Dependências antes de implementação

- definição de produto e priorização comercial;
- desenho de dados e regras de acesso dedicadas;
- Cloud Functions e integrações específicas;
- decisão explícita sobre billing/Blaze e custos operacionais.

## Como tratar daqui para frente

- não misturar esses itens com sprints operacionais do piloto;
- abrir implementação apenas com escopo, ADR e validação de segurança próprios;
- manter PRs do piloto focados em fluxo de salão, equipe e atendimento.
