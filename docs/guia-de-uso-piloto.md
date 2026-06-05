# Guia de Uso do Piloto - NailFlow

## Objetivo

Orientar a validacao manual do app no piloto da Fase A usando APK/development build, com foco nos fluxos essenciais por perfil e nas pendencias reais de backend.

## Premissas do piloto

- Nao usar Expo Go para validacao principal. O SDK 56 e `expo-notifications` exigem APK/development build para push remoto.
- Usar APK Android gerado via EAS `preview` ou `pilot`.
- Para iOS, usar EAS Build com credenciais Apple ou ambiente macOS/Xcode quando a distribuicao iOS entrar no escopo.
- O Firebase de testes deve estar configurado no `.env`.
- Cloud Functions so ficam disponiveis apos ativar Blaze no projeto Firebase e executar deploy.
- Sem Functions publicadas, validar apenas fluxos client-side e fallbacks ja implementados.

## Build Android de referencia

- Perfil: `preview`
- Build EAS: `95bf855a-29e4-447c-9caf-4d4865358d2a`
- Status: `FINISHED`
- `versionCode/appBuildVersion`: `3`
- Commit: `7da07de`
- Link: `https://expo.dev/accounts/guhzynhuh/projects/nailflow/builds/95bf855a-29e4-447c-9caf-4d4865358d2a`

Para builds novas, os perfis EAS usam `autoIncrement: true`; cada novo APK deve receber novo `versionCode`.

## Dados e perfis de teste

Antes da rodada, confirme que o seed foi executado:

```bash
pnpm seed:test-accounts
```

Contas:

| Perfil | E-mail | Role | Foco |
|---|---|---|---|
| Profissional | `manicure.teste@nailflow.app` | `nail_technician` | agenda, clientes e atendimentos |
| Dono do salao | `owner.teste@nailflow.app` | `salon_owner` | dashboard, equipe, agenda e comandas |
| Admin global | `admin.teste@nailflow.app` | `super_admin` | governanca, auditoria e notificacoes |

Senha padrao: `Nailflow@123`, salvo quando `TEST_ACCOUNT_PASSWORD` sobrescrever.

Entidades seedadas:

- salao de teste;
- cliente de teste;
- atendimento confirmado para hoje;
- uma comanda aberta e uma fechada;
- notificacoes para cada perfil;
- log de auditoria;
- exemplo de `syncQueueDeadLetter`.

## Fluxos para validar

### 1. Autenticacao

- Entrar com e-mail e senha para cada perfil.
- Confirmar redirecionamento correto:
  - `super_admin` -> painel admin;
  - `salon_owner` -> painel owner;
  - `nail_technician` -> agenda da profissional.
- Recuperar senha.
- Conferir Politica de Privacidade e Termos.
- Confirmar que 2FA so bloqueia quando `twoFactor.totp.enabled` estiver habilitado no perfil.

### 2. Profissional

- Abrir agenda.
- Criar atendimento.
- Editar atendimento.
- Cancelar ou concluir atendimento.
- Abrir lista de atendimentos.
- Abrir clientes.
- Cadastrar novo cliente.
- Confirmar que nenhum clique cai em `Unmatched Route`.

### 3. Dono do salao

- Abrir dashboard.
- Abrir agenda consolidada.
- Abrir comandas.
- Criar e editar comanda.
- Fechar comanda.
- Abrir equipe/profissionais.
- Abrir central de notificacoes.

### 4. Superadmin

- Abrir dashboard global.
- Atualizar indicadores.
- Abrir saloes.
- Abrir usuarios.
- Abrir logs de auditoria.
- Abrir central de notificacoes.
- Abrir exportacao LGPD.

Observacao: `getGlobalDashboard` possui fallback Firestore enquanto a Function nao estiver publicada. Exportacao LGPD completa depende de Functions.

### 5. Google Calendar

Sem Blaze/Functions:

- Validar que a tela informa indisponibilidade do backend sem quebrar navegacao.
- Validar botao de voltar para agenda.

Com Blaze/Functions publicadas:

- Conectar conta Google.
- Confirmar status conectado.
- Criar/editar atendimento e validar sync App -> Google.
- Alterar evento no Google e validar sync Google -> App.
- Validar tratamento de token expirado/revogado.

### 6. Notificacoes

- Abrir central in-app.
- Confirmar contador de nao lidas.
- Marcar notificacao como lida.
- Validar preferencias e nao perturbe quando disponivel.
- Confirmar que erros de indice nao aparecem.

Push real depende de APK/development build com `EXPO_PUBLIC_EAS_PROJECT_ID`; nao validar push remoto no Expo Go.

## Checklist rapido por rodada

- App abre sem travar no splash.
- Login funciona com os 3 perfis seedados.
- Nenhuma tela principal mostra erro de Firebase ausente.
- Nenhuma consulta mostra link de indice faltante.
- Nenhuma navegacao cai em `Unmatched Route`.
- Labels principais deixam claro o destino do botao.
- Estados de loading, vazio e erro sao legiveis.
- Botao "Sair" funciona.

## Validacoes locais recomendadas antes de gerar APK

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm test:coverage
pnpm --dir functions build
npx expo-doctor
```

Validacoes complementares:

```bash
pnpm test:integration
pnpm test:e2e
```

`pnpm test:integration` depende dos emuladores Firebase configurados. `pnpm test:e2e` depende da CLI Maestro e de app instalado/rodando no ambiente.

## Pendencias que nao sao bug do APK

- Cloud Functions nao publicadas sem Firebase Blaze.
- Google Calendar real nao funciona sem Functions.
- 2FA TOTP real nao funciona sem Functions.
- Exportacao LGPD via callable nao funciona sem Functions.
- Schedulers/triggers de backend nao rodam sem Functions.

Registrar essas pendencias como bloqueio de ambiente/backend, nao como regressao de UI.
