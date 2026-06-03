# Guia de Uso do Piloto - NailFlow

## Objetivo
Orientar a validacao do app no piloto da Fase A com foco nos fluxos essenciais por perfil.

## Perfis de teste
- `super_admin`: governanca global, auditoria, notificacoes e visao dos saloes.
- `salon_owner`: dashboard operacional, equipe, agenda consolidada e comandas.
- `nail_technician`: agenda propria, clientes, atendimentos e sincronizacao com Google Calendar.

## Fluxos para validar no piloto

### 1. Autenticacao
- Entrar com e-mail e senha.
- Recuperar senha.
- Validar 2FA para `super_admin` e `salon_owner`.
- Conferir links de politica de privacidade e termos no cadastro.

### 2. Operacao da profissional
- Criar atendimento.
- Editar atendimento.
- Cancelar ou concluir atendimento.
- Confirmar refletir na agenda.

### 3. Operacao do salao
- Abrir comanda.
- Editar itens e valores.
- Fechar comanda.
- Conferir resumo no dashboard do owner.

### 4. Integracao Google Calendar
- Conectar conta Google.
- Confirmar criacao/edicao de atendimento com sincronizacao.
- Validar tratamento de erro ou expiracao de conexao.

### 5. Notificacoes
- Conferir badge e central in-app.
- Validar preferencia de notificacoes e horario de nao perturbe.
- Verificar notificacao de erro de sincronizacao.

### 6. Governanca e auditoria
- Entrar com `super_admin`.
- Abrir lista de saloes.
- Abrir lista de usuarios.
- Consultar logs recentes de auditoria.

## Checklist de validacao rapida
- O app abre sem travar no splash.
- O login leva ao painel correto por perfil.
- Toda tela principal mostra estados de loading, erro ou vazio quando aplicavel.
- O dark mode permanece legivel nas telas principais.
- Os botoes principais respondem corretamente com acessibilidade basica.

## Comandos uteis
```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
```

## Observacoes do piloto
- Build/distribuicao via EAS fica na Sprint 10.
- Coleta de feedback, onboarding presencial e monitoramento ativo dependem de execucao operacional fora do repositorio.
