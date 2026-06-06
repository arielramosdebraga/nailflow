# Sprint 14 - Onboarding de equipe, validação final e backlog admin

## Objetivo

Fechar o fluxo seguro de `Nova profissional`, concluir a validação técnica final do repositório e separar definitivamente o backlog admin que não pertence ao escopo operacional do piloto.

## Estratégia aprovada para `Nova profissional`

- o owner inicia o cadastro por uma callable backend dedicada;
- o app envia apenas `displayName`, `email` e `phone`;
- o backend resolve `salonId` e fixa `role` como `nail_technician`;
- nenhuma senha é escolhida ou exibida no app do owner;
- a conta é criada com credencial temporária gerada no backend;
- a profissional define ou recupera o acesso usando `Esqueci minha senha` no login.

## O que foi implementado

### 1. Fluxo seguro de onboarding

- rota `owner/manicures/new` ativada com CTA visível na tela de equipe;
- mutation e service do app alinhados ao nome canônico `createNailTechnician`;
- payload do cliente reduzido ao mínimo necessário;
- function `createNailTechnician` ajustada para:
  - criar conta sem senha vinda do app;
  - não usar `phoneNumber` solto no Auth;
  - preservar associação com o salão;
  - registrar status de onboarding no perfil;
  - retornar `status` e `message` explícitos.

### 2. Fechamento de consistência auth/profile

- trigger `onUserCreated` atualizado para não sobrescrever `role`, `salonId` ou claims pré-existentes do fluxo de onboarding;
- o app invalida a query de `users` após sucesso para atualizar a equipe.

### 3. Backlog admin fora do piloto

- backlog admin consolidado em documento próprio;
- itens SaaS e de governança permanecem fora da sprint operacional.

## Critérios de aceite atendidos

- existe fluxo seguro para criar profissional sem trocar a sessão da owner;
- a tela de equipe expõe CTA claro para cadastro;
- o repositório deixa explícito como a profissional ativa o acesso;
- o backlog admin fica separado do escopo do piloto;
- validações técnicas obrigatórias podem ser executadas ao fim da sprint.

## Riscos conhecidos

- o envio automático de convite por e-mail continua dependente de infraestrutura adicional fora do fluxo atual;
- a conferência final em build real segue sendo operacional, não puramente de repositório.

## Próximos passos operacionais

1. Publicar Functions e app no ambiente do piloto.
2. Validar o fluxo em development build/APK com perfis reais de teste.
3. Conduzir onboarding assistido da equipe no piloto.
